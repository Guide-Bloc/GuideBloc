"use client";

import { useEffect, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

function CallbackContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/auth/login");
      return;
    }

    if (status === "authenticated" && session?.user?.email) {
      // 1. Check if user intended to sign up / verify as a Guide
      let hasGuideIntent = false;
      try {
        const cookieIntent = document.cookie
          .split("; ")
          .find((row) => row.startsWith("guidebloc_role_intent="))
          ?.split("=")[1];
        const localIntent = localStorage.getItem("guidebloc_role_intent");
        if (cookieIntent === "GUIDE" || localIntent === "GUIDE") {
          hasGuideIntent = true;
          // Clear intent so subsequent logins don't get trapped
          document.cookie = "guidebloc_role_intent=; path=/; max-age=0";
          localStorage.removeItem("guidebloc_role_intent");
        }
      } catch {}

      if (hasGuideIntent) {
        window.location.href = "/auth/verify-guide";
        return;
      }

      // 2. Check explicit callbackUrl
      const explicitCallback = searchParams.get("callbackUrl");
      if (
        explicitCallback &&
        explicitCallback.startsWith("/") &&
        !explicitCallback.startsWith("/auth/login") &&
        !explicitCallback.startsWith("/auth/callback")
      ) {
        window.location.href = explicitCallback;
        return;
      }

      // 3. Query database for fresh user role
      fetch(`/api/auth/user-role?email=${encodeURIComponent(session.user.email)}`)
        .then((res) => (res.ok ? res.json() : Promise.reject()))
        .then((data) => {
          if (data.role === "ADMIN") {
            window.location.href = "/admin/dashboard";
          } else if (data.role === "GUIDE") {
            window.location.href = "/dashboard/guide/overview";
          } else {
            window.location.href = "/dashboard/tourist/bookings";
          }
        })
        .catch(() => {
          const userRole = (session.user as any)?.role;
          if (userRole === "ADMIN") {
            window.location.href = "/admin/dashboard";
          } else if (userRole === "GUIDE") {
            window.location.href = "/dashboard/guide/overview";
          } else {
            window.location.href = "/dashboard/tourist/bookings";
          }
        });
    }
  }, [session, status, router, searchParams]);

  return (
    <div className="min-h-screen bg-[#0B1120] flex flex-col items-center justify-center p-4">
      <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-600 to-blue-400 flex items-center justify-center text-white font-bold text-xl mb-4 shadow-lg shadow-blue-500/20 animate-pulse">
        G
      </div>
      <div className="flex items-center gap-2 text-slate-300 text-sm font-medium">
        <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
        <span>Authenticating and directing your journey...</span>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0B1120] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}
