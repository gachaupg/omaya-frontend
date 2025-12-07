import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { resetPassword } from "@/features/settings/slices/settingsSlice";
import { RootState, AppDispatch } from "@/store/rootReducer";
import { showToast } from "@/lib/utils/toast";

interface PasswordChangeRequest {
  new_password: string;
  confirm_password: string;
}

const PasswordSection: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { updating, error, success } = useSelector(
    (state: RootState) => state.settings
  );

  const [formData, setFormData] = useState<PasswordChangeRequest>({
    new_password: "",
    confirm_password: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    new: false,
    confirm: false,
  });
  const [errors, setErrors] = useState<Partial<PasswordChangeRequest>>({});

  const handleInputChange = (
    field: keyof PasswordChangeRequest,
    value: string
  ) => {
    setFormData((prev: PasswordChangeRequest) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev: Partial<PasswordChangeRequest>) => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords((prev: typeof showPasswords) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const validateForm = (): boolean => {
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

  const handleSubmit = async () => {
    if (!validateForm()) return;

    if (!user?.email) {
      const errorMessage = "User email not found. Please log in again.";
      setErrors({ new_password: errorMessage });
      showToast.error(errorMessage);
      return;
    }

    try {
      await dispatch(
        resetPassword({
          email: user.email,
          password: formData.new_password,
          confirm_password: formData.confirm_password,
        })
      ).unwrap();

      // Clear form on success
      setFormData({
        new_password: "",
        confirm_password: "",
      });
      setShowPasswords({
        new: false,
        confirm: false,
      });
    } catch (error: any) {
      // Error is handled by the slice and toast
      console.error("Password reset error:", error);
    }
  };

  // Clear errors when component unmounts or when success occurs
  useEffect(() => {
    if (success) {
      setErrors({});
    }
  }, [success]);

  return (
    <>
      <div className="text-base sm:text-lg font-bold dark:text-white text-gray-900 mb-0">
        Password
      </div>

      <section className="dark:bg-[#1D1D23] bg-white rounded-2xl dark:border-[#35353E] border-[#E8EFF5] border-2 p-3 sm:p-4 lg:p-6 shadow-lg">

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">

          <div>
            <label className="block text-xs dark:text-white text-[#051015] mb-1">
              New Password*
            </label>

            <div className="flex items-center dark:bg-[#23232B] bg-gray-100 rounded-2xl px-3 sm:px-4 py-2 sm:py-2.5 border dark:border-[#35353E] border-gray-300">

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
              Confirm New Password*
            </label>

            <div className="flex items-center dark:bg-[#23232B] bg-gray-100 rounded-2xl px-3 sm:px-4 py-2 sm:py-2.5 border dark:border-[#35353E] border-gray-300">

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

        <button
          className="w-full py-2 sm:py-2.5 rounded-[18px] border border-[#1D8751] text-[#1D8751] hover:bg-[#1D8751] hover:text-white transition text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleSubmit}
          disabled={updating}
        >
          {updating ? "Updating..." : "Update"}
        </button>

      </section>

    </>
  );
};

export default PasswordSection;
