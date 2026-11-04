import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error("[Meet Location Expiry Cron] CRON_SECRET is not configured");
    return NextResponse.json({ message: "Cron is not configured" }, { status: 503 });
  }

  if (req.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const staleBefore = new Date(now.getTime() - 5 * 60 * 1000);
    const sessions = await prisma.meetSession.findMany({
      where: {
        OR: [
          { touristSharingExpiresAt: { lte: now } },
          { touristLocationUpdated: { lte: staleBefore }, touristLat: { not: null } },
          { guideSharingExpiresAt: { lte: now } },
          { guideLocationUpdated: { lte: staleBefore }, guideLat: { not: null } },
        ],
      },
      select: { bookingId: true },
    });

    let clearedLocationCount = 0;
    let updatedSessionCount = 0;

    for (const { bookingId } of sessions) {
      const [touristResult, guideResult] = await Promise.all([
        prisma.meetSession.updateMany({
          where: {
            bookingId,
            OR: [
              { touristSharingExpiresAt: { lte: now } },
              { touristLocationUpdated: { lte: staleBefore }, touristLat: { not: null } },
            ],
          },
          data: {
            touristLat: null,
            touristLng: null,
            touristSharingExpiresAt: null,
          },
        }),
        prisma.meetSession.updateMany({
          where: {
            bookingId,
            OR: [
              { guideSharingExpiresAt: { lte: now } },
              { guideLocationUpdated: { lte: staleBefore }, guideLat: { not: null } },
            ],
          },
          data: {
            guideLat: null,
            guideLng: null,
            guideSharingExpiresAt: null,
          },
        }),
      ]);

      const clearedCount = touristResult.count + guideResult.count;
      if (clearedCount === 0) continue;

      clearedLocationCount += clearedCount;
      updatedSessionCount += 1;

      const meet = await prisma.meetSession.findUnique({
        where: { bookingId },
        select: {
          status: true,
          touristLat: true,
          touristLng: true,
          guideLat: true,
          guideLng: true,
        },
      });

      if (!meet || meet.status === "COMPLETED") continue;

      const hasActiveLocation =
        (meet.touristLat !== null && meet.touristLng !== null) ||
        (meet.guideLat !== null && meet.guideLng !== null);
      const nextStatus =
        meet.status === "ARRIVED"
          ? hasActiveLocation
            ? "SHARING"
            : "NOT_STARTED"
          : !hasActiveLocation && meet.status === "SHARING"
            ? "NOT_STARTED"
            : meet.status;

      if (nextStatus !== meet.status) {
        await prisma.meetSession.updateMany({
          where: { bookingId, status: meet.status },
          data: { status: nextStatus },
        });
      }
    }

    return NextResponse.json({
      success: true,
      clearedLocationCount,
      updatedSessionCount,
    });
  } catch (error) {
    console.error("[Meet Location Expiry Cron] Failed to clear expired locations:", error);
    return NextResponse.json({ message: "Failed to expire meet locations" }, { status: 500 });
  }
}
