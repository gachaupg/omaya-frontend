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
    <div className="w-full  mx-auto px-3 sm:px-4 pt-2 mb-4">
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
                      src="https://res.cloudinary.com/pitz/image/upload/v1752561097/Group_9_gen9av.png"
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
                      src="https://res.cloudinary.com/pitz/image/upload/v1752561097/Group_9_gen9av.png"
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
