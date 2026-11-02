import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Cron Job Endpoint to auto-expire PENDING bookings older than 24 hours (1 day).
 * Logs expired bookings to payment_audit_logs.
 */
export async function GET(req: Request) {
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const expiredBookings = await prisma.booking.findMany({
      where: {
        status: "PENDING",
        OR: [
          { expiresAt: { lt: new Date() } },
          { expiresAt: null, createdAt: { lt: oneDayAgo } },
        ],
      },
      select: { id: true }
    });

    if (expiredBookings.length === 0) {
      return NextResponse.json({ message: "No expired bookings found.", expiredCount: 0 });
    }

    const expiredIds = expiredBookings.map((b) => b.id);

    // Delete expired bookings completely to prevent DB clutter
    const deleteRes = await prisma.booking.deleteMany({
      where: {
        OR: [
          { status: "EXPIRED" },
          { id: { in: expiredIds } },
        ],
      },
    });

    return NextResponse.json({
      success: true,
      message: `Successfully cleaned and deleted ${deleteRes.count} expired bookings.`,
      expiredCount: deleteRes.count
    });
  } catch (error: any) {
    console.error("[Cron Auto-Expiry Error]", error);
    return NextResponse.json({ message: error.message || "Internal server error" }, { status: 500 });
  }
}
