import React, { useState } from "react";

interface CopyButtonProps {
  value: string;
  className?: string;
  children?: React.ReactNode;
  showIcon?: boolean;
}

const CopyButton: React.FC<CopyButtonProps> = ({
  value,
  className = "",
  children,
  showIcon = true,
}) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    if (!value) return;

    navigator.clipboard.writeText(value);
    setIsCopied(true);

    // Reset the "Copied" state after 2 seconds
    setTimeout(() => {
      setIsCopied(false);
    }, 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className={`flex items-center gap-2 ${className}`}
      type="button"
    >
      {children}
      {isCopied ? (
        <span className="text-sm font-medium">Copied</span>
      ) : showIcon ? (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <rect x="9" y="9" width="13" height="13" rx="2" />
          <rect x="3" y="3" width="13" height="13" rx="2" />
        </svg>
      ) : null}
    </button>
  );
};

export default CopyButton;
