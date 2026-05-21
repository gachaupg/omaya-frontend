import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  sendPasswordResetOTP,
  verifyPasswordResetOTP,
  changePasswordWithOTP,
  clearError,
} from "@/features/settings/slices/settingsSlice";
import { RootState, AppDispatch } from "@/store/rootReducer";
import { PasswordChangeRequest } from "@/features/settings/types";
import { Lock, Eye, EyeOff, Mail, CheckCircle2 } from "lucide-react";

const PasswordSection: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { updating } = useSelector((state: RootState) => state.settings);

  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const submitInFlightRef = useRef(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionInfo, setActionInfo] = useState<string | null>(null);

  const [formData, setFormData] = useState<PasswordChangeRequest>({
    old_password: "",
    new_password: "",
  });
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [maskedEmail, setMaskedEmail] = useState<string | null>(null);
  const [showPasswords, setShowPasswords] = useState({
    old: false,
    new: false,
  });
  const [errors, setErrors] = useState<Partial<PasswordChangeRequest & { otp: string }>>({});

  const clearActionMessages = () => {
    setActionError(null);
    setActionInfo(null);
  };

  const handleInputChange = (field: keyof PasswordChangeRequest, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    clearActionMessages();
    dispatch(clearError());
  };

  const handleOtpChange = (value: string) => {
    const numericValue = value.replace(/\D/g, "").slice(0, 6);
    setOtp(numericValue);
    if (errors.otp) {
      setErrors((prev) => ({ ...prev, otp: undefined }));
    }
    clearActionMessages();
  };

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const showActionError = (message: string) => {
    setActionError(message);
    setActionInfo(null);
    const lower = message.toLowerCase();
    if (lower.includes("otp")) {
      setErrors((prev) => ({ ...prev, otp: message }));
    }
  };

  const validatePasswordForm = (): boolean => {
    const newErrors: Partial<PasswordChangeRequest> = {};

    if (!formData.old_password) {
      newErrors.old_password = "Current password is required";
    }

    if (!formData.new_password) {
      newErrors.new_password = "New password is required";
    } else if (formData.new_password.length < 8) {
      newErrors.new_password = "Password must be at least 8 characters";
    } else if (!/(?=.*[a-zA-Z])(?=.*[0-9])/.test(formData.new_password)) {
      newErrors.new_password = "Password must contain both letters and numbers";
    } else if (
      formData.old_password &&
      formData.old_password === formData.new_password
    ) {
      newErrors.new_password = "New password must be different from current password";
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      const firstMessage = Object.values(newErrors)[0];
      if (firstMessage) setActionError(firstMessage);
      return false;
    }
    return true;
  };

  const validateOtp = (): boolean => {
    if (!otp) {
      setErrors((prev) => ({ ...prev, otp: "OTP is required" }));
      setActionError("OTP is required");
      return false;
    }
    if (otp.length !== 6) {
      setErrors((prev) => ({ ...prev, otp: "OTP must be 6 digits" }));
      setActionError("OTP must be 6 digits");
      return false;
    }
    return true;
  };

  const resetOtpFlow = () => {
    setOtpSent(false);
    setOtpVerified(false);
    setOtp("");
    setMaskedEmail(null);
    setErrors({});
    clearActionMessages();
    dispatch(clearError());
  };

  const handlePasswordChangeFailed = (errorMessage: string) => {
    showActionError(errorMessage);
    setOtpVerified(false);
    setOtp("");
    dispatch(clearError());
  };

  const handleSendOTP = async () => {
    if (sendingOtp || submitInFlightRef.current) return;
    clearActionMessages();
    if (!validatePasswordForm()) return;

    submitInFlightRef.current = true;
    setSendingOtp(true);

    try {
      const response = await dispatch(
        sendPasswordResetOTP({
          old_password: formData.old_password,
          new_password: formData.new_password,
        })
      ).unwrap();
      setOtpSent(true);
      setMaskedEmail(response.masked_email || null);
      setErrors((prev) => ({ ...prev, otp: undefined }));
      setOtp("");
      setActionInfo(
        response.masked_email
          ? `OTP sent to ${response.masked_email}`
          : "OTP sent to your email"
      );
    } catch (sendError: unknown) {
      const errorMessage =
        typeof sendError === "string" ? sendError : "Failed to send OTP";
      showActionError(errorMessage);
      dispatch(clearError());
    } finally {
      submitInFlightRef.current = false;
      setSendingOtp(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (verifyingOtp || submitInFlightRef.current || updating) return;
    clearActionMessages();
    if (!validateOtp()) return;
    if (!validatePasswordForm()) return;

    submitInFlightRef.current = true;
    setVerifyingOtp(true);

    try {
      await dispatch(
        verifyPasswordResetOTP({
          otp,
          old_password: formData.old_password,
          new_password: formData.new_password,
        })
      ).unwrap();
      setOtpVerified(true);
      clearActionMessages();

      try {
        await dispatch(
          changePasswordWithOTP({
            old_password: formData.old_password,
            new_password: formData.new_password,
          })
        ).unwrap();

        setFormData({ old_password: "", new_password: "" });
        setOtp("");
        resetOtpFlow();
        setPasswordSuccess(true);
        setShowPasswords({ old: false, new: false });
      } catch (passwordError: unknown) {
        const errorMessage =
          typeof passwordError === "string"
            ? passwordError
            : "Failed to change password";
        handlePasswordChangeFailed(errorMessage);
      }
    } catch (verifyError: unknown) {
      const errorMessage =
        typeof verifyError === "string" ? verifyError : "Invalid OTP. Please try again.";
      showActionError(errorMessage);
      dispatch(clearError());
      setOtp("");
      setOtpVerified(false);
    } finally {
      submitInFlightRef.current = false;
      setVerifyingOtp(false);
    }
  };

  const handleChangePassword = async () => {
    if (submitInFlightRef.current || updating || verifyingOtp) return;
    clearActionMessages();
    dispatch(clearError());
    if (!validatePasswordForm()) return;

    if (!otpVerified) {
      setActionError("Please verify OTP first");
      return;
    }

    submitInFlightRef.current = true;

    try {
      await dispatch(
        changePasswordWithOTP({
          old_password: formData.old_password,
          new_password: formData.new_password,
        })
      ).unwrap();

      setFormData({ old_password: "", new_password: "" });
      resetOtpFlow();
      setPasswordSuccess(true);
      setShowPasswords({ old: false, new: false });
    } catch (changeError: unknown) {
      const errorMessage =
        typeof changeError === "string" ? changeError : "Failed to change password";
      handlePasswordChangeFailed(errorMessage);
    } finally {
      submitInFlightRef.current = false;
    }
  };

  const handleReset = () => {
    resetOtpFlow();
  };

  useEffect(() => {
    if (passwordSuccess) {
      setErrors({});
      clearActionMessages();
      dispatch(clearError());
      const timer = setTimeout(() => setPasswordSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [passwordSuccess, dispatch]);

  return (
    <>
      <div className="text-sm font-bold dark:text-white text-gray-900 mb-1">
        Password
      </div>

      <section className="dark:bg-card bg-card rounded-xl dark:border-accent border-border border p-3 sm:p-4">
        <div className="flex flex-col sm:grid sm:grid-cols-2 gap-2 sm:gap-3">
          <div>
            <label className="block text-xs dark:text-white text-[#051015] mb-1">
              Current password*
            </label>

            <div className="flex items-center dark:bg-card bg-card rounded-[18px] px-3 sm:px-4 py-1 sm:py-2.5 border dark:border-accent border-border">
              <Lock size={16} stroke="#1D8751" strokeWidth={2} />

              <input
                type={showPasswords.old ? "text" : "password"}
                className="bg-transparent flex-1 min-w-0 ml-2 outline-none text-sm sm:text-base text-[#788099] dark:text-white"
                placeholder="Enter current login password"
                value={formData.old_password}
                onChange={(e) => handleInputChange("old_password", e.target.value)}
                autoComplete="current-password"
                disabled={verifyingOtp || sendingOtp}
              />

              <button
                type="button"
                onClick={() => togglePasswordVisibility("old")}
                className="dark:text-[#788099] text-gray-500 dark:hover:text-white hover:text-gray-700 transition-colors shrink-0 p-0 min-h-0 min-w-0 leading-none"
              >
                {showPasswords.old ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {errors.old_password && (
              <div className="text-red-500 text-xs mt-1">{errors.old_password}</div>
            )}
          </div>

          <div>
            <label className="block text-xs dark:text-white text-[#051015] mb-1">
              New password*
            </label>

            <div className="flex items-center dark:bg-card bg-card rounded-[18px] px-3 sm:px-4 py-1 sm:py-2.5 border dark:border-accent border-border">
              <Lock size={16} stroke="#1D8751" strokeWidth={2} />

              <input
                type={showPasswords.new ? "text" : "password"}
                className="bg-transparent flex-1 min-w-0 ml-2 outline-none text-sm sm:text-base text-[#788099] dark:text-white"
                placeholder="Enter new password"
                value={formData.new_password}
                onChange={(e) => handleInputChange("new_password", e.target.value)}
                autoComplete="new-password"
                disabled={verifyingOtp || sendingOtp}
              />

              <button
                type="button"
                onClick={() => togglePasswordVisibility("new")}
                className="dark:text-[#788099] text-gray-500 dark:hover:text-white hover:text-gray-700 transition-colors shrink-0 p-0 min-h-0 min-w-0 leading-none"
              >
                {showPasswords.new ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {errors.new_password && (
              <div className="text-red-500 text-xs mt-1">{errors.new_password}</div>
            )}
          </div>
        </div>

        {otpSent && (
          <div className="mt-3 mb-1">
            <label className="block text-xs dark:text-white text-[#051015] mb-1">
              Enter OTP{" "}
              {maskedEmail && (
                <span className="text-gray-500">(sent to {maskedEmail})</span>
              )}
            </label>
            <div className="flex items-center dark:bg-[var(--card-color)] bg-gray-100 rounded-2xl px-3 sm:px-4 py-2 sm:py-2.5 border dark:border-[#35353E] border-gray-300">
              <Mail size={16} stroke="#1D8751" strokeWidth={2} />
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
            {errors.otp && !actionError && (
              <div className="mt-1 space-y-1">
                <div className="text-red-500 text-xs">{errors.otp}</div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Re-enter the code above or{" "}
                  <button
                    type="button"
                    onClick={handleSendOTP}
                    disabled={sendingOtp || verifyingOtp || updating}
                    className="underline hover:no-underline text-[#1D8751] font-medium"
                  >
                    resend OTP
                  </button>
                </p>
              </div>
            )}
            {otpVerified && (
              <div className="mt-2 text-xs text-green-600 dark:text-green-400 flex items-center">
                <CheckCircle2 size={16} className="mr-1" strokeWidth={2} />
                OTP Verified
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col gap-2">
          {actionError && !passwordSuccess && (
            <div
              className="mt-2 rounded-[18px] border border-red-500/40 bg-red-500/10 px-3 py-2 text-center text-xs sm:text-sm text-red-600 dark:text-red-400"
              role="alert"
            >
              {actionError}
            </div>
          )}

          {actionInfo && !actionError && !passwordSuccess && (
            <div className="mt-2 text-center text-xs sm:text-sm text-[#1D8751]">
              {actionInfo}
            </div>
          )}

          {passwordSuccess ? (
            <div className="w-full mt-2 py-2 sm:py-2.5 rounded-[18px] border border-green-500 bg-green-500/10 text-green-600 dark:text-green-400 text-sm sm:text-base text-center">
              ✓ Password Changed Successfully
            </div>
          ) : !otpSent ? (
            <button
              type="button"
              className="w-full mt-2 py-2 sm:py-2.5 rounded-[18px] border border-[#1D8751] text-[#1D8751] hover:bg-[#1D8751] hover:text-white transition text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleSendOTP}
              disabled={sendingOtp || verifyingOtp || updating}
            >
              {sendingOtp ? "Sending..." : "Send OTP"}
            </button>
          ) : !otpVerified ? (
            <button
              type="button"
              className="w-full mt-2 py-2 sm:py-2.5 rounded-[18px] border border-[#1D8751] text-[#1D8751] hover:bg-[#1D8751] hover:text-white transition text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleVerifyOTP}
              disabled={verifyingOtp || updating || sendingOtp || otp.length !== 6}
              aria-busy={verifyingOtp}
            >
              {verifyingOtp ? "Verifying & Changing Password..." : "Verify OTP & Change Password"}
            </button>
          ) : (
            <button
              type="button"
              className="w-full mt-2 py-2 sm:py-2.5 rounded-[18px] border border-[#1D8751] text-[#1D8751] hover:bg-[#1D8751] hover:text-white transition text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleChangePassword}
              disabled={updating || verifyingOtp || sendingOtp}
              aria-busy={updating}
            >
              {updating ? "Changing Password..." : "Change Password"}
            </button>
          )}

          {otpSent && !otpVerified && (
            <button
              type="button"
              className="w-full py-2 sm:py-2.5 rounded-[18px] border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition text-sm sm:text-base"
              onClick={handleReset}
              disabled={sendingOtp || verifyingOtp || updating}
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
