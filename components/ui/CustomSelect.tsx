"use client";

import React, { useState, useRef, useEffect } from "react";

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
  optionClassName?: string;
  searchable?: boolean;
  loading?: boolean;
  loadingText?: string;
  emptyText?: string;
}

const CustomSelect: React.FC<CustomSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = "Select an option",
  disabled = false,
  className = "",
  optionClassName = "",
  searchable = false,
  loading = false,
  loadingText = "Loading...",
  emptyText = "No options available",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

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
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen, searchable]);

  const handleToggle = () => {
    if (!disabled && !loading) {
      setIsOpen(!isOpen);
      if (!isOpen) {
        setSearchTerm("");
      }
    }
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
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        disabled={disabled || loading}
        className={`
          w-full text-left px-4 py-3 rounded-2xl border
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          transition-colors duration-200
          ${disabled || loading
            ? "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed border-gray-300 dark:border-gray-600"
            : "bg-white dark:bg-[#1D1D23] text-[#35353e] dark:text-[#ffffff] border-[#A2A4A9FF] dark:border-[#35353E] hover:border-blue-400 dark:hover:border-blue-400 cursor-pointer"
          }
        `}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        role="combobox"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {selectedLogo && !loading && (
              <img
                src={selectedLogo}
                alt=""
                className="w-5 h-5 rounded object-cover flex-shrink-0"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            )}
            <span className={`truncate ${!selectedOption ? "text-gray-500 dark:text-gray-400" : ""}`}>
              {loading ? loadingText : displayValue}
            </span>
          </div>
          <svg
            className={`w-5 h-5 transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            } ${disabled || loading ? "text-gray-400" : "text-gray-500"}`}
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
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-[#1D1D23] border border-[#A2A4A9FF] dark:border-[#35353E] rounded-2xl shadow-lg max-h-60 overflow-hidden">
          {/* Search Input */}
          {searchable && (
            <div className="p-2 border-b border-gray-200 dark:border-gray-600">
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search options..."
                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
              />
            </div>
          )}

          {/* Options List */}
          <div className="max-h-48 overflow-y-auto p-1">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center">
                {searchTerm ? "No matching options" : emptyText}
              </div>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleOptionClick(option.value)}
                  disabled={option.disabled}
                  className={`
                    w-full text-left px-4 py-3 text-sm transition-colors duration-150
                    hover:bg-blue-50 dark:hover:bg-blue-900/20
                    focus:outline-none focus:bg-blue-50 dark:focus:bg-blue-900/20
                    ${value === option.value
                      ? "bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100 font-medium"
                      : "text-gray-900 dark:text-white"
                    }
                    ${option.disabled
                      ? "opacity-50 cursor-not-allowed hover:bg-transparent dark:hover:bg-transparent"
                      : "cursor-pointer"
                    }
                    ${optionClassName}
                  `}
                  style={{ minHeight: '44px', marginBottom: '2px' }}
                  role="option"
                  aria-selected={value === option.value}
                >
                  <div className="flex items-center gap-3 min-w-0 w-full">
                    {option.logo && (
                      <img
                        src={option.logo}
                        alt=""
                        className="w-5 h-5 rounded object-cover flex-shrink-0"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    )}
                    <span className="truncate min-w-0 flex-1 text-left">{option.label}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomSelect;
