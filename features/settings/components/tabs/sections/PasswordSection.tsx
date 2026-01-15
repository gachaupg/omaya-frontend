import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  sendPasswordResetOTP,
  verifyPasswordResetOTP,
  changePasswordWithOTP,
} from "@/features/settings/slices/settingsSlice";
import { RootState, AppDispatch } from "@/store/rootReducer";
import { showToast } from "@/lib/utils/toast";

interface PasswordChangeRequest {
  new_password: string;
  confirm_password: string;
}

const PasswordSection: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { error } = useSelector(
    (state: RootState) => state.settings
  );
  
  // Local success state for password section only
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  
  // Local loading states for password section only
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  
  // Track backend error separately to prioritize it
  const [backendError, setBackendError] = useState<string | null>(null);

  const [formData, setFormData] = useState<PasswordChangeRequest>({
    new_password: "",
    confirm_password: "",
  });
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [maskedEmail, setMaskedEmail] = useState<string | null>(null);
  const [showPasswords, setShowPasswords] = useState({
    new: false,
    confirm: false,
  });
  const [errors, setErrors] = useState<Partial<PasswordChangeRequest & { otp: string }>>({});

  const handleInputChange = (
    field: keyof PasswordChangeRequest,
    value: string
  ) => {
    setFormData((prev: PasswordChangeRequest) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing (including backend error)
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }
    // Clear backend error when user starts typing
    if (backendError) {
      setBackendError(null);
    }
  };

  const handleOtpChange = (value: string) => {
    // Only allow numeric input and limit to 6 digits
    const numericValue = value.replace(/\D/g, "").slice(0, 6);
    setOtp(numericValue);
    if (errors.otp) {
      setErrors((prev) => ({
        ...prev,
        otp: undefined,
      }));
    }
  };

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords((prev: typeof showPasswords) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const validatePasswordForm = (): boolean => {
    // Don't show local validation errors if there's a backend error
    if (backendError) {
      return false;
    }
    
    const newErrors: Partial<PasswordChangeRequest> = {};

    if (!formData.new_password) {
      newErrors.new_password = "New password is required";
    } else if (formData.new_password.length < 8) {
      newErrors.new_password = "Password must be at least 8 characters";
    }

    if (!formData.confirm_password) {
      newErrors.confirm_password = "Please confirm your password";
    } else if (formData.new_password !== formData.confirm_password) {
      newErrors.confirm_password = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateOtp = (): boolean => {
    if (!otp) {
      setErrors((prev) => ({ ...prev, otp: "OTP is required" }));
      return false;
    }
    if (otp.length !== 6) {
      setErrors((prev) => ({ ...prev, otp: "OTP must be 6 digits" }));
      return false;
    }
    return true;
  };

  const handleSendOTP = async () => {
    if (!validatePasswordForm()) return;

    try {
      setSendingOtp(true);
      const response = await dispatch(sendPasswordResetOTP()).unwrap();
      setOtpSent(true);
      setMaskedEmail(response.masked_email || null);
      showToast.success("OTP sent to your email");
    } catch (error: any) {
      // Error is handled by the slice and toast
      console.error("Send OTP error:", error);
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!validateOtp()) return;

    // Validate password form before verifying OTP (since we'll immediately change password)
    if (!validatePasswordForm()) {
      showToast.error("Please fill in all password fields correctly before verifying OTP");
      return;
    }

    try {
      setVerifyingOtp(true);
      // Step 1: Verify OTP
      await dispatch(verifyPasswordResetOTP(otp)).unwrap();
      setOtpVerified(true);

      // Step 2: Immediately change password after OTP verification
      try {
        await dispatch(
          changePasswordWithOTP({
            new_password: formData.new_password,
            confirm_password: formData.confirm_password,
          })
        ).unwrap();

        // Clear form on success
        setFormData({
          new_password: "",
          confirm_password: "",
        });
        setOtp("");
        setOtpSent(false);
        setOtpVerified(false);
        setMaskedEmail(null);
        setBackendError(null);
        setPasswordSuccess(true);
        setShowPasswords({
          new: false,
          confirm: false,
        });
      } catch (passwordError: any) {
        // Store backend error to display it in the UI
        const errorMessage = passwordError || "Failed to change password";
        setBackendError(errorMessage);
        // Also set it in the errors object for the new_password field
        setErrors((prev) => ({
          ...prev,
          new_password: errorMessage,
        }));
        // Don't reset OTP verified state since OTP was successfully verified
      }
    } catch (error: any) {
      // Error is handled by the slice and toast
      console.error("Verify OTP error:", error);
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleChangePassword = async () => {
    // Clear backend error when user tries again
    setBackendError(null);
    
    if (!validatePasswordForm()) return;

    if (!otpVerified) {
      showToast.error("Please verify OTP first");
      return;
    }

    try {
      await dispatch(
        changePasswordWithOTP({
          new_password: formData.new_password,
          confirm_password: formData.confirm_password,
        })
      ).unwrap();

      // Clear form on success
      setFormData({
        new_password: "",
        confirm_password: "",
      });
      setOtp("");
      setOtpSent(false);
      setOtpVerified(false);
      setMaskedEmail(null);
      setBackendError(null);
      setShowPasswords({
        new: false,
        confirm: false,
      });
    } catch (error: any) {
      // Store backend error to display it in the UI
      const errorMessage = error || "Failed to change password";
      setBackendError(errorMessage);
      // Also set it in the errors object for the new_password field
      setErrors((prev) => ({
        ...prev,
        new_password: errorMessage,
      }));
    }
  };

  // Clear errors when password change succeeds
  useEffect(() => {
    if (passwordSuccess) {
      setErrors({});
      setBackendError(null);
      // Reset success state after a delay
      const timer = setTimeout(() => {
        setPasswordSuccess(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [passwordSuccess]);
  
  // Clear backend error when Redux error changes (from other actions)
  useEffect(() => {
    if (error && error !== backendError) {
      // Only update if it's a different error (not already set)
      if (!backendError) {
        setBackendError(error);
        setErrors((prev) => ({
          ...prev,
          new_password: error,
        }));
      }
    }
  }, [error, backendError]);

  // Reset OTP state when form is cleared
  const handleReset = () => {
    setOtpSent(false);
    setOtpVerified(false);
    setOtp("");
    setMaskedEmail(null);
    setErrors({});
    setBackendError(null);
  };

  return (
    <>
      <div className="text-sm font-bold dark:text-white text-gray-900 mb-1">
        Password
      </div>

      <section className="dark:bg-card bg-card rounded-xl dark:border-[#35353E] border-[#E8EFF5] border p-3 sm:p-4">

        <div className="flex flex-col sm:grid sm:grid-cols-2 gap-2 sm:gap-3">

          <div>
            <label className="block text-xs dark:text-white text-[#051015] mb-1">
              Password*
            </label>

            <div className="flex items-center dark:bg-card bg-card rounded-[18px] px-3 sm:px-4 py-2 sm:py-2.5 border dark:border-[#35353E] border-[#E8EFF5]">

              <svg width="16" height="16" viewBox="0 0 24 24" stroke="#1D8751" fill="none">
                <rect x="3" y="11" width="18" height="8" rx="4" strokeWidth="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" strokeWidth="2" />
              </svg>

              <input
                type={showPasswords.new ? "text" : "password"}
                className="bg-transparent flex-1 min-w-0 ml-2 outline-none text-sm sm:text-base text-[#788099] dark:text-white"
                placeholder="Enter new password"
                value={formData.new_password}
                onChange={(e) => handleInputChange("new_password", e.target.value)}
                autoComplete="new-password"
              />

              <button
                type="button"
                onClick={() => togglePasswordVisibility("new")}
                className="dark:text-[#788099] text-gray-500 dark:hover:text-white hover:text-gray-700 transition-colors flex-shrink-0"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" stroke="currentColor" fill="none">
                  {showPasswords.new ? (
                    <path
                      d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22"
                      strokeWidth="2"
                    />
                  ) : (
                    <path
                      d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"
                      strokeWidth="2"
                    />
                  )}
                </svg>
              </button>
            </div>

            {errors.new_password && (
              <div className="text-red-500 text-xs mt-1">{errors.new_password}</div>
            )}
          </div>

          {/* CONFIRM PASSWORD */}
          <div>
            <label className="block text-xs dark:text-white text-[#051015] mb-1">
              Confirm password*
            </label>

            <div className="flex items-center dark:bg-card bg-card rounded-[18px] px-3 sm:px-4 py-2 sm:py-2.5 border dark:border-[#35353E] border-[#E8EFF5]">

              <svg width="16" height="16" viewBox="0 0 24 24" stroke="#1D8751" fill="none">
                <rect x="3" y="11" width="18" height="8" rx="4" strokeWidth="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" strokeWidth="2" />
              </svg>

              <input
                type={showPasswords.confirm ? "text" : "password"}
                className="bg-transparent flex-1 min-w-0 ml-2 outline-none text-sm sm:text-base text-[#788099] dark:text-white"
                placeholder="Confirm new password"
                value={formData.confirm_password}
                onChange={(e) => handleInputChange("confirm_password", e.target.value)}
                autoComplete="new-password"
              />

              <button
                type="button"
                onClick={() => togglePasswordVisibility("confirm")}
                className="dark:text-[#788099] text-gray-500 dark:hover:text-white hover:text-gray-700 transition-colors flex-shrink-0"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" stroke="currentColor" fill="none">
                  {showPasswords.confirm ? (
                    <path
                      d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22"
                      strokeWidth="2"
                    />
                  ) : (
                    <path
                      d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"
                      strokeWidth="2"
                    />
                  )}
                </svg>
              </button>
            </div>

            {errors.confirm_password && (
              <div className="text-red-500 text-xs mt-1">{errors.confirm_password}</div>
            )}
          </div>
        </div>

        {/* OTP Section */}
        {otpSent && (
          <div className="mb-3">
            <label className="block text-xs dark:text-white text-[#051015] mb-1">
              Enter OTP {maskedEmail && <span className="text-gray-500">(sent to {maskedEmail})</span>}
            </label>
            <div className="flex items-center dark:bg-[var(--card-color)] bg-gray-100 rounded-2xl px-3 sm:px-4 py-2 sm:py-2.5 border dark:border-[#35353E] border-gray-300">
              <svg width="16" height="16" viewBox="0 0 24 24" stroke="#1D8751" fill="none">
                <rect x="3" y="5" width="18" height="14" rx="2" strokeWidth="2" />
                <path d="M3 7l9 6 9-6" strokeWidth="2" />
              </svg>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                className="bg-transparent flex-1 min-w-0 ml-2 outline-none text-sm sm:text-base text-[#788099] dark:text-white tracking-widest text-center"
                placeholder="000000"
                value={otp}
                onChange={(e) => handleOtpChange(e.target.value)}
                disabled={otpVerified || verifyingOtp}
              />
            </div>
            {errors.otp && (
              <div className="text-red-500 text-xs mt-1">{errors.otp}</div>
            )}
            {otpVerified && (
              <div className="mt-2 text-xs text-green-600 dark:text-green-400 flex items-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="mr-1">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                  <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                OTP Verified & Password Changed
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-2">
          {!otpSent ? (
            <button
              className="w-full mt-2 py-2 sm:py-2.5 rounded-[18px] border border-[#1D8751] text-[#1D8751] hover:bg-[#1D8751] hover:text-white transition text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleSendOTP}
              disabled={sendingOtp}
            >
              {sendingOtp ? "Sending..." : "Send OTP"}
            </button>
          ) : !otpVerified ? (
            <button
              className="w-full py-2 sm:py-2.5 rounded-[18px] border border-[#1D8751] text-[#1D8751] hover:bg-[#1D8751] hover:text-white transition text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleVerifyOTP}
              disabled={verifyingOtp || otp.length !== 6}
            >
              {verifyingOtp ? "Verifying & Changing Password..." : "Verify OTP & Change Password"}
            </button>
          ) : (
            <div className="w-full py-2 sm:py-2.5 rounded-[18px] border border-green-500 bg-green-500/10 text-green-600 dark:text-green-400 text-sm sm:text-base text-center">
              ✓ Password Changed Successfully
            </div>
          )}
          
          {otpSent && !otpVerified && (
            <button
              className="w-full py-2 sm:py-2.5 rounded-[18px] border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition text-sm sm:text-base"
              onClick={handleReset}
              disabled={sendingOtp || verifyingOtp}
            >
              Reset
            </button>
          )}
        </div>

      </section>

    </>
  );
};

export default PasswordSection;
