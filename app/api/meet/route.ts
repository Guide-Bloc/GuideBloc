import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) *
      Math.cos(phi2) *
      Math.sin(deltaLambda / 2) *
      Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // distance in meters
}

// Helper: Verify user is a participant of the booking
async function verifyBookingParticipant(bookingId: string, userId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      touristId: true,
      gig: { select: { guideId: true, lat: true, lng: true } },
    },
  });

  if (!booking) {
    return { status: 404, message: "Booking not found" };
  }

  const isTourist = booking.touristId === userId;
  const isGuide = booking.gig?.guideId === userId;

  if (!isTourist && !isGuide) {
    return { status: 403, message: "Forbidden: You are not a participant in this booking" };
  }

  const role: "TOURIST" | "GUIDE" = isGuide ? "GUIDE" : "TOURIST";
  return { booking, role };
}

// 1. GET Meet Session details
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any)?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const bookingId = searchParams.get("bookingId");
    if (!bookingId) {
      return NextResponse.json({ message: "Missing bookingId" }, { status: 400 });
    }

    const authCheck = await verifyBookingParticipant(bookingId, (session.user as any).id);
    if ("status" in authCheck && authCheck.status) {
      return NextResponse.json({ message: authCheck.message }, { status: authCheck.status });
    }

    let meet = await prisma.meetSession.findUnique({
      where: { bookingId },
    });

    // If it doesn't exist, create it
    if (!meet) {
      meet = await prisma.meetSession.create({
        data: {
          bookingId,
          status: "NOT_STARTED",
        },
      });
    }

    // Server-enforced Expiry Check:
    // 1) Absolute 2.5-hour session expiry (from when sharing started)
    // 2) Stale location cleanup (if no coordinates received for > 5 minutes)
    const now = Date.now();
    let touristExpired = false;
    let guideExpired = false;

    // Check tourist absolute session expiry
    if (meet.touristSharingExpiresAt && now >= new Date(meet.touristSharingExpiresAt).getTime()) {
      meet.touristLat = null;
      meet.touristLng = null;
      meet.touristSharingExpiresAt = null;
      touristExpired = true;
    } else if (meet.touristLocationUpdated && now - new Date(meet.touristLocationUpdated).getTime() > 5 * 60 * 1000) {
      // Inactive / browser closed for > 5 mins -> clear stale pin
      meet.touristLat = null;
      meet.touristLng = null;
      meet.touristSharingExpiresAt = null;
      touristExpired = true;
    }

    // Check guide absolute session expiry
    if (meet.guideSharingExpiresAt && now >= new Date(meet.guideSharingExpiresAt).getTime()) {
      meet.guideLat = null;
      meet.guideLng = null;
      meet.guideSharingExpiresAt = null;
      guideExpired = true;
    } else if (meet.guideLocationUpdated && now - new Date(meet.guideLocationUpdated).getTime() > 5 * 60 * 1000) {
      // Inactive / browser closed for > 5 mins -> clear stale pin
      meet.guideLat = null;
      meet.guideLng = null;
      meet.guideSharingExpiresAt = null;
      guideExpired = true;
    }

    if (touristExpired || guideExpired) {
      const hasActiveLocation = meet.touristLat !== null || meet.guideLat !== null;
      const updatedStatus = meet.status === "COMPLETED"
        ? "COMPLETED"
        : meet.status === "ARRIVED" || !hasActiveLocation
        ? (hasActiveLocation ? "SHARING" : "NOT_STARTED")
        : meet.status;
      meet.status = updatedStatus;

      meet = await prisma.meetSession.update({
        where: { bookingId },
        data: {
          status: updatedStatus,
          ...(touristExpired ? {
            touristLat: null,
            touristLng: null,
            touristSharingExpiresAt: null,
          } : {}),
          ...(guideExpired ? {
            guideLat: null,
            guideLng: null,
            guideSharingExpiresAt: null,
          } : {}),
        },
      });
    }

    return NextResponse.json(meet);
  } catch (error: any) {
    console.error("GET meet session error:", error);
    return NextResponse.json({ message: error.message || "Server error" }, { status: 500 });
  }
}

