import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { FALLBACK_GIGS } from "@/lib/mockGigs";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const gig = await prisma.gig.findUnique({
      where: { id: id },
      include: {
        guide: {
          select: {
            id: true,
            name: true,
            avatar: true,
            country: true,
            bio: true,
            language: true,
            walletAddress: true,
          },
        },
        reviews: {
          where: {
            reviewer: {
              role: { not: "GUIDE" },
            },
          },
          include: {
            reviewer: { select: { id: true, name: true, avatar: true, role: true } },
            guide: { select: { id: true, name: true, avatar: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!gig) {
      const fallback = FALLBACK_GIGS.find((g) => g.id === id);
      if (fallback) {
        return NextResponse.json({
          ...fallback,
          reviews: fallback.reviews || [],
          avgRating: fallback.avgRating,
          reviewCount: fallback.reviewCount,
        });
      }
      return NextResponse.json({ message: "Gig not found" }, { status: 404 });
    }

    const avgRating =
      gig.reviews.length > 0
        ? gig.reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / gig.reviews.length
        : 0;

    return NextResponse.json({ ...gig, avgRating, reviewCount: gig.reviews.length });
  } catch (error) {
    console.error("Gig detail error:", error);
    const fallback = FALLBACK_GIGS.find((g) => g.id === id);
    if (fallback) {
      return NextResponse.json({
        ...fallback,
        reviews: fallback.reviews || [],
        avgRating: fallback.avgRating,
        reviewCount: fallback.reviewCount,
      });
    }
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;
    const gig = await prisma.gig.findUnique({ where: { id: id } });

    if (!gig) {
      return NextResponse.json({ message: "Gig not found" }, { status: 404 });
    }

    if (gig.guideId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const data = await req.json();

    const updated = await prisma.gig.update({
      where: { id: id },
      data,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Gig update error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;
    const gig = await prisma.gig.findUnique({ where: { id: id } });

    if (!gig) {
      return NextResponse.json({ message: "Gig not found" }, { status: 404 });
    }

    if (gig.guideId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    await prisma.gig.delete({ where: { id: id } });

    return NextResponse.json({ message: "Gig deleted successfully" });
  } catch (error) {
    console.error("Gig delete error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
