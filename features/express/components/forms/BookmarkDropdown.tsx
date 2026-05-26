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
  onSaveCurrent: (label: string) => void | Promise<void>;
  anchorRef: React.RefObject<HTMLElement | null>;
  isDark?: boolean;
  /** Hint shown as placeholder only (e.g. "My USDT wallet") */
  defaultLabel?: string;
  labelKind?: "wallet" | "account";
  saveDisabled?: boolean;
  hideSaveButton?: boolean;
  /** API / validation error from whitelist save (shown inside panel) */
  saveError?: string | null;
  /** Remove a saved whitelist address (user bookmarks only; not approved-payment rows) */
  onDelete?: (bookmark: BookmarkedAddress) => void | Promise<void>;
  /** Open linked-accounts flow (PaymentMethodsModal) for the current provider */
  onAddPaymentMethod?: () => void;
  /** Provider label for save CTAs (e.g. "Sahal Golis") */
  providerDisplayName?: string;
}

function canDeleteBookmark(b: BookmarkedAddress): boolean {
  const id = String(b.id ?? "").trim();
  return !!id && !id.startsWith("approved-");
}

/** Prevent parent bookmark toggle handlers from closing the panel while interacting inside it. */
function stopBubble(e: React.SyntheticEvent) {
  e.stopPropagation();
}

/** Saved whitelist row — stable colors on hover (no flash/lift). */
const whitelistAddressCardClass = (isDark: boolean) =>
  isDark
    ? "bg-[#0a0a0c] border-[#2a2a34] hover:bg-[#0a0a0c] hover:border-[#2a2a34]"
    : "bg-[#e4e6ea] border-[#d1d5db] hover:bg-[#e4e6ea] hover:border-[#d1d5db]";

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
        ? "bg-[#1D8751]/25 text-[#86efac] border border-[#1D8751]/55"
        : "bg-[#1D8751] text-white border border-[#166b3e] shadow-sm"
      : isDark
        ? "bg-[#141418] text-[#c8ccd6] border border-[#3d3d48]"
        : "bg-[#f3f4f6] text-[#374151] border border-[#d1d5db]";
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
  onDelete,
  onAddPaymentMethod,
  providerDisplayName,
}: BookmarkDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const labelInputId = useId();
  const labelPlaceholder =
    defaultLabel?.trim() || getDefaultBookmarkLabel(asset, labelKind);
  const [label, setLabel] = useState("");
  const [labelError, setLabelError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLabel(defaultLabel?.trim() || "");
      setLabelError(null);
    }
  }, [isOpen, defaultLabel]);

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
      ? "bg-[#18181f] text-white placeholder:text-[#788099]"
      : "bg-white text-gray-900 placeholder:text-gray-400"
  }`;

  const handleSave = async () => {
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
    try {
      await onSaveCurrent(trimmed);
    } catch {
      // Errors surfaced via saveError / toast from useBookmarkedAddresses
    }
  };

  return (
    <div
      ref={dropdownRef}
      role="dialog"
      aria-label="Saved addresses"
      onMouseDown={stopBubble}
      onClick={stopBubble}
      className={`absolute right-0 top-full mt-1 z-[11000] min-w-[260px] max-w-[320px] rounded-xl shadow-xl border ${
        isDark
          ? "bg-[#0f0f14] border-[#2e2e38] shadow-black/50"
          : "bg-[#fafafa] border-gray-200 shadow-gray-300/30"
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
              {labelKind === "account" ? "Save account" : "Whitelist address"}
            </button>
            {onAddPaymentMethod ? (
              <>
                <p
                  className={`text-[11px] leading-snug ${
                    isDark ? "text-[#8B90A5]" : "text-gray-500"
                  }`}
                >
                  Or add as a linked payment method
                  {providerDisplayName ? ` (${providerDisplayName})` : ""} — same
                  flow as Accounts → Payment Methods.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onAddPaymentMethod();
                    onClose();
                  }}
                  className={`w-full rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
                    isDark
                      ? "border-[#35353E] bg-[#18181f] text-white hover:bg-[#23232B]"
                      : "border-gray-200 bg-white text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  Add payment method
                </button>
              </>
            ) : null}
          </div>
        )}
        {onAddPaymentMethod &&
        currentAddress.trim() &&
        !saveDisabled &&
        hideSaveButton ? (
          <div className="space-y-2 mb-2">
            <p
              className={`text-xs font-medium ${
                isDark ? "text-[#A3A3A3]" : "text-gray-600"
              }`}
            >
              Account not saved yet
              {providerDisplayName ? ` — ${providerDisplayName}` : ""}
            </p>
            <button
              type="button"
              onClick={() => {
                onAddPaymentMethod();
                onClose();
              }}
              className={`w-full rounded-lg border px-3 py-2.5 text-sm font-semibold transition-colors ${
                isDark
                  ? "bg-[#1D8751] hover:bg-[#166b3e] text-white border-[#1D8751]"
                  : "bg-[#1D8751] hover:bg-[#166b3e] text-white border-[#1D8751]"
              }`}
            >
              Add payment method
            </button>
          </div>
        ) : null}
        <div className={`border-t my-1 ${isDark ? "border-[#2a2a34]" : "border-gray-200/90"}`} />
        <div
          className={`text-xs font-semibold px-2 py-1 ${
            isDark ? "text-[#9ca3af]" : "text-gray-700"
          }`}
        >
          Saved addresses
        </div>
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
            {bookmarks.map((b, index) => {
              const addr = String(b.address ?? "").trim();
              const rowKey = b.id || `${addr}-${index}`;
              const showRemove = !!onDelete && canDeleteBookmark(b);
              const isDeleting = deletingId === b.id;
              return (
              <div
                key={rowKey}
                className={`group flex items-stretch gap-0.5 rounded-lg border ${whitelistAddressCardClass(isDark)}`}
              >
                <button
                  type="button"
                  disabled={!addr}
                  onClick={() => {
                    if (!addr) return;
                    onSelect(addr);
                    onClose();
                  }}
                  className="flex-1 min-w-0 flex flex-col items-start gap-1.5 px-3 py-2.5 rounded-lg text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D8751]/50"
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
                  <span
                    className={`text-xs font-mono truncate w-full ${
                      isDark ? "text-[#c4c8d4]" : "text-gray-700"
                    }`}
                  >
                    {!addr
                      ? "—"
                      : addr.length > 20
                        ? `${addr.slice(0, 10)}...${addr.slice(-8)}`
                        : addr}
                  </span>
                </button>
                {showRemove ? (
                  <button
                    type="button"
                    aria-label="Remove whitelisted address"
                    disabled={isDeleting}
                    onClick={async (e) => {
                      stopBubble(e);
                      if (!b.id) return;
                      setDeletingId(b.id);
                      try {
                        await onDelete(b);
                      } finally {
                        setDeletingId(null);
                      }
                    }}
                    className={`shrink-0 self-center mr-1.5 p-1.5 rounded-md border border-transparent transition-colors ${
                      isDark
                        ? "text-[#9ca3af] hover:!text-red-400 hover:border-red-500/30 hover:bg-red-500/15"
                        : "text-gray-500 hover:!text-red-600 hover:border-red-200 hover:bg-red-50"
                    } ${isDeleting ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    {isDeleting ? (
                      <span className="block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </button>
                ) : null}
              </div>
            );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
