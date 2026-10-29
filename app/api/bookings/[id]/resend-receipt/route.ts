import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateReceiptPdf } from "@/lib/receipt";
import { triggerBookingSuccessEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const userRole = (session.user as any).role;

    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
      include: {
        gig: {
          include: {
            guide: { select: { id: true, name: true, email: true } },
          },
        },
        tourist: { select: { id: true, name: true, email: true } },
      },
    });

    if (!booking) {
      return NextResponse.json({ message: "Booking not found" }, { status: 404 });
    }

    // Permission check: only the tourist, guide, or admin can trigger receipt resend
    if (userRole !== "ADMIN" && booking.touristId !== userId && booking.gig.guideId !== userId) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const effectiveNetwork = booking.paymentNetwork || "Avalanche C-Chain";
    const effectiveTxHash = booking.txHash || "On-Chain Escrow";

    const pdfBuffer = generateReceiptPdf({
      id: booking.id,
      bookingDate: booking.bookingDate.toISOString(),
      bookingTime: booking.bookingTime || "09:00 AM",
      groupSize: booking.groupSize,
      totalPriceUSD: booking.totalPriceUSD,
      paymentNetwork: effectiveNetwork,
      txHash: effectiveTxHash,
      paymentMethod: "Web3 Smart Contract Escrow",
      gig: { title: booking.gig.title, location: booking.gig.location },
      tourist: { name: booking.tourist.name, email: booking.tourist.email },
    });

    const emailSent = await triggerBookingSuccessEmail(
      booking.id,
      booking.tourist.email,
      booking.gig.title,
      booking.totalPriceUSD,
      pdfBuffer,
      true // forceSend bypasses deduplication
    );

    if (!emailSent) {
      return NextResponse.json(
        { message: "Failed to dispatch email via provider. Please check configuration." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Transaction receipt successfully sent to ${booking.tourist.email}`,
    });
  } catch (error: any) {
    console.error("[Resend Receipt API Error]:", error);
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
