import React from "react";

interface BasicInfoSectionProps {
  user: any;
}

const BasicInfoSection: React.FC<BasicInfoSectionProps> = ({ user }) => {
  return (
    <section className="dark:bg-[#18181D] bg-[#F5F5F5] rounded-xl border dark:border-[#35353E] border-gray-300 p-3 shadow-lg">
      <div className="text-base font-semibold dark:text-white text-[#0D0D0D] mb-2">
        Basic Info
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
        <div>
          <label className="block text-xs dark:text-[#fff] text-[#0D0D0D] mb-1">
            First Name*
          </label>
          <input
            className="dark:bg-[#23232B] bg-white border dark:border-[#35353E] border-gray-300 rounded-[18px] px-3 py-2 text-sm dark:text-white text-[#0D0D0D] w-full"
            value={user?.first_name || ""}
            readOnly
          />
        </div>
        <div>
          <label className="block text-xs dark:text-[#fff] text-[#0D0D0D] mb-1">
            Last Name*
          </label>
          <input
            className="dark:bg-[#23232B] bg-white border dark:border-[#35353E] border-gray-300 rounded-[18px] px-3 py-2 text-sm dark:text-white text-[#0D0D0D] w-full"
            value={user?.last_name || ""}
            readOnly
          />
        </div>
        <div>
          <label className="block text-xs dark:text-[#fff] text-[#0D0D0D] mb-1">
            Email*
          </label>
          <input
            className="dark:bg-[#23232B] bg-white border dark:border-[#35353E] border-gray-300 rounded-[18px] px-3 py-2 text-sm dark:text-white text-[#0D0D0D] w-full"
            value={user?.email || ""}
            readOnly
          />
        </div>
        <div>
          <label className="block text-xs dark:text-[#fff] text-[#0D0D0D] mb-1">
            Phone*
          </label>
          <input
            className="dark:bg-[#23232B] bg-white border dark:border-[#35353E] border-gray-300 rounded-[18px] px-3 py-2 text-sm dark:text-white text-[#0D0D0D] w-full"
            value={user?.phone_number || ""}
            readOnly
          />
        </div>
      </div>
    </section>
  );
};

export default BasicInfoSection;
