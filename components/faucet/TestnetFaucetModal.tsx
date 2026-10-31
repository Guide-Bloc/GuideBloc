"use client";

import { useState, useEffect } from "react";
import {
  X,
  Droplet,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ExternalLink,
  Loader2,
  Sparkles,
  Wallet,
  PlusCircle,
  ArrowRight
} from "lucide-react";
import toast from "react-hot-toast";
import { importUsdcToMetaMask, importUsdtToMetaMask, getNetworkConfig } from "@/lib/crypto/networkConfig";

interface TestnetFaucetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TestnetFaucetModal({ isOpen, onClose }: TestnetFaucetModalProps) {
  const [recipient, setRecipient] = useState<string>("");
  const [loadingToken, setLoadingToken] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);
  const [claimedSuccess, setClaimedSuccess] = useState<string | null>(null);

  const cfg = getNetworkConfig();

  // Auto-detect connected wallet if MetaMask or similar is injected
  useEffect(() => {
    if (isOpen && typeof window !== "undefined" && (window as any).ethereum) {
      (window as any).ethereum
        .request({ method: "eth_accounts" })
        .then((accounts: string[]) => {
          if (accounts && accounts.length > 0 && !recipient) {
            setRecipient(accounts[0]);
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success("Address copied to clipboard!");
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleConnectWallet = async () => {
    if (typeof window === "undefined" || !(window as any).ethereum) {
      toast.error("No Web3 wallet found. Please paste your address manually.");
      return;
    }
    try {
      const accounts = await (window as any).ethereum.request({
        method: "eth_requestAccounts",
      });
      if (accounts && accounts.length > 0) {
        setRecipient(accounts[0]);
        toast.success("Wallet address filled!");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to connect wallet.");
    }
  };

  const handleClaim = async (tokenChoice: "USDC" | "USDT" | "ALL") => {
    if (!recipient || !recipient.startsWith("0x") || recipient.length !== 42) {
      toast.error("Please provide a valid Avalanche address (0x...)");
      return;
    }

    setLoadingToken(tokenChoice);
    setClaimedSuccess(null);
    setLastTxHash(null);

    try {
      const res = await fetch("/api/faucet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient: recipient.trim(),
          token: tokenChoice,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to request faucet tokens.");
      }

      setClaimedSuccess(
        tokenChoice === "ALL"
          ? "100 USDC and 100 USDT successfully sent to your wallet!"
          : `100 ${tokenChoice} successfully sent to your wallet!`
      );
      if (data.txHashes && data.txHashes.length > 0) {
        setLastTxHash(data.txHashes[0].txHash);
      }
      toast.success("Tokens sent! Check your wallet.");
    } catch (err: any) {
      toast.error(err.message || "Failed to claim tokens.");
    } finally {
      setLoadingToken(null);
    }
  };

  const handleImportToken = async (type: "USDC" | "USDT") => {
    try {
      if (type === "USDC") {
        await importUsdcToMetaMask();
        toast.success("USDC added to your MetaMask!");
      } else {
        await importUsdtToMetaMask();
        toast.success("USDT added to your MetaMask!");
      }
    } catch (err: any) {
      toast.error(err?.message || `Failed to add ${type} to MetaMask`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div 
        className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto bg-dark-900 border border-dark-700 rounded-3xl shadow-2xl p-6 sm:p-8 text-white space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-dark-400 hover:text-white hover:bg-dark-800 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-primary/20 border border-primary/30 text-primary">
              <Droplet className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-display font-bold text-white flex items-center gap-2">
                Fuji Testnet Faucet
                <span className="text-[11px] font-sans font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                  Chain 43113
                </span>
              </h3>
              <p className="text-xs text-dark-400">
                Claim free testnet USDC & USDT to test booking tours and payments on GuideBloc.
              </p>
            </div>
          </div>
        </div>

        {/* Address Input Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <label className="text-dark-300 font-medium">Recipient Wallet Address</label>
            <button
              onClick={handleConnectWallet}
              className="text-primary hover:text-primary/80 font-medium flex items-center gap-1 transition-colors"
            >
              <Wallet className="w-3.5 h-3.5" />
              Auto-fill Connected Wallet
            </button>
          </div>
          <div className="relative">
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="0x... (Your EVM wallet address)"
              className="w-full bg-dark-800 border border-dark-700 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl px-4 py-3 text-sm text-white placeholder-dark-500 font-mono transition-all"
            />
          </div>
        </div>

        {/* Claim Buttons */}
        <div className="space-y-2.5">
          <label className="text-xs text-dark-300 font-medium block">Select Faucet Claim Action</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* Claim USDC */}
            <button
              onClick={() => handleClaim("USDC")}
              disabled={loadingToken !== null}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-dark-800 border border-dark-700 hover:border-blue-500/50 hover:bg-dark-750 text-sm font-semibold text-white transition-all disabled:opacity-50"
            >
              {loadingToken === "USDC" ? (
                <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
              ) : (
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Circle_USDC_Logo.svg/1280px-Circle_USDC_Logo.svg.png"
                  alt="USDC"
                  className="w-4 h-4 object-contain"
                />
              )}
              <span>Claim 100 USDC</span>
            </button>

            {/* Claim USDT */}
            <button
              onClick={() => handleClaim("USDT")}
              disabled={loadingToken !== null}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-dark-800 border border-dark-700 hover:border-emerald-500/50 hover:bg-dark-750 text-sm font-semibold text-white transition-all disabled:opacity-50"
            >
              {loadingToken === "USDT" ? (
                <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
              ) : (
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/0/01/USDT_Logo.png"
                  alt="USDT"
                  className="w-4 h-4 object-contain"
                />
              )}
              <span>Claim 100 USDT</span>
            </button>

            {/* Claim Both */}
            <button
              onClick={() => handleClaim("ALL")}
              disabled={loadingToken !== null}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-primary to-cyan-500 hover:opacity-95 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition-all disabled:opacity-50"
            >
              {loadingToken === "ALL" ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <Sparkles className="w-4 h-4 text-white" />
              )}
              <span>Claim Both</span>
            </button>
          </div>
        </div>

        {/* Success Alert */}
        {claimedSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <p className="font-semibold text-emerald-300">{claimedSuccess}</p>
              {lastTxHash && (
                <a
                  href={`https://testnet.snowtrace.io/tx/${lastTxHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-emerald-400 hover:underline"
                >
                  View on Snowtrace Fuji <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        )}

        {/* Add to MetaMask Section */}
        <div className="p-4 rounded-2xl bg-dark-800/60 border border-dark-700/80 space-y-3">
          <p className="text-xs text-dark-300 font-medium">1-Click Add Tokens to MetaMask (Fuji):</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleImportToken("USDC")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-dark-700 hover:bg-dark-600 text-xs font-medium text-white transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5 text-blue-400" />
              Add USDC to MetaMask
            </button>
            <button
              onClick={() => handleImportToken("USDT")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-dark-700 hover:bg-dark-600 text-xs font-medium text-white transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
              Add USDT to MetaMask
            </button>
          </div>
        </div>

        {/* Token Addresses Reference */}
        <div className="space-y-2 pt-1 border-t border-dark-800 text-xs">
          <span className="text-dark-400 font-medium block">Token Contract Addresses (Avalanche Fuji):</span>
          
          <div className="space-y-1.5 font-mono text-[11px]">
            {/* USDC */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-dark-800/80 border border-dark-750">
              <span className="text-dark-300 font-sans font-medium flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-400"></span> USDC:
              </span>
              <div className="flex items-center gap-2 text-dark-400">
                <span>{cfg.usdcTokenAddress.slice(0, 10)}...{cfg.usdcTokenAddress.slice(-8)}</span>
                <button
                  onClick={() => handleCopy(cfg.usdcTokenAddress, "usdc")}
                  className="p-1 hover:text-white transition-colors"
                  title="Copy address"
                >
                  {copiedKey === "usdc" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* USDT */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-dark-800/80 border border-dark-750">
              <span className="text-dark-300 font-sans font-medium flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span> USDT:
              </span>
              <div className="flex items-center gap-2 text-dark-400">
                <span>{cfg.usdtTokenAddress.slice(0, 10)}...{cfg.usdtTokenAddress.slice(-8)}</span>
                <button
                  onClick={() => handleCopy(cfg.usdtTokenAddress, "usdt")}
                  className="p-1 hover:text-white transition-colors"
                  title="Copy address"
                >
                  {copiedKey === "usdt" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Official External Faucets */}
        <div className="pt-2 border-t border-dark-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-dark-400">
          <span>Need testnet AVAX for gas or Circle USDC?</span>
          <div className="flex items-center gap-3">
            <a
              href="https://core.app/tools/testnet-faucet/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline flex items-center gap-1"
            >
              AVAX Faucet <ExternalLink className="w-3 h-3" />
            </a>
            <span className="text-dark-600">•</span>
            <a
              href="https://faucet.circle.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline flex items-center gap-1"
            >
              Circle Faucet <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
