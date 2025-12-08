import React from "react";

interface VerifiedBadgeProps {
  size?: number;
  className?: string;
}

const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({ 
  size = 20, 
  className = "" 
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`flex-shrink-0 ${className}`}
    >
      {/* Wavy circular badge shape matching Figma design */}
      <path
        d="M12 2C12 2 13.5 3.5 15 3.5C16.5 3.5 18.5 2 18.5 2C18.5 2 20 3.5 20 5C20 6.5 21.5 8.5 21.5 8.5C21.5 8.5 20 10 20 11.5C20 13 21.5 15 21.5 15C21.5 15 20 16.5 20 18C20 19.5 18.5 21.5 18.5 21.5C18.5 21.5 16.5 20 15 20C13.5 20 12 21.5 12 21.5C12 21.5 10.5 20 9 20C7.5 20 5.5 21.5 5.5 21.5C5.5 21.5 4 19.5 4 18C4 16.5 2.5 15 2.5 15C2.5 15 4 13 4 11.5C4 10 2.5 8.5 2.5 8.5C2.5 8.5 4 6.5 4 5C4 3.5 5.5 2 5.5 2C5.5 2 7.5 3.5 9 3.5C10.5 3.5 12 2 12 2Z"
        fill="#1D8751"
      />
      {/* White checkmark */}
      <path
        d="M8 12L10.5 14.5L16 9"
        stroke="#FFFFFF"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default VerifiedBadge;
