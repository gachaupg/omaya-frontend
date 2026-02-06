"use client";
import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useRouter, useSearchParams } from "next/navigation";
import ExpressExchangeForm from "./ExpressExchangeForm";
import Exchanging from "./exchnaging";
import SuccessPage from "./success";
import { useTheme } from "@/context/theme";
import {
  buildExpressRedirectPath,
  setAuthRedirectPath,
} from "@/lib/utils/authRedirect";

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
  const searchParams = useSearchParams();
  const { isAuthenticated } = useSelector((state: any) => state.auth);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!searchParams) return;
    const modeParam = searchParams.get("mode");
    if (modeParam === "deposit" || modeParam === "withdrawal") {
      setCurrentMode(modeParam);
    }
  }, [searchParams]);

  const handleModeToggle = () => {
    // If on home page and not authenticated, navigate to login
    if (isHomePage && !isAuthenticated) {
      const nextMode = currentMode === "deposit" ? "withdrawal" : "deposit";
      setAuthRedirectPath(buildExpressRedirectPath(nextMode));
      router.push("/auth/login");
      return;
    }
    setCurrentMode(currentMode === "deposit" ? "withdrawal" : "deposit");
  };

  return (
    <div className="w-full max-w-full box-border px-4 sm:px-6 pt-0 mb-0 overflow-x-hidden">
      {!isHomePage && (
        <div className="mb-1">
          <button
            onClick={handleModeToggle}
            className="hover:opacity-80  transition-opacity"
            title={`Switch to ${currentMode === "deposit" ? "withdrawal" : "deposit"} mode`}
          >
            <span
              className="flex items-center justify-center"
              suppressHydrationWarning
            >
              <span className="text-[#76777B] dark:text-white text-base uppercase font-bold">
                E
              </span>
              {mounted && (
                <>
                  {isDark ? (
                    <img src="/images/xwhite.png" alt="Express" className="mt-2" />
                  ) : (
                    <img src="/images/x.png" alt="Express" className="mt-2" />
                  )}
                </>
              )}
              <span className="text-[#76777B] dark:text-white text-base uppercase font-bold ml-[-3px]">
                CHANGE
              </span>
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
