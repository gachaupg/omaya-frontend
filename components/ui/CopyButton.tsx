import React, { useState } from "react";
import { showToast } from "@/lib/utils/toast";

interface CopyButtonProps {
  value: string;
  className?: string;
  children?: React.ReactNode;
  showIcon?: boolean;
  showInlineMessage?: boolean;
}

const CopyButton: React.FC<CopyButtonProps> = ({
  value,
  className = "",
  children,
  showIcon = true,
  showInlineMessage = true,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!value) return;

    navigator.clipboard.writeText(value);
    setCopied(true);
    
    // Only show toast if inline message is disabled
    if (!showInlineMessage) {
      showToast.success("Copied to clipboard");
    }
    
    // Reset copied state after 2 seconds
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className={`flex items-center gap-2 relative ${className}`}
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
      )}
      {/* Inline copied message */}
      {showInlineMessage && copied && (
        <span className="text-xs text-[#1D8751] font-medium animate-fade-in whitespace-nowrap">
          Copied!
        </span>
      )}
    </button>
  );
};

export default CopyButton;
