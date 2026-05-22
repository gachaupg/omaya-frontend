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

  /** Rates (and other flows) stash payload in localStorage then `?resumeStatus=1` — same handoff as deposit/withdrawal onExchange. */
  useEffect(() => {
    if (!searchParams || searchParams.get("resumeStatus") !== "1") return;
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem("express_transaction_data");
      if (!raw) return;
      const parsed = JSON.parse(raw) as { transactionId?: string; type?: string };
      if (!parsed?.transactionId) return;
      setTransactionData(parsed);
      setShowExchanging(true);
      scrollAppToTop();
      if (parsed.type === "deposit" || parsed.type === "withdrawal") {
        setCurrentMode(parsed.type);
      }
      router.replace("/dashboard/express-exchange", { scroll: false });
    } catch {
      /* ignore */
    }
  }, [searchParams, router]);

  useScrollAppToTopWhen(showExchanging && !!transactionData);

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
    <div className="w-full max-w-5xl mx-auto box-border px-3 sm:px-4 md:px-6 lg:px-8 pt-0 mb-0 overflow-x-hidden">
      {!isHomePage && (
        <div className="mb-1">
          <button
            onClick={handleModeToggle}
            className="hover:opacity-80  transition-opacity"
            title={`Switch to ${currentMode === "deposit" ? "withdrawal" : "deposit"} mode`}
          >
            <span
              className="flex items-center justify-center text-xl sm:text-2xl font-bold text-[#76777B] dark:text-white [.deem_&]:text-white uppercase"
              suppressHydrationWarning
            >
              <span>E</span>
              {mounted && (
                <>
                  {isDark ? (
                    <img src="/images/xwhite.png" alt="Express" className="mt-2" />
                  ) : (
                    <img src="/images/x.png" alt="Express" className="mt-2" />
                  )}
                </>
              )}
              <span className="ml-[-3px]">CHANGE</span>
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
