"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import type { BookmarkedAddress } from "../../services/bookmarkedAddressesApi";
import { getDefaultBookmarkLabel } from "../../services/bookmarkedAddressesApi";

interface BookmarkDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  bookmarks: BookmarkedAddress[];
  loading: boolean;
  saving: boolean;
  currentAddress: string;
  asset?: string;
  network?: string;
  onSelect: (address: string) => void;
  onSaveCurrent: (label: string) => void;
  anchorRef: React.RefObject<HTMLElement | null>;
  isDark?: boolean;
  /** Hint shown as placeholder only (e.g. "My USDT wallet") */
  defaultLabel?: string;
  labelKind?: "wallet" | "account";
  saveDisabled?: boolean;
  hideSaveButton?: boolean;
  /** API / validation error from whitelist save (shown inside panel) */
  saveError?: string | null;
}

/** Prevent parent bookmark toggle handlers from closing the panel while interacting inside it. */
function stopBubble(e: React.SyntheticEvent) {
  e.stopPropagation();
}

function BookmarkLabelBadge({
  children,
  isDark,
  variant = "primary",
}: {
  children: React.ReactNode;
  isDark: boolean;
  variant?: "primary" | "muted";
}) {
  const base =
    "inline-flex max-w-full items-center rounded-full px-2 py-0.5 text-[10px] font-semibold leading-tight truncate";
  const styles =
    variant === "primary"
      ? isDark
        ? "bg-[#1D8751]/20 text-[#4ade80] border border-[#1D8751]/45"
        : "bg-[#1D8751] text-white border border-[#1D8751]"
      : isDark
        ? "bg-[#1D8751]/10 text-[#788099] border border-[#35353E]"
        : "bg-[#1D8751]/8 text-[#1D8751] border border-[#1D8751]/25";
  return <span className={`${base} ${styles}`}>{children}</span>;
}

