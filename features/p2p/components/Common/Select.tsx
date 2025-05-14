import React from "react";
import { tokens } from "@/styles/tokens";

interface Option {
  value: string;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: Option[];
  className?: string;
  placeholder?: string;
  borderColor?: string;
  bgColor?: string;
}

const Select: React.FC<SelectProps> = ({
  options,
  className = "",
  placeholder,
  borderColor = tokens.colors.dark.border,
  bgColor = tokens.colors.dark.card,
  value,
  ...props
}) => {
  return (
    <select
      className={`bg-[#35353e] border border-[${borderColor}] rounded-lg px-4 py-2 text-[${tokens.colors.dark.textTitle}] focus:outline-none focus:border-[${tokens.colors.brand.primary}] transition ${className}`}
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
          className="bg-[#35353e]"
        >
          {option.label}
        </option>
      ))}
    </select>
  );
};

export default Select;
