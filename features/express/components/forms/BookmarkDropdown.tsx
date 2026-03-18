"use client";

import React, { useEffect, useRef } from "react";
import type { BookmarkedAddress } from "../../services/bookmarkedAddressesApi";

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
  onSaveCurrent: () => void;
  anchorRef: React.RefObject<HTMLElement | null>;
  isDark?: boolean;
  /** When true, disables the "Whitelist address" button (e.g. address failed validation) */
  saveDisabled?: boolean;
}

export function BookmarkDropdown({
  isOpen,
  onClose,
  bookmarks,
  loading,
  saving,
  currentAddress,
  onSelect,
  onSaveCurrent,
  anchorRef,
  isDark = false,
  saveDisabled = false,
}: BookmarkDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        anchorRef.current?.contains(target) ||
        dropdownRef.current?.contains(target)
      ) {
        return;
      }
      onClose();
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose, anchorRef]);

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className={`absolute right-0 top-full mt-1 z-[9999] min-w-[240px] max-w-[320px] rounded-xl shadow-lg border ${
        isDark ? "bg-[#1D1D23] border-[#35353E]" : "bg-white border-gray-200"
      }`}
    >
      <div className="p-2 max-h-[280px] overflow-y-auto">
        {currentAddress.trim() && !saveDisabled && (
          <button
            type="button"
            onClick={() => {
              onSaveCurrent();
            }}
            disabled={saving}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm font-medium transition-colors ${
              isDark
                ? "bg-[#1D8751] hover:bg-[#166b3e] text-white"
                : "bg-[#1D8751] hover:bg-[#166b3e] text-white"
            } ${saving ? "opacity-70 cursor-not-allowed" : ""}`}
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
        )}
        <div className={`border-t my-1 ${isDark ? "border-[#35353E]" : "border-gray-200"}`} />
        <div className="text-xs font-semibold px-2 py-1 text-[#788099]">Saved addresses</div>
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <span className="w-5 h-5 border-2 border-[#1D8751] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : bookmarks.length === 0 ? (
          <p className={`text-sm py-4 text-center ${isDark ? "text-[#788099]" : "text-gray-500"}`}>
            No saved addresses. Save one above.
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
                className={`w-full flex flex-col items-start gap-0.5 px-3 py-2 rounded-lg text-left text-sm transition-colors ${
                  isDark ? "hover:bg-[#2A2A32]" : "hover:bg-gray-100"
                }`}
              >
                <span className={`font-medium truncate w-full ${isDark ? "text-white" : "text-gray-900"}`}>
                  {b.label || "Unnamed"}
                </span>
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
