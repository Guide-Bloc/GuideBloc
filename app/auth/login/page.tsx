"use client";

import { useState, useEffect, Suspense } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import AuthVisualSide from "@/components/auth/AuthVisualSide";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [keepSignedIn, setKeepSignedIn] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Automatically intercept users who intended to sign up/verify as guide,
  // or authenticated users who landed on the sign-in page
  useEffect(() => {
    try {
      const cookieIntent = document.cookie
        .split("; ")
        .find((row) => row.startsWith("guidebloc_role_intent="))
        ?.split("=")[1];
      const localIntent = typeof window !== "undefined" ? localStorage.getItem("guidebloc_role_intent") : null;

      if (cookieIntent === "GUIDE" || localIntent === "GUIDE") {
        document.cookie = "guidebloc_role_intent=; path=/; max-age=0";
        try {
          localStorage.removeItem("guidebloc_role_intent");
        } catch {}
        window.location.href = "/auth/verify-guide";
        return;
      }
    } catch {}

    if (status === "authenticated" && session?.user?.email) {
      const role = (session.user as any)?.role;
      if (role === "ADMIN") {
        window.location.href = "/admin/dashboard";
      } else if (role === "GUIDE") {
        window.location.href = "/dashboard/guide/overview";
      } else {
        window.location.href = "/dashboard/tourist/bookings";
      }
    }
  }, [session, status]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password. Please verify your credentials.");
        setLoading(false);
        return;
      }

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

      // Fast role-based redirect
      const roleRes = await fetch(`/api/auth/user-role?email=${encodeURIComponent(email)}`);
      if (roleRes.ok) {
        const { role } = await roleRes.json();
        if (role === "ADMIN") {
          window.location.href = "/admin/dashboard";
          return;
        } else if (role === "GUIDE") {
          window.location.href = "/dashboard/guide/overview";
          return;
        }
      }

      window.location.href = "/dashboard/tourist/bookings";
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    const callback = searchParams.get("callbackUrl") || "/auth/callback";
    signIn("google", { callbackUrl: callback });
  };

  return (
    <div className="min-h-screen bg-[#dce7f9] flex items-center justify-center p-4 sm:p-6 lg:p-10">
      <div className="w-full max-w-[1040px] rounded-[28px] sm:rounded-[32px] overflow-hidden bg-white shadow-2xl border border-slate-200/80 grid grid-cols-1 lg:grid-cols-12">
        {/* Left Visual Column */}
        <div className="lg:col-span-6">
          <AuthVisualSide
            variant="story"
            backHref="/explore"
            backLabel="Back to explore"
          />
        </div>

        {/* Right Form Column */}
        <div className="lg:col-span-6 p-6 sm:p-10 lg:p-12 flex flex-col justify-center bg-white">
          {/* Top Toggle Switcher Pill */}
          <div className="inline-flex items-center p-1 bg-slate-100 rounded-full border border-slate-200 self-end mb-6">
            <span className="px-4 py-1.5 rounded-full text-xs font-semibold bg-[#111928] text-white shadow-xs">
              Sign in
            </span>
            <Link
              href="/auth/register"
              className="px-4 py-1.5 rounded-full text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
            >
              Sign up
            </Link>
          </div>

          {/* Typography Header */}
          <div className="mb-6">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 block mb-1.5">
              WELCOME BACK
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-display">
              Good to see you again
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Sign in to continue planning your next unforgettable trip.
            </p>
          </div>

          {/* Google Authentication Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="w-full py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors text-slate-700 font-medium text-sm flex items-center justify-center gap-2.5 shadow-2xs cursor-pointer"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          {/* Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-white text-slate-400">or continue with email</span>
            </div>
          </div>

          {/* Error Message Box */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {error}
            </div>
          )}

          {/* Email / Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Email address
              </label>
              <div className="relative rounded-xl border border-slate-200 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100 bg-white transition-all">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none bg-transparent rounded-xl"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Password
                </label>
                <Link
                  href="/auth/forgot-password"
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative rounded-xl border border-slate-200 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100 bg-white transition-all">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none bg-transparent rounded-xl"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={keepSignedIn}
                  onChange={(e) => setKeepSignedIn(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                />
                <span className="text-xs text-slate-600">Keep me signed in</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-md shadow-blue-500/25 transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Sign in &rarr;</span>
              )}
            </button>
          </form>

          {/* Bottom Link */}
          <p className="text-center text-xs text-slate-500 mt-6">
            New to GuideBloc?{" "}
            <Link href="/auth/register" className="text-blue-600 font-semibold hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#dce7f9] flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
