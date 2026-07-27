"use client";

import Link from "next/link";
import { Trash2 } from "lucide-react";

const AccountDeletionSection: React.FC = () => {
  return (
    <>
      <div className="text-sm font-bold dark:text-white text-gray-900 mb-1 mt-1">
        Account Deletion
      </div>
      <section className="dark:bg-[var(--card-color)] bg-white rounded-xl border border-[#E8EFF5] dark:border-[#35353E] p-4 sm:p-6 min-w-0 overflow-hidden">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <div className="w-10 h-10 rounded-xl bg-[#E23D3A]/10 flex items-center justify-center shrink-0">
            <Trash2 className="w-5 h-5 text-[#E23D3A]" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-gray-700 dark:text-[#788099] leading-relaxed mb-3">
              You may request deletion of your account and personal data through
              our{" "}
              <Link
                href="/delete-account"
                className="text-[#1D8751] underline hover:text-[#166b3e] font-medium"
              >
                account-deletion page
              </Link>
              .
            </p>
            <Link
              href="/delete-account"
              className="inline-flex w-full sm:w-auto items-center justify-center px-4 py-2.5 rounded-xl border border-[#E23D3A] text-[#E23D3A] text-sm font-semibold hover:bg-[#E23D3A] hover:text-white transition-colors"
            >
              Request account deletion
            </Link>
          </div>
        </div>
      </section>
    </>
  );
};

export default AccountDeletionSection;
