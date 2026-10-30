"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  ShieldAlert, 
  Wrench, 
  RefreshCw, 
  ExternalLink, 
  Cpu, 
  Layers, 
  Lock, 
  CheckCircle2,
  Clock,
  ArrowRight
} from "lucide-react";
import { NETWORKS } from "@/lib/crypto/networkConfig";

export default function MaintenancePage() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const fujiConfig = NETWORKS.fuji;

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      window.location.reload();
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-white flex flex-col justify-between selection:bg-primary-500 selection:text-white relative overflow-hidden font-body">
      {/* Ambient background glows */}
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-blue-600/20 via-primary-600/10 to-transparent blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 -left-40 w-[500px] h-[500px] bg-blue-500/10 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 -right-40 w-[500px] h-[500px] bg-indigo-500/10 blur-[150px] pointer-events-none" />

      {/* Grid pattern overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)",
          backgroundSize: "28px 28px"
        }}
      />

      {/* Top Navbar Header */}
      <header className="relative z-10 border-b border-white/[0.08] backdrop-blur-md bg-[#070b14]/70">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="/assets/assemble.png" 
              alt="GuideBloc Logo" 
              className="h-8 w-auto object-contain brightness-110" 
              onError={(e) => {
                // Fallback if assemble.png is not found
                (e.target as HTMLImageElement).src = "/assets/logo.png";
              }}
            />
            <span className="text-lg font-black tracking-tight text-white font-display">
              GuideBloc<span className="text-primary-400">.</span>
            </span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs font-semibold tracking-wide shadow-xs">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>SCHEDULED MAINTENANCE</span>
          </div>
        </div>
      </header>

      {/* Main Content Hero */}
      <main className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-20 flex flex-col items-center text-center">
        {/* Pulsing Icon Halo */}
        <div className="relative mb-8">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-br from-amber-500/20 via-primary-500/10 to-blue-500/20 border border-amber-400/30 flex items-center justify-center shadow-[0_0_50px_rgba(245,158,11,0.15)] relative">
            <Wrench className="w-11 h-11 sm:w-13 sm:h-13 text-amber-400 animate-pulse" />
            <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center text-[#070b14] shadow-md">
              <Clock className="w-3.5 h-3.5 stroke-[2.5]" />
            </div>
          </div>
        </div>

        {/* Headline */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-300 text-xs font-semibold uppercase tracking-wider mb-5">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Protocol Migration Window</span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight font-display max-w-2xl leading-[1.15]">
          System Under <span className="bg-gradient-to-r from-amber-300 via-orange-300 to-amber-200 bg-clip-text text-transparent">Scheduled Maintenance</span>
        </h1>

        <p className="mt-6 text-slate-300 text-base sm:text-lg max-w-2xl leading-relaxed font-normal">
          The GuideBloc platform is currently undergoing planned smart contract upgrades and active network migration to <strong>Avalanche Fuji Testnet</strong>. Public marketplace features, tourist bookings, and on-chain settlements are temporarily paused while our team verifies the deployment.
        </p>

        {/* Live Status Cards Grid */}
        <div className="mt-12 w-full grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
          {/* Card 1 */}
          <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:border-white/[0.15] transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Cpu className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20">
                In Progress
              </span>
            </div>
            <h3 className="text-sm font-bold text-white mb-1">Smart Escrow V2</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Validating GuideBlocEscrowV2 contracts, atomic fee distribution, and proof-of-tour cryptographic hashes.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:border-white/[0.15] transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Layers className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                Active Network
              </span>
            </div>
            <h3 className="text-sm font-bold text-white mb-1">Avalanche Fuji Testnet</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Active settlement environment switched to Chain ID 43113 with mock USDC/USDT liquidity integration.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:border-white/[0.15] transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Lock className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-300 border border-blue-500/20">
                Security Audit
              </span>
            </div>
            <h3 className="text-sm font-bold text-white mb-1">Relayer & Signatures</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Verifying EIP-712 agreement signing, Haversine GPS proximity engine, and automated release reconcilers.
            </p>
          </div>
        </div>

        {/* Network Detail Strip */}
        <div className="mt-8 w-full p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Target Network:</span>
            <span className="font-semibold text-white">{fujiConfig.name}</span>
            <span className="px-1.5 py-0.5 rounded bg-white/[0.06] font-mono text-[11px]">
              Chain ID: {fujiConfig.chainIdDecimal}
            </span>
          </div>

          <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
            <span>Escrow Contract:</span>
            <span className="text-primary-300 truncate max-w-[180px] sm:max-w-none">
              {fujiConfig.escrowContractAddress}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="px-6 py-3 rounded-xl bg-primary-600 hover:bg-primary-500 active:bg-primary-700 text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-primary-600/25 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
            <span>{isRefreshing ? "Checking Status..." : "Refresh Status"}</span>
          </button>

          <a
            href={fujiConfig.explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] active:bg-white/[0.15] border border-white/[0.1] text-white font-semibold text-sm flex items-center gap-2 transition-all"
          >
            <span>SnowTrace Testnet</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </a>

          <a
            href="https://github.com/Guide-Bloc/GuideBloc"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] active:bg-white/[0.15] border border-white/[0.1] text-white font-semibold text-sm flex items-center gap-2 transition-all"
          >
            <span>Official GitHub</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </a>
        </div>
      </main>

      {/* Footer Notice */}
      <footer className="relative z-10 border-t border-white/[0.06] py-6 text-center text-xs text-slate-400">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            &copy; {new Date().getFullYear()} GuideBloc. All rights reserved. Local development environments remain active.
          </p>
          <p className="text-slate-400 font-mono text-[11px]">
            Status: System Protocol Maintenance
          </p>
        </div>
      </footer>
    </div>
  );
}
