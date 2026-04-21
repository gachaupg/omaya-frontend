"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
// @ts-ignore
interface Option {
  value: string;
  label: string;
  disabled?: boolean;
  logo?: string;
  subtitle?: string;
}

interface CustomSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  optionClassName?: string;
  searchable?: boolean;
  loading?: boolean;
  loadingText?: string;
  emptyText?: string;
  /**
   * Hides the currently selected label inside the trigger button.
   * Useful when the label is rendered elsewhere.
   */
  hideSelectedLabel?: boolean;
  placeholderClassName?: string;
  sizeMode?: "compact" | "wide" | "card";
  logoSize?: number;
  logoClassName?: string;
  dropdownOffsetY?: number;
  dropdownMaxHeight?: number;
  dropdownPosition?: "below" | "above";
  /**
   * Custom title for dropdown header
   */
  dropdownTitle?: string;
  /**
   * Horizontal offset for dropdown positioning
   */
  dropdownOffsetX?: number;
  /**
   * Whether to use larger dropdown items (bigger logos and text)
   */
  largeDropdownItems?: boolean;
  selectedTextClassName?: string;
  optionTextClassName?: string;
}

const CustomSelect: React.FC<CustomSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = "Select an option",
  disabled = false,
  className = "",
  triggerClassName = "",
  optionClassName = "",
  searchable = false,
  loading = false,
  loadingText = "Loading...",
  emptyText = "No options available",
  hideSelectedLabel = false,
  placeholderClassName = "",
  sizeMode = "compact",
  logoSize,
  logoClassName,
  dropdownOffsetY = 0,
  dropdownMaxHeight,
  dropdownPosition = "below",
  dropdownTitle,
  dropdownOffsetX = 0,
  largeDropdownItems = false,
  selectedTextClassName,
  optionTextClassName,
}) => {
  // Use larger logo size for large dropdown items
  const resolvedLogoSize = logoSize ?? (largeDropdownItems ? 40 : sizeMode === "card" ? 24 : 32);
  const dropdownItemLogoSize = largeDropdownItems ? 40 : resolvedLogoSize;
  const resolvedLogoClass =
    logoClassName ?? "rounded object-cover flex-shrink-0";
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownContentRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownId = `custom-select-${Math.random().toString(36).substr(2, 9)}`;
  const [dropdownStyles, setDropdownStyles] = useState({
    top: 0,
    left: 0,
    width: 0,
  });

  // Filter options based on search term
  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get the selected option label and logo
  const selectedOption = options.find((option) => option.value === value);
  const displayValue = selectedOption?.label || placeholder;
  const selectedLogo = selectedOption?.logo;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        (!dropdownContentRef.current || !dropdownContentRef.current.contains(target))
      ) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const handleScroll = (event: Event) => {
      const target = event.target as Node | null;

      // 1. Ignore scrolls inside dropdown content
      if (
        dropdownContentRef.current &&
        target &&
        dropdownContentRef.current.contains(target)
      ) {
        return;
      }

      // 2. Ignore scrolls on the trigger itself (edge case)
      if (
        triggerRef.current &&
        target &&
        triggerRef.current.contains(target)
      ) {
        return;
      }

      // 3. Close dropdown on any other scroll
      setIsOpen(false);
    };

    // Capture phase is CRITICAL
    window.addEventListener("scroll", handleScroll, true);
    document.addEventListener("scroll", handleScroll, true);

    return () => {
      window.removeEventListener("scroll", handleScroll, true);
      document.removeEventListener("scroll", handleScroll, true);
    };
  }, [isOpen]);


  const commitDropdownStyles = (next: {
    top: number;
    left: number;
    width: number;
  }) => {
    setDropdownStyles((prev) => {
      const unchanged =
        Math.abs(prev.top - next.top) < 0.5 &&
        Math.abs(prev.left - next.left) < 0.5 &&
        Math.abs((prev.width || 0) - next.width) < 0.5;
      return unchanged ? prev : next;
    });
  };

  const updateDropdownPosition = () => {
    if (typeof window === "undefined") return;
    const triggerElement = triggerRef.current;
    if (!triggerElement) return;

    const rect = triggerElement.getBoundingClientRect();
    const viewportWidth = window.innerWidth || 0;
    const viewportHeight = window.innerHeight || 0;
    const minMargin = 12;
    const minWidth = 200;
    const baseWidth = rect.width;

    const cardElement = triggerElement.closest("[data-select-card='true']");
    const cardRect = cardElement?.getBoundingClientRect();

    const verticalOffset = dropdownOffsetY;

    if (sizeMode === "wide" && cardRect) {
      let desiredWidth = cardRect.width * 0.75;
      desiredWidth = Math.min(desiredWidth, viewportWidth - minMargin * 2);
      desiredWidth = Math.max(desiredWidth, Math.max(cardRect.width * 0.6, minWidth));

      const left = Math.min(
        Math.max(minMargin, cardRect.right - desiredWidth),
        Math.max(minMargin, viewportWidth - desiredWidth - minMargin)
      );

      const topOffset = Math.max(minMargin, cardRect.top - 64);
      let top = Math.min(topOffset, Math.max(minMargin, viewportHeight - minMargin));
      top = Math.max(minMargin, Math.min(top + verticalOffset, viewportHeight - minMargin));

      commitDropdownStyles({
        top,
        left,
        width: desiredWidth,
      });
      return;
    }

    if (sizeMode === "card") {
      // For card mode, match the trigger width exactly (not bigger)
      const triggerWidth = rect.width;

      // Use trigger width exactly, not card width - ensure it never exceeds trigger width
      let dropdownWidth = triggerWidth;

      // Ensure the dropdown doesn't exceed viewport width
      if (viewportWidth) {
        const maxWidth = viewportWidth - minMargin * 2;
        dropdownWidth = Math.min(dropdownWidth, maxWidth);
        // But also ensure it doesn't exceed the trigger width
        dropdownWidth = Math.min(dropdownWidth, triggerWidth);
      }

      // Calculate left position to align with trigger exactly
      let leftPosition = rect.left;

      // Ensure dropdown doesn't go off screen
      if (viewportWidth) {
        if (leftPosition + dropdownWidth > viewportWidth - minMargin) {
          leftPosition = Math.max(minMargin, viewportWidth - dropdownWidth - minMargin);
        }
        if (leftPosition < minMargin) {
          leftPosition = minMargin;
          dropdownWidth = Math.min(dropdownWidth, viewportWidth - minMargin * 2);
          // Still ensure it doesn't exceed trigger width
          dropdownWidth = Math.min(dropdownWidth, triggerWidth);
        }
      }

      // Calculate top position based on dropdownPosition prop
      let topPosition;
      if (dropdownPosition === "above") {
        // Position above the trigger
        const dropdownHeight = dropdownMaxHeight || 300;
        topPosition = rect.top - dropdownHeight - 4 + verticalOffset;
        // If it would go above viewport, position it below instead
        if (topPosition < minMargin) {
          topPosition = rect.bottom + 4 + verticalOffset;
        }
      } else {
        // Default: position below the trigger
        topPosition = rect.bottom + 4 + verticalOffset;
      }

      commitDropdownStyles({
        top: topPosition,
        left: leftPosition,
        width: dropdownWidth, // Match trigger width exactly - never bigger
      });
      return;
    }

    let desiredWidth = baseWidth * 0.55;
    desiredWidth = Math.max(desiredWidth, minWidth);
    desiredWidth = Math.min(desiredWidth, baseWidth - 12);

    if (viewportWidth) {
      const viewportLimit = Math.max(
        minWidth,
        Math.min(viewportWidth * 0.3, viewportWidth - minMargin * 2)
      );
      desiredWidth = Math.min(desiredWidth, viewportLimit);
    }

    if (desiredWidth <= 0 || Number.isNaN(desiredWidth)) {
      desiredWidth = Math.max(baseWidth - 12, minWidth);
    }

    const left = Math.min(
      Math.max(minMargin, rect.right - desiredWidth),
      Math.max(minMargin, viewportWidth - desiredWidth - minMargin)
    );

    commitDropdownStyles({
      top: rect.bottom + 4 + verticalOffset,
      left,
      width: desiredWidth,
    });
  };

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    updateDropdownPosition();

    const handleReposition = (event: Event) => {
      const target = event.target;
      if (
        event.type === "scroll" &&
        target instanceof Node &&
        (dropdownContentRef.current?.contains(target) ||
          triggerRef.current?.contains(target))
      ) {
        return;
      }
      updateDropdownPosition();
    };

    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleReposition, true);

    return () => {
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("scroll", handleReposition, true);
    };
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen, searchable]);

  const handleToggle = () => {
    if (disabled || loading) {
      return;
    }

    if (isOpen) {
      setIsOpen(false);
      setSearchTerm("");
      return;
    }

    updateDropdownPosition();
    setIsOpen(true);
    setSearchTerm("");
  };

  const handleOptionClick = (optionValue: string) => {
    if (!disabled) {
      onChange(optionValue);
      setIsOpen(false);
      setSearchTerm("");
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleToggle();
    } else if (event.key === "Escape") {
      setIsOpen(false);
      setSearchTerm("");
    }
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        disabled={disabled || loading}
        ref={triggerRef}
        className={`
          w-full text-left px-3 sm:px-4 py-2 rounded-2xl border text-base sm:text-lg
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          transition-colors duration-200 min-w-0
          ${sizeMode === "card" ? "h-[48px] flex items-center bg-transparent dark:bg-transparent" : ""}
          ${disabled || loading
            ? "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed border-gray-300 dark:border-gray-600"
            : sizeMode === "card"
              ? "bg-transparent dark:bg-transparent text-[#35353e] dark:text-[#ffffff] border-[#A2A4A9FF] dark:border-[#35353E] hover:border-blue-400 dark:hover:border-blue-400 cursor-pointer"
              : "bg-white dark:bg-[var(--card-color)] text-[#35353e] dark:text-[#ffffff] border-[#A2A4A9FF] dark:border-[#35353E] hover:border-blue-400 dark:hover:border-blue-400 cursor-pointer"
          }
        ${triggerClassName}
        `}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls={dropdownId}
        role="combobox"
        title={selectedOption ? displayValue : undefined}
      >
        <div className="flex items-center justify-between min-w-0 w-full">
          <div className="flex items-center gap-3 min-w-0 flex-1 overflow-hidden">
            {selectedLogo && !loading && (
              <img
                src={selectedLogo}
                alt=""
                className={resolvedLogoClass}
                style={{ width: resolvedLogoSize, height: resolvedLogoSize }}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            )}
            {!hideSelectedLabel && (
              <span
                className={`truncate min-w-0 ${selectedTextClassName || "text-base sm:text-lg"} ${!selectedOption && !loading
                    ? placeholderClassName || "text-gray-500 dark:text-gray-400"
                    : selectedOption ? "font-bold dark:font-normal" : ""
                  }`}
                title={selectedOption ? displayValue : undefined}
              >
                {loading ? loadingText : displayValue}
              </span>
            )}
          </div>
          <svg
            className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-200 flex-shrink-0 ${isOpen ? "rotate-180" : ""
              } ${disabled || loading ? "text-gray-400 dark:text-gray-500" : "text-gray-600 dark:text-gray-400"}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </button>

      {/* Dropdown Options */}
      {isOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            id={dropdownId}
            ref={dropdownContentRef}
            className="z-40 bg-white dark:bg-[#1D1D23] border border-border dark:border-accent rounded-2xl shadow-xl overflow-hidden"
            role="listbox"
            style={{
              position: "fixed",
              top: dropdownStyles.top,
              left: dropdownStyles.left,
              width: `${dropdownStyles.width || 200}px`,
              minWidth: sizeMode === "card" ? `${dropdownStyles.width || 200}px` : `${dropdownStyles.width || 200}px`,
              maxWidth: sizeMode === "card" ? `${dropdownStyles.width || 200}px` : "none",
              maxHeight: dropdownMaxHeight ? `${dropdownMaxHeight}px` : "300px",
            }}
          >
            {/* Search Input */}
            {searchable && (
              <div className="p-2">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search options..."
                  className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                />
              </div>
            )}

            {/* Options List */}
            <div
              className="overflow-y-auto p-1"
              style={{
                maxHeight: dropdownMaxHeight ? `${dropdownMaxHeight - (searchable ? 80 : 20)}px` : "250px",
              }}
            >
              {filteredOptions.length === 0 ? (
                <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center">
                  {searchTerm ? "No matching options" : emptyText}
                </div>
              ) : (
                filteredOptions.map((option, index) => {
                  const isSelected = value === option.value;
                  return (
                    <button
                      key={`${option.value}-${index}`}
                      type="button"
                      onClick={() => handleOptionClick(option.value)}
                      disabled={option.disabled}
                      className={`
                    w-full text-left transition-colors duration-150
                    hover:bg-blue-50 dark:hover:bg-blue-900/20
                    focus:outline-none focus:bg-blue-50 dark:focus:bg-blue-900/20
                    ${largeDropdownItems ? "px-4 py-3 sm:py-4" : "px-3 sm:px-4 py-2 sm:py-2.5"}
                    ${optionTextClassName || "text-base sm:text-lg"}
                    ${isSelected
                          ? "bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100 font-medium"
                          : "text-gray-900 dark:text-white"
                        }
                    ${option.disabled
                          ? "opacity-50 cursor-not-allowed hover:bg-transparent dark:hover:bg-transparent"
                          : "cursor-pointer"
                        }
                    ${optionClassName}
                  `}
                      style={{ minHeight: largeDropdownItems ? "56px" : "32px", marginBottom: "1px" }}
                      role="option"
                      aria-selected={value === option.value}
                    >
                      <div className={`flex items-center min-w-0 w-full ${largeDropdownItems ? "gap-3 sm:gap-4" : "gap-2 sm:gap-3"}`}>

                        {option.logo && (
                          <img
                            src={option.logo}
                            alt=""
                            className={resolvedLogoClass}
                            style={{ width: dropdownItemLogoSize, height: dropdownItemLogoSize }}
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = "none";
                            }}
                          />
                        )}
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className={`truncate text-left ${optionTextClassName || (largeDropdownItems ? "text-base sm:text-lg font-medium" : "text-base sm:text-lg")}`}>{option.label}</span>
                          {option.subtitle && (
                            <span className={`truncate text-left text-gray-500 dark:text-gray-400 ${largeDropdownItems ? "text-sm" : "text-xs"}`}>
                              {option.subtitle}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default CustomSelect;
