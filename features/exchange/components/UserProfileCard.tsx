import React from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/rootReducer";
import Button from "@/features/p2p/components/Common/Button";

type UserProfileCardProps = {
  name: string;
  userId: string;
  userType: string;
  profileImage: string;
};

const UserProfileCard: React.FC<UserProfileCardProps> = ({
  name,
  userId,
  userType,
  profileImage,
}) => {
  const { user } = useSelector((state: RootState) => state.auth);
  const isVerified = user?.is_verified ?? false;

  return (
    <div className="flex items-center gap-4 p-2 rounded-2xl bg-[#1D1D23] border border-[#35353E]">
      <div className="flex flex-col w-full gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4 min-w-0">
          {/* User Avatar with Edit Button */}
          <div className="relative flex-shrink-0">
            <div className="h-14 w-14 rounded-full overflow-hidden relative">
              <img src="https://res.cloudinary.com/pitz/image/upload/v1746538908/1fd9f384e7054d4ed9c913e3cfc2b1cf634d0cf4_ldkmkj.jpg" alt="" />
            </div>
            <div className="absolute -top-1 -right-1 rounded-full p-1 bg-[#1D8751]">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M16 3L21 8L8 21L3 21L3 16L16 3Z"
                  className="stroke-[#FFFFFF]"
                  strokeWidth="2"
                />
              </svg>
            </div>
          </div>

          {/* User Info */}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-lg text-[14px] font-semibold text-[#FFFFFF] truncate">
                Hello, {name}!
              </h2>
            </div>
            <div className="flex items-center gap-1">
              <span className={`text-[14px] ${isVerified ? 'text-[#1D8751]' : 'text-[#E23D3A]'}`}>
                {isVerified ? "Verified" : "Unverified"} Profile
              </span>
              {isVerified && (
                <div className="rounded-full p-0.5 bg-[#1D8751] flex-shrink-0">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M9 12L11 14L15 10"
                      className="stroke-[#FFFFFF]"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <circle
                      cx="12"
                      cy="12"
                      r="9"
                      className="stroke-[#FFFFFF]"
                      strokeWidth="2"
                    />
                  </svg>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* User Details and Actions */}
        <div className="flex flex-wrap gap-4 sm:gap-6 items-start sm:items-center">
          {/* User ID */}
          <div className="min-w-0">
            <p className="text-xs text-[#788099]">User ID</p>
            <div className="flex items-center gap-2">
              <p className="text-base text-[#FFFFFF] truncate">{userId}</p>
              <button className="flex-shrink-0">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect
                    x="5"
                    y="5"
                    width="14"
                    height="14"
                    rx="2"
                    className="stroke-[#E23D3A]"
                    strokeWidth="2"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* User Type */}
          <div className="min-w-0">
            <p className="text-xs text-[#788099]">User Type</p>
            <p className="text-base text-[#FFFFFF] truncate">{userType}</p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center justify-center p-0"
              icon={
                <div className="w-10 h-10 rounded-full border border-[#1D8751] flex items-center justify-center p-1">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z"
                      className="stroke-[#1D8751]"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21"
                      className="stroke-[#1D8751]"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              }
            />
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center justify-center p-0"
              icon={
                <div className="w-10 h-10 rounded-[50%] border border-[#1D8751] flex items-center justify-center p-0">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M3 18V12C3 9.61305 3.94821 7.32387 5.63604 5.63604C7.32387 3.94821 9.61305 3 12 3C14.3869 3 16.6761 3.94821 18.364 5.63604C20.0518 7.32387 21 9.61305 21 12V18"
                      className="stroke-[#1D8751]"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M21 19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H18C17.4696 21 16.9609 20.7893 16.5858 20.4142C16.2107 20.0391 16 19.5304 16 19V16C16 15.4696 16.2107 14.9609 16.5858 14.5858C16.9609 14.2107 17.4696 14 18 14H21V19ZM3 19C3 19.5304 3.21071 20.0391 3.58579 20.4142C3.96086 20.7893 4.46957 21 5 21H6C6.53043 21 7.03914 20.7893 7.41421 20.4142C7.78929 20.0391 8 19.5304 8 19V16C8 15.4696 7.78929 14.9609 7.41421 14.5858C7.03914 14.2107 6.53043 14 6 14H3V19Z"
                      className="stroke-[#1D8751]"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfileCard; 