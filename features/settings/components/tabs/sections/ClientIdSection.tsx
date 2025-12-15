import React, { useState } from "react";
import { showToast } from "@/lib/utils/toast";

interface ClientIdSectionProps {
  user: any;
}

const ClientIdSection: React.FC<ClientIdSectionProps> = ({ user }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (user?.user_id) {
      navigator.clipboard.writeText(user.user_id);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      showToast.success("Copied to clipboard");
    }
  };

  return (
    <>
      <div className="text-base font-bold dark:text-white text-gray-900 mb-0">
        Client ID
      </div>
      <section className="dark:bg-[var(--card-color)] bg-white rounded-xl border border-[#E8EFF5] dark:border-[#35353E] w-full">
        <div className="p-4 sm:p-6">
          <label className="dark:text-[#fff] text-gray-700 text-xs mb-1 block">
            Your unique ID
          </label>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="flex flex-1 items-center border border-[#1D8751] rounded-full px-2 sm:px-3 py-2 bg-transparent min-w-0">
              <span className="w-3 h-3 rounded-full bg-[#1D8751] inline-block mr-2 flex-shrink-0"></span>
              <span className="text-[#1D8751] text-xs sm:text-sm font-semibold truncate min-w-0">
                {user?.user_id || ""}
              </span>
              <span className="ml-auto flex-shrink-0">
                {/* QR icon */}
                <svg
                  width="16"
                  height="16"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="#1D8751"
                  className="flex-shrink-0"
                >
                  <rect
                    x="3"
                    y="3"
                    width="6"
                    height="6"
                    rx="1.5"
                    strokeWidth="2"
                  />
                  <rect
                    x="15"
                    y="3"
                    width="6"
                    height="6"
                    rx="1.5"
                    strokeWidth="2"
                  />
                  <rect
                    x="3"
                    y="15"
                    width="6"
                    height="6"
                    rx="1.5"
                    strokeWidth="2"
                  />
                  <rect
                    x="15"
                    y="15"
                    width="2"
                    height="2"
                    rx="1"
                    strokeWidth="2"
                  />
                  <rect
                    x="19"
                    y="19"
                    width="2"
                    height="2"
                    rx="1"
                    strokeWidth="2"
                  />
                </svg>
              </span>
            </div>
            <button
              className={`flex items-center justify-center gap-1 px-3 py-2 rounded-xl dark:bg-[var(--card-color)] bg-gray-200 text-[#1D8751] font-semibold hover:bg-[#1D8751] hover:text-white transition text-sm whitespace-nowrap flex-shrink-0 ${
                copied ? "bg-[#1D8751] text-white" : ""
              }`}
              onClick={handleCopy}
              type="button"
            >
              <span>{copied ? "Copied!" : "Copy"}</span>
              {/* Copy icon */}
              <svg
                width="14"
                height="14"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                className="flex-shrink-0"
              >
                <rect
                  x="9"
                  y="9"
                  width="13"
                  height="13"
                  rx="2"
                  strokeWidth="2"
                />
                <rect
                  x="2"
                  y="2"
                  width="13"
                  height="13"
                  rx="2"
                  strokeWidth="2"
                />
              </svg>
            </button>
          </div>
        </div>
      </section>
    </>
  );
};

export default ClientIdSection;
