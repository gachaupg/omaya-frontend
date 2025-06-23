import React from "react";

interface BasicInfoSectionProps {
  user: any;
}

const BasicInfoSection: React.FC<BasicInfoSectionProps> = ({ user }) => {
  return (
    <section className="bg-[#18181D] rounded-xl border border-[#35353E] p-3 shadow-lg">
      <div className="text-base font-semibold text-white mb-2">Basic Info</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
        <div>
          <label className="block text-xs text-[#fff] mb-1">First Name*</label>
          <input
            className="bg-[#23232B] border border-[#35353E] rounded-[18px] px-3 py-2 text-sm text-white w-full"
            value={user?.first_name || ""}
            readOnly
          />
        </div>
        <div>
          <label className="block text-xs text-[#fff] mb-1">Last Name*</label>
          <input
            className="bg-[#23232B] border border-[#35353E] rounded-[18px] px-3 py-2 text-sm text-white w-full"
            value={user?.last_name || ""}
            readOnly
          />
        </div>
        <div>
          <label className="block text-xs text-[#fff] mb-1">Email*</label>
          <input
            className="bg-[#23232B] border border-[#35353E] rounded-[18px] px-3 py-2 text-sm text-white w-full"
            value={user?.email || ""}
            readOnly
          />
        </div>
        <div>
          <label className="block text-xs text-[#fff] mb-1">Phone*</label>
          <input
            className="bg-[#23232B] border border-[#35353E] rounded-[18px] px-3 py-2 text-sm text-white w-full"
            value={user?.phone_number || ""}
            readOnly
          />
        </div>
      </div>
    </section>
  );
};

export default BasicInfoSection;