// 2. POST Update Coordinates or Arrived/StopSharing Status
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any)?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { bookingId, lat, lng, stopSharing, arrived } = body;

    if (!bookingId) {
      return NextResponse.json({ message: "Missing bookingId" }, { status: 400 });
    }

    const authCheck = await verifyBookingParticipant(bookingId, (session.user as any).id);
    if ("status" in authCheck && authCheck.status) {
      return NextResponse.json({ message: authCheck.message }, { status: authCheck.status });
    }

    const role = authCheck.role!;

    // Fetch existing meet session or create default
    let meet = await prisma.meetSession.findUnique({
      where: { bookingId },
    });

    if (!meet) {
      meet = await prisma.meetSession.create({
        data: { bookingId, status: "SHARING" },
      });
    }

    // Handle stop sharing
    if (stopSharing) {
      const updateData: any = {};
      if (role === "GUIDE") {
        updateData.guideLat = null;
        updateData.guideLng = null;
        updateData.guideSharingExpiresAt = null;
      } else {
        updateData.touristLat = null;
        updateData.touristLng = null;
        updateData.touristSharingExpiresAt = null;
      }

      const willHaveAnyActive = role === "GUIDE"
        ? meet.touristLat !== null
        : meet.guideLat !== null;
      if (meet.status !== "COMPLETED") {
        updateData.status = willHaveAnyActive ? "SHARING" : "NOT_STARTED";
      }

      const updatedMeet = await prisma.meetSession.update({
        where: { bookingId },
        data: updateData,
      });
      return NextResponse.json(updatedMeet);
    }

    if (lat === undefined || lng === undefined) {
      if (arrived === false) {
        const hasActiveLocation = meet.touristLat !== null || meet.guideLat !== null;
        const updatedMeet = await prisma.meetSession.update({
          where: { bookingId },
          data: {
            status: meet.status === "COMPLETED"
              ? "COMPLETED"
              : hasActiveLocation ? "SHARING" : "NOT_STARTED",
          },
        });
        return NextResponse.json(updatedMeet);
      }
      return NextResponse.json({ message: "Missing coordinates" }, { status: 400 });
    }

    const latitude = Number(lat);
    const longitude = Number(lng);
    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      return NextResponse.json({ message: "Invalid coordinates" }, { status: 400 });
    }

    // ─── Enforce Absolute 2.5-Hour Server Expiry ─────────────────────────────
    const now = Date.now();
    const currentExpiry = role === "GUIDE" ? meet.guideSharingExpiresAt : meet.touristSharingExpiresAt;

    // If an existing sharing session has expired, reject further updates and clear coordinates
    if (currentExpiry && now >= new Date(currentExpiry).getTime()) {
      const expireData: any = {};
      if (role === "GUIDE") {
        expireData.guideLat = null;
        expireData.guideLng = null;
        expireData.guideSharingExpiresAt = null;
      } else {
        expireData.touristLat = null;
        expireData.touristLng = null;
        expireData.touristSharingExpiresAt = null;
      }
      const remainingLocation = role === "GUIDE" ? meet.touristLat : meet.guideLat;
      if (meet.status !== "COMPLETED") {
        expireData.status = remainingLocation !== null ? "SHARING" : "NOT_STARTED";
      }
      await prisma.meetSession.update({
        where: { bookingId },
        data: expireData,
      });

      return NextResponse.json(
        { expired: true, message: "Location sharing session expired after 2.5 hours" },
        { status: 410 } // 410 Gone / Expired
      );
    }

    // If starting a fresh session or re-sharing after stopped, establish strict 2.5-hour expiry:
    const EXPIRY_MS = 2.5 * 60 * 60 * 1000;
    const sessionExpiresAt = currentExpiry || new Date(now + EXPIRY_MS);

    const updateData: any = {};
    if (role === "GUIDE") {
      updateData.guideLat = latitude;
      updateData.guideLng = longitude;
      updateData.guideLocationUpdated = new Date();
      if (!meet.guideSharingExpiresAt) {
        updateData.guideSharingExpiresAt = sessionExpiresAt;
      }
    } else {
      updateData.touristLat = latitude;
      updateData.touristLng = longitude;
      updateData.touristLocationUpdated = new Date();
      if (!meet.touristSharingExpiresAt) {
        updateData.touristSharingExpiresAt = sessionExpiresAt;
      }
    }

    // Determine current locations to check distance
    const tLat = role === "TOURIST" ? latitude : meet.touristLat;
    const tLng = role === "TOURIST" ? longitude : meet.touristLng;
    const gLat = role === "GUIDE" ? latitude : meet.guideLat;
    const gLng = role === "GUIDE" ? longitude : meet.guideLng;
    const touristUpdatedAt = role === "TOURIST" ? now : meet.touristLocationUpdated?.getTime();
    const guideUpdatedAt = role === "GUIDE" ? now : meet.guideLocationUpdated?.getTime();
    const meetingLat = authCheck.booking!.gig?.lat;
    const meetingLng = authCheck.booking!.gig?.lng;
    const hasMeetingCoordinates =
      typeof meetingLat === "number" &&
      Number.isFinite(meetingLat) &&
      typeof meetingLng === "number" &&
      Number.isFinite(meetingLng);
    const bothRecentlyLocated =
      touristUpdatedAt !== null &&
      touristUpdatedAt !== undefined &&
      guideUpdatedAt !== null &&
      guideUpdatedAt !== undefined &&
      now - touristUpdatedAt <= 5 * 60 * 1000 &&
      now - guideUpdatedAt <= 5 * 60 * 1000;
    const bothAtMeetingPoint =
      hasMeetingCoordinates &&
      bothRecentlyLocated &&
      tLat !== null &&
      tLng !== null &&
      gLat !== null &&
      gLng !== null &&
      typeof meetingLat === "number" &&
      typeof meetingLng === "number" &&
      getDistance(tLat, tLng, meetingLat, meetingLng) < 50 &&
      getDistance(gLat, gLng, meetingLat, meetingLng) < 50;

    const hasActiveLocation = tLat !== null || gLat !== null;
    const newStatus = meet.status === "COMPLETED"
      ? "COMPLETED"
      : arrived === false
      ? (hasActiveLocation ? "SHARING" : "NOT_STARTED")
      : bothAtMeetingPoint
      ? "ARRIVED"
      : hasActiveLocation
      ? "SHARING"
      : "NOT_STARTED";

    updateData.status = newStatus;

    const updatedMeet = await prisma.meetSession.update({
      where: { bookingId },
      data: updateData,
    });

    if (arrived === true && updatedMeet.status !== "ARRIVED") {
      return NextResponse.json({
        ...updatedMeet,
        arrivalError: hasMeetingCoordinates
          ? "Both guide and tourist must be within 50 meters of the meeting point with recent locations."
          : "The meeting point does not have saved coordinates.",
      });
    }

    return NextResponse.json(updatedMeet);
  } catch (error: any) {
    console.error("POST meet location error:", error);
    return NextResponse.json({ message: error.message || "Server error" }, { status: 500 });
  }
}

