"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";

interface AuthHeaderProps {
  backHref?: string;
  backLabel?: string;
}

export default function AuthHeader({
  backHref = "/explore",
  backLabel = "Back to explore",
}: AuthHeaderProps) {
  return (
    <header className="w-full bg-[#0B1120] border-b border-white/10 px-6 sm:px-10 py-3.5 flex items-center justify-between sticky top-0 z-30">
      {/* Brand Logo */}
      <Link href="/" className="flex items-center gap-2.5 group">
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 via-blue-500 to-sky-400 flex items-center justify-center text-white shadow-sm transition-transform duration-200 group-hover:scale-105">
          <span className="font-bold text-sm tracking-tight font-display">G</span>
        </div>
        <span className="text-white font-bold text-lg tracking-tight font-display">
          Guide<span className="text-blue-400">Bloc</span>
        </span>
      </Link>

      {/* Back Link */}
      <Link
        href={backHref}
        className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-300 hover:text-white transition-colors duration-150 py-1 px-2.5 rounded-lg hover:bg-white/5"
      >
        <ChevronLeft className="w-4 h-4 text-slate-400" />
        <span>{backLabel}</span>
      </Link>
    </header>
  );
}
