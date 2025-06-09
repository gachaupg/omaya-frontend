import React from "react";

interface LoaderProps {
  size?: "sm" | "md" | "lg";
  color?: string;
  className?: string;
  text?: string;
  textColor?: string;
  showText?: boolean;
  fullPage?: boolean;
}

const Loader: React.FC<LoaderProps> = ({
  size = "md",
  color = "#1D8751",
  className = "",
  text = "Loading data...",
  textColor = "#788099",
  showText = false,
  fullPage = false,
}) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  const containerClasses = fullPage
    ? "fixed inset-0 flex items-center justify-center bg-black/50 z-50"
    : "flex items-center justify-center";

  return (
    <div className={`${containerClasses} ${className}`}>
      <div className="flex flex-col items-center">
        <div
          className={`${sizeClasses[size]} animate-spin rounded-full border-4 border-t-transparent`}
          style={{ borderColor: `${color} transparent ${color} ${color}` }}
        />
        {showText && (
          <p className="mt-2 text-sm" style={{ color: textColor }}>
            {text}
          </p>
        )}
      </div>
    </div>
  );
};

export default Loader;
