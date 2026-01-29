/**
 * Button.tsx – auto‑generated placeholder
 */

import React from "react";
import { tokens } from "@/styles/tokens";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
  icon?: React.ReactNode;
  className?: string;
}

const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  icon,
  className = "",
  children,
  ...props
}) => {
  const baseClasses =
    "inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none";

  const variantClasses = {
    primary: `bg-[${tokens.colors.brand.primary}] text-white hover:bg-opacity-90`,
    secondary: `bg-[${tokens.colors.brand.secondary}] text-white hover:bg-opacity-90`,
    ghost: `bg-transparent text-gray-700 dark:text-[${tokens.colors.dark.textBody}] hover:bg-gray-100 dark:hover:bg-[${tokens.colors.dark.border}]`,
    outline: `bg-transparent border border-gray-300 dark:border-[${tokens.colors.dark.border}] text-gray-700 dark:text-[${tokens.colors.dark.textBody}] hover:bg-gray-100 dark:hover:bg-[${tokens.colors.dark.border}]`,
  };

  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  };

  const defaultRadiusClasses = {
    sm: "rounded-lg",
    md: "rounded-lg",
    lg: "rounded-xl",
  };

  // Check if className contains any border radius classes
  const hasCustomRadius = className.includes("rounded-");
  const radiusClass = hasCustomRadius ? "" : defaultRadiusClasses[size];

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${radiusClass} ${className}`}
      {...props}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  );
};

export default Button;
