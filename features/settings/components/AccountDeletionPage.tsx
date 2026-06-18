"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { AlertTriangle } from "lucide-react";
import { AppDispatch, RootState } from "@/store";
import { logout } from "@/features/auth/slices/authSlice";
import { createSupportRequest } from "@/features/settings/slices/settingsSlice";
import { showToast } from "@/lib/utils/toast";

const DELETION_NOTES = [
  "Deletion may be delayed or refused if your account has pending transactions, remaining balances, unresolved disputes, investigations, or legal holds.",
  "We must retain identity records, KYC documents, transaction records, and compliance data for as long as required by applicable law.",
  "Deleted information may persist in backups for a limited period until overwritten in the ordinary course.",
];

const AccountDeletionPage: React.FC<{ variant?: "standalone" | "settings" }> = ({
  variant = "standalone",
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const { supportRequestLoading } = useSelector(
    (state: RootState) => state.settings
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [email, setEmail] = useState(user?.email ?? "");
  const [reason, setReason] = useState("");
  const [supportingFile, setSupportingFile] = useState<File | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!email.trim() || !reason.trim()) {
      showToast.error("Please enter your email and reason for deletion.");
      return;
    }

    if (!confirmed) {
      showToast.error("Please confirm that you understand the consequences.");
      return;
    }

    try {
      await dispatch(
        createSupportRequest({
          email_address: email.trim(),
          question: `[Account deletion request]\n\n${reason.trim()}`,
          supporting_file: supportingFile,
          request_type: "deletion",
        })
      ).unwrap();

      showToast.success(
        "Your account deletion request has been submitted. Our team will contact you after review."
      );

      if (isAuthenticated) {
        dispatch(logout());
        router.push("/auth/login");
        return;
      }

      setReason("");
      setSupportingFile(null);
      setConfirmed(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch {
      showToast.error("Failed to submit your request. Please try again or email privacy@omaya.io.");
    }
  };

  return (
    <div className={variant === "standalone" ? "max-w-2xl mx-auto w-full" : "w-full"}>
      <div className={variant === "standalone" ? "mb-6" : "mb-4"}>
        <h1
          className={
            variant === "standalone"
              ? "text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2"
              : "text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2"
          }
        >
          Request Account Deletion
        </h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-[#788099] leading-relaxed">
          You may request deletion of your OMAYA.io account and personal data
          through this page. We will review your request and respond within the
          time required by applicable law.
        </p>
      </div>

      <div className="rounded-xl border border-[#E23D3A]/30 bg-[#E23D3A]/5 dark:bg-[#E23D3A]/10 p-4 mb-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-[#E23D3A] shrink-0 mt-0.5" />
          <div className="space-y-2 text-sm text-gray-700 dark:text-[#D6D6E0]">
            <p className="font-semibold text-gray-900 dark:text-white">
              Before you continue
            </p>
            <p>
              Account closure and account deletion are different. Closure ends
              your access to the Services; deletion involves removing or
              deactivating personal data from our active systems.
            </p>
            <ul className="list-disc pl-5 space-y-1">
              {DELETION_NOTES.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-xl border border-gray-200 dark:border-[#35353E] bg-white dark:bg-[var(--card-color)] p-4 sm:p-6 space-y-4"
      >
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-[#D6D6E0] mb-1">
            Email address*
          </label>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-[18px] border border-[#E8EFF5] dark:border-[#35353E] bg-white dark:bg-[var(--card-color)] px-4 py-2.5 text-sm text-gray-900 dark:text-[#788099] focus:outline-none focus:border-[#1D8751]"
            placeholder="your@email.com"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-[#D6D6E0] mb-1">
            Reason for deletion*
          </label>
          <textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows={5}
            className="w-full rounded-[18px] border border-[#E8EFF5] dark:border-[#35353E] bg-white dark:bg-[var(--card-color)] px-4 py-2.5 text-sm text-gray-900 dark:text-[#788099] focus:outline-none focus:border-[#1D8751] resize-y"
            placeholder="Tell us why you want to delete your account."
            required
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-[#D6D6E0] mb-1">
            Supporting file (optional)
          </label>
          <input
            ref={fileInputRef}
            type="file"
            onChange={(event) =>
              setSupportingFile(event.target.files?.[0] ?? null)
            }
            className="block w-full text-sm text-gray-600 dark:text-[#788099] file:mr-3 file:rounded-lg file:border-0 file:bg-[#1D8751] file:px-3 file:py-2 file:text-white file:text-sm file:font-medium"
          />
        </div>

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(event) => setConfirmed(event.target.checked)}
            className="mt-1 w-4 h-4 rounded border-2 border-[#E23D3A] text-[#E23D3A] focus:ring-[#E23D3A]"
          />
          <span className="text-sm text-gray-700 dark:text-[#788099] leading-relaxed">
            I understand that account deletion is permanent, may be delayed if
            there are pending balances or disputes, and that certain records may
            be retained as required by law.
          </span>
        </label>

        <button
          type="submit"
          disabled={supportRequestLoading}
          className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#E23D3A] hover:bg-[#c9322f] text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {supportRequestLoading ? "Submitting..." : "Submit deletion request"}
        </button>
      </form>

      <p className="mt-6 text-sm text-gray-600 dark:text-[#788099]">
        You can also contact us at{" "}
        <a
          href="mailto:privacy@omaya.io"
          className="text-[#1D8751] underline hover:text-[#166b3e]"
        >
          privacy@omaya.io
        </a>{" "}
        or read our{" "}
        <Link
          href="/legal/privacy-policy"
          className="text-[#1D8751] underline hover:text-[#166b3e]"
        >
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  );
};

export default AccountDeletionPage;
