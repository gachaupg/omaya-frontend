import React, { useState, useEffect } from "react";
import Button from "@/components/ui/Button";
import { useDispatch, useSelector } from "react-redux";
import {
  createReferralWithdraw,
  clearSuccess,
} from "@/features/settings/slices/referralWalletSlice";
import { AppDispatch } from "@/store/rootReducer";
import { validateWithdrawalForm } from "@/features/p2p/components/ui/p2pdashboard/sections/validation";
import { useRouter } from "next/navigation";

const Withdraw = () => {
  const [walletAddress, setWalletAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [confirmAddress, setConfirmAddress] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errors, setErrors] = useState<{
    amount?: string;
    walletAddress?: string;
    confirmAddress?: string;
  }>({});
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { loading, error, success } = useSelector(
    (state: any) => state.referralWallet
  );

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setWalletAddress(text);
    } catch (err) {
      // Optionally handle error (e.g., show a toast)
    }
  };

  const validate = () => {
    const validationErrors = validateWithdrawalForm(
      {
        amount,
        walletAddress,
        file: null,
        confirmPayment: true,
      },
      "TRC20"
    );
    const errorObj: {
      amount?: string;
      walletAddress?: string;
      confirmAddress?: string;
    } = {};

    validationErrors.forEach((err) => {
      if (err.field === "amount" || err.field === "walletAddress") {
        errorObj[err.field] = err.message;
      }
    });

    // Validate wallet address confirmation
    if (!confirmAddress) {
      errorObj.confirmAddress =
        "Please confirm that the wallet address is correct";
    }

    setErrors(errorObj);
    return validationErrors.length === 0 && confirmAddress;
  };

  const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    dispatch(
      createReferralWithdraw({
        requested_amount: amount,
        wallet_address: walletAddress,
      })
    );
  };

  // Handle success and navigation
  useEffect(() => {
    if (success) {
      setShowSuccess(true);
      // Reset form
      setAmount("");
      setWalletAddress("");
      setConfirmAddress(false);
      setErrors({});

      setTimeout(() => {
        setShowSuccess(false);
        dispatch(clearSuccess()); // Clear success state
        router.back();
      }, 2000);
    }
  }, [success, router, dispatch]);

  const commission = 0;
  const networkFee = 0;
  const totalFees = commission + networkFee;
  const netAmount = amount;
  const totalWithFees = Number(amount || 0) + totalFees;

  return (
    <div className="min-h-screen text-white flex flex-col items-center">
      {/* Success Message */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#1D1D23] border border-[#1D8751] rounded-2xl p-8 max-w-md mx-4 text-center">
            <div className="mb-4">
              <svg
                className="w-16 h-16 text-[#1D8751] mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              Withdrawal Successful!
            </h3>
            <p className="text-[#A3A3A3] mb-4">
              Your withdrawal request has been submitted successfully.
              Redirecting back...
            </p>
          </div>
        </div>
      )}

    <div className="min-h-screen dark:text-white text-[#0D0D0D] flex flex-col items-center">
      {/* Withdraw Form Card */}
      <div className="w-full max-w-2xl rounded-2xl p-6 shadow-lg">
        <form onSubmit={handleWithdraw}>
          {/* Tabs for USDT TRC20 / Cash */}
          <div className="flex gap-2 mb-6 border border-[#EF4444] rounded-lg p-1 w-fit">
            <button className="px-6 py-2 rounded-lg bg-[#EF4444] text-white font-semibold text-base">
              USDT TRC20
            </button>
            <button className="px-6 py-2 rounded-lg bg-[#23232B] text-[#A3A3A3] font-semibold text-base">
              Cash
            </button>
          </div>
          {/* 1- Transaction Info */}
          <div className="text-xs font-bold mb-2">1- Transaction Info</div>

          <div className="mb-3 p-3 border border-[#35353F] bg-[#1D1D23] rounded-lg">
            <div className="flex  flex-col md:flex-row gap-4 mb-2">
              <div className="flex-1">
                <label className="block text-[#A3A3A3] mb-1">Amount</label>
                <input
                  className={`w-full bg-[#18181B] border border-[#35353F] rounded-[18px] px-1 py-1 text-white text-lg focus:outline-none ${
                    errors.amount ? "border-red-500" : ""
                  }`}
                  placeholder="102"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
                {errors.amount && (
                  <div className="text-red-500 text-xs mt-1">
                    {errors.amount}
                  </div>
                )}
              </div>
              <div className="flex-1">
                <label className="block text-[#A3A3A3] mb-1">
                  I want to Recieve Net
                </label>
                <div className="flex items-center bg-[#18181B] border border-[#35353F] rounded-[18px] px-1 py-1">
                  <span className="text-[#1D8751] text-2xl font-bold mr-2">
                    $ {netAmount || "0"}
                  </span>
                  <span className="ml-auto text-[#A3A3A3]">USD</span>
                </div>
              </div>
            </div>
            <div className="flex items-center text- text-sm mb-2 mt-1">
              <svg
                width="18"
                height="18"
                fill="none"
                viewBox="0 0 24 24"
                className="mr-1"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="#EF4444"
                  strokeWidth="2"
                />
                <path
                  d="M12 8v4"
                  stroke="#EF4444"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <circle cx="12" cy="16" r="1" fill="#EF4444" />
              </svg>
              <span className="text-[#fffff]">
                This is only estimated price and its based on current Market
                Price. We will fix the price when we receive the funds .
              </span>
            </div>
            {/* Amount & Fees */}
            <div className=" border border-[#35353F] rounded-xl p-4 flex flex-col md:flex-row gap-4 items-center mb-2">
              <div className="flex-1 flex flex-col ">
                <div className="text-[#A3A3A3] mb-1">
                  Net Amount to Transfer
                </div>
                <button className="w-full bg-[#35353F] text-white font-bold text-[14px] rounded-[18px] px-2 py-2">
                  Amount including Total Fees{" "}
                  <span className="bg-[#1D8751] rounded-lg px-2 py-1 text-white text-12">
                    ${totalWithFees}
                  </span>
                </button>
              </div>
              <div className="flex-1 border rounded-lg border-[#35353F]  p-3 flex flex-col gap-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#A3A3A3]">Commission:</span>
                  <span className="text-[#1D8751]">$0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#A3A3A3]">Network Fee:</span>
                  <span className="text-[#1D8751]">$0</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span className="text-[#EF4444]">Total Fees</span>
                  <span className="text-[#EF4444]">${totalFees}</span>
                </div>
              </div>
            </div>
            <div className="flex items-start text-[#FACC15] text-xs mb-1">
              <svg
                width="16"
                height="16"
                fill="none"
                viewBox="0 0 24 24"
                className="mr-1 mt-0.5 flex-shrink-0"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="#FACC15"
                  strokeWidth="2"
                />
                <path
                  d="M12 8v4"
                  stroke="#FACC15"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <circle cx="12" cy="16" r="1" fill="#FACC15" />
              </svg>
              <span className="text-white">
                Transactions are subject to commission, above is the information
                on the commission rates
              </span>
            </div>
          </div>
          {/* 2- Wallet Address */}
          <div>
            <div className="text-[14px]  font-bold mb-2">
              2- Your Wallet Address
            </div>
            <div className="mb-2 border border-[#35353F]  bg-[#1D1D23] p-3 rounded-[18px]">
              <label className="block text-[#A3A3A3] mb-1">
                Wallet/Account Address
              </label>
              <div className="flex items-center bg-[#18181B] border border-[#35353F] rounded-[18px] px-4 py-3">
                <span className="text-[#1D8751] mr-2">📋</span>
                <input
                  className="flex-1 bg-transparent text-white text-lg focus:outline-none"
                  placeholder="Paste here your Crypto address"
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                />
                <button
                  className="ml-2 text-[#1D8751] px-3 py-1 rounded-[18px] bg-[#35353F] text-sm"
                  type="button"
                  onClick={handlePaste}
                >
                  Paste
                </button>
              </div>
              <div className="flex items-start text-[#FACC15] text-xs mb-2">
                <input
                  type="checkbox"
                  className="mr-2 mt-1 accent-[#1D8751] flex-shrink-0"
                  checked={confirmAddress}
                  onChange={(e) => setConfirmAddress(e.target.checked)}
                />
                <span className="text-white">
                  I confirm that the above submitted address is correct Address
                  for the Cryptocurrency I chose, and not other Crypto *
                </span>
              </div>
              {errors.confirmAddress && (
                <div className="text-red-500 text-xs mb-2">
                  {errors.confirmAddress}
                </div>
              )}
              <div className="bg-[#18181B] border border-[#1D8751] rounded-xl p-4 mb-4">
                <div className="flex items-center mb-2 text-[#1D8751] font-semibold text-base">
                  <svg
                    width="18"
                    height="18"
                    fill="none"
                    viewBox="0 0 24 24"
                    className="mr-1"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="#1D8751"
                      strokeWidth="2"
                    />
                    <path
                      d="M12 8v4"
                      stroke="#1D8751"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <circle cx="12" cy="16" r="1" fill="#1D8751" />
                  </svg>
                  Transfer Details
                </div>
                <ul className="list-disc pl-6 text-[#A3A3A3] text-sm space-y-1">
                  <li className="text-[#1D8751]">
                    Please send the money from your own account Only
                  </li>
                  <li>
                    Put transaction ID in the description field of the bank
                  </li>
                  <li>
                    Please note, If you do not follow above conditions, we will
                    reject your transaction and send you back your money.
                  </li>
                </ul>
              </div>
              <Button
                variant="primary"
                size="lg"
                className="w-full bg-[#EF4444] hover:bg-[#d32f2f] text-white font-semibold text-[14px] rounded-[18px] py-3 mt-4 flex items-center justify-center transition-all duration-200 transform hover:scale-[1.02]"
                type="submit"
                disabled={loading}
              >
                {loading && (
                  <svg
                    className="animate-spin h-5 w-5 mr-2 text-white"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8z"
                    />
                  </svg>
                )}
                {loading ? "Processing..." : "Withdraw"}
              </Button>
              {error && (
                <div className="text-red-500 text-xs mt-2 text-center">
                  {typeof error === "string" ? error : JSON.stringify(error)}
                </div>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Withdraw;
