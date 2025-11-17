"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

interface Option {
  value: string;
  label: string;
  disabled?: boolean;
  logo?: string;
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

    const rect = triggerElement.getBoundingClientRect();
    setDropdownStyles({
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
    });
  };

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    updateDropdownPosition();

    const handleReposition = () => updateDropdownPosition();

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
          w-full text-left px-3 sm:px-4 py-2.5 sm:py-3 rounded-2xl border text-sm sm:text-base
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          transition-colors duration-200 min-w-0
          ${disabled || loading
            ? "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed border-gray-300 dark:border-gray-600"
            : "bg-white dark:bg-[#1D1D23] text-[#35353e] dark:text-[#ffffff] border-[#A2A4A9FF] dark:border-[#35353E] hover:border-blue-400 dark:hover:border-blue-400 cursor-pointer"
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
                className="w-4 h-4 sm:w-5 sm:h-5 rounded object-cover flex-shrink-0"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            )}
            {!hideSelectedLabel && (
              <span
                className={`truncate min-w-0 ${
                  !selectedOption ? "text-gray-500 dark:text-gray-400" : ""
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
            className="z-[9999] bg-white dark:bg-[#1D1D23] border border-gray-300 dark:border-[#35353E] rounded-2xl shadow-xl max-h-[300px] sm:max-h-[250px] overflow-hidden"
            role="listbox"
            style={{
              position: "fixed",
              top: dropdownStyles.top,
              left: dropdownStyles.left,
              width: dropdownStyles.width,
              minWidth: dropdownStyles.width,
            }}
          >
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
            <div className="max-h-[250px] sm:max-h-[200px] overflow-y-auto p-1">
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
                    w-full text-left px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm transition-colors duration-150
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
                    style={{ minHeight: "40px", marginBottom: "2px" }}
                    role="option"
                    aria-selected={value === option.value}
                  >
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 w-full">
                      {option.logo && (
                        <img
                          src={option.logo}
                          alt=""
                          className="w-4 h-4 sm:w-5 sm:h-5 rounded object-cover flex-shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      )}
                      <span className="truncate min-w-0 flex-1 text-left">{option.label}</span>
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
