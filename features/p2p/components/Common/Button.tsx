import React from "react";
import { tokens } from "@/styles/tokens";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  fullWidth?: boolean;
  className?: string;
  width?: string | number;
  height?: string | number;
  borderColor?: string;
  borderRadius?: string | number;
  loading?: boolean;
  ariaLabel?: string;
  ariaDescribedBy?: string;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  icon,
  iconPosition = "left",
  fullWidth = false,
  className = "",
  width,
  height,
  borderColor,
  borderRadius,
  loading = false,
  ariaLabel,
  ariaDescribedBy,
  disabled,
  ...props
}) => {
  const baseStyles =
    "flex items-center justify-center gap-2 transition-all duration-200 font-medium text-dark-textTitle cursor-pointer focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed";

  const sizeStyles = {
    sm: "px-3 text-xs",
    md: "px-4 text-sm",
    lg: "px-5 text-base",
  };

  const variantStyles = {
    primary:
      "bg-[#1D8751] border-none hover:opacity-90 text-white focus:ring-green-500",
    secondary:
      "bg-[#E23D3A] border-none hover:opacity-90 text-white focus:ring-red-500",
    outline: `bg-transparent text-brand-primary border hover:opacity-90 focus:ring-blue-500`,
    ghost: "bg-transparent border-none hover:opacity-90 focus:ring-gray-500",
  };

  const widthStyle = fullWidth ? "w-full" : width ? `w-[${width}px]` : "w-fit";
  const heightStyle = height ? `h-[${height}px]` : "";
  const borderRadiusStyle =
    borderRadius === "full"
      ? "rounded-full"
      : borderRadius
      ? `rounded-[${borderRadius}px]`
      : "rounded-md";

  // Determine border color class
  let borderColorClass = "";
  if (borderColor) {
    if (borderColor.startsWith("#")) {
      borderColorClass = `border-[${borderColor}]`;
    } else {
      borderColorClass = `border-${borderColor}`;
    }
  }

  // Determine if border should be shown
  const showBorder =
    borderColor && variant !== "primary" && variant !== "secondary";

  // Handle keyboard events
  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (!disabled && !loading && props.onClick) {
        props.onClick(e as any);
      }
    }
  };

  const isDisabled = disabled || loading;

  return (
    <button
      style={{
        width: width ? `${width}px` : undefined,
        height: height ? `${height}px` : undefined,
        ...(borderColor ? { borderColor: borderColor } : {}),
      }}
      className={[
        baseStyles,
        sizeStyles[size],
        variantStyles[variant],
        borderRadiusStyle,
        showBorder ? `border` : "",
        className,
      ].join(" ")}
      disabled={isDisabled}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      aria-disabled={isDisabled}
      role="button"
      tabIndex={isDisabled ? -1 : 0}
      onKeyDown={handleKeyDown}
      {...props}
    >
      {loading && (
        <div
          className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"
          role="status"
          aria-label="Loading"
        >
          <span className="sr-only">Loading...</span>
        </div>
      )}
      {icon && iconPosition === "left" && !loading && icon}
      {children}
      {icon && iconPosition === "right" && !loading && icon}
    </button>
  );
};

export default Button;
