"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
// @ts-ignore
interface Option {
  value: string;
  label: string;
  disabled?: boolean;
  logo?: string;
  subtitle?: string; // Second line for two-line display
  title?: string; // Tooltip text shown on hover
}

type DropdownVerticalAlign = "cardTop" | "cardCenter";

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
  dropdownTitle?: string; // Title shown at the top of the dropdown
  dropdownVerticalAlign?: DropdownVerticalAlign;
  dropdownOffsetY?: number;
  dropdownOffsetX?: number;
  /**
   * Whether to use larger dropdown items (bigger logos and text)
   */
  largeDropdownItems?: boolean;
  /**
   * When true, dropdown matches trigger width and aligns with it (full width)
   */
  dropdownMatchTriggerWidth?: boolean;
  /**
   * Optional max width (px) for dropdown panel.
   * Useful for wide home-card payment method pickers.
   */
  dropdownMaxWidth?: number;
  /**
   * Optional minimum width (px) for dropdown panel.
   * Useful when trigger width is small but dropdown should be wider.
   */
  dropdownMinWidth?: number;
  logoSize?: number;
  logoClassName?: string;
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
  dropdownTitle,
  dropdownVerticalAlign = "cardTop",
  dropdownOffsetY = 0,
  dropdownOffsetX = 0,
  largeDropdownItems = false,
  dropdownMatchTriggerWidth = false,
  dropdownMaxWidth,
  dropdownMinWidth,
  logoSize,
  logoClassName,
}) => {
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
  
  // Keep logo sizing/style configurable so home dashboards can stay consistent.
  const resolvedLogoSize = logoSize ?? (largeDropdownItems ? 40 : 32);
  const dropdownItemLogoSize = resolvedLogoSize;
  const resolvedLogoClassName =
    logoClassName ?? "rounded object-cover flex-shrink-0";

  // Filter options based on search term (label, subtitle, value)
  const filteredOptions = options.filter((option) => {
    const q = searchTerm.toLowerCase();
    return (
      String(option.label || "").toLowerCase().includes(q) ||
      String(option.value || "").toLowerCase().includes(q) ||
      String(option.subtitle || "").toLowerCase().includes(q)
    );
  });

  // Get the selected option label and logo
  const selectedOption = options.find((option) => option.value === value);
  const displayValue = selectedOption?.label || placeholder;
  const selectedSubtitle = selectedOption?.subtitle;
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

  const updateDropdownPosition = () => {
    if (typeof window === "undefined") return;
    const triggerElement = triggerRef.current;
    if (!triggerElement) return;

    const viewportWidth = window.innerWidth || 0;
    const viewportHeight = window.innerHeight || 0;
    const minMargin = 16;
    const isMobileViewport = viewportWidth < 640;
    const minWidth = isMobileViewport ? 0 : (dropdownMinWidth ?? 280);
    const maxWidth = dropdownMaxWidth ?? 450;
    
    // Get trigger button position - get fresh values
    const triggerRect = triggerElement.getBoundingClientRect();
    
    // Prefer the card that contains this trigger; fallback to first card
    const parentCard =
      triggerElement.closest("[data-select-card='true']") ||
      triggerElement.closest("[data-asset-card='true']");
    const fallbackCard =
      document.querySelector("[data-select-card='true']") ||
      document.querySelector("[data-asset-card='true']");
    
    const targetCard = parentCard || fallbackCard;
    const verticalOffset = dropdownOffsetY;
    const horizontalOffset = dropdownOffsetX;
    
    if (targetCard) {
      const cardRect = targetCard.getBoundingClientRect();

      if (isMobileViewport) {
        let width = Math.min(cardRect.width, viewportWidth - minMargin * 2);
        let left = cardRect.left;

        if (left < minMargin) {
          left = minMargin;
        }
        if (left + width > viewportWidth - minMargin) {
          width = Math.max(0, viewportWidth - minMargin * 2);
          left = minMargin;
        }

        setDropdownStyles({
          top: cardRect.top,
          left,
          width,
        });
        return;
      }

      // Width strategy:
      // - When dropdownMatchTriggerWidth=true, match the Asset dropdown behavior:
      //   clamp to [minWidth..maxWidth] based on trigger width.
      // - Otherwise, keep the reduced dropdown width so it doesn't cover neighboring inputs.
      let desiredWidth = dropdownMatchTriggerWidth
        ? Math.min(maxWidth, Math.max(minWidth, triggerRect.width))
        : Math.min(maxWidth, Math.max(minWidth, cardRect.width * 0.4));

      // Ensure it doesn't exceed viewport width
      desiredWidth = Math.min(desiredWidth, viewportWidth - minMargin * 2);
      
      // Position directly below the trigger button (from top)
      // Use getBoundingClientRect which gives viewport-relative coordinates (perfect for fixed positioning)
      // Calculate base position: trigger bottom + gap (negative to pull up)
      const baseGap = -44; // Very large negative gap to pull dropdown up with big margin
      let top = triggerRect.bottom + baseGap;
      
      // Apply vertical alignment preference
      if (dropdownVerticalAlign === "cardCenter") {
        // Position at card center vertically
        top = cardRect.top + cardRect.height / 2 - 70;
      }
      
      // Apply vertical offset (positive values push down, negative pull up)
      top += verticalOffset;
      
      // Store the initial calculated position before viewport checks
      const initialTop = top;
      
      // CRITICAL: Allow dropdown to overlap significantly with trigger for very large upward push
      // Allow it to be well above trigger bottom for huge upward positioning
      const minTopPosition = triggerRect.bottom - 120; // Allow up to 120px overlap for very big margin
      if (top < minTopPosition) {
        top = minTopPosition;
      }
      
      // Position horizontally
      // - Match trigger width: align to trigger left edge
      // - Reduced width: align right edge with trigger right edge
      let left = dropdownMatchTriggerWidth
        ? triggerRect.left
        : triggerRect.right - desiredWidth; // Align right edge of dropdown with right edge of trigger
      
      // Apply horizontal offset (positive moves right, negative moves left)
      left += horizontalOffset;
      
      // When no horizontal offset is provided, keep the dropdown inside the card
      // (even for dropdownMatchTriggerWidth=true). This makes the panel align to the
      // right side of the card on small screens instead of drifting left/cutting off.
      if (horizontalOffset === 0) {
        if (left < cardRect.left) left = cardRect.left;
        if (left + desiredWidth > cardRect.right) {
          // Keep left edge fixed and shrink width instead of shifting left.
          // This preserves "left stays the same, grow to the right" behavior.
          desiredWidth = Math.max(0, cardRect.right - left);
        }
      }
      
      // Ensure dropdown doesn't go off screen horizontally
      if (left + desiredWidth > viewportWidth - minMargin) {
        // Keep left edge fixed and shrink width instead of shifting left.
        desiredWidth = Math.max(0, viewportWidth - minMargin - left);
      }
      if (left < minMargin) {
        left = minMargin;
      }

      // Ensure dropdown doesn't go off screen vertically
      const maxDropdownHeight = viewportHeight * 0.7; // 70vh
      // Estimate dropdown height (assuming ~50px per option + header/search)
      const estimatedDropdownHeight = Math.min(maxDropdownHeight, options.length * 50 + 120);
      
      // Only move above trigger if absolutely necessary (dropdown would go off screen)
      // Otherwise, keep it below the trigger as requested
      if (top + estimatedDropdownHeight > viewportHeight - minMargin) {
        // Check if we can fit it below by just limiting the height
        const spaceBelow = viewportHeight - top - minMargin;
        if (spaceBelow < 100) {
          // Only then position above the trigger button
          top = triggerRect.top - estimatedDropdownHeight - 4;
          // Ensure it doesn't go above viewport
          if (top < minMargin) {
            // If we can't fit above, keep it below but constrain to viewport
            top = Math.max(triggerRect.bottom + 2, minMargin);
          }
        }
        // Otherwise, keep it below and let it be scrollable
      }

      // Final position calculation - allow very large overlap for huge upward margin
      const finalTop = Math.max(top, triggerRect.bottom - 120);
      
      setDropdownStyles({
        top: finalTop,
        left,
        width: desiredWidth,
      });
      
      // Debug log to verify positioning
    } else {
      // Fallback: if no card found, or dropdownMatchTriggerWidth - position relative to trigger button
      const rect = triggerElement.getBoundingClientRect();
      let desiredWidth = dropdownMatchTriggerWidth
        ? Math.min(rect.width, viewportWidth - minMargin * 2)
        : Math.min(maxWidth, Math.max(minWidth, viewportWidth * 0.4));
      
      // Position directly below trigger button (from top)
      let top = rect.bottom + 4 + verticalOffset;
      
      // Align: full width = align with trigger left; otherwise align right edge
      let left = dropdownMatchTriggerWidth
        ? rect.left + horizontalOffset
        : rect.right - desiredWidth + horizontalOffset;
      
      // If dropdown would go off screen on the left, align with trigger's left edge instead
      if (left < minMargin) {
        left = rect.left + horizontalOffset;
        // If still goes off, position it to fit
        if (left + desiredWidth > viewportWidth - minMargin) {
          left = viewportWidth - desiredWidth - minMargin;
        }
      }
      
      // Ensure it doesn't go off screen
      if (left + desiredWidth > viewportWidth - minMargin) {
        left = viewportWidth - desiredWidth - minMargin;
      }
      if (left < minMargin) {
        left = minMargin;
      }
      
      // If dropdown would go below viewport, position it above the trigger
      const maxDropdownHeight = viewportHeight * 0.7;
      const estimatedDropdownHeight = Math.min(maxDropdownHeight, options.length * 50 + 120);
      if (top + estimatedDropdownHeight > viewportHeight - minMargin) {
        top = rect.top - estimatedDropdownHeight - 4;
        if (top < minMargin) {
          top = minMargin;
        }
      }

      setDropdownStyles({
        top,
        left: Math.max(minMargin, left),
        width: desiredWidth,
      });
    }
  };

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    // Use a small timeout to ensure DOM is ready, then calculate position
    const timeoutId = setTimeout(() => {
      updateDropdownPosition();
    }, 10);

    const handleReposition = () => updateDropdownPosition();
    const handleScroll = (event: Event) => {
      const target = event.target as Node | null;
      const isPageScrollTarget =
        target === document ||
        target === document.documentElement ||
        target === document.body;
      // If the scroll originated from inside the dropdown itself, don't close it
      if (
        dropdownContentRef.current &&
        target &&
        dropdownContentRef.current.contains(target)
      ) {
        return;
      }
      // Only close on whole-page scroll, not nested container scroll.
      if (!isPageScrollTarget) {
        return;
      }
      setIsOpen(false);
      setSearchTerm("");
    };

    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleScroll, true);
    document.addEventListener("scroll", handleScroll, true);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("scroll", handleScroll, true);
      document.removeEventListener("scroll", handleScroll, true);
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

    // Calculate position before opening to ensure it's ready
    // Use setTimeout to ensure DOM is ready
    setTimeout(() => {
      updateDropdownPosition();
    }, 0);
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
          w-full text-left px-4 py-2 rounded-2xl border text-lg
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          transition-colors duration-200 min-w-0
          ${disabled || loading
            ? "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed border-gray-300 dark:border-gray-600"
            : "bg-transparent text-[#1F2937] dark:text-white border-gray-200 dark:border-white/10 cursor-pointer"
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
              <span
                className="rounded-full overflow-hidden flex-shrink-0"
                style={{ width: resolvedLogoSize, height: resolvedLogoSize }}
              >
                <img
                  src={selectedLogo}
                  alt=""
                  className={`${resolvedLogoClassName} w-full h-full object-cover`}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </span>
            )}
            {!hideSelectedLabel && (
              selectedOption && selectedSubtitle ? (
                <div className="flex flex-col min-w-0 flex-1 overflow-hidden text-left leading-tight">
                  <span
                    className={`truncate min-w-0 text-base font-bold dark:font-normal`}
                    title={displayValue}
                  >
                    {loading ? loadingText : displayValue}
                  </span>
                  {!loading && (
                    <span
                      className="truncate min-w-0 text-xs text-gray-500 dark:text-gray-400"
                      title={selectedSubtitle}
                    >
                      {selectedSubtitle}
                    </span>
                  )}
                </div>
              ) : (
                <span
                  className={`truncate min-w-0 text-base ${
                    !selectedOption && !loading
                      ? placeholderClassName || "text-gray-500 dark:text-gray-400"
                      : selectedOption ? "font-bold dark:font-normal" : ""
                  }`}
                  title={selectedOption ? displayValue : undefined}
                >
                  {loading ? loadingText : displayValue}
                </span>
              )
            )}
          </div>
          <svg
            className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-200 flex-shrink-0 ${
              isOpen ? "rotate-180" : ""
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
            className="z-[99999] bg-white dark:bg-[#1D1D23] border border-gray-300 dark:border-[#35353E] rounded-2xl shadow-xl overflow-hidden max-h-[85vh] sm:max-h-[70vh]"
            role="listbox"
            style={{
              position: "fixed",
              top: `${Math.max(0, dropdownStyles.top)}px`,
              left: `${Math.max(0, dropdownStyles.left)}px`,
              width: `${dropdownStyles.width || 200}px`,
              minWidth: `${dropdownStyles.width || 200}px`,
              zIndex: 99999,
            }}
          >
            {/* Dropdown Title */}
            {dropdownTitle && (
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-600">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{dropdownTitle}</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  aria-label="Close"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
            {/* Search Input */}
            {searchable && (
              <div className="p-2 border-b border-gray-200 dark:border-gray-600">
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
              className="overflow-y-auto p-1 max-h-[calc(85vh-120px)] sm:max-h-[calc(70vh-120px)]"
            >
              {filteredOptions.length === 0 ? (
                <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center">
                  {searchTerm ? "No matching options" : emptyText}
                </div>
              ) : (
                filteredOptions.map((option) => {
                  const isSelected = value === option.value;
                  return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleOptionClick(option.value)}
                    disabled={option.disabled}
                    title={option.title || option.label}
                    className={`
                    w-full text-left transition-colors duration-150
                    hover:bg-blue-50 dark:hover:bg-blue-900/20
                    focus:outline-none focus:bg-blue-50 dark:focus:bg-blue-900/20
                    ${largeDropdownItems ? "px-3 py-2.5" : "px-3 py-2.5"}
                    text-sm
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
                    style={{ minHeight: largeDropdownItems ? "46px" : "44px" }}
                    role="option"
                    aria-selected={value === option.value}
                  >
                    <div className={`flex items-center min-w-0 w-full gap-2.5`}>
                      {option.logo && (
                        <span
                          className="rounded-full overflow-hidden flex-shrink-0"
                          style={{
                            width: dropdownItemLogoSize,
                            height: dropdownItemLogoSize,
                          }}
                        >
                          <img
                            src={option.logo}
                            alt=""
                            className={`${resolvedLogoClassName} w-full h-full object-cover`}
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = "none";
                            }}
                          />
                        </span>
                      )}
                      {option.subtitle ? (
                        <div className="flex-1 min-w-0">
                          <div className={`text-[#1F2937] dark:text-[#ffffff] truncate ${largeDropdownItems ? "font-medium text-base" : "font-normal text-base"}`}>{option.label}</div>
                          <div className="text-gray-500 dark:text-gray-400 truncate text-xs">{option.subtitle}</div>
                        </div>
                      ) : (
                        <span className={`truncate min-w-0 flex-1 text-left ${largeDropdownItems ? "text-base font-medium" : "text-base"}`}>{option.label}</span>
                      )}
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

// Add display name for better debugging
CustomSelect.displayName = 'CustomSelect';

export default CustomSelect;
