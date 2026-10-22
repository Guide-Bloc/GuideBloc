"use client";

import { useState, useRef, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UploadCloud, Lock, Check, X, Loader2, FileText, ImageIcon } from "lucide-react";
import AuthVisualSide from "@/components/auth/AuthVisualSide";
import toast from "react-hot-toast";

function VerifyGuideContent() {
  const { data: session } = useSession();
  const router = useRouter();

  const [certificationFile, setCertificationFile] = useState<string>("");
  const [certFileName, setCertFileName] = useState<string>("");
  const [certFileSize, setCertFileSize] = useState<string>("");
  const [certFileType, setCertFileType] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = (file?: File) => {
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
    setCertFileType(file.type);

    const reader = new FileReader();
    reader.onloadend = () => {
      setCertificationFile(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    processFile(file);
  };

  const removeSelectedFile = () => {
    setCertificationFile("");
    setCertFileName("");
    setCertFileSize("");
    setCertFileType("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!certificationFile) {
      toast.error("Please upload your professional guide certification.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/verify-guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          certificationFile,
          certificationText: `Submitted via Google Guide Onboarding: ${certFileName}`,
          userEmail: session?.user?.email || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "Failed to submit certification.");
        setLoading(false);
        return;
      }

      toast.success("Credentials submitted! Welcome to GuideBloc.");
      document.cookie = "guidebloc_role_intent=; path=/; max-age=0";
      try {
        localStorage.removeItem("guidebloc_role_intent");
      } catch {}
      // Redirect to guide overview
      window.location.href = "/dashboard/guide/overview";
    } catch {
      toast.error("An error occurred while uploading. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#dce7f9] flex items-center justify-center p-4 sm:p-6 lg:p-10">
      <div className="w-full max-w-[1040px] rounded-[28px] sm:rounded-[32px] overflow-hidden bg-white shadow-2xl border border-slate-200/80 grid grid-cols-1 lg:grid-cols-12">
        {/* Left Visual Column */}
        <div className="lg:col-span-6">
          <AuthVisualSide
            variant="verification"
            backHref="/auth/register?role=guide"
            backLabel="Back to sign up"
          />
        </div>

        {/* Right Form Column */}
        <div className="lg:col-span-6 p-6 sm:p-10 lg:p-12 flex flex-col justify-center bg-white">
          {/* Header Content */}
          <div className="mb-6">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 block mb-1">
              ONE LAST STEP
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-display">
              Verify your guide credentials
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Upload a valid tourism license or professional guide certification. Your document
              stays private.
            </p>
          </div>

          {/* Google Account Connected Status Card */}
          <div className="border border-slate-200 bg-slate-50/70 rounded-xl p-3 sm:p-3.5 flex items-center justify-between mb-6 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center shadow-2xs shrink-0">
                <svg className="w-4 h-4" viewBox="0 0 24 24">
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
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block leading-tight">
                  Signed up with Google{session?.user?.email ? ` (${session.user.email})` : ""}
                </span>
                <span className="text-xs font-bold text-slate-900 leading-tight">
                  Guide account connected
                </span>
              </div>
            </div>

            <div className="w-5 h-5 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 shrink-0">
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
            </div>
          </div>

          {/* Verification Form */}
          <form onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Professional certification
              </label>

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => processFile(e.target.files?.[0])}
              />

              {!certificationFile ? (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-8 sm:p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all select-none group ${
                    isDragging
                      ? "border-blue-600 bg-blue-50/60"
                      : "border-blue-300 hover:border-blue-500 bg-blue-50/20 hover:bg-blue-50/40"
                  }`}
                >
                  <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform shadow-2xs">
                    <UploadCloud className="w-6 h-6" />
                  </div>

                  <h4 className="text-sm font-bold text-slate-800 mb-1">
                    Drop your certificate here, or browse
                  </h4>
                  <p className="text-xs text-slate-400 mb-4">
                    PDF, JPG or PNG &middot; Maximum file size 10 MB
                  </p>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                  >
                    Choose file
                  </button>
                </div>
              ) : (
                <div className="border border-blue-200 bg-blue-50/40 rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                      {certFileType.includes("pdf") ? (
                        <FileText className="w-5 h-5" />
                      ) : (
                        <ImageIcon className="w-5 h-5" />
                      )}
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-bold text-slate-800 truncate">{certFileName}</p>
                      <p className="text-[11px] text-slate-500">{certFileSize}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={removeSelectedFile}
                    className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Secure Info Note */}
            <div className="flex items-start gap-2.5 mt-4 mb-6">
              <Lock className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
              <div>
                <h5 className="text-xs font-semibold text-slate-700">
                  Your document is secure
                </h5>
                <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
                  It&apos;s used only for verification and never displayed on your public profile.
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-md shadow-blue-500/25 transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting for verification...</span>
                </>
              ) : (
                <span>Submit for verification &rarr;</span>
              )}
            </button>
          </form>

          {/* Bottom Support Link */}
          <p className="text-center text-xs text-slate-500 mt-6">
            Having trouble?{" "}
            <Link href="/help-center" className="text-blue-600 font-medium hover:underline">
              Contact guide support
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function VerifyGuidePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#dce7f9] flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      }
    >
      <VerifyGuideContent />
    </Suspense>
  );
}
