"use client";
import React, { useEffect, useState } from "react";

interface CongratulationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
}

const CongratulationsModal: React.FC<CongratulationsModalProps> = ({
  isOpen,
  onClose,
  userName,
}) => {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowConfetti(true);
      // Hide confetti after animation
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4">
      {/* Confetti Animation */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-10%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${3 + Math.random() * 2}s`,
              }}
            >
              <div
                className="w-3 h-3 rounded-sm"
                style={{
                  backgroundColor: ['#1D8751', '#FFD700', '#2ECC71', '#00FF00', '#FF6B6B'][Math.floor(Math.random() * 5)],
                  transform: `rotate(${Math.random() * 360}deg)`,
                }}
              />
            </div>
          ))}
        </div>
      )}

      <div
        className="bg-white dark:bg-[var(--card-color)] rounded-3xl p-6 sm:p-8 w-full max-w-md text-center shadow-2xl animate-bounce-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Success Icon */}
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#1D8751] to-[#2ECC71] flex items-center justify-center shadow-lg animate-pulse">
          <svg
            className="w-10 h-10 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        {/* Title */}
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-3">
          🎉 Congratulations!
        </h2>

        {/* Message */}
        <p className="text-gray-600 dark:text-gray-300 mb-2 text-lg">
          {userName ? `Hello ${userName},` : "Hello,"}
        </p>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Your account has been verified successfully! You now have full access to all OMAYA.io features including deposits, withdrawals, and trading.
        </p>

        {/* Features unlocked */}
        <div className="bg-gray-50 dark:bg-[#35353E] rounded-xl p-4 mb-6">
          <p className="text-sm font-semibold text-[#1D8751] mb-3">Features Unlocked:</p>
          <div className="grid grid-cols-2 gap-2 text-sm text-gray-700 dark:text-gray-300">
            <div className="flex items-center gap-2">
              <span className="text-[#1D8751]">✓</span> Crypto Exchange
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#1D8751]">✓</span> Money X
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#1D8751]">✓</span> P2P Trading
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#1D8751]">✓</span> Withdrawals
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <button
          onClick={onClose}
          className="w-full py-3 bg-gradient-to-r from-[#1D8751] to-[#2ECC71] text-white font-semibold rounded-xl hover:opacity-90 transition-opacity shadow-lg"
        >
          Start Trading
        </button>
      </div>

      {/* Add CSS animations */}
      <style jsx>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        
        @keyframes bounce-in {
          0% {
            transform: scale(0.5);
            opacity: 0;
          }
          50% {
            transform: scale(1.05);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        
        .animate-confetti {
          animation: confetti-fall linear forwards;
        }
        
        .animate-bounce-in {
          animation: bounce-in 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default CongratulationsModal;