export function BookmarkDropdown({
  isOpen,
  onClose,
  bookmarks,
  loading,
  saving,
  currentAddress,
  asset,
  onSelect,
  onSaveCurrent,
  anchorRef,
  isDark = false,
  defaultLabel,
  labelKind = "wallet",
  saveDisabled = false,
  hideSaveButton = false,
  saveError = null,
}: BookmarkDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const labelInputId = useId();
  const labelPlaceholder =
    defaultLabel?.trim() || getDefaultBookmarkLabel(asset, labelKind);
  const [label, setLabel] = useState("");
  const [labelError, setLabelError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLabel("");
      setLabelError(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handlePointerDownOutside = (e: PointerEvent) => {
      const target = e.target as Node;
      if (
        anchorRef.current?.contains(target) ||
        dropdownRef.current?.contains(target)
      ) {
        return;
      }
      onClose();
    };
    document.addEventListener("pointerdown", handlePointerDownOutside, true);
    return () =>
      document.removeEventListener("pointerdown", handlePointerDownOutside, true);
  }, [isOpen, onClose, anchorRef]);

  if (!isOpen) return null;

  const inputClass = `w-full rounded-lg border px-2.5 py-1.5 text-sm outline-none focus:ring-1 focus:ring-[#1D8751] ${
    labelError
      ? "border-red-500 focus:ring-red-500"
      : isDark
        ? "border-[#35353E]"
        : "border-gray-200"
  } ${
    isDark
      ? "bg-[#25252c] text-white placeholder:text-[#788099]"
      : "bg-white text-gray-900 placeholder:text-gray-400"
  }`;

  const handleSave = () => {
    const trimmed = label.trim();
    if (!trimmed) {
      setLabelError("Label is required");
      return;
    }
    if (trimmed.length > 120) {
      setLabelError("Label must be 120 characters or less");
      return;
    }
    setLabelError(null);
    onSaveCurrent(trimmed);
  };

  return (
    <div
      ref={dropdownRef}
      role="dialog"
      aria-label="Saved addresses"
      onMouseDown={stopBubble}
      onClick={stopBubble}
      className={`absolute right-0 top-full mt-1 z-[11000] min-w-[260px] max-w-[320px] rounded-xl shadow-lg border ${
        isDark ? "bg-[#1D1D23] border-[#35353E]" : "bg-white border-gray-200"
      }`}
    >
      <div className="p-2 max-h-[320px] overflow-y-auto">
        {saveError && (
          <div
            role="alert"
            className={`mb-2 rounded-lg border px-2.5 py-2 text-xs leading-snug ${
              isDark
                ? "border-red-500/40 bg-red-500/10 text-red-300"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            <p className="font-semibold mb-0.5">Could not save address</p>
            <p>{saveError}</p>
          </div>
        )}
        {currentAddress.trim() && !saveDisabled && !hideSaveButton && (
          <div className="space-y-2 mb-2">
            <label
              htmlFor={labelInputId}
              className={`block text-xs font-medium ${
                isDark ? "text-[#A3A3A3]" : "text-gray-600"
              }`}
            >
              Address label <span className="text-red-500">*</span>
            </label>
            <input
              id={labelInputId}
              type="text"
              value={label}
              required
              onChange={(e) => {
                setLabel(e.target.value);
                if (labelError) setLabelError(null);
              }}
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSave();
                }
              }}
              placeholder={`e.g. ${labelPlaceholder}`}
              maxLength={120}
              className={inputClass}
              autoComplete="off"
              autoFocus
            />
            {labelError && (
              <p className="text-red-500 text-xs">{labelError}</p>
            )}
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !label.trim()}
              className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isDark
                  ? "bg-[#1D8751] hover:bg-[#166b3e] text-white"
                  : "bg-[#1D8751] hover:bg-[#166b3e] text-white"
              } ${saving || !label.trim() ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {saving ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path d="M12 4v16m8-8H4" strokeLinecap="round" />
                </svg>
              )}
              Whitelist address
            </button>
          </div>
        )}
        <div className={`border-t my-1 ${isDark ? "border-[#35353E]" : "border-gray-200"}`} />
        <div className="text-xs font-semibold px-2 py-1 text-[#788099]">Saved addresses</div>
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <span className="w-5 h-5 border-2 border-[#1D8751] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : bookmarks.length === 0 ? (
          <p className={`text-sm py-4 text-center ${isDark ? "text-[#788099]" : "text-gray-500"}`}>
            No saved addresses yet.
          </p>
        ) : (
          <div className="space-y-0.5">
            {bookmarks.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => {
                  onSelect(b.address);
                  onClose();
                }}
                className={`w-full flex flex-col items-start gap-1.5 px-3 py-2 rounded-lg text-left text-sm transition-colors ${
                  isDark ? "hover:bg-[#2A2A32]" : "hover:bg-gray-100"
                }`}
              >
                <div className="flex flex-wrap items-center gap-1 w-full min-w-0">
                  <BookmarkLabelBadge isDark={isDark} variant="primary">
                    {b.label?.trim() || "Unnamed"}
                  </BookmarkLabelBadge>
                  {b.asset ? (
                    <BookmarkLabelBadge isDark={isDark} variant="muted">
                      {String(b.asset).toUpperCase()}
                    </BookmarkLabelBadge>
                  ) : null}
                  {b.network && String(b.network).toUpperCase() !== String(b.asset || "").toUpperCase() ? (
                    <BookmarkLabelBadge isDark={isDark} variant="muted">
                      {String(b.network).toUpperCase()}
                    </BookmarkLabelBadge>
                  ) : null}
                </div>
                <span className={`text-xs font-mono truncate w-full ${isDark ? "text-[#788099]" : "text-gray-500"}`}>
                  {b.address.length > 20 ? `${b.address.slice(0, 10)}...${b.address.slice(-8)}` : b.address}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
