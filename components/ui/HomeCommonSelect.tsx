"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
// @ts-ignore
interface Option {
  value: string;
  label: string;
  disabled?: boolean;
  logo?: string;
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

  const updateDropdownPosition = () => {
    if (typeof window === "undefined") return;
    const triggerElement = triggerRef.current;
    if (!triggerElement) return;

    const viewportWidth = window.innerWidth || 0;
    const minMargin = 16;
    const minWidth = 280;
    const maxWidth = 450;
    
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
      
      // Calculate reduced width so dropdowns don't cover amount inputs (40% of card width)
      let desiredWidth = Math.min(maxWidth, Math.max(minWidth, cardRect.width * 0.4));
      
      // Position at the top of the card or center based on preference
      let top = cardRect.top + 8; // default: slightly below top
      if (dropdownVerticalAlign === "cardCenter") {
        top = cardRect.top + cardRect.height / 2 - 70; // slightly higher than previous
      }
      top += verticalOffset;
      
      // Position to the right side of the card
      let left = cardRect.right - desiredWidth - 4; // 4px from right edge
      if (dropdownVerticalAlign === "cardCenter") {
        left = cardRect.right - desiredWidth + 4; // push further right
      }
      left += horizontalOffset;
      
      // If card is too narrow, center it but still push right a bit
      if (cardRect.width < desiredWidth + 16) {
        left = cardRect.left + (cardRect.width - desiredWidth) / 2 + 20; // Push 20px to the right
      }
      
      // Ensure dropdown doesn't go off screen
      if (left + desiredWidth > viewportWidth - minMargin) {
        left = viewportWidth - desiredWidth - minMargin;
      }
      if (left < minMargin) {
        left = minMargin;
      }

      setDropdownStyles({
        top,
        left,
        width: desiredWidth,
      });
    } else {
      // Fallback: if no card found, center on screen
      const rect = triggerElement.getBoundingClientRect();
      let desiredWidth = Math.min(maxWidth, Math.max(minWidth, viewportWidth * 0.4));
      let left = (viewportWidth - desiredWidth) / 2;
      left += horizontalOffset;
      let top = 200; // Fixed top position
      top += verticalOffset;

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

    updateDropdownPosition();

    const handleReposition = () => updateDropdownPosition();
    const handleScroll = (event: Event) => {
      const target = event.target as Node | null;
      // If the scroll originated from inside the dropdown itself, don't close it
      if (
        dropdownContentRef.current &&
        target &&
        dropdownContentRef.current.contains(target)
      ) {
        return;
      }
      setIsOpen(false);
      setSearchTerm("");
    };

    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleScroll, true);
    document.addEventListener("scroll", handleScroll, true);

    return () => {
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
              <img
                src={selectedLogo}
                alt=""
                className="w-6 h-6 rounded object-cover flex-shrink-0"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            )}
            {!hideSelectedLabel && (
              <span
                className={`truncate min-w-0 text-lg ${
                  !selectedOption && !loading
                    ? placeholderClassName || "text-gray-500 dark:text-gray-400"
                    : ""
                }`}
                title={selectedOption ? displayValue : undefined}
              >
                {loading ? loadingText : displayValue}
              </span>
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
            className="z-[9999] bg-white dark:bg-[#1D1D23] border border-gray-300 dark:border-[#35353E] rounded-2xl shadow-xl max-h-[70vh] sm:max-h-[60vh] overflow-hidden"
            role="listbox"
            style={{
              position: "fixed",
              top: `${dropdownStyles.top}px`,
              left: `${dropdownStyles.left}px`,
              width: `${dropdownStyles.width || 200}px`,
              minWidth: `${dropdownStyles.width || 200}px`,
            }}
          >
            {/* Dropdown Title */}
            {dropdownTitle && (
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-600">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">{dropdownTitle}</h3>
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
            <div className="max-h-[60vh] sm:max-h-[50vh] overflow-y-auto p-1">
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
                    className={`
                    w-full text-left px-3 sm:px-4 py-2 sm:py-2.5 text-base sm:text-lg transition-colors duration-150
                    hover:bg-blue-50 dark:hover:bg-blue-900/20
                    focus:outline-none focus:bg-blue-50 dark:focus:bg-blue-900/20
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
                    style={{ minHeight: "32px", marginBottom: "1px" }}
                    role="option"
                    aria-selected={value === option.value}
                  >
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 w-full">
                      {option.logo && (
                        <img
                          src={option.logo}
                          alt=""
                          className="w-6 h-6 sm:w-8 sm:h-8 rounded object-cover flex-shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      )}
                      <span className="truncate min-w-0 flex-1 text-left text-base sm:text-lg">{option.label}</span>
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
