"use client";

import React from "react";
import clsx from "clsx";

type StatusTone = "success" | "warning" | "error" | "info" | "neutral";

const normalizeStatusLabel = (raw: unknown): string => {
  const s = String(raw ?? "").trim();
  if (!s) return "-";
  return s
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
};

const getTone = (label: string): StatusTone => {
  const s = label.toLowerCase();
  if (["completed", "finished", "approved", "success", "succeeded", "done"].includes(s)) {
    return "success";
  }
  if (["pending", "waiting", "processing", "confirming", "exchanging", "sending", "otp pending"].includes(s)) {
    return "warning";
  }
  if (["failed", "rejected", "cancelled", "canceled", "error", "expired", "refunded"].includes(s)) {
    return "error";
  }
  if (s.includes("pending") || s.includes("process") || s.includes("wait") || s.includes("confirm")) {
    return "warning";
  }
  if (s.includes("fail") || s.includes("reject") || s.includes("cancel") || s.includes("error") || s.includes("expire") || s.includes("refund")) {
    return "error";
  }
  return "neutral";
};

const toneClasses: Record<StatusTone, string> = {
  success: "bg-[#E0F2E8] text-[#1D8751] dark:bg-[#1D8751]/20 dark:text-[#1D8751] [.deem_&]:bg-[#1D8751]/20",
  warning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 [.deem_&]:bg-yellow-900/30",
  error: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 [.deem_&]:bg-red-900/30",
  info: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 [.deem_&]:bg-blue-900/30",
  neutral: "bg-gray-100 text-gray-800 dark:bg-gray-700/60 dark:text-gray-200 [.deem_&]:bg-gray-700/60",
};

export function StatusBadge({
  status,
  className,
  title,
}: {
  status: unknown;
  className?: string;
  title?: string;
}) {
  const label = normalizeStatusLabel(status);
  const tone = getTone(label);

  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium leading-none",
        toneClasses[tone],
        className
      )}
      title={title ?? label}
    >
      {label}
    </span>
  );
}

