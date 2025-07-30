import React, { useState } from "react";

interface PasswordChangeRequest {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

const PasswordSection: React.FC = () => {
  const [updating, setUpdating] = useState(false);
  const [formData, setFormData] = useState<PasswordChangeRequest>({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
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

    if (!formData.current_password) {
      newErrors.current_password = "Current password is required";
    }

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

    setUpdating(true);
    // Simulate API call
    setTimeout(() => {
      // Clear form on success
      setFormData({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });
      setShowPasswords({
        current: false,
        new: false,
        confirm: false,
      });
      setUpdating(false);
      // Show success message
      alert("Password updated successfully!");
    }, 1000);
  };

  return (
    <>
      <div className="text-base font-semibold text-[#788099] mb-0">
        3-Password
      </div>

      <section className="bg-[#1D1D23] rounded-xl border-2 border-[#35353E] p-3 shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
          <div>
            <label className="block text-xs text-[#fff] mb-1">
              Current Password*
            </label>
            <div className="flex items-center bg-[#23232B] rounded-lg px-3 py-2 border border-[#35353E]">
              <svg
                width="16"
                height="16"
                fill="none"
                viewBox="0 0 24 24"
                stroke="#1D8751"
              >
                <rect
                  x="3"
                  y="11"
                  width="18"
                  height="8"
                  rx="4"
                  strokeWidth="2"
                />
                <path d="M7 11V7a5 5 0 0110 0v4" strokeWidth="2" />
              </svg>
              <input
                type={showPasswords.current ? "text" : "password"}
                className="bg-transparent flex-1 ml-2 outline-none text-sm text-white"
                placeholder="Enter current password"
                value={formData.current_password}
                onChange={(e) =>
                  handleInputChange("current_password", e.target.value)
                }
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility("current")}
                className="text-[#788099] hover:text-white transition-colors"
              >
                <svg
                  width="16"
                  height="16"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  {showPasswords.current ? (
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
            {errors.current_password && (
              <div className="text-red-500 text-xs mt-1">
                {errors.current_password}
              </div>
            )}
          </div>
          <div>
            <label className="block text-xs text-[#fff] mb-1">
              New Password*
            </label>
            <div className="flex items-center bg-[#23232B] rounded-lg px-3 py-2 border border-[#35353E]">
              <svg
                width="16"
                height="16"
                fill="none"
                viewBox="0 0 24 24"
                stroke="#1D8751"
              >
                <rect
                  x="3"
                  y="11"
                  width="18"
                  height="8"
                  rx="4"
                  strokeWidth="2"
                />
                <path d="M7 11V7a5 5 0 0110 0v4" strokeWidth="2" />
              </svg>
              <input
                type={showPasswords.new ? "text" : "password"}
                className="bg-transparent flex-1 ml-2 outline-none text-sm text-white"
                placeholder="Enter new password"
                value={formData.new_password}
                onChange={(e) =>
                  handleInputChange("new_password", e.target.value)
                }
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility("new")}
                className="text-[#788099] hover:text-white transition-colors"
              >
                <svg
                  width="16"
                  height="16"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
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
              <div className="text-red-500 text-xs mt-1">
                {errors.new_password}
              </div>
            )}
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs text-[#fff] mb-1">
              Confirm New Password*
            </label>
            <div className="flex items-center bg-[#23232B] rounded-lg px-3 py-2 border border-[#35353E]">
              <svg
                width="16"
                height="16"
                fill="none"
                viewBox="0 0 24 24"
                stroke="#1D8751"
              >
                <rect
                  x="3"
                  y="11"
                  width="18"
                  height="8"
                  rx="4"
                  strokeWidth="2"
                />
                <path d="M7 11V7a5 5 0 0110 0v4" strokeWidth="2" />
              </svg>
              <input
                type={showPasswords.confirm ? "text" : "password"}
                className="bg-transparent flex-1 ml-2 outline-none text-sm text-white"
                placeholder="Confirm new password"
                value={formData.confirm_password}
                onChange={(e) =>
                  handleInputChange("confirm_password", e.target.value)
                }
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility("confirm")}
                className="text-[#788099] hover:text-white transition-colors"
              >
                <svg
                  width="16"
                  height="16"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
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
              <div className="text-red-500 text-xs mt-1">
                {errors.confirm_password}
              </div>
            )}
          </div>
        </div>
        <button
          className="w-full py-1.5 rounded-lg border border-[#1D8751] text-[#1D8751] hover:bg-[#1D8751] hover:text-white transition text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleSubmit}
          disabled={updating}
        >
          {updating ? "Updating..." : "Update Password"}
        </button>
      </section>
    </>
  );
};

export default PasswordSection;
