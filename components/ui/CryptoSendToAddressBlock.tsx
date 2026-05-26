"use client";

import CopyButton from "@/components/ui/CopyButton";
import { AlertTriangle } from "lucide-react";

type CryptoSendToAddressBlockProps = {
  address: string;
  assetTicker?: string;
  networkLabel?: string;
  isDark?: boolean;
  className?: string;
  compact?: boolean;
};

function formatNetworkForLabel(network: string): string {
  const n = String(network || "BSC").trim().toUpperCase();
  if (n === "BEP20" || n === "BSC" || n.includes("BINANCE")) return "BSC";
  return n;
}

export default function CryptoSendToAddressBlock({
  address,
  assetTicker = "USDT",
  networkLabel = "BSC",
  isDark = false,
  className = "",
  compact = false,
}: CryptoSendToAddressBlockProps) {
  const trimmed = String(address || "").trim();
  if (!trimmed) return null;

  const asset = String(assetTicker || "USDT").trim().toUpperCase();
  const network = formatNetworkForLabel(networkLabel);

  const shell = `w-full overflow-hidden rounded-xl border ${
    isDark
      ? "border-[#1D8751]/40 bg-[#1a1a20]"
      : "border-[#1D8751]/30 bg-white shadow-sm"
  } ${className}`;

  const codeBox = `rounded-lg px-2.5 py-2 font-mono text-[11px] sm:text-xs leading-snug break-all ${
    isDark ? "bg-[#25252c] text-white" : "bg-gray-50 text-gray-900"
  }`;

  const labelClass = `text-[10px] sm:text-xs font-semibold ${
    isDark ? "text-gray-200" : "text-gray-800"
  }`;

  const stepClass = `text-[10px] sm:text-xs leading-snug ${
    isDark ? "text-[#9CA3AF]" : "text-gray-600"
  }`;

  return (
    <div className={shell}>
      <div className={compact ? "p-2 space-y-1.5" : "p-2.5 space-y-1.5"}>
        <p className={`${stepClass} leading-snug`}>
          Open your crypto wallet · Select {asset} and choose the {network}{" "}
          (BEP20) network · Paste the address below and send the exact amount
          shown.{" "}
          <span className={`${labelClass} font-semibold`}>
            Send {asset} ({network}) to this address:
          </span>
        </p>

        <div className="flex items-stretch gap-1.5 min-w-0">
          <p className={`${codeBox} flex-1 min-w-0`}>{trimmed}</p>
          <CopyButton
            value={trimmed}
            showInlineMessage
            className={`flex shrink-0 items-center justify-center rounded-lg border px-2.5 ${
              isDark
                ? "border-[#35353d] text-gray-300 hover:bg-[#25252c]"
                : "border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          />
        </div>

        <div
          className={`flex gap-2 rounded-lg border px-2.5 py-1.5 ${
            isDark
              ? "border-amber-500/40 bg-amber-500/10"
              : "border-amber-400/60 bg-amber-50"
          }`}
          role="alert"
        >
          <AlertTriangle
            className={`h-4 w-4 shrink-0 mt-0.5 ${
              isDark ? "text-amber-400" : "text-amber-600"
            }`}
            aria-hidden
          />
          <p
            className={`text-[10px] sm:text-xs leading-snug ${
              isDark ? "text-amber-100" : "text-amber-900"
            }`}
          >
            <span className="font-semibold">Network warning:</span> Only send{" "}
            {asset} on {network} (BEP20). Sending other tokens or using ERC20,
            TRC20, or the wrong network may result in permanent loss of funds.
          </p>
        </div>
      </div>
    </div>
  );
}
