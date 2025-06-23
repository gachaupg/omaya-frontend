import React from "react";
import Button from "@/components/ui/Button";

interface ReferralUsersListProps {
  referredUsers: any[];
  loading: boolean;
}

const ReferralUsersList: React.FC<ReferralUsersListProps> = ({
  referredUsers,
  loading,
}) => {
  const renderUsersList = () => {
    if (loading) {
      return <div className="text-[#A3A3A3]">Loading...</div>;
    }

    if (referredUsers.length > 0) {
      return referredUsers.map((user) => (
        <div
          key={user.id}
          className="flex items-center gap-4 rounded-2xl border border-[#35353F] bg-[#23232B] px-6 py-4 mb-2 w-full"
        >
          <div className="w-14 h-14 rounded-full bg-[#35353F] flex items-center justify-center text-2xl font-bold text-[#A3A3A3]">
            {user.name.charAt(0)}
          </div>
          <div className="flex flex-col">
            <span className="text-white font-semibold text-base">
              {user.email}
            </span>
            <span className="text-[#1D8751] text-sm font-medium">
              Profile status: {user.status}
            </span>
          </div>
          <Button
            variant="ghost"
            size="md"
            className="ml-auto px-6 py-2 rounded-full border border-[#35353F] text-[#A3A3A3] bg-[#18181B] hover:bg-[#35353F] transition"
          >
            Close
          </Button>
        </div>
      ));
    }

    return (
      <div className="w-full flex flex-col items-center justify-center py-12 px-4 border border-[#35353F] rounded-2xl bg-[#23232B]">
        <div className="w-20 h-20 rounded-full bg-[#18181B] flex items-center justify-center mb-4 border border-[#35353F]">
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#1D8751"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">
          No Referred Users Yet
        </h3>
        <p className="text-[#A3A3A3] text-center max-w-md">
          Share your referral code with friends and start earning rewards when
          they join using your code.
        </p>
      </div>
    );
  };

  return (
    <div className="flex-1 flex-col w-full items-center justify-center">
      <div className="text-lg font-bold text-white mb-4 w-full">
        Users Registered With Your Code
      </div>
      <div className="w-full flex flex-col items-center">
        {renderUsersList()}
      </div>
    </div>
  );
};

export default ReferralUsersList;