// 3. PUT Upload Selfie
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any)?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { bookingId, photoUrl } = body;

    if (!bookingId || !photoUrl) {
      return NextResponse.json({ message: "Missing parameters" }, { status: 400 });
    }

    const authCheck = await verifyBookingParticipant(bookingId, (session.user as any).id);
    if ("status" in authCheck && authCheck.status) {
      return NextResponse.json({ message: authCheck.message }, { status: authCheck.status });
    }

    const role = authCheck.role!;

    const meet = await prisma.meetSession.findUnique({
      where: { bookingId },
    });

    if (!meet) {
      return NextResponse.json({ message: "Meet session not found" }, { status: 404 });
    }

    const updateData: any = {};
    if (role === "GUIDE") {
      updateData.guidePhoto = photoUrl;
    } else {
      updateData.touristPhoto = photoUrl;
    }

    // Check if both photos are now present
    const tPhoto = role === "TOURIST" ? photoUrl : meet.touristPhoto;
    const gPhoto = role === "GUIDE" ? photoUrl : meet.guidePhoto;

    if (tPhoto && gPhoto) {
      updateData.status = "COMPLETED";
    }

    const updatedMeet = await prisma.meetSession.update({
      where: { bookingId },
      data: updateData,
    });

    return NextResponse.json(updatedMeet);
  } catch (error: any) {
    console.error("PUT meet verification error:", error);
    return NextResponse.json({ message: error.message || "Server error" }, { status: 500 });
  }
}
