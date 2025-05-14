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
  ...props
}) => {
  const baseStyles =
    "flex items-center justify-center gap-2 transition-all duration-200 font-medium text-dark-textTitle cursor-pointer";

  const sizeStyles = {
    sm: "px-3 text-xs",
    md: "px-4 text-sm",
    lg: "px-5 text-base",
  };

  const variantStyles = {
    primary: "bg-[#1D8751] border-none hover:opacity-90 text-white",
    secondary: "bg-[#E23D3A] border-none hover:opacity-90 text-white",
    outline: `bg-transparent text-brand-primary border hover:opacity-90`,
    ghost: "bg-transparent border-none hover:opacity-90",
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
      {...props}
    >
      {icon && iconPosition === "left" && icon}
      {children}
      {icon && iconPosition === "right" && icon}
    </button>
  );
};

export default Button;
