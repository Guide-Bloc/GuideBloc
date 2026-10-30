"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, User, Eye, EyeOff, Loader2, Home, Compass, UploadCloud, X, Check } from "lucide-react";
import AuthVisualSide from "@/components/auth/AuthVisualSide";
import toast from "react-hot-toast";
import { signIn, useSession } from "next-auth/react";
import TurnstileCaptcha from "@/components/auth/TurnstileCaptcha";

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const initialRole = searchParams.get("role") === "guide" ? "GUIDE" : "TOURIST";

  const [role, setRole] = useState<"TOURIST" | "GUIDE">(initialRole);

  // If returning from Google OAuth with guide intent, direct straight to verify-guide
  useEffect(() => {
    try {
      const cookieIntent = document.cookie
        .split("; ")
        .find((row) => row.startsWith("guidebloc_role_intent="))
        ?.split("=")[1];
      const localIntent = typeof window !== "undefined" ? localStorage.getItem("guidebloc_role_intent") : null;

      if ((cookieIntent === "GUIDE" || localIntent === "GUIDE") && status === "authenticated") {
        document.cookie = "guidebloc_role_intent=; path=/; max-age=0";
        try {
          localStorage.removeItem("guidebloc_role_intent");
        } catch {}
        window.location.href = "/auth/verify-guide";
      }
    } catch {}
  }, [session, status]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [certificationFile, setCertificationFile] = useState<string>("");
  const [certFileName, setCertFileName] = useState<string>("");
  const [certFileSize, setCertFileSize] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (file?: File) => {
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File exceeds 10MB limit. Please choose a smaller file.");
      return;
    }

    const validTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast.error("Please upload a PDF, JPG, or PNG document.");
      return;
    }

    const sizeFormatted =
      file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(file.size / 1024)} KB`;

    setCertFileName(file.name);
    setCertFileSize(sizeFormatted);

    const reader = new FileReader();
    reader.onloadend = () => {
      setCertificationFile(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeSelectedFile = () => {
    setCertificationFile("");
    setCertFileName("");
    setCertFileSize("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleGoogleSignUp = async () => {
    if (role === "GUIDE") {
      document.cookie = "guidebloc_role_intent=GUIDE; path=/; max-age=1800";
      try {
        localStorage.setItem("guidebloc_role_intent", "GUIDE");
      } catch {}

      try {
        const result = await signIn("google", {
          callbackUrl: "/auth/verify-guide",
          redirect: false,
        });

        if (result?.error) {
          // If Google OAuth has a local config issue or warning, direct immediately to verify-guide
          router.push("/auth/verify-guide");
          return;
        }

        if (result?.url) {
          window.location.href = result.url;
        } else {
          router.push("/auth/verify-guide");
        }
      } catch {
        router.push("/auth/verify-guide");
      }
    } else {
      document.cookie = "guidebloc_role_intent=TOURIST; path=/; max-age=1800";
      try {
        localStorage.setItem("guidebloc_role_intent", "TOURIST");
      } catch {}
      signIn("google", { callbackUrl: "/dashboard/tourist/bookings" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!agreeTerms) {
      toast.error("Please agree to the Terms of Service and Privacy Policy.");
      return;
    }

    if (!captchaVerified) {
      toast.error("Please complete the Cloudflare Turnstile verification.");
      return;
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters long.");
      return;
    }

    if (role === "GUIDE" && !certificationFile) {
      toast.error("Please upload your professional guide certification.");
      return;
    }

    setLoading(true);

    try {
      const cleanEmail = email.trim().toLowerCase();
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: cleanEmail,
          password,
          role,
          certificationText:
            role === "GUIDE" ? `Uploaded Certificate: ${certFileName}` : undefined,
          certificationFile: role === "GUIDE" ? certificationFile : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "Registration failed. Please try again.");
        setLoading(false);
        return;
      }

      // Auto sign-in with credentials
      const signInRes = await signIn("credentials", {
        email: cleanEmail,
        password,
        redirect: false,
      });

      if (signInRes?.ok) {
        toast.success(
          role === "GUIDE"
            ? "Guide application submitted successfully!"
            : "Account created successfully!"
        );
        const destination =
          role === "GUIDE" ? "/dashboard/guide/overview" : "/dashboard/tourist/bookings";
        window.location.href = destination;
      } else {
        router.push("/auth/login");
      }
    } catch {
      toast.error("Something went wrong during registration.");
      setLoading(false);
    }
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
            <div className="inline-flex items-center p-1 bg-slate-100 rounded-full border border-slate-200 self-end mb-5">
              <Link
                href="/auth/login"
                className="px-4 py-1.5 rounded-full text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
              >
                Sign in
              </Link>
              <span className="px-4 py-1.5 rounded-full text-xs font-semibold bg-[#111928] text-white shadow-xs">
                Sign up
              </span>
            </div>

            {/* Typography Header */}
            <div className="mb-5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 block mb-1">
                START YOUR JOURNEY
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-display">
                Create your account
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Plan better trips and book extraordinary local experiences.
              </p>
            </div>

            {/* Role Selection Switcher Cards */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              {/* Tourist Role Card */}
              <div
                onClick={() => setRole("TOURIST")}
                className={`p-3 rounded-2xl flex items-center justify-between cursor-pointer transition-all select-none ${
                  role === "TOURIST"
                    ? "border-2 border-blue-600 bg-blue-50/50 shadow-xs"
                    : "border border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                      role === "TOURIST" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    <Home className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 leading-tight">Tourist</h4>
                    <p className="text-[10px] text-slate-500 leading-tight mt-0.5">
                      Explore & book trips
                    </p>
                  </div>
                </div>

                <div
                  className={`w-4 h-4 rounded-full flex items-center justify-center transition-all ${
                    role === "TOURIST" ? "border-2 border-blue-600" : "border border-slate-300"
                  }`}
                >
                  {role === "TOURIST" && <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
                </div>
              </div>

              {/* Tour Guide Role Card */}
              <div
                onClick={() => setRole("GUIDE")}
                className={`p-3 rounded-2xl flex items-center justify-between cursor-pointer transition-all select-none ${
                  role === "GUIDE"
                    ? "border-2 border-blue-600 bg-blue-50/50 shadow-xs"
                    : "border border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                      role === "GUIDE" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    <Compass className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 leading-tight">Tour guide</h4>
                    <p className="text-[10px] text-slate-500 leading-tight mt-0.5">
                      Host local experiences
                    </p>
                  </div>
                </div>

                <div
                  className={`w-4 h-4 rounded-full flex items-center justify-center transition-all ${
                    role === "GUIDE" ? "border-2 border-blue-600" : "border border-slate-300"
                  }`}
                >
                  {role === "GUIDE" && <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
                </div>
              </div>
            </div>

            {/* Google Authentication Button */}
            <button
              type="button"
              onClick={handleGoogleSignUp}
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
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-white text-slate-400">or continue with email</span>
              </div>
            </div>

            {/* Registration Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full name
                </label>
                <div className="relative rounded-xl border border-slate-200 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100 bg-white transition-all">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none bg-transparent rounded-xl"
                    placeholder="Alex Morgan"
                    required
                  />
                </div>
              </div>

              {/* Guide Certification Field (Only shown when Tour Guide is selected) */}
              {role === "GUIDE" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Guide certification
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => handleFileChange(e.target.files?.[0])}
                  />

                  {!certificationFile ? (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-blue-300 hover:border-blue-500 bg-blue-50/20 hover:bg-blue-50/40 rounded-xl p-3.5 flex items-center justify-between cursor-pointer transition-all group select-none"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                          <UploadCloud className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800 leading-tight">
                            Upload your certification
                          </p>
                          <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
                            PDF, JPG or PNG &middot; Max 10 MB
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-blue-600 hover:text-blue-700">
                        Browse
                      </span>
                    </div>
                  ) : (
                    <div className="border border-blue-200 bg-blue-50/40 rounded-xl p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                          <Check className="w-4 h-4 stroke-[2.5]" />
                        </div>
                        <div className="truncate">
                          <p className="text-xs font-bold text-slate-800 truncate">{certFileName}</p>
                          <p className="text-[10px] text-slate-500">{certFileSize}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={removeSelectedFile}
                        className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Your document is reviewed securely and is not shown publicly.
                  </span>
                </div>
              )}

              {/* Email Address */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email address
                </label>
                <div className="relative rounded-xl border border-slate-200 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100 bg-white transition-all">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none bg-transparent rounded-xl"
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password
                </label>
                <div className="relative rounded-xl border border-slate-200 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100 bg-white transition-all">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none bg-transparent rounded-xl"
                    placeholder="At least 8 characters"
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

              {/* Terms Checkbox */}
              <div className="pt-1">
                <label className="flex items-start gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 mt-0.5 cursor-pointer"
                  />
                  <span className="text-[11px] text-slate-600 leading-tight">
                    I agree to the{" "}
                    <Link href="/terms-of-service" className="text-blue-600 hover:underline">
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link href="/privacy-policy" className="text-blue-600 hover:underline">
                      Privacy Policy
                    </Link>
                    .
                  </span>
                </label>
              </div>

              {/* Cloudflare Turnstile Captcha */}
              <TurnstileCaptcha onVerify={setCaptchaVerified} />

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !captchaVerified}
                className="w-full mt-3 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-md shadow-blue-500/25 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : role === "GUIDE" ? (
                  <span>Apply as a guide &rarr;</span>
                ) : (
                  <span>Create account &rarr;</span>
                )}
              </button>
            </form>

            {/* Bottom Link */}
            <p className="text-center text-xs text-slate-500 mt-5">
              Already have an account?{" "}
              <Link href="/auth/login" className="text-blue-600 font-semibold hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#dce7f9] flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      }
    >
      <RegisterContent />
    </Suspense>
  );
}
