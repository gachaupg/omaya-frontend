"use client";

import CopyButton from "@/components/ui/CopyButton";
import { isUssdDialable, toUssdTelHref } from "@/lib/utils/ussdDial";
import { Phone } from "lucide-react";

type HowToSendDialBlockProps = {
  value: string;
  isDark?: boolean;
  className?: string;
  /** Tighter layout under QR code */
  compact?: boolean;
  /** Hide "Dial now" from md breakpoint up; keep on small screens (express deposit USSD) */
  dialOnMobileOnly?: boolean;
};

export default function HowToSendDialBlock({
  value,
  isDark = false,
  className = "",
  compact = false,
  dialOnMobileOnly = false,
}: HowToSendDialBlockProps) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return null;

  const dialable = isUssdDialable(trimmed);
  const telHref = dialable ? toUssdTelHref(trimmed) : "";

  const shell = `w-full overflow-hidden rounded-xl border ${
    isDark
      ? "border-[#1D8751]/40 bg-[#1a1a20]"
      : "border-[#1D8751]/30 bg-white shadow-sm"
  } ${compact ? "text-left" : ""} ${className}`;

  const codeBox = `rounded-lg px-2.5 py-2 font-mono text-[11px] sm:text-xs leading-snug break-all ${
    isDark ? "bg-[#25252c] text-white" : "bg-gray-50 text-gray-900"
  }`;

  const labelClass = `text-[10px] sm:text-xs font-medium uppercase tracking-wide ${
    isDark ? "text-gray-400" : "text-gray-500"
  }`;

  const copyBtnClass = `flex shrink-0 items-center justify-center rounded-lg border px-2.5 ${
    isDark
      ? "border-[#35353d] text-gray-300 hover:bg-[#25252c]"
      : "border-gray-200 text-gray-600 hover:bg-gray-50"
  }`;

  const dialBtnClass = `flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold text-white transition active:scale-[0.98] ${
    isDark
      ? "bg-[#1D8751] hover:bg-[#167044]"
      : "bg-[#1D8751] hover:bg-[#167044] shadow-sm"
  }`;

  if (dialable && telHref) {
    return (
      <div className={shell}>
        <div className={compact ? "p-2.5 space-y-2" : "p-3 space-y-2.5"}>
          <div className="flex items-center gap-1.5">
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                isDark ? "bg-[#1D8751]/20" : "bg-[#1D8751]/10"
              }`}
            >
              <Phone className="h-3.5 w-3.5 text-[#1D8751]" aria-hidden />
            </span>
            <span className={labelClass}>USSD payment</span>
          </div>

          {dialOnMobileOnly ? (
            <div className="flex flex-col gap-2 md:flex-row md:items-stretch md:gap-1.5 min-w-0">
              <p className={`${codeBox} md:flex-1 md:min-w-0`}>{trimmed}</p>
              <div className="flex items-stretch gap-1.5 shrink-0">
                <a href={telHref} className={`${dialBtnClass} md:hidden`}>
                  <Phone className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  Dial now
                </a>
                <CopyButton
                  value={trimmed}
                  showInlineMessage
                  className={copyBtnClass}
                />
              </div>
            </div>
          ) : (
            <>
              <p className={codeBox}>{trimmed}</p>
              <div className="flex items-stretch gap-1.5">
                <a href={telHref} className={dialBtnClass}>
                  <Phone className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  Dial now
                </a>
                <CopyButton
                  value={trimmed}
                  showInlineMessage
                  className={copyBtnClass}
                />
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={shell}>
      <div
        className={`flex flex-col gap-2 ${
          compact ? "p-2.5" : "p-3"
        }`}
      >
        <span className={labelClass}>How to send</span>
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
      </div>
    </div>
  );
}
