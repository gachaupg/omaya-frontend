"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store";
import { updateProfile } from "@/features/settings/slices/settingsSlice";
import { showToast } from "@/lib/utils/toast";

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

  // Initialize form data when user changes
  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        phone_number: user.phone_number || "",
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

  // Check if form data has actually changed from original user data
  const hasChanges = useMemo(() => {
    if (!user) return false;
    return (
      formData.first_name.trim() !== (user.first_name || "").trim() ||
      formData.last_name.trim() !== (user.last_name || "").trim() ||
      formData.phone_number.trim() !== (user.phone_number || "").trim()
    );
  }, [formData, user]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleUpdate = async () => {
    // Prevent update if component is unmounting (navigation in progress)
    if (!isMountedRef.current) {
      return;
    }

    // Check if there are actual changes
    if (!hasChanges) {
      showToast.info("No changes to update");
      return;
    }

    // Validate required fields
    if (!formData.first_name.trim() || !formData.last_name.trim()) {
      showToast.error("First name and last name are required");
      return;
    }

    setIsUpdating(true);
    try {
      // Only send editable fields (exclude email as it's typically not editable)
      // Double-check mounted state before making request
      if (!isMountedRef.current) {
        return;
      }
      
      await dispatch(
        updateProfile({
          first_name: formData.first_name.trim(),
          last_name: formData.last_name.trim(),
          phone_number: formData.phone_number.trim(),
        })
      ).unwrap();
      
      // Only show success if still mounted
      if (isMountedRef.current) {
        showToast.success("Profile updated successfully");
      }
    } catch (error: any) {
      // Only show error if still mounted
      if (isMountedRef.current) {
        showToast.error(error?.message || "Failed to update profile");
      }
    } finally {
      if (isMountedRef.current) {
        setIsUpdating(false);
      }
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
              className="dark:bg-[var(--card-color)] bg-white border  border-[#E8EFF5] dark:border-[#35353E] rounded-[18px] px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base dark:text-[#788099] text-[#0D0D0D] w-full focus:outline-none focus:border-[#1D8751]"
              value={formData.first_name}
              onChange={(e) => handleInputChange("first_name", e.target.value)}
              placeholder="Enter first name"
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
              placeholder="Enter last name"
            />
          </div>
          <div>
            <label className="block text-xs dark:text-[#ffff] text-[#0D0D0D] mb-1">
              Phone*
            </label>
            <input
              className="dark:bg-[var(--card-color)] bg-white border dark:border-[#35353E] border-[#E8EFF5] rounded-[18px] px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base dark:text-[#788099] text-[#0D0D0D] w-full focus:outline-none focus:border-[#1D8751]"
              value={formData.phone_number}
              onChange={(e) => handleInputChange("phone_number", e.target.value)}
              placeholder="Enter phone number"
            />
          </div>
          <div>
            <label className="block text-xs dark:text-[#ffff] text-[#0D0D0D] mb-1">
              Email*
            </label>
            <input
              className="dark:bg-[var(--card-color)] bg-white border dark:border-[#35353E] border-[#E8EFF5] rounded-[18px] px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base dark:text-[#788099] text-[#0D0D0D] w-full opacity-60 cursor-not-allowed"
              value={formData.email}
              readOnly
              title="Email cannot be changed"
            />
          </div>
        </div>
        <button
          className={`w-full mt-3 py-2.5 rounded-xl bg-transparent border border-[#1D8751] text-[#1D8751] font-semibold text-sm hover:bg-[#1D8751] hover:text-white transition disabled:opacity-50 disabled:cursor-not-allowed ${!hasChanges ? 'opacity-50' : ''}`}
          type="button"
          onClick={handleUpdate}
          disabled={isUpdating || !hasChanges}
        >
          {isUpdating ? "Updating..." : "Update"}
        </button>
      </section>
    </>
  );
};

export default BasicInfoSection;
