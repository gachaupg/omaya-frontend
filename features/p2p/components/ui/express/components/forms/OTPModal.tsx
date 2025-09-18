import React, { useState, useRef, useEffect } from 'react';

interface OTPModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerify: (otp: string) => void;
  onResend: () => void;
  isLoading?: boolean;
  error?: string;
}

const OTPModal: React.FC<OTPModalProps> = ({
  isOpen,
  onClose,
  onVerify,
  onResend,
  isLoading = false,
  error = ''
}) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Timer effect
  useEffect(() => {
    if (!isOpen || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, timeLeft]);

  // Reset OTP when modal opens
  useEffect(() => {
    if (isOpen) {
      setOtp(['', '', '', '', '', '']);
      setTimeLeft(300);
      // Focus first input
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    }
  }, [isOpen]);

  const handleInputChange = (index: number, value: string) => {
    if (value.length > 1) return; // Only allow single digit
    if (!/^\d*$/.test(value)) return; // Only allow numbers

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = pastedData.split('').concat(['', '', '', '', '', '']).slice(0, 6);
    setOtp(newOtp);

    // Focus the next empty input or the last one
    const nextEmptyIndex = newOtp.findIndex(digit => !digit);
    const focusIndex = nextEmptyIndex === -1 ? 5 : nextEmptyIndex;
    inputRefs.current[focusIndex]?.focus();
  };

  const handleVerify = () => {
    const otpString = otp.join('');
    if (otpString.length === 6) {
      onVerify(otpString);
    }
  };

  const handleResend = () => {
    setTimeLeft(300);
    setOtp(['', '', '', '', '', '']);
    onResend();
    inputRefs.current[0]?.focus();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isOtpComplete = otp.every(digit => digit !== '');
  const isExpired = timeLeft <= 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[#1D1D23] rounded-3xl p-8 max-w-md w-full mx-4 text-center shadow-2xl border border-[#39394a]">
        {/* Header */}
        <div className="mb-6">
          <div className="w-16 h-16 bg-[#1D8751] rounded-full flex items-center justify-center mx-auto mb-4">
            <svg width="32" height="32" fill="none" viewBox="0 0 24 24">
              <path
                d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M9 12l2 2 4-4"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h2 className="text-white text-2xl font-semibold mb-2">
            Verify Your Withdrawal
          </h2>
          <p className="text-[#788099] text-sm">
            Enter the 6-digit verification code sent to your registered email/phone
          </p>
        </div>

        {/* OTP Input */}
        <div className="mb-6">
          <div className="flex justify-center gap-3 mb-4">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={el => {
                  inputRefs.current[index] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handleInputChange(index, e.target.value)}
                onKeyDown={e => handleKeyDown(index, e)}
                onPaste={handlePaste}
                className="w-12 h-12 text-center text-xl font-semibold bg-[#2A2A2A] border-2 border-[#39394a] rounded-xl text-white focus:border-[#1D8751] focus:outline-none transition-colors"
                disabled={isLoading || isExpired}
              />
            ))}
          </div>

          {/* Timer */}
          <div className="mb-4">
            {isExpired ? (
              <p className="text-red-500 text-sm">Code expired</p>
            ) : (
              <p className="text-[#788099] text-sm">
                Code expires in: <span className="text-[#1D8751] font-medium">{formatTime(timeLeft)}</span>
              </p>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleVerify}
            disabled={!isOtpComplete || isLoading || isExpired}
            className="w-full bg-[#1D8751] text-white py-3 rounded-2xl text-lg font-medium hover:bg-[#166741] disabled:bg-[#39394a] disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Verifying...
              </div>
            ) : (
              'Verify OTP'
            )}
          </button>

          <div className="flex items-center justify-between text-sm">
            <span className="text-[#788099]">Didn't receive code?</span>
            <button
              onClick={handleResend}
              disabled={isLoading || (!isExpired && timeLeft > 240)} // Allow resend only after 1 minute or if expired
              className="text-[#1D8751] hover:underline disabled:text-[#39394a] disabled:cursor-not-allowed"
            >
              Resend Code
            </button>
          </div>

          <button
            onClick={onClose}
            disabled={isLoading}
            className="w-full bg-transparent border border-[#39394a] text-[#788099] py-3 rounded-2xl text-lg font-medium hover:bg-[#39394a]/20 disabled:cursor-not-allowed transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default OTPModal;
