/**
 * UserCard.tsx – auto‑generated placeholder
 */

import React from "react";
import { tokens } from "../../../../styles/tokens";

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
  borderColor = "dark:border-[#35353E] border-gray-200",
  width = "w-full", 
  bgColor = "dark:bg-[#1D1D23] bg-white",
  borderRadius = "rounded-xl",
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
