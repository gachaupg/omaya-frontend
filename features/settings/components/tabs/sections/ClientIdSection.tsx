import React, { useState } from "react";
import { showToast } from "@/lib/utils/toast";
import QRCode from "qrcode";
import { X } from "lucide-react";

interface ClientIdSectionProps {
  user: any;
}

const ClientIdSection: React.FC<ClientIdSectionProps> = ({ user }) => {
  const [copied, setCopied] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [qrCodeError, setQrCodeError] = useState(false);

  const handleCopy = () => {
    if (user?.user_id) {
      navigator.clipboard.writeText(user.user_id);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      showToast.success("Copied to clipboard");
    }
  };

  /* ───────────── generate QR code ───────────── */
  const generateQRCode = async (id: string) => {
    try {
      setQrCodeError(false);
      // Ensure we have a valid non-empty string
      const validId = String(id || "").trim();
      if (!validId) {
        throw new Error("Invalid or empty user ID");
      }
      
      const qrDataUrl = await QRCode.toDataURL(validId, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      setQrCodeDataUrl(qrDataUrl);
    } catch (error) {
      console.error("Error generating QR code:", error);
      setQrCodeError(true);
      setQrCodeDataUrl("");
    }
  };

  /* ───────────── handle QR icon click ───────────── */
  const handleQRCodeClick = () => {
    if (!showQRCode) {
      const userId = user?.user_id || "";
      if (userId) {
        generateQRCode(userId);
      } else {
        setQrCodeError(true);
      }
    }
    setShowQRCode(!showQRCode);
  };

  return (
    <>
      <div className="text-sm font-bold dark:text-white text-gray-900 mb-1">
        Client ID
      </div>
      <section className="dark:bg-[var(--card-color)] bg-white rounded-xl border border-[#E8EFF5] dark:border-[#35353E] w-full relative">
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
            </div>
            <button
              type="button"
              onClick={handleQRCodeClick}
              className="flex items-center justify-center gap-1 px-3 py-2 rounded-xl dark:bg-[var(--card-color)] bg-gray-200 text-[#1D8751] font-semibold hover:bg-[#1D8751] hover:text-white transition text-sm whitespace-nowrap flex-shrink-0"
              title="Show QR Code"
            >
              <span>QR</span>
              <svg
                width="14"
                height="14"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
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
            </button>
            <button
              className={`flex items-center justify-center gap-1 px-3 py-2 rounded-xl dark:bg-[var(--card-color)] bg-gray-200 text-[#1D8751] font-semibold hover:bg-[#1D8751] hover:text-white transition text-sm whitespace-nowrap flex-shrink-0 ${copied ? "bg-[#1D8751] text-white" : ""
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

      {/* QR Code Modal - Positioned on top of items */}
      {showQRCode && (
        <div 
          className="absolute inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setShowQRCode(false)}
        >
          <div
            className="bg-white dark:bg-[#1A1A1F] rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-[#E2E8F0] dark:border-[#35353e]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[#0B0F23] dark:text-white">
                Client ID QR Code
              </h3>
              <button
                onClick={() => setShowQRCode(false)}
                className="text-[#4C526A] dark:text-[#A3AED0] hover:text-[#0B0F23] dark:hover:text-white transition-colors"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
            {qrCodeError ? (
              <div className="flex flex-col items-center">
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800 mb-4">
                  <p className="text-sm text-red-600 dark:text-red-400 text-center">
                    Failed to generate QR code
                  </p>
                </div>
                <p className="text-sm text-[#4C526A] dark:text-[#A3AED0] text-center mb-2">
                  Your Client ID:
                </p>
                <p className="text-xs text-[#4C526A] dark:text-[#A3AED0] text-center font-mono break-all bg-gray-100 dark:bg-[#2A2A2F] p-3 rounded-lg">
                  {user?.user_id || ""}
                </p>
              </div>
            ) : qrCodeDataUrl ? (
              <div className="flex flex-col items-center">
                <div className="bg-white p-4 rounded-lg border border-[#E2E8F0] dark:border-[#35353e] mb-4">
                  <img
                    src={qrCodeDataUrl}
                    alt="Client ID QR Code"
                    className="w-64 h-64"
                  />
                </div>
                <p className="text-sm text-[#4C526A] dark:text-[#A3AED0] text-center mb-2">
                  Scan this QR code to see your Client ID
                </p>
                <p className="text-xs text-[#4C526A] dark:text-[#A3AED0] text-center font-mono break-all">
                  {user?.user_id || ""}
                </p>
              </div>
            ) : (
              <div className="flex items-center justify-center py-8">
                <p className="text-sm text-[#4C526A] dark:text-[#A3AED0]">
                  Generating QR code...
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default ClientIdSection;
