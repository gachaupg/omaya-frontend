import React from "react";

interface SortArrowsIconProps {
  className?: string;
  size?: number;
}

/** Sort indicator: up + down arrows (neutral / column can be sorted). */
export const SortArrowsIcon: React.FC<SortArrowsIconProps> = ({
  className = "text-gray-400 dark:text-[#788099]",
  size = 18,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block ml-1 align-middle flex-shrink-0 ${className}`}
    aria-hidden
  >
    <path
      d="M8 4l3 3H5l3-3z"
      fill="currentColor"
    />
    <path
      d="M8 12l-3-3h6l-3 3z"
      fill="currentColor"
    />
  </svg>
);

export default SortArrowsIcon;
