"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  MapPin, Navigation, Radio, Clock, CheckCircle, AlertCircle,
  ExternalLink, User, ArrowLeft, MessageSquare, Phone, ShieldCheck,
  Crosshair, Compass, Eye
} from "lucide-react";
import toast from "react-hot-toast";
import DotsLoader from "@/components/ui/DotsLoader";

// Calculate Haversine distance in meters
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const dphi = ((lat2 - lat1) * Math.PI) / 180;
  const dlam = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dphi / 2) ** 2 + Math.cos(phi1) * Math.cos(phi2) * Math.sin(dlam / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

type MapLocation = {
  id: string;
  lat: number;
  lng: number;
  label: string;
  color: string;
};

function getFallbackMapData(locations: MapLocation[]) {
  if (locations.length === 0) return null;

  const worldCoordinates = locations.map((location) => {
    const latitude = Math.max(-85.05112878, Math.min(85.05112878, location.lat));
    const latitudeRadians = (latitude * Math.PI) / 180;
    return {
      ...location,
      x: ((location.lng + 180) / 360) * 256,
      y: ((1 - Math.asinh(Math.tan(latitudeRadians)) / Math.PI) / 2) * 256,
    };
  });

  const firstX = worldCoordinates[0].x;
  worldCoordinates.forEach((location) => {
    while (location.x - firstX > 128) location.x -= 256;
    while (location.x - firstX < -128) location.x += 256;
  });

  const minX = Math.min(...worldCoordinates.map(({ x }) => x));
  const maxX = Math.max(...worldCoordinates.map(({ x }) => x));
  const minY = Math.min(...worldCoordinates.map(({ y }) => y));
  const maxY = Math.max(...worldCoordinates.map(({ y }) => y));

  let zoom = 0;
  for (let candidate = 18; candidate >= 0; candidate -= 1) {
    const scale = 2 ** candidate;
    if ((maxX - minX) * scale <= 320 && (maxY - minY) * scale <= 360) {
      zoom = candidate;
      break;
    }
  }

  const scale = 2 ** zoom;
  const worldSize = 256 * scale;
  const centerX = ((minX + maxX) / 2) * scale;
  const centerY = ((minY + maxY) / 2) * scale;
  const centerTileX = Math.floor(centerX / 256);
  const centerTileY = Math.floor(centerY / 256);
  const tileCount = 2 ** zoom;
  const tiles = [];

  for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
    for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
      const tileX = ((centerTileX + offsetX) % tileCount + tileCount) % tileCount;
      const tileY = centerTileY + offsetY;
      if (tileY < 0 || tileY >= tileCount) continue;

      tiles.push({
        key: `${offsetX}-${offsetY}`,
        url: `https://tile.openstreetmap.org/${zoom}/${tileX}/${tileY}.png`,
        left: centerTileX * 256 + offsetX * 256 - centerX,
        top: centerTileY * 256 + offsetY * 256 - centerY,
      });
    }
  }

  return {
    tiles,
    locations: worldCoordinates.map((location) => {
      const x = location.x * scale;
      const y = location.y * scale;
      const xOffset = x - centerX;
      const worldOffset = Math.round(xOffset / worldSize);

      return {
        ...location,
        left: xOffset - worldOffset * worldSize,
        top: y - centerY,
      };
    }),
  };
}

function formatCountdown(targetDateStr: string, timeStr?: string): string {
  try {
    let target = new Date(targetDateStr).getTime();
    if (timeStr) {
      const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
      if (match) {
        let hours = parseInt(match[1], 10);
        const minutes = parseInt(match[2], 10);
        const ampm = match[3]?.toUpperCase();
        if (ampm === "PM" && hours < 12) hours += 12;
        if (ampm === "AM" && hours === 12) hours = 0;
        const d = new Date(targetDateStr);
        d.setHours(hours, minutes, 0, 0);
        target = d.getTime();
      }
    }

    const diff = target - Date.now();
    if (diff <= 0) return "Tour in progress";
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    if (h > 0) return `Tour begins in ${h}h ${m}m`;
    return `Tour begins in ${m} min`;
  } catch {
    return "Upcoming Tour";
  }
}

