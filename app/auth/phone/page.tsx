"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/useI18n";
import { useTheme } from "@/context/theme";
import { API_BASE_URL } from "@/config/api";

export default function PhoneCapturePage() {
  const router = useRouter();
  const { t } = useI18n("auth");
  const { isDark } = useTheme();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!phone || phone.trim().length < 6) {
      setError(t("auth.phone.error", "Please enter a valid phone number"));
      return;
    }

    try {
      setLoading(true);
      const token = (typeof window !== "undefined" && localStorage.getItem("access_token")) || "";

      const res = await fetch(`${API_BASE_URL}/api/auth/update-phone/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({ phone_number: phone }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || data?.detail || t("auth.phone.submitError", "Failed to save phone number"));
      }

      if (data.access) localStorage.setItem("access_token", data.access);
      if (data.refresh) localStorage.setItem("refresh_token", data.refresh);
      if (data.user) localStorage.setItem("user", JSON.stringify(data.user));

      router.replace("/dashboard");
      router.refresh?.();
    } catch (err: any) {
      setError(err.message || t("auth.phone.unknownError", "Something went wrong"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen dark:bg-[#18181D] bg-gray-50 flex flex-col md:flex-row items-start justify-center relative overflow-hidden px-6 py-16 md:pt-24 md:pb-24">
      {/* Left - Mobile preview (same visual language as login) */}
      <div className="w-full md:w-1/2 flex justify-center mb-8 md:mb-0 relative z-10">
        <div className="w-[438px] h-[403px] bg-[#1D8751] blur-[60px] absolute left-16 2xl:left-54 opacity-60"></div>
        <div className="relative">
          <Image
            src="/images/iphone_vn7ejc.webp"
            alt="OMAYA Exchange Mobile App"
            width={350}
            height={650}
            className="mx-auto"
            priority
          />
        </div>
      </div>

      {/* Right - Form */}
      <div className="w-full md:w-1/2 relative z-10">
        <div className="max-w-md mx-auto 2xl:max-w-3/4">
          <div className="mb-6">
            <h1 className="dark:text-white text-gray-900 text-2xl font-semibold">
              {t("auth.phone.title", "Complete your profile")}
            </h1>
            <p className="dark:text-[#788099] text-gray-600">
              {t("auth.phone.subtitle", "Add your phone number to continue")}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block dark:text-white text-gray-900 mb-2">
                {t("auth.phone.label", "Phone number")}
              </label>
              <div className="relative">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={t("auth.phone.placeholder", "e.g. +252712345678")}
                  className={`w-full py-3 px-4 pl-10 rounded-full dark:bg-[#1D1D23] bg-white border ${error ? "border-[#FDA29B]" : "dark:border-gray-700 border-gray-300"
                    } dark:text-white text-gray-900 focus:outline-none focus:border-[#13B562]`}
                  required
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    width="20"
                    height="20"
                  >
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.11 4.18 2 2 0 0 1 4.06 2h3a2 2 0 0 1 2 1.72c.12.9.37 1.77.72 2.58a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.5-1.19a2 2 0 0 1 2.11-.45c.81.35 1.68.6 2.58.72A2 2 0 0 1 22 16.92z" stroke="#1D8751" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                  </svg>
                </div>
                {error && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-[#F04438]"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}
              </div>
              {error && (
                <p className="mt-1 text-sm text-[#F04438]">{error}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-[#1D8751] text-white py-3 px-4 rounded-full hover:bg-[#0E5531] transition-colors duration-300 ${loading ? "opacity-70 cursor-not-allowed" : ""
                }`}
            >
              {loading ? t("auth.phone.saving", "Saving...") : t("auth.phone.continue", "Continue")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
