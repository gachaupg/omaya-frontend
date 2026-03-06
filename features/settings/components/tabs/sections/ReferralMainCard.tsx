// src/features/p2p/components/ui/referral/sections/ReferralMainCard.tsx
"use client";

import React, { useState } from "react";
import { QrCode, X } from "lucide-react";
import QRCode from "qrcode";

import Button from "@/components/ui/Button";
import CopyButton from "@/components/ui/CopyButton";
import { DonutChartWithCenter } from "@/components/ui/DonutChartWithCenter";
import { formatCurrency } from "@/lib/globalFormatter";

interface Props {
  user: any;
  walletData: any;
  walletLoading: boolean;
  walletError: any;
  setShowWithdrawPage: (v: boolean) => void;
}

const ReferralMainCard: React.FC<Props> = ({
  user,
  walletData,
  walletLoading,
  walletError,
  setShowWithdrawPage,
}) => {
  /* ───────────── state ───────────── */
  const [showQRCode, setShowQRCode] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");

  /* ───────────── helpers ───────────── */
  const deposits = walletData?.total_earned ?? 0;
  const withdrawals = walletData?.total_withdrawn ?? 0;
  const balance = walletData?.balance ?? 0;
  const commissions = walletData?.total_commissions ?? balance; // Use total_commissions if available
  const total = deposits + withdrawals;

  const chartData =
    total === 0
      ? []
      : [
          { label: "Income from deposits", value: deposits, color: "#1D8751" },
          {
            label: "Income from withdrawals",
            value: withdrawals,
            color: "#EF4444",
          },
        ];

  const referralCode = user?.referral_code || "123456789";

  /* ───────────── generate QR code ───────────── */
  const generateQRCode = async (code: string) => {
    try {
      const qrDataUrl = await QRCode.toDataURL(code, {
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
    }
  };

  /* ───────────── handle QR icon click ───────────── */
  const handleQRCodeClick = () => {
    if (!showQRCode) {
      generateQRCode(referralCode);
    }
    setShowQRCode(!showQRCode);
  };

  /* ───────────── render ───────────── */
  return (
    <>
      {/* Referral Code QR Modal - on top of items */}
      {showQRCode && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowQRCode(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[#0B0F23]">
                Referral Code QR
              </h3>
              <button
                onClick={() => setShowQRCode(false)}
                className="text-[#4C526A] hover:text-[#0B0F23] transition-colors"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
            {qrCodeDataUrl ? (
              <div className="flex flex-col items-center">
                <div className="bg-white p-4 rounded-lg border border-[#E2E8F0] mb-4">
                  <img
                    src={qrCodeDataUrl}
                    alt="Referral Code QR Code"
                    className="w-64 h-64"
                  />
                </div>
                <p className="text-sm text-[#4C526A] text-center mb-2">
                  Scan this QR code to share your referral code
                </p>
                <p className="text-xs text-[#4C526A] text-center font-mono">
                  {referralCode}
                </p>
              </div>
            ) : (
              <div className="flex items-center justify-center py-8">
                <p className="text-sm text-[#4C526A]">
                  Generating QR code...
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Single Card containing both sections */}
      <div
        className="w-full rounded-[26px] border border-[#E2E8F0] dark:border-[#35353e] bg-white dark:bg-[#1A1A1F] p-5 text-[#0B0F23] dark:text-white"
      >
        <div className="flex flex-col gap-6 lg:flex-row lg:items-stretch">
          {/* ───────── left column ───────── */}
          <div className="flex-1 flex flex-col justify-between gap-6">
            <div className="space-y-4 text-sm leading-6 text-[#4C526A] dark:text-[#A3AED0]">
              <p>
                Earn lifetime commissions whenever traders you invite close a deal. Share your code, let them complete their first order, and the platform automatically adds your percentage to this wallet.
              </p>
              <p>
                Withdraw whenever you're ready—no need to track spreadsheets or manual payouts. Everything syncs in real time so you can focus on growing your network.
              </p>
            </div>

            <Button
              variant="primary"
              size="lg"
              onClick={() => setShowWithdrawPage(true)}
              className="w-full sm:w-auto px-10 h-[48px] bg-[#FF5E5B] hover:bg-[#ff4946]
                         rounded-[999px]
                         text-white font-semibold tracking-wide flex items-center justify-center gap-2"
            >
              <img
                src="https://res.cloudinary.com/pitz/image/upload/v1763908134/Group_3_ocyc3p.png"
                alt="Withdraw icon"
                width={22}
                height={22}
                className="flex-shrink-0"
              />
              Withdraw
            </Button>
          </div>

          {/* ───────── right column (chart) ───────── */}
          <div className="flex-1 flex items-center justify-center">
            {walletError && (
              <p className="text-center text-red-400">Failed to load wallet data</p>
            )}

            {walletLoading && !walletError && (
              <p className="text-center text-[#8C92B2]">Loading…</p>
            )}

            {!walletLoading && !walletError && (
              <div className="flex flex-col items-center w-full">
                <div className="flex flex-col items-center gap-4 mb-4">
                  <DonutChartWithCenter
                    data={chartData}
                    total={total}
                    label="Commissions"
                    centerValue={commissions}
                  />
                </div>
                <div className="flex flex-col gap-3 mt-2 w-full max-w-[280px]">
                  {chartData.map(({ label, value, color }) => (
                    <div
                      key={label}
                      className="flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span
                          className="w-3.5 h-3.5 rounded-full inline-flex flex-shrink-0"
                          style={{ background: color }}
                        />
                        <span className="text-sm text-[#4C526A] dark:text-[#E2E6FF] truncate">
                          {label}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-[#0B0F23] dark:text-white">
                        {formatCurrency(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mb-4 mt-10 space-y-6">
        {/* Referral Code Section */}
        <div>
          <div className="text-sm font-medium text-[#1D8751] mb-3">
            Your Referral Code
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div
              className="flex items-center gap-3 rounded-[28px] border border-[#1D8751]
                         bg-transparent px-4 py-3 min-w-[260px] flex-1 w-full"
            >
              <span className="w-3 h-3 rounded-full bg-[#1D8751] flex-shrink-0" />
              <span className="font-mono text-sm sm:text-base tracking-[0.4em] text-[#1D8751] uppercase truncate flex-1">
                {referralCode}
              </span>
              <button
                onClick={handleQRCodeClick}
                className="flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                aria-label="Show QR Code"
              >
                <QrCode size={18} className="text-[#1D8751]" strokeWidth={2} />
              </button>
            </div>
            <CopyButton
              value={user?.referral_code ?? ""}
              className="bg-gray-200 dark:bg-[#1A1A1F] text-[#1D8751] font-semibold border border-[#E2E8F0] dark:border-[#35353e]
                         hover:opacity-80 rounded-[999px] px-4 py-3 text-sm transition-opacity flex-shrink-0"
              showIcon={true}
            >
              Copy
            </CopyButton>
          </div>
        </div>

        {/* Referral Link Section */}
        <div>
          <div className="text-sm font-medium text-[#1D8751] mb-3">
            Your Referral Link
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div
              className="flex items-center gap-3 rounded-[28px] border border-[#1D8751]
                         bg-transparent px-4 py-3 min-w-[260px] flex-1 w-full"
            >
              <span className="w-3 h-3 rounded-full bg-[#1D8751] flex-shrink-0" />
              <span className="text-sm sm:text-base text-[#1D8751] truncate flex-1">
                {typeof window !== 'undefined' ? `${window.location.origin}/auth/register?ref=${referralCode}` : `https://omaya.io/auth/register?ref=${referralCode}`}
              </span>
            </div>
            <div className="flex gap-2">
              <CopyButton
                value={typeof window !== 'undefined' ? `${window.location.origin}/auth/register?ref=${referralCode}` : `https://omaya.io/auth/register?ref=${referralCode}`}
                className="bg-gray-200 dark:bg-[#1A1A1F] text-[#1D8751] font-semibold border border-[#E2E8F0] dark:border-[#35353e]
                           hover:opacity-80 rounded-[999px] px-4 py-3 text-sm transition-opacity flex-shrink-0"
                showIcon={true}
              >
                Copy
              </CopyButton>
              <button
                onClick={() => {
                  const referralLink = typeof window !== 'undefined' ? `${window.location.origin}/auth/register?ref=${referralCode}` : `https://omaya.io/auth/register?ref=${referralCode}`;
                  if (navigator.share) {
                    navigator.share({
                      title: 'Join OMAYA.io',
                      text: 'Sign up on OMAYA.io using my referral link and start trading crypto!',
                      url: referralLink,
                    }).catch(() => {});
                  } else {
                    // Fallback: copy to clipboard
                    navigator.clipboard.writeText(referralLink);
                    alert('Link copied to clipboard! Share it with your friends.');
                  }
                }}
                className="bg-[#1D8751] text-white font-semibold border border-[#1D8751]
                           hover:bg-[#166b3e] rounded-[999px] px-4 py-3 text-sm transition-colors flex-shrink-0 flex items-center gap-2"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="18" cy="5" r="3"/>
                  <circle cx="6" cy="12" r="3"/>
                  <circle cx="18" cy="19" r="3"/>
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                </svg>
                Share
              </button>
            </div>
          </div>
        </div>
      </div>

    </>
  );
};

export default ReferralMainCard;
