/**
 * Card.tsx – auto‑generated placeholder
 */
/**
 * UserCard.tsx – auto‑generated placeholder
 */

import { tokens } from "@/styles/tokens";
import React from "react";

interface CardProps {
  children: React.ReactNode;
  borderColor?: string;
  width?: string;
  bgColor?: string;
  borderRadius?: string;
  className?: string;
}

const Card: React.FC<CardProps> = ({
  children,
  borderColor = `border-[${tokens.colors.dark.border}]`,
  width = "w-full",
  bgColor = `bg-[${tokens.colors.dark.card}]`,
  borderRadius = "rounded-[20px]",
  className = "",
}) => {
  return (
    <div
      className={`border ${borderColor} ${width} ${bgColor} ${borderRadius} ${className}`}
    >
      {children}
    </div>
  );
};

export default Card;
