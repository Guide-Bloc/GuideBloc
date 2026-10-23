"use client";

import { useState } from "react";
import { ShieldCheck, Loader2, Check } from "lucide-react";

export default function TurnstileCaptcha({ onVerify }: { onVerify: (verified: boolean) => void }) {
  const [status, setStatus] = useState<"idle" | "verifying" | "success">("idle");

  const handleVerify = () => {
    if (status !== "idle") return;
    setStatus("verifying");
    setTimeout(() => {
      setStatus("success");
      onVerify(true);
    }, 1200);
  };

  return (
    <div className="border border-slate-200 bg-slate-50/80 p-3 rounded-xl flex items-center justify-between my-3 select-none transition-all">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleVerify}
          disabled={status !== "idle"}
          className={`w-6 h-6 rounded-md border flex items-center justify-center transition-all cursor-pointer ${
            status === "success" 
              ? "bg-emerald-600 border-emerald-600 text-white shadow-2xs" 
              : status === "verifying"
              ? "border-blue-400 bg-blue-50/50"
              : "border-slate-300 hover:border-slate-400 bg-white shadow-2xs"
          }`}
          aria-label="Cloudflare Turnstile verification"
        >
          {status === "verifying" && <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />}
          {status === "success" && <Check className="w-3.5 h-3.5 stroke-[3]" />}
        </button>
        <span className="text-xs text-slate-700 font-medium">
          {status === "idle" && "Verify you are human"}
          {status === "verifying" && "Verifying browser security..."}
          {status === "success" && "Verification successful"}
        </span>
      </div>
      <div className="text-right flex flex-col items-end">
        <div className="flex items-center gap-1">
          <ShieldCheck className="w-3 h-3 text-slate-400" />
          <span className="text-[10px] text-slate-600 font-bold block tracking-tight">Cloudflare Turnstile</span>
        </div>
        <span className="text-[8px] text-slate-400 block mt-0.5">Privacy &middot; Terms</span>
      </div>
    </div>
  );
}
