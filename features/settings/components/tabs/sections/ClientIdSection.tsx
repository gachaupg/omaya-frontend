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
      <div className="text-base font-semibold dark:text-[#788099] text-gray-600 mb-0">
        1-Client ID
      </div>
      <section className="dark:bg-[#1D1D23] bg-gray-50 rounded-xl dark:border-[#35353E] border-gray-300 border-2 p-3 shadow-lg">
        <div className="text-base font-semibold dark:text-white text-[#0D0D0D]">
          Client ID
        </div>
        <section className="dark:bg-[#18181D] bg-[#F5F5F5] rounded-xl border dark:border-[#35353E] border-gray-300 p-3 shadow-lg">
          <label className="dark:text-[#fff] text-gray-700 text-xs mb-1 block">
            Your unique ID
          </label>
          <div className="flex items-center gap-2">
            <div className="flex flex-1 items-center border border-[#1D8751] rounded-xl px-3 py-2 bg-transparent">
              <span className="w-3 h-3 rounded-full bg-[#1D8751] inline-block mr-2"></span>
              <span className="text-[#1D8751] text-sm font-semibold mr-2">
                {user?.user_id || ""}
              </span>
              <span className="ml-auto">
                {/* QR icon */}
                <svg
                  width="16"
                  height="16"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="#1D8751"
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
              className={`flex items-center gap-1 px-3 py-2 rounded-xl dark:bg-[#23232B] bg-gray-200 text-[#1D8751] font-semibold hover:bg-[#1D8751] hover:text-white transition text-sm ${
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
        </section>
      </section>
    </>
  );
};

export default ClientIdSection;
