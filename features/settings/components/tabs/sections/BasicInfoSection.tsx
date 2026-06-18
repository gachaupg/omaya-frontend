"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store";
import { showToast } from "@/lib/utils/toast";
import EmailPhoneChangeModal from "./EmailPhoneChangeModal";
import NameChangeOtpModal from "./NameChangeOtpModal";
import { fetchProfile, updateProfile } from "@/features/settings/slices/settingsSlice";

interface BasicInfoSectionProps {
  user: any;
}
const PROFILE_CHANGE_OTP_PENDING_KEY = "profile_change_otp_pending_v1";
const NAME_CHANGE_OTP_PENDING_KEY = "profile_name_change_otp_pending_v1";

const BasicInfoSection: React.FC<BasicInfoSectionProps> = ({ user }) => {
  const dispatch = useDispatch<AppDispatch>();
  const [isUpdating, setIsUpdating] = useState(false);
  const isMountedRef = useRef(true);
  const isVerifiedUser = useMemo(() => user?.is_verified === true, [user]);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phone_number: "",
    email: "",
  });
  const [changeModal, setChangeModal] = useState<{
    open: boolean;
    type: "email" | "phone";
    initialValue?: string;
  }>({ open: false, type: "email" });
  const [nameOtpModal, setNameOtpModal] = useState({
    open: false,
    message: "",
    first_name: "",
    last_name: "",
  });

  const closeNameOtpModal = useCallback(() => {
    try {
      localStorage.removeItem(NAME_CHANGE_OTP_PENDING_KEY);
    } catch {
      // Ignore localStorage access issues
    }
    setNameOtpModal({
      open: false,
      message: "",
      first_name: "",
      last_name: "",
    });
  }, []);

  const closeChangeModal = () => {
    try {
      localStorage.removeItem(PROFILE_CHANGE_OTP_PENDING_KEY);
    } catch {
      // Ignore localStorage access issues
    }
    setChangeModal({ open: false, type: "email" });
  };

  // Initialize form data when user changes (phone stored/displayed without leading +)
  useEffect(() => {
    if (user) {
      const phone = (user.phone_number || "").replace(/^\+/, "");
      setFormData({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        phone_number: phone,
        email: user.email || "",
      });
    }
  }, [user]);

  // Cleanup on unmount - prevent any PATCH requests during navigation
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Restore pending profile-change OTP modal after refresh/navigation.
  useEffect(() => {
    if (!user) return;
    try {
      const raw = localStorage.getItem(PROFILE_CHANGE_OTP_PENDING_KEY);
      if (!raw) return;
      const pending = JSON.parse(raw) as {
        type?: "email" | "phone";
        value?: string;
      };
      if (!pending?.type || !pending?.value) return;
      setChangeModal({
        open: true,
        type: pending.type,
        initialValue: pending.value,
      });
    } catch {
      // Ignore malformed pending OTP state
    }
  }, [user]);

  // Restore name-change OTP modal after refresh/navigation.
  useEffect(() => {
    if (!user) return;
    try {
      const raw = localStorage.getItem(NAME_CHANGE_OTP_PENDING_KEY);
      if (!raw) return;
      const pending = JSON.parse(raw) as {
        first_name?: string;
        last_name?: string;
        message?: string;
      };
      const first = (pending.first_name ?? "").trim();
      const last = (pending.last_name ?? "").trim();
      if (!first || !last) return;
      setNameOtpModal({
        open: true,
        message:
          pending.message ||
          "OTP sent to your email. Submit again with the OTP to confirm your name change.",
        first_name: first,
        last_name: last,
      });
    } catch {
      // Ignore malformed pending OTP state
    }
  }, [user]);

  const hasNameChanges = useMemo(() => {
    if (!user) return false;
    if (isVerifiedUser) return false;
    return (
      formData.first_name.trim() !== (user.first_name || "").trim() ||
      formData.last_name.trim() !== (user.last_name || "").trim()
    );
  }, [formData, user, isVerifiedUser]);

  // Check if email or phone has changed, or first/last name
  const hasChanges = useMemo(() => {
    if (!user) return false;
    const emailChanged =
      formData.email.trim() !== (user.email || "").trim();
    const userPhone = (user.phone_number || "").replace(/^\+/, "");
    const phoneChanged = formData.phone_number.trim() !== userPhone;
    return emailChanged || phoneChanged || hasNameChanges;
  }, [formData, user, hasNameChanges]);

  const handleInputChange = (field: string, value: string) => {
    if (isVerifiedUser && (field === "first_name" || field === "last_name")) {
      return;
    }
    if (field === "phone_number") {
      value = value.replace(/[^0-9]/g, "");
    }
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const requestNameChangeOtp = async () => {
    if (!user || !isMountedRef.current) return;
    if (isVerifiedUser) {
      showToast.error("Verified users cannot change name details");
      return;
    }
    const first = formData.first_name.trim();
    const last = formData.last_name.trim();
    if (!first || !last) {
      showToast.error("First and last name are required");
      return;
    }
    setIsUpdating(true);
    try {
      const result = await dispatch(
        updateProfile({ first_name: first, last_name: last })
      ).unwrap();
      if (!isMountedRef.current) return;
      if (result.outcome === "otp_required") {
        try {
          localStorage.setItem(
            NAME_CHANGE_OTP_PENDING_KEY,
            JSON.stringify({
              first_name: first,
              last_name: last,
              message: result.message,
            })
          );
        } catch {
          // Ignore localStorage errors
        }
        setNameOtpModal({
          open: true,
          message: result.message,
          first_name: first,
          last_name: last,
        });
      } else if (result.outcome === "success") {
        try {
          localStorage.removeItem(NAME_CHANGE_OTP_PENDING_KEY);
        } catch {
          // Ignore
        }
        await dispatch(fetchProfile());
      }
    } catch {
      // Errors surfaced via thunk toast
    } finally {
      if (isMountedRef.current) setIsUpdating(false);
    }
  };

  const handleUpdate = () => {
    if (!isMountedRef.current || !hasChanges) return;

    // Prefer email change first if both changed
    if (formData.email.trim() !== (user?.email || "").trim()) {
      setChangeModal({ open: true, type: "email", initialValue: formData.email });
    } else if (
      formData.phone_number.trim() !==
      (user?.phone_number || "").replace(/^\+/, "")
    ) {
      setChangeModal({
        open: true,
        type: "phone",
        initialValue: formData.phone_number,
      });
    } else if (hasNameChanges && !isVerifiedUser) {
      void requestNameChangeOtp();
    } else {
      showToast.info("No changes to update");
    }
  };

  return (
    <>
      <div className="text-sm font-bold dark:text-white text-gray-900 mb-1">
        Basic Info
      </div>
      <section className="dark:bg-[var(--card-color)] bg-white rounded-xl border dark:border-[#35353E] border-[#E8EFF5] p-2 sm:p-3 md:p-4 lg:p-6 shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3 mb-2">
          <div>
            <label className="block text-xs dark:text-[#ffff] text-[#0D0D0D] mb-1">
              First Name*
            </label>
            <input
              className="dark:bg-[var(--card-color)] bg-white border border-[#E8EFF5] dark:border-[#35353E] rounded-[18px] px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base dark:text-[#788099] text-[#0D0D0D] w-full focus:outline-none focus:border-[#1D8751]"
              value={formData.first_name}
              onChange={(e) => handleInputChange("first_name", e.target.value)}
              placeholder="First name"
              disabled={isVerifiedUser}
            />
           
          </div>
          <div>
            <label className="block text-xs dark:text-[#ffff] text-[#0D0D0D] mb-1">
              Last Name*
            </label>
            <input
              className="dark:bg-[var(--card-color)] bg-white border dark:border-[#35353E] border-[#E8EFF5] rounded-[18px] px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base dark:text-[#788099] text-[#0D0D0D] w-full focus:outline-none focus:border-[#1D8751]"
              value={formData.last_name}
              onChange={(e) => handleInputChange("last_name", e.target.value)}
              placeholder="Last name"
              disabled={isVerifiedUser}
            />
          </div>
          <div>
            <label className="block text-xs dark:text-[#ffff] text-[#0D0D0D] mb-1">
              Phone*
            </label>
            <input
              type="tel"
              inputMode="numeric"
              className="dark:bg-[var(--card-color)] bg-white border dark:border-[#35353E] border-[#E8EFF5] rounded-[18px] px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base dark:text-[#788099] text-[#0D0D0D] w-full focus:outline-none focus:border-[#1D8751]"
              value={formData.phone_number}
              onChange={(e) => handleInputChange("phone_number", e.target.value)}
              placeholder="+254712345678"
            />
          </div>
          <div>
            <label className="block text-xs dark:text-[#ffff] text-[#0D0D0D] mb-1">
              Email*
            </label>
            <input
              type="email"
              className="dark:bg-[var(--card-color)] bg-white border dark:border-[#35353E] border-[#E8EFF5] rounded-[18px] px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base dark:text-[#788099] text-[#0D0D0D] w-full focus:outline-none focus:border-[#1D8751]"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              placeholder="newemail@example.com"
            />
          </div>
        </div>
        <button
          className={`w-full mt-3 py-2.5 rounded-xl bg-transparent border border-[#1D8751] text-[#1D8751] font-semibold text-sm hover:bg-[#1D8751] hover:text-white transition disabled:opacity-50 disabled:cursor-not-allowed ${!hasChanges ? "opacity-50" : ""}`}
          type="button"
          onClick={handleUpdate}
          disabled={!hasChanges || isUpdating}
        >
          {isUpdating ? "Please wait..." : "Update"}
        </button>
      </section>

      <EmailPhoneChangeModal
        isOpen={changeModal.open}
        onClose={closeChangeModal}
        type={changeModal.type}
        currentValue={
          changeModal.type === "email"
            ? user?.email || ""
            : (user?.phone_number || "").replace(/^\+/, "")
        }
        initialValue={changeModal.initialValue}
      />

      <NameChangeOtpModal
        isOpen={nameOtpModal.open}
        onClose={closeNameOtpModal}
        introMessage={nameOtpModal.message}
        firstName={nameOtpModal.first_name}
        lastName={nameOtpModal.last_name}
      />
    </>
  );
};

export default BasicInfoSection;
