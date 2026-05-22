"use client";
import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";

import { useTheme } from "@/context/theme";
import {
  buildExpressRedirectPath,
  setAuthRedirectPath,
  getExpressHomeFormState,
} from "@/lib/utils/authRedirect";
import Exchanging from "../components/exchnaging";
import ExpressExchangeForm from "../components/ExpressExchangeForm";
import { useScrollAppToTopWhen } from "@/hooks/useScrollAppToTopWhen";
import { scrollAppToTop } from "@/lib/utils/scrollAppToTop";

interface ExpressProps {
  isHomePage?: boolean;
}

const Express = ({ isHomePage = false }: ExpressProps) => {
  const [showExchanging, setShowExchanging] = useState(false);
  const [transactionData, setTransactionData] = useState<any>(null);
  const [currentMode, setCurrentMode] = useState<"deposit" | "withdrawal">(
    "deposit"
  );
  const [mounted, setMounted] = useState(false);
  const { isDark } = useTheme();
  const router = useRouter();
  const { isAuthenticated } = useSelector((state: any) => state.auth);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Home UX: if user navigates away/refreshes, return to the main form (do not restore exchanging).
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem("express_transaction_data");
    window.localStorage.removeItem("express_transaction_expiry");
  }, []);

  useScrollAppToTopWhen(showExchanging && !!transactionData);

  const handleModeToggle = () => {
    // If on home page and not authenticated, navigate to login (include saved amount/asset)
    if (isHomePage && !isAuthenticated) {
      const nextMode = currentMode === "deposit" ? "withdrawal" : "deposit";
      const savedState = getExpressHomeFormState();
      setAuthRedirectPath(buildExpressRedirectPath(nextMode, savedState || undefined));
      router.push("/auth/login");
      return;
    }
    setCurrentMode(currentMode === "deposit" ? "withdrawal" : "deposit");
  };

  return (
    <div className="w-full mx-auto pt-0 mb-0">
      {!isHomePage && (
        <div className=" mb-1">
          <button
            onClick={handleModeToggle}
            className="hover:opacity-80  transition-opacity"
            title={`Switch to ${currentMode === "deposit" ? "withdrawal" : "deposit"} mode`}
          >
            <span
              className="flex items-center justify-center"
              suppressHydrationWarning
            >
              {mounted && isDark ? (
                <>
                  <span className="flex items-center justify-center">
                    <span className="text-[#727272] text-base uppercase font-bold">
                      E
                    </span>

                    <img
                      className="mt-2"
                      src="/assets/Group_9_gen9av.png"
                      alt=""
                    />
                  </span>
                </>
              ) : (
                <>
                  <span className="flex items-center justify-center">
                    <span className="text-[#727272] text-base uppercase font-bold">
                      E
                    </span>

                    <img
                      className="mt-2"
                      src="/assets/Group_9_gen9av.png"
                      alt=""
                    />
                  </span>
                </>
              )}
            </span>
          </button>
          {/* <div className="mt-2 text-sm text-gray-600">
          Current Mode: <span className="font-semibold capitalize">{currentMode}</span>
        </div> */}
        </div>
      )}
      {showExchanging ? (
        <Exchanging transactionData={transactionData} />
      ) : (
        <ExpressExchangeForm
          onExchange={(data) => {
            setTransactionData(data);
            setShowExchanging(true);
            scrollAppToTop();
          }}
          initialMode={currentMode}
          isHomePage={isHomePage}
        />
      )}
      {/* <Exchanging transactionData={transactionData} /> */}
      {/* 
                     <SuccessPage transactionData={transactionData} /> 


       */}
    </div>
  );
};

export default Express;
