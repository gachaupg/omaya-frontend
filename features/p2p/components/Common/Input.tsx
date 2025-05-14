import React from "react";
import { tokens } from "@/styles/tokens";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
  borderColor?: string;
  bgColor?: string;
}

const Input: React.FC<InputProps> = ({
  className = "",
  borderColor = tokens.colors.dark.border,
  bgColor = tokens.colors.dark.card,
  ...props
}) => {
  return (
    <input
      className={`bg-[${bgColor}] border border-[${borderColor}] ${
        className.includes("rounded") ? "" : "rounded-lg"
      } px-4 py-2 text-[${tokens.colors.dark.textTitle}] placeholder:text-[${
        tokens.colors.dark.textBody
      }] focus:outline-none transition ${className}`}
      {...props}
    />
  );
};

export default Input;