export default function MeetingPointPage() {
  const params = useParams();
  const bookingId = params?.bookingId as string;
  const { data: session } = useSession();
  const router = useRouter();

  const [booking, setBooking] = useState<any>(null);
  const [meetSession, setMeetSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [myCoords, setMyCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [sharingStarted, setSharingStarted] = useState<Date | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [distanceToMeeting, setDistanceToMeeting] = useState<number | null>(null);
  const [countdown, setCountdown] = useState("");
  const [hasNotifiedNearby, setHasNotifiedNearby] = useState(false);
  const [arrived, setArrived] = useState(false);
  const [mapMode, setMapMode] = useState<"interactive" | "embed">("embed");
  const [startingChat, setStartingChat] = useState(false);
  const [expiryCountdown, setExpiryCountdown] = useState<string>("");

  const watchIdRef = useRef<number | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<any>(null);
  const markersRef = useRef<{ [key: string]: any }>({});
  const shareExpiryRef = useRef<NodeJS.Timeout | null>(null);
  const previousMeetStatusRef = useRef<{ bookingId: string; status: string } | null>(null);

  const rawRole = (session?.user as any)?.role;
  const role: "TOURIST" | "GUIDE" = rawRole === "GUIDE" ? "GUIDE" : "TOURIST";
  const dashRole: "guide" | "tourist" = role === "GUIDE" ? "guide" : "tourist";

  // Fetch Booking Details
  useEffect(() => {
    if (!bookingId) return;
    const fetchBooking = async () => {
      try {
        const res = await fetch(`/api/bookings/${bookingId}`);
        if (res.ok) {
          const data = await res.json();
          setBooking(data);
        } else {
          toast.error("Failed to load booking details");
        }
      } catch (err) {
        console.error(err);
        toast.error("Error connecting to server");
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();
  }, [bookingId]);

  // Tour countdown
  useEffect(() => {
    if (!booking?.bookingDate) return;
    const updateCountdown = () => {
      setCountdown(formatCountdown(booking.bookingDate, booking.bookingTime));
    };
    updateCountdown();
    const timer = setInterval(updateCountdown, 15000);
    return () => clearInterval(timer);
  }, [booking]);

  // Poll Meet Session
  const fetchMeet = useCallback(async () => {
    if (!bookingId || !session?.user) return;
    try {
      const res = await fetch(`/api/meet?bookingId=${bookingId}`);
      if (res.ok) {
        const data = await res.json();
        const previousMeet = previousMeetStatusRef.current;
        if (
          previousMeet?.bookingId === bookingId &&
          previousMeet.status !== "ARRIVED" &&
          data.status === "ARRIVED"
        ) {
          toast.success(
            role === "TOURIST"
              ? "Your guide has arrived at the meeting point."
              : "The tourist has arrived at the meeting point."
          );
        }
        previousMeetStatusRef.current = { bookingId, status: data.status };
        setMeetSession(data);
        setArrived(data.status === "ARRIVED");
      }
    } catch (err) {
      console.error("Meet session fetch error:", err);
    }
  }, [bookingId, role, session?.user]);

  useEffect(() => {
    fetchMeet();
    const interval = setInterval(fetchMeet, 4000);
    return () => clearInterval(interval);
  }, [fetchMeet]);

  // Handle Proximity & Distances
  useEffect(() => {
    if (!booking?.gig) return;

    // Meeting point coords
    const meetLat = booking.gig.lat;
    const meetLng = booking.gig.lng;

    // Distance to meeting point
    if (
      myCoords &&
      typeof meetLat === "number" &&
      typeof meetLng === "number"
    ) {
      const dMeet = Math.round(getDistance(myCoords.lat, myCoords.lng, meetLat, meetLng));
      setDistanceToMeeting(dMeet);
    } else {
      setDistanceToMeeting(null);
    }

    // Distance between Tourist and Guide
    if (meetSession && myCoords) {
      const otherLat = role === "TOURIST" ? meetSession.guideLat : meetSession.touristLat;
      const otherLng = role === "TOURIST" ? meetSession.guideLng : meetSession.touristLng;

      if (typeof otherLat === "number" && typeof otherLng === "number") {
        const d = Math.round(getDistance(myCoords.lat, myCoords.lng, otherLat, otherLng));
        setDistance(d);

        // Proximity notifications
        if (d < 200 && !hasNotifiedNearby) {
          toast.success(
            role === "TOURIST"
              ? "Your tour guide is nearby! (Less than 200m away)"
              : "Tourist is nearby! (Less than 200m away)"
          );
          setHasNotifiedNearby(true);
        }

      } else {
        setDistance(null);
      }
    }
  }, [myCoords, meetSession, booking, role, hasNotifiedNearby]);

  // Google Maps Loader
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    const hasCoords =
      typeof booking?.gig?.lat === "number" &&
      Number.isFinite(booking.gig.lat) &&
      typeof booking?.gig?.lng === "number" &&
      Number.isFinite(booking.gig.lng);
    if (!apiKey || !hasCoords || typeof window === "undefined") {
      setMapMode("embed");
      return;
    }

    import("@googlemaps/js-api-loader")
      .then(({ Loader }) => {
        const loader = new Loader({
          apiKey,
          version: "weekly",
        });

        return loader.load().then((google: any) => {
          if (!mapContainerRef.current) return;
          setMapMode("interactive");

          const center = { lat: booking.gig.lat, lng: booking.gig.lng };
          const map = new google.maps.Map(mapContainerRef.current, {
            center,
            zoom: 16,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
            styles: [
              { elementType: "geometry", stylers: [{ color: "#0f172a" }] },
              { elementType: "labels.text.fill", stylers: [{ color: "#94a3b8" }] },
              { elementType: "labels.text.stroke", stylers: [{ color: "#020617" }] },
              { featureType: "road", elementType: "geometry", stylers: [{ color: "#1e293b" }] },
              { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#0f172a" }] },
              { featureType: "water", elementType: "geometry", stylers: [{ color: "#0369a1" }] },
              { featureType: "poi", elementType: "geometry", stylers: [{ color: "#1e293b" }] },
            ],
          });
          googleMapRef.current = map;

          // Meeting Point Pin
          markersRef.current.meeting = new google.maps.Marker({
            position: center,
            map,
            title: `Meeting Point: ${booking.gig.meetingPoint || booking.gig.location}`,
            icon: {
              path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
              scale: 6,
              fillColor: "#ef4444",
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: 2,
            },
            label: {
              text: "MEETING",
              color: "#ffffff",
              fontSize: "10px",
              fontWeight: "bold",
              className: "mt-1",
            },
          });
        });
      })
      .catch((err) => {
        console.warn("Google Maps JS API loading error, using embed fallback:", err);
        setMapMode("embed");
      });
  }, [booking]);

  // Update dynamic markers on interactive map
  useEffect(() => {
    if (!googleMapRef.current || !(window as any).google || !meetSession) return;
    const google = (window as any).google;

    const updateOrSetMarker = (
      key: string,
      lat: number | null,
      lng: number | null,
      title: string,
      fillColor: string,
      labelStr: string
    ) => {
      if (
        typeof lat !== "number" ||
        !Number.isFinite(lat) ||
        typeof lng !== "number" ||
        !Number.isFinite(lng)
      ) {
        if (markersRef.current[key]) {
          markersRef.current[key].setMap(null);
          delete markersRef.current[key];
        }
        return;
      }

      const pos = { lat, lng };
      if (markersRef.current[key]) {
        markersRef.current[key].setPosition(pos);
      } else {
        markersRef.current[key] = new google.maps.Marker({
          position: pos,
          map: googleMapRef.current,
          title,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 9,
            fillColor,
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 2.5,
          },
          label: {
            text: labelStr,
            color: "#ffffff",
            fontSize: "10px",
            fontWeight: "bold",
          },
        });
      }
    };

    updateOrSetMarker(
      "tourist",
      meetSession.touristLat,
      meetSession.touristLng,
      "Tourist Live Location",
      "#3b82f6",
      "T"
    );

    updateOrSetMarker(
      "guide",
      meetSession.guideLat,
      meetSession.guideLng,
      "Guide Live Location",
      "#8b5cf6",
      "G"
    );
  }, [meetSession, mapMode]);


  // Server-synced sharing expiry countdown
  useEffect(() => {
    const mySharingExpiresAt = role === "GUIDE" ? meetSession?.guideSharingExpiresAt : meetSession?.touristSharingExpiresAt;
    if (!mySharingExpiresAt || !isSharing) {
      setExpiryCountdown("");
      return;
    }

    const updateTimer = () => {
      const diff = new Date(mySharingExpiresAt).getTime() - Date.now();
      if (diff <= 0) {
        setExpiryCountdown("Expired");
        stopSharing(false);
        toast.error("Location sharing session expired after 2.5 hours");
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      if (h > 0) setExpiryCountdown(`${h}h ${m}m left`);
      else if (m > 0) setExpiryCountdown(`${m}m ${s}s left`);
      else setExpiryCountdown(`${s}s left`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [meetSession, role, isSharing]);

  // Start Live GPS Sharing
  const startSharing = () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setIsSharing(true);
    setSharingStarted(new Date());
    toast.success("Live location sharing activated");

    watchIdRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setMyCoords({ lat, lng });

        try {
          const res = await fetch("/api/meet", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ bookingId, lat, lng }),
          });

          if (res.status === 410) {
            const data = await res.json();
            stopSharing(false);
            toast.error(data.message || "Location sharing session expired after 2.5 hours");
            fetchMeet();
            return;
          }
        } catch (postErr) {
          console.error("Error posting live coordinates:", postErr);
        }
      },
      (err) => {
        console.error("GPS Watch error:", err);
        toast.error("Unable to retrieve GPS coordinates. Please check browser permissions.");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  // Stop Live GPS Sharing
  const stopSharing = async (notifyServer = true) => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (shareExpiryRef.current) {
      clearTimeout(shareExpiryRef.current);
      shareExpiryRef.current = null;
    }
    setIsSharing(false);
    setSharingStarted(null);
    setExpiryCountdown("");

    if (notifyServer) {
      try {
        await fetch("/api/meet", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookingId, stopSharing: true }),
        });
        fetchMeet();
      } catch {}
      toast.success("Location sharing paused");
    }
  };

  // Confirm or Toggle arrival
  const handleToggleArrived = async () => {
    const isCurrentlyArrived = arrived || meetSession?.status === "ARRIVED";
    const nextArrived = !isCurrentlyArrived;

    if (nextArrived && (!myCoords || distanceToMeeting === null || distanceToMeeting >= 50)) {
      toast.error("Share your location and get within 50 meters of the meeting point first.");
      return;
    }

    try {
      const res = await fetch("/api/meet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          ...(myCoords ? { lat: myCoords.lat, lng: myCoords.lng } : {}),
          arrived: nextArrived,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to update arrival status");
      }

      previousMeetStatusRef.current = { bookingId, status: data.status };
      setArrived(data.status === "ARRIVED");
      if (nextArrived && data.status !== "ARRIVED") {
        toast.error(data.arrivalError || "Both guide and tourist must be near the meeting point.");
      } else if (nextArrived) {
        toast.success("Guide and tourist are both within 50 meters of the meeting point.");
      } else {
        toast.success("Arrival status reset to approaching.");
      }
      fetchMeet();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update arrival status");
    }
  };

  // Chat redirect
  const handleOpenChat = async () => {
    if (!booking) return;
    setStartingChat(true);
    try {
      const guideId = booking.gig?.guide?.id || booking.gig?.guideId;
      const touristId = booking.tourist?.id || booking.touristId;
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          touristId,
          guideId,
          gigId: booking.gigId,
          bookingId: booking.id,
        }),
      });

      if (res.ok) {
        router.push(role === "TOURIST" ? "/dashboard/tourist/messages" : "/dashboard/guide/messages");
      } else {
        toast.error("Could not start conversation");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to connect to messages");
    } finally {
      setStartingChat(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (shareExpiryRef.current) {
        clearTimeout(shareExpiryRef.current);
      }
    };
  }, []);

  const otherParty = role === "TOURIST" ? booking?.gig?.guide : booking?.tourist;
  const otherPartyCoords = meetSession
    ? role === "TOURIST"
      ? { lat: meetSession.guideLat, lng: meetSession.guideLng }
      : { lat: meetSession.touristLat, lng: meetSession.touristLng }
    : null;
  const otherConnected =
    typeof otherPartyCoords?.lat === "number" &&
    typeof otherPartyCoords?.lng === "number";
  const bothConnected = isSharing && otherConnected;

  const hasExactCoords =
    typeof booking?.gig?.lat === "number" &&
    Number.isFinite(booking.gig.lat) &&
    typeof booking?.gig?.lng === "number" &&
    Number.isFinite(booking.gig.lng);
  const meetingLat = hasExactCoords ? booking.gig.lat : null;
  const meetingLng = hasExactCoords ? booking.gig.lng : null;
  const meetingAddress = booking?.gig?.meetingPoint || booking?.gig?.location || "Designated Tour Meeting Spot";
  const meetingPhoto = booking?.gig?.meetingPointPhoto || booking?.gig?.images?.[0] || "/assets/santorini.jpg";
  const fallbackMapLocations: MapLocation[] = [];

  if (meetingLat !== null && meetingLng !== null) {
    fallbackMapLocations.push({
      id: "meeting",
      lat: meetingLat,
      lng: meetingLng,
      label: "MEETING",
      color: "#ef4444",
    });
  }
  if (
    typeof meetSession?.touristLat === "number" &&
    Number.isFinite(meetSession.touristLat) &&
    typeof meetSession?.touristLng === "number" &&
    Number.isFinite(meetSession.touristLng)
  ) {
    fallbackMapLocations.push({
      id: "tourist",
      lat: meetSession.touristLat,
      lng: meetSession.touristLng,
      label: "T",
      color: "#3b82f6",
    });
  }
  if (
    typeof meetSession?.guideLat === "number" &&
    Number.isFinite(meetSession.guideLat) &&
    typeof meetSession?.guideLng === "number" &&
    Number.isFinite(meetSession.guideLng)
  ) {
    fallbackMapLocations.push({
      id: "guide",
      lat: meetSession.guideLat,
      lng: meetSession.guideLng,
      label: "G",
      color: "#8b5cf6",
    });
  }
  const fallbackMapData = getFallbackMapData(fallbackMapLocations);

  const directionsUrl = hasExactCoords
    ? `https://www.google.com/maps/dir/?api=1&destination=${meetingLat},${meetingLng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(meetingAddress)}`;

  if (loading) {
    return (
      <DashboardLayout role={dashRole}>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
          <DotsLoader size="lg" />
          <span className="text-xs font-semibold text-dark-400">Loading meeting point & live radar...</span>
        </div>
      </DashboardLayout>
    );
  }

  if (!booking) {
    return (
      <DashboardLayout role={dashRole}>
        <div className="card p-12 text-center max-w-md mx-auto my-12 space-y-4">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <h2 className="text-lg font-bold text-dark-900">Booking Not Found</h2>
          <p className="text-xs text-dark-500">The requested booking does not exist or you do not have permission to view it.</p>
          <button
            onClick={() => router.back()}
            className="btn-primary w-full py-2.5 text-xs font-semibold"
          >
            Go Back
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role={dashRole}>
      <div className="space-y-4 pb-8 max-w-7xl mx-auto">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-dark-100 pb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2.5 rounded-xl border border-dark-200 hover:bg-dark-100 text-dark-700 transition-colors cursor-pointer"
              title="Return to bookings"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-dark-900 tracking-tight">Meeting Point Helper</h1>
                <span className="badge text-[10px] bg-primary/10 text-primary font-semibold">
                  Live Radar
                </span>
              </div>
              <p className="text-xs text-dark-500 line-clamp-1 mt-0.5">
                {booking.gig?.title || "Tour Destination"}
              </p>
            </div>
          </div>

          {countdown && (
            <div className="flex items-center gap-2 bg-dark-900 text-white px-3.5 py-1.5 rounded-xl text-xs font-medium self-start sm:self-auto shadow-sm">
              <Clock className="w-3.5 h-3.5 text-primary" />
              <span>{countdown}</span>
            </div>
          )}
        </div>

        {/* Responsive Grid: Map + Right Action Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-[580px]">
          {/* Left Column: Interactive Map (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col space-y-3">
            <div className="relative w-full h-[380px] sm:h-[440px] lg:h-[540px] bg-dark-950 rounded-2xl overflow-hidden border border-dark-200 shadow-md">
              {/* Map Target Container */}
              <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />

              {/* OpenStreetMap fallback keeps live markers visible without a Google Maps key. */}
              {mapMode === "embed" && fallbackMapData && (
                <div className="absolute inset-0 overflow-hidden bg-slate-200" aria-label="Map with live locations">
                  {fallbackMapData.tiles.map((tile) => (
                    <div
                      key={tile.key}
                      aria-hidden="true"
                      className="absolute h-64 w-64 max-w-none"
                      style={{
                        left: `calc(50% + ${tile.left}px)`,
                        top: `calc(50% + ${tile.top}px)`,
                        backgroundImage: `url("${tile.url}")`,
                        backgroundSize: "256px 256px",
                      }}
                    />
                  ))}
                  {fallbackMapData.locations.map((location) => (
                    <div
                      key={location.id}
                      className="absolute z-10 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
                      style={{
                        left: `calc(50% + ${location.left}px)`,
                        top: `calc(50% + ${location.top}px)`,
                      }}
                      title={
                        location.id === "meeting"
                          ? `Meeting point: ${meetingAddress}`
                          : location.id === "guide"
                          ? "Guide live location"
                          : "Tourist live location"
                      }
                    >
                      <span
                        className="flex h-8 min-w-8 items-center justify-center rounded-full border-2 border-white px-1 text-[10px] font-bold text-white shadow-lg"
                        style={{ backgroundColor: location.color }}
                      >
                        {location.label}
                      </span>
                    </div>
                  ))}
                  <a
                    href="https://www.openstreetmap.org/copyright"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute bottom-28 right-2 z-10 rounded bg-white/90 px-1.5 py-1 text-[9px] text-slate-700 shadow"
                  >
                    © OpenStreetMap contributors
                  </a>
                </div>
              )}

              {/* Address-only fallback when no coordinates are available for live markers. */}
              {mapMode === "embed" && !fallbackMapData && (
                <iframe
                  title="Google Maps Meeting Point"
                  width="100%"
                  height="100%"
                  className="absolute inset-0 border-0 filter contrast-105"
                  loading="lazy"
                  allowFullScreen
                  src={
                    hasExactCoords
                      ? `https://maps.google.com/maps?q=${meetingLat},${meetingLng}&hl=en&z=16&output=embed`
                      : `https://maps.google.com/maps?q=${encodeURIComponent(meetingAddress)}&hl=en&z=16&output=embed`
                  }
                />
              )}

              {/* Top Badges on Map */}
              <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                <div className="pointer-events-auto flex items-center gap-2 bg-dark-950/85 backdrop-blur-md border border-dark-800 text-white px-3 py-1.5 rounded-xl text-xs font-medium shadow-lg">
                  <div className={`w-2 h-2 rounded-full ${isSharing ? "bg-emerald-400 animate-ping" : "bg-dark-500"}`} />
                  <span>{isSharing ? "GPS Broadcasting Live" : "GPS Sharing Inactive"}</span>
                </div>

                <a
                  href={directionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pointer-events-auto flex items-center gap-1.5 bg-white/95 hover:bg-white text-dark-900 border border-dark-200 px-3 py-1.5 rounded-xl text-xs font-bold shadow-lg transition-transform active:scale-95"
                >
                  <span>Open in Maps</span>
                  <ExternalLink className="w-3.5 h-3.5 text-primary" />
                </a>
              </div>

              {/* Bottom Meeting Point Details Card inside Map */}
              <div className="absolute bottom-3 left-3 right-3 pointer-events-auto">
                <div className="bg-white/95 dark:bg-dark-900/95 backdrop-blur-md rounded-2xl p-3.5 shadow-xl border border-dark-200/80 dark:border-dark-800 flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl overflow-hidden border border-dark-200 flex-shrink-0 bg-dark-100">
                    <img
                      src={meetingPhoto}
                      alt="Meeting point reference"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-rose-500">
                        <MapPin className="w-3.5 h-3.5 flex-shrink-0" /> Designated Meeting Point
                      </span>
                      {hasExactCoords ? (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                          Verified GPS Pin
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-600 border border-amber-500/20">
                          Address Reference
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-semibold text-dark-900 truncate mt-0.5">
                      {meetingAddress}
                    </p>
                    <p className="text-[11px] text-dark-500 truncate mt-0.5">
                      {booking.gig?.country || "Meeting coordinate locked"}
                    </p>
                  </div>

                  <a
                    href={directionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 bg-primary hover:bg-primary-600 text-white font-semibold py-2 px-3 rounded-xl text-xs flex items-center gap-1 shadow-sm transition-all"
                  >
                    <span>Navigate</span>
                    <Navigation className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Radar, Proximity, & Live Controls (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col space-y-4">
            {/* Live Distance & Connection Card */}
            <div className="card p-5 space-y-4 bg-gradient-to-br from-white to-dark-50/60 border border-dark-200/80 shadow-xs">
              <div className="flex items-center justify-between border-b border-dark-100 pb-3">
                <div className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-primary" />
                  <span className="text-xs font-bold text-dark-800 uppercase tracking-wider">Live Proximity</span>
                </div>

                <div className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
                  bothConnected
                    ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                    : isSharing
                    ? "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                    : "bg-dark-100 text-dark-500"
                }`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${
                    bothConnected ? "bg-emerald-500" : isSharing ? "bg-amber-500 animate-pulse" : "bg-dark-400"
                  }`} />
                  <span>
                    {bothConnected
                      ? "Both locations connected"
                      : isSharing
                      ? "Waiting for partner..."
                      : "Sharing offline"}
                  </span>
                </div>
              </div>

              {/* Big Distance Metric */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="bg-white border border-dark-200/80 rounded-xl p-3.5 text-center shadow-2xs">
                  <span className="text-[10px] font-bold text-dark-400 uppercase tracking-wider block">
                    {role === "TOURIST" ? "Distance to Guide" : "Distance to Tourist"}
                  </span>
                  <p className="text-2xl font-extrabold text-dark-900 mt-1">
                    {distance !== null
                      ? distance < 1000
                        ? `${distance} m`
                        : `${(distance / 1000).toFixed(1)} km`
                      : "—"}
                  </p>
                  <span className="text-[10px] text-dark-400 block mt-0.5">
                    {distance !== null ? "Real-time GPS" : "Requires active sharing"}
                  </span>
                </div>

                <div className="bg-white border border-dark-200/80 rounded-xl p-3.5 text-center shadow-2xs">
                  <span className="text-[10px] font-bold text-dark-400 uppercase tracking-wider block">
                    Distance to Spot
                  </span>
                  <p className="text-2xl font-extrabold text-primary mt-1">
                    {distanceToMeeting !== null
                      ? distanceToMeeting < 1000
                        ? `${distanceToMeeting} m`
                        : `${(distanceToMeeting / 1000).toFixed(1)} km`
                      : "—"}
                  </p>
                  <span className="text-[10px] text-dark-400 block mt-0.5">
                    Meeting coordinate
                  </span>
                </div>
              </div>

              {/* Proximity / Arrived Alert Banner */}
              {(arrived || meetSession?.status === "ARRIVED") && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-start gap-2.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-emerald-800">
                      {role === "TOURIST" ? "You have arrived at the location" : "Tour guide is at the location"}
                    </p>
                    <p className="text-[11px] text-emerald-700 mt-0.5">
                      Both parties are confirmed on-site. Have an unforgettable tour!
                    </p>
                  </div>
                </div>
              )}

              {distance !== null && distance < 200 && !arrived && meetSession?.status !== "ARRIVED" && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center gap-2.5">
                  <Navigation className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <p className="text-xs font-semibold text-blue-800">
                    {role === "TOURIST" ? "Guide is nearby! Keep your phone ready." : "Tourist is nearby! Keep an eye out."}
                  </p>
                </div>
              )}
            </div>

            {/* Other Party Profile Card */}
            <div className="card p-4 space-y-3 bg-white border border-dark-200/80 shadow-xs">
              <span className="text-[10px] font-bold text-dark-400 uppercase tracking-wider block">
                {role === "TOURIST" ? "Your Tour Guide" : "Customer / Tourist"}
              </span>

              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary/20 flex-shrink-0 bg-dark-100 flex items-center justify-center">
                    {otherParty?.avatar ? (
                      <img
                        src={otherParty.avatar}
                        alt={otherParty.name || "User"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-6 h-6 text-dark-400" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-bold text-dark-900 truncate">
                        {otherParty?.name || (role === "TOURIST" ? "Assigned Guide" : "Traveler")}
                      </p>
                      {role === "TOURIST" && (
                        <span title="Verified Tour Guide"><ShieldCheck className="w-3.5 h-3.5 text-primary flex-shrink-0" /></span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-dark-500 mt-0.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${otherConnected ? "bg-emerald-500" : "bg-dark-300"}`} />
                      <span>{otherConnected ? "Broadcasting Location" : "Location Not Shared"}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleOpenChat}
                  disabled={startingChat}
                  className="flex items-center gap-1.5 py-2 px-3 rounded-xl bg-dark-100 hover:bg-dark-200 text-dark-800 text-xs font-semibold transition-colors cursor-pointer flex-shrink-0"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>{startingChat ? "Opening..." : "Chat"}</span>
                </button>
              </div>
            </div>

            {/* Sharing & Arrival Controls */}
            <div className="card p-5 space-y-3 bg-white border border-dark-200/80 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-dark-900">Location Sharing Settings</span>
                <span className="text-[11px] font-semibold text-dark-500">{expiryCountdown ? `Session: ${expiryCountdown}` : "Max duration: 2.5h"}</span>
              </div>

              {sharingStarted && (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                  <span>Temporary live GPS active{expiryCountdown ? ` (${expiryCountdown})` : ""}. Server will automatically terminate session after 2.5 hours to preserve privacy.</span>
                </div>
              )}

              {/* Toggle Live Location */}
              {isSharing ? (
                <button
                  onClick={() => stopSharing(true)}
                  className="w-full py-3 px-4 rounded-xl border border-amber-300 bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs active:scale-98"
                >
                  <Radio className="w-4 h-4 text-amber-600 animate-pulse" />
                  <span>Stop Sharing My Location</span>
                </button>
              ) : (
                <button
                  onClick={startSharing}
                  className="w-full py-3 px-4 rounded-xl bg-primary hover:bg-primary-600 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-primary/20 active:scale-98"
                >
                  <Navigation className="w-4 h-4" />
                  <span>Share My Live Location</span>
                </button>
              )}

              {/* Arrival Confirmation Button (Toggleable) */}
              <button
                onClick={handleToggleArrived}
                disabled={
                  meetSession?.status === "COMPLETED" ||
                  (!(arrived || meetSession?.status === "ARRIVED") &&
                    (!myCoords || distanceToMeeting === null || distanceToMeeting >= 50))
                }
                className={`w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer active:scale-98 ${
                  arrived || meetSession?.status === "ARRIVED"
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                    : "bg-dark-900 hover:bg-dark-950 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                }`}
              >
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>
                  {arrived || meetSession?.status === "ARRIVED"
                    ? "Arrived at Meeting Point (Click to Reset)"
                    : "I've Arrived at the Meeting Point"}
                </span>
              </button>

              <p className="text-[11px] text-dark-400 text-center pt-1">
                Arrival is confirmed only when both live locations are within 50 meters of the designated pin.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
