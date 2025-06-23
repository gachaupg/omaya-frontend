import React, { useState, useEffect } from "react";
import Withdraw from "./Withdraw";
import { RootState, AppDispatch } from "@/store/rootReducer";
import { useSelector, useDispatch } from "react-redux";
import { fetchReferredUsers } from "../../slices/referralSlice";
import { fetchReferralWallet } from "../../slices/referralWalletSlice";
import ReferralTabs from "./sections/ReferralTabs";
import ReferralMainCard from "./sections/ReferralMainCard";
import ReferralUsersList from "./sections/ReferralUsersList";

const Referral = () => {
  const [tab, setTab] = useState("Referral");
  const [showWithdrawPage, setShowWithdrawPage] = useState(false);

  const { user, isAuthenticated } = useSelector(
    (state: RootState) => state.auth
  );
  const { referredUsers, loading } = useSelector(
    (state: RootState) => state.referral
  );
  const {
    data: walletData,
    loading: walletLoading,
    error: walletError,
  } = useSelector((state: RootState) => state.referralWallet);

  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    const fetchData = async () => {
      if (user?.referral_code && isAuthenticated) {
        try {
          await Promise.all([
            dispatch(fetchReferredUsers(user.referral_code)),
            dispatch(fetchReferralWallet()),
          ]);
        } catch (error) {
          console.error("Error fetching referral data:", error);
        }
      }
    };
    fetchData();
  }, [user?.referral_code, dispatch, isAuthenticated]);

  if (showWithdrawPage) {
    return (
      <div className="min-h-screen bg-[#18181B] text-white flex flex-col items-center ">
        <Withdraw />
      </div>
    );
  }

  return (
    <div className="text-white bg-[#18181B]">
      <ReferralTabs tab={tab} setTab={setTab} />

      {/* Main Card & Users Section */}
      {tab === "Referral" && (
        <>
          <ReferralMainCard
            user={user}
            walletData={walletData}
            walletLoading={walletLoading}
            walletError={walletError}
            setShowWithdrawPage={setShowWithdrawPage}
          />
          <ReferralUsersList referredUsers={referredUsers} loading={loading} />
        </>
      )}
      {tab === "History" && (
        <div className="text-center py-12 text-[#A3A3A3] text-lg">
          History page content goes here.
        </div>
      )}
    </div>
  );
};

export default Referral;
