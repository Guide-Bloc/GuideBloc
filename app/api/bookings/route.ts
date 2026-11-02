import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { recalculateGigRankingScore } from "@/lib/ranking";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;
    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role");

    const where: any = {};
    if (role === "guide") {
      where.gig = { guideId: user.id };
    } else {
      where.touristId = user.id;
    }

    // Auto-delete any EXPIRED bookings or stale PENDING bookings (> 30 mins, unpaid)
    // so they never clutter the user dashboard or database
    const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);
    await prisma.booking.deleteMany({
      where: {
        OR: [
          { status: "EXPIRED" },
          {
            status: "PENDING" as const,
            txHash: null,
            OR: [
              { expiresAt: { lt: new Date() } },
              { expiresAt: null, createdAt: { lt: thirtyMinsAgo } },
            ],
          },
        ],
      },
    });

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        escrowPayout: true,
        reviews: {
          select: { id: true, reviewerId: true }
        },
        gig: {
          include: { guide: { select: { id: true, name: true, avatar: true, country: true } } },
        },
        tourist: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            passportNumber: true,
            idCardNumber: true,
            birthDate: true,
            title: true,
            age: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(bookings);
  } catch (error) {
    console.error("Bookings GET error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;
    const data = await req.json();

    const gig = await prisma.gig.findUnique({
      where: { id: data.gigId },
      include: { guide: { select: { id: true, walletAddress: true } } },
    });
    if (!gig) {
      return NextResponse.json({ message: "Gig not found" }, { status: 404 });
    }

    // Prevent Tour Guides from booking their OWN tours (Admin & Tourists can book for testing)
    if (user.role !== "ADMIN" && (gig.guideId === user.id || (user.email && gig.guideId === user.email))) {
      return NextResponse.json(
        { message: "Tour Guides cannot book their own tours." },
        { status: 403 }
      );
    }

    // Calculate pricing based on selected package if provided
    let client_price = 0;
    let guide_price = 0;
    let platform_fee = 0;

    if (data.selectedPackage) {
      client_price = parseFloat(data.selectedPackage.client_price || data.selectedPackage.priceUSD || "0");
      guide_price = parseFloat(data.selectedPackage.guide_price || (client_price / 1.10).toFixed(2));
      platform_fee = Math.round((client_price - guide_price) * 100) / 100;
    } else {
      client_price = gig.client_price || gig.priceUSD;
      guide_price = gig.guide_price || Math.round((client_price / 1.10) * 100) / 100;
      platform_fee = Math.round((client_price - guide_price) * 100) / 100;
    }

    const subtotalUSD = Math.round(client_price * data.groupSize * 100) / 100;
    const discountUSD = data.discountUSD ? parseFloat(data.discountUSD) : 0;
    const finalTotalPriceUSD = Math.max(0.01, Math.round((subtotalUSD - discountUSD) * 100) / 100);
    const totalPlatformFee = Math.round(platform_fee * data.groupSize * 100) / 100;

    const oneDayInMs = 24 * 60 * 60 * 1000;
    const expiresAt = new Date(Date.now() + oneDayInMs);

    // ─── Idempotency Check ───────────────────────────────────────────────────
    // If user already has an unpaid PENDING booking for this gig, reuse and update it
    // instead of creating duplicate records in the database.
    const existingPending = await prisma.booking.findFirst({
      where: {
        touristId: user.id,
        gigId: data.gigId,
        status: "PENDING" as const,
      },
      orderBy: { createdAt: "desc" },
    });

    const bookingPayload = {
      gigId: data.gigId,
      touristId: user.id,
      bookingDate: new Date(data.bookingDate),
      bookingTime: data.bookingTime || null,
      participants: data.participants || null,
      groupSize: data.groupSize,
      totalPriceUSD: finalTotalPriceUSD,
      totalPriceCrypto: finalTotalPriceUSD,
      discountUSD: discountUSD > 0 ? discountUSD : null,
      promoCode: data.promoCode || null,
      selectedPackage: data.selectedPackage || null,
      cryptoToken: data.cryptoToken || "USDT",
      guide_price: Math.round(guide_price * data.groupSize * 100) / 100,
      client_price: finalTotalPriceUSD,
      platform_fee: totalPlatformFee,
      specialRequests: data.specialRequests,
      status: "PENDING" as const,
      expiresAt,
      // Lock the guide's current wallet address at booking creation time.
      guideWalletSnapshot: gig.guide.walletAddress || null,
    };

    let booking;
    if (existingPending) {
      booking = await prisma.booking.update({
        where: { id: existingPending.id },
        data: bookingPayload,
      });
    } else {
      booking = await prisma.booking.create({
        data: bookingPayload,
      });
    }

    // Auto-save new companions in the background (non-blocking for ultra-fast response)
    if (data.participants && Array.isArray(data.participants)) {
      (async () => {
        try {
          for (const p of data.participants) {
            if (p.isMainUser || !p.name) continue;

            const existing = await prisma.groupMember.findFirst({
              where: {
                userId: user.id,
                name: p.name,
              },
            });

            if (!existing) {
              await prisma.groupMember.create({
                data: {
                  userId: user.id,
                  name: p.name,
                  passportNumber: p.passportNumber || null,
                  idCardNumber: p.idCardNumber || null,
                  birthDate: p.birthDate ? new Date(p.birthDate) : null,
                  title: p.title || null,
                  age: p.age ? parseInt(p.age) : null,
                },
              });
            }
          }
        } catch (compErr) {
          console.error("Auto-save companion notice:", compErr);
        }
      })();
    }

    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    console.error("Bookings POST error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
