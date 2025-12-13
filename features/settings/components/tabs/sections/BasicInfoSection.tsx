import React from "react";

interface BasicInfoSectionProps {
  user: any;
}

const BasicInfoSection: React.FC<BasicInfoSectionProps> = ({ user }) => {
  return (
    <>
      <div className="text-sm font-bold dark:text-white text-gray-900 mb-1">
        Basic Info
      </div>
      <section className="dark:bg-transparent bg-white rounded-xl border dark:border-[#35353E] border-[#E8EFF5] p-3 sm:p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3">
          <div>
            <label className="block text-xs dark:text-[#ffff] text-[#0D0D0D] mb-1">
              First Name*
            </label>
            <input
              className="dark:bg-[var(--bg-color)] bg-white border  border-[#E8EFF5] dark:border-[#35353E] rounded-[18px] px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base dark:text-[#788099] text-[#0D0D0D] w-full"
              value={user?.first_name || ""}
              readOnly
            />
          </div>
          <div>
            <label className="block text-xs dark:text-[#ffff] text-[#0D0D0D] mb-1">
              Last Name*
            </label>
            <input
              className="dark:bg-transparent bg-white border dark:border-[#35353E] border-[#E8EFF5] rounded-[18px] px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base dark:text-[#788099] text-[#0D0D0D] w-full"
              value={user?.last_name || ""}
              readOnly
            />
          </div>
          <div>
            <label className="block text-xs dark:text-[#ffff] text-[#0D0D0D] mb-1">
              Phone*
            </label>
            <input
              className="dark:bg-transparent bg-white border dark:border-[#35353E] border-[#E8EFF5] rounded-[18px] px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base dark:text-[#788099] text-[#0D0D0D] w-full"
              value={user?.phone_number || ""}
              readOnly
            />
          </div>
          <div>
            <label className="block text-xs dark:text-[#ffff] text-[#0D0D0D] mb-1">
              Email*
            </label>
            <input
              className="dark:bg-transparent bg-white border dark:border-[#35353E] border-[#E8EFF5] rounded-[18px] px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base dark:text-[#788099] text-[#0D0D0D] w-full"
              value={user?.email || ""}
              readOnly
            />
          </div>
        </div>
        <button
          className="w-full mt-3 py-2.5 rounded-xl bg-transparent border border-[#1D8751] text-[#1D8751] font-semibold text-sm hover:bg-[#1D8751] hover:text-white transition"
          type="button"
        >
          Update
        </button>
      </section>
    </>
  );
};

export default BasicInfoSection;
