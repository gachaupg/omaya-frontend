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

  // Home UX: landing on the widget should not restore a stale inline exchanging state.
  useEffect(() => {
    if (!isHomePage || typeof window === "undefined") return;
    window.localStorage.removeItem("express_transaction_data");
    window.localStorage.removeItem("express_transaction_expiry");
  }, [isHomePage]);

  const handleModeToggle = () => {
    if (isHomePage && !isAuthenticated) {
      const nextMode = currentMode === "deposit" ? "withdrawal" : "deposit";
      const savedState = getExpressHomeFormState();
      setAuthRedirectPath(
        buildExpressRedirectPath(nextMode, savedState || undefined)
      );
      router.push("/auth/login");
      return;
    }
    setCurrentMode(currentMode === "deposit" ? "withdrawal" : "deposit");
  };

  const handleExchange = (data: any) => {
    const mode = data?.type === "withdrawal" ? "withdrawal" : "deposit";

    if (isHomePage) {
      if (typeof window !== "undefined") {
        localStorage.setItem("express_transaction_data", JSON.stringify(data));
      }
      scrollAppToTop();
      router.push(
        `/dashboard/express-exchange?resumeStatus=1&mode=${encodeURIComponent(mode)}`
      );
      return;
    }

    setTransactionData(data);
    setShowExchanging(true);
    scrollAppToTop();
  };

  if (isHomePage) {
    return (
      <div className="w-full mx-auto pt-0 mb-0">
        <ExpressExchangeForm
          onExchange={handleExchange}
          initialMode={currentMode}
          isHomePage={isHomePage}
        />
      </div>
    );
  }

  return (
    <div className="w-full mx-auto pt-0 mb-0">
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
      </div>
      {showExchanging ? (
        <Exchanging transactionData={transactionData} />
      ) : (
        <ExpressExchangeForm
          onExchange={handleExchange}
          initialMode={currentMode}
          isHomePage={isHomePage}
        />
      )}
    </div>
  );
};

export default Express;
