import React, { useEffect } from "react";
import { formatNumber } from "@/utils/formatters";
import { formatCurrency } from "@/lib/globalFormatter";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store";
import { toNumber } from "@/lib/finanacial";
import { useRouter } from "next/navigation";
import { fetchMerchantApplicationStatusThunk } from "@/features/p2p/slices/merchantSlice";

const P2pProfile = ({
  wallets,
  summary,
  loading,
}: {
  wallets: any;
  summary: any;
  loading: any;
}) => {
  const router = useRouter();
  const dispatch = useDispatch();
  const { user, isAuthenticated, profile: userProfile } = useSelector(
    (state: RootState) => state.auth
  );
  const { status: merchantStatus } = useSelector(
    (state: RootState) => state.merchant
  );

  // Fetch merchant status on component mount
  useEffect(() => {
    dispatch(fetchMerchantApplicationStatusThunk() as any);
  }, [dispatch]);
  
  console.log("P2pProfile user:", user);
  console.log("P2pProfile wallets:", wallets);
  console.log("P2pProfile summary:", summary);

  // Get balance from wallet response - try multiple sources (same logic as P2pWallet.tsx)
  const totalBalance = wallets?.total_balance ? toNumber(wallets.total_balance) : 0;
  const walletBalance = wallets?.wallet?.balance ? parseFloat(wallets.wallet.balance) : 0;
  
  // For USDT wallets, prioritize the individual wallet balance
  // This handles cases where total_balance might not be accurate
  const isUSDTWallet = wallets?.wallet?.currency === "USDT";
  const balance = isUSDTWallet && walletBalance > 0 ? walletBalance : 
                  (totalBalance && !isNaN(totalBalance) && totalBalance > 0) ? totalBalance : walletBalance;
  
  console.log("P2pProfile - total_balance:", wallets?.total_balance);
  console.log("P2pProfile - wallet.balance:", wallets?.wallet?.balance);
  console.log("P2pProfile - wallet.currency:", wallets?.wallet?.currency);
  console.log("P2pProfile - totalBalance (toNumber):", totalBalance);
  console.log("P2pProfile - walletBalance (parseFloat):", walletBalance);
  console.log("P2pProfile - isUSDTWallet:", isUSDTWallet);
  console.log("P2pProfile - final balance:", balance);
  console.log("P2pProfile - summary.total_volume:", summary?.total_volume);
  return (
    <div className="w-full h-[130px] rounded-[24px] border-2 bg-white dark:bg-[#18181D] border-gray-200 dark:border-[#35353E] flex flex-col sm:flex-row justify-between items-start sm:items-center p-2 sm:p-4 box-border gap-4 sm:gap-0">
      {/* Left Section */}
      <div className="flex items-center gap-4 sm:gap-6">
        {/* User Info */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3 sm:gap-4">
            {/* User Avatar */}
            <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              {userProfile?.photo ? (
                <img  
                  src={userProfile.photo}
                  alt="User Avatar"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback to initials if image fails to load
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent && !parent.querySelector('.fallback-initials')) {
                      const initials = document.createElement('div');
                      initials.className = 'fallback-initials text-gray-600 dark:text-gray-300 text-lg font-semibold';
                      initials.textContent = user?.first_name?.charAt(0)?.toUpperCase() || 'U';
                      parent.appendChild(initials);
                    }
                  }}
                />
              ) : (
                <div className="text-gray-600 dark:text-gray-300 text-lg font-semibold">
                  {user?.first_name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-900 dark:text-white text-base sm:text-lg font-medium">
                {user?.first_name}
              </span>
              {/* Edit Icon (simple pencil SVG) */}
              <svg
                className="w-6 h-6 text-[#1D8751] cursor-pointer"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828A2 2 0 019 17H7v-2a2 2 0 01.586-1.414z"
                />
              </svg>
            </div>

          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1">
            {/* Show Verified Merchant badge only if approved */}
            {merchantStatus?.is_merchant && merchantStatus?.status === 'approved' && (
              <span className="flex items-center text-xs text-[#1D8751] bg-[#E0F2E8] dark:bg-[#384B41] rounded-full px-3 py-1">
                <svg
                  className="w-3 h-3 mr-1"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Verified Merchant
              </span>
            )}
            
            {/* Show Pending badge if application is pending */}
            {merchantStatus?.status === 'pending' && (
              <span className="flex items-center text-xs text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 rounded-full px-3 py-1">
                <svg
                  className="w-3 h-3 mr-1"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Application Pending
              </span>
            )}
            
            {/* Show button only if not approved or not pending */}
            {(!merchantStatus || (merchantStatus.status !== 'approved' && merchantStatus.status !== 'pending')) && (
              <button 
                onClick={() => router.push("/p2p/merchant")}
                className="bg-[#1D8751] text-white text-xs font-semibold rounded-full px-4 sm:px-5 py-2"
              >
                {merchantStatus?.status === 'rejected' ? 'Reapply as Merchant' : 'Become Merchant PRO'}
              </button>
            )}
          </div>
        </div>
      </div>
      {/* Right Section */}
      <div className="flex flex-col items-start sm:items-end gap-2 w-full sm:w-auto">
        <span className="text-[#1D8751] text-base sm:text-lg font-medium">
          P2P Balance
        </span>
        <div className="flex items-end gap-2">
          <span className="text-gray-900 dark:text-white text-lg sm:text-xl font-semibold">
            {formatCurrency(balance ?? 0, "USDT")}
          </span>
          <span className="text-gray-500 dark:text-[#7B8191] text-base sm:text-lg">
            ≈ {formatCurrency(balance ?? 0, "USD")}
          </span>
        </div>
        <span className="text-gray-500 dark:text-[#7B8191] text-sm">
          Total Volume:{" "}
          <span className="text-gray-900 dark:text-white font-medium">
            {formatCurrency(summary?.total_volume || 0, "USD")}
          </span>
        </span>
      </div>
    </div>
  );
};

export default P2pProfile;
