"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store";
import { showToast } from "@/lib/utils/toast";
import EmailPhoneChangeModal from "./EmailPhoneChangeModal";

interface BasicInfoSectionProps {
  user: any;
}

const BasicInfoSection: React.FC<BasicInfoSectionProps> = ({ user }) => {
  const dispatch = useDispatch<AppDispatch>();
  const [isUpdating, setIsUpdating] = useState(false);
  const isMountedRef = useRef(true);
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

  // Check if email or phone has changed (first/last are disabled)
  const hasChanges = useMemo(() => {
    if (!user) return false;
    const emailChanged =
      formData.email.trim() !== (user.email || "").trim();
    const userPhone = (user.phone_number || "").replace(/^\+/, "");
    const phoneChanged = formData.phone_number.trim() !== userPhone;
    return emailChanged || phoneChanged;
  }, [formData, user]);

  const handleInputChange = (field: string, value: string) => {
    if (field === "phone_number") {
      value = value.replace(/[^0-9]/g, "");
    }
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
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
              className="dark:bg-[var(--card-color)] bg-white border border-[#E8EFF5] dark:border-[#35353E] rounded-[18px] px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base dark:text-[#788099] text-[#0D0D0D] w-full opacity-60 cursor-not-allowed"
              value={formData.first_name}
              readOnly
              disabled
            />
          </div>
          <div>
            <label className="block text-xs dark:text-[#ffff] text-[#0D0D0D] mb-1">
              Last Name*
            </label>
            <input
              className="dark:bg-[var(--card-color)] bg-white border dark:border-[#35353E] border-[#E8EFF5] rounded-[18px] px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base dark:text-[#788099] text-[#0D0D0D] w-full opacity-60 cursor-not-allowed"
              value={formData.last_name}
              readOnly
              disabled
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
          disabled={!hasChanges}
        >
          Update
        </button>
      </section>

      <EmailPhoneChangeModal
        isOpen={changeModal.open}
        onClose={() => setChangeModal({ open: false, type: "email" })}
        type={changeModal.type}
        currentValue={
          changeModal.type === "email"
            ? user?.email || ""
            : (user?.phone_number || "").replace(/^\+/, "")
        }
        initialValue={changeModal.initialValue}
      />
    </>
  );
};

export default BasicInfoSection;
