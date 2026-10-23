"use client";

import Image from "next/image";
import Link from "next/link";
import { MapPin, Check, ChevronLeft } from "lucide-react";

interface AuthVisualSideProps {
  variant?: "story" | "verification";
  backHref?: string;
  backLabel?: string;
}

export default function AuthVisualSide({
  variant = "story",
  backHref = "/explore",
  backLabel = "Back to explore",
}: AuthVisualSideProps) {
  return (
    <div className="relative w-full h-[260px] min-h-[260px] sm:h-[320px] sm:min-h-[320px] lg:h-full lg:min-h-[660px] flex flex-col justify-between p-6 sm:p-10 lg:p-12 overflow-hidden bg-slate-950 text-white select-none">
      {/* Background Santorini Image with High Fidelity */}
      <Image
        src="/assets/santorini.jpg"
        alt="Santorini Greece - GuideBloc Experience"
        fill
        priority
        className="object-cover object-center scale-105"
      />

      {/* Dark Vignette Overlay for Crisp Readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0B1120] via-[#0B1120]/45 to-[#0B1120]/30" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0B1120]/65 via-transparent to-transparent" />

      {/* Top / Main Visual Content */}
      <div className="relative z-10">
        {/* Back Link on Top-Left of Santorini Picture */}
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-white/80 hover:text-white transition-colors duration-150 py-1 px-2.5 -ml-2.5 rounded-lg hover:bg-white/10 group cursor-pointer w-fit mb-3"
        >
          <ChevronLeft className="w-4 h-4 text-white/70 group-hover:text-white transition-transform duration-150 group-hover:-translate-x-0.5" />
          <span>{backLabel}</span>
        </Link>

        {/* White Logo of the Web directly below the back link */}
        <div className="mb-4 sm:mb-6">
          <Link href="/" className="inline-block transition-transform duration-200 hover:scale-[1.02]">
            <Image
              src="/assets/assemble.webp"
              alt="GuideBloc Logo"
              width={140}
              height={38}
              priority
              className="h-7 sm:h-9 w-auto object-contain brightness-0 invert drop-shadow-sm"
            />
          </Link>
        </div>

        {variant === "story" ? (
          <div>
            {/* Location Pill */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/60 backdrop-blur-md border border-white/20 text-white text-xs font-medium mb-5 shadow-sm">
              <MapPin className="w-3.5 h-3.5 text-blue-400" />
              <span>Santorini, Greece</span>
            </div>

            {/* Main Headline */}
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-[1.12] mb-3 sm:mb-4 drop-shadow-sm font-display">
              Your next story starts here.
            </h2>

            {/* Subtitle */}
            <p className="hidden sm:block text-slate-200/90 text-sm sm:text-base leading-relaxed max-w-sm">
              Join a global community discovering remarkable places with trusted local guides.
            </p>
          </div>
        ) : (
          <div>
            {/* Main Headline (White logo above replaced the GUIDEBLOC VERIFIED word) */}
            <h2 className="text-xl sm:text-4xl font-extrabold text-white tracking-tight leading-[1.15] mb-2 sm:mb-4 drop-shadow-sm font-display">
              Build trust before the journey begins.
            </h2>

            {/* Subtitle */}
            <p className="hidden sm:block text-slate-200/90 text-sm sm:text-base leading-relaxed max-w-sm mb-8">
              Every guide is reviewed to help travelers book local experiences with confidence.
            </p>

            {/* Step Indicators */}
            <div className="hidden lg:block space-y-3 max-w-md">
              {/* Step 01 - Completed */}
              <div className="bg-slate-900/70 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex items-center justify-between transition-all">
                <div className="flex items-center gap-3.5">
                  <span className="w-7 h-7 rounded-lg bg-slate-800 border border-white/10 flex items-center justify-center text-xs font-bold text-slate-300">
                    01
                  </span>
                  <div>
                    <h4 className="text-xs sm:text-sm font-semibold text-white leading-tight">
                      Google account connected
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Your basic profile is ready
                    </p>
                  </div>
                </div>
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                </div>
              </div>

              {/* Step 02 - Active */}
              <div className="bg-blue-950/70 backdrop-blur-md border border-blue-500/50 rounded-2xl p-4 flex items-center justify-between shadow-lg shadow-blue-500/10 ring-1 ring-blue-500/30">
                <div className="flex items-center gap-3.5">
                  <span className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                    02
                  </span>
                  <div>
                    <h4 className="text-xs sm:text-sm font-semibold text-white leading-tight">
                      Verify your credentials
                    </h4>
                    <p className="text-[11px] text-blue-200/80 mt-0.5">
                      Upload one valid guide certificate
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Content / Social Proof (only on story variant) */}
      {variant === "story" && (
        <div className="relative z-10 hidden lg:flex pt-8 mt-auto border-t border-white/10 items-center gap-3.5">
          {/* Overlapping Avatars */}
          <div className="flex items-center -space-x-2.5">
            <div className="w-8 h-8 rounded-full bg-teal-500 border-2 border-[#0B1120] flex items-center justify-center text-white text-[11px] font-bold shadow-sm">
              AM
            </div>
            <div className="w-8 h-8 rounded-full bg-blue-600 border-2 border-[#0B1120] flex items-center justify-center text-white text-[11px] font-bold shadow-sm">
              JL
            </div>
            <div className="w-8 h-8 rounded-full bg-purple-600 border-2 border-[#0B1120] flex items-center justify-center text-white text-[11px] font-bold shadow-sm">
              RK
            </div>
          </div>

          {/* Social Proof Text */}
          <div>
            <div className="text-xs font-bold text-white leading-tight">
              24,000+ happy travelers
            </div>
            <div className="text-[11px] text-slate-300 leading-tight mt-0.5">
              Exploring with confidence
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
