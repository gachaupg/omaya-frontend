import React from "react";

interface Option {
  value: string;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: Option[];
  className?: string;
  placeholder?: string;
  /** Tailwind / HEX color for dark-mode border */
  borderColor?: string;
  /** Tailwind / HEX color for dark-mode background */
  bgColor?: string;
}

/**
 * Generic `<select>` that now supports both light & dark themes.
 *
 * Light theme → white background, gray-300 border, gray-900 text.
 * Dark theme → uses standard dark mode colors. No behaviour changed.
 */
const Select: React.FC<SelectProps> = ({
  options,
  className = "",
  placeholder,
  borderColor = "#35353E",
  bgColor = "#1D1D23",
  value,
  ...props
}) => {
  return (
    <select
      className={`bg-white dark:bg-[#1D1D23] border border-gray-300 dark:border-[#35353E] text-gray-900 dark:text-white px-4 py-2 rounded focus:outline-none focus:border-[#1D8751] transition ${className}`}
      value={value}
      {...props}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map((option) => (
        <option
          key={option.value}
          value={option.value}
          className="bg-white dark:bg-[#1D1D23]"
        >
          {option.label}
        </option>
      ))}
    </select>
  );
};

export default Select;
