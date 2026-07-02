"use client";
import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import ExpressExchangeForm from "./ExpressExchangeForm";
import { useTheme } from "@/context/theme";
import { scrollAppToTop } from "@/lib/utils/scrollAppToTop";

interface ExpressProps {
  isHomePage?: boolean;
}

const Express = ({ isHomePage = false }: ExpressProps) => {
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

  useEffect(() => {
    if (!isHomePage || typeof window === "undefined") return;
    window.localStorage.removeItem("express_transaction_data");
    window.localStorage.removeItem("express_transaction_expiry");
  }, [isHomePage]);

  const handleModeToggle = () => {
    if (isHomePage && !isAuthenticated) {
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

    scrollAppToTop();
    router.push(
      `/dashboard/express-exchange?resumeStatus=1&mode=${encodeURIComponent(mode)}`
    );
  };

  return (
    <div className="w-full overflow-x-hidden">
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
        </div>
      )}
      <ExpressExchangeForm
        onExchange={handleExchange}
        initialMode={currentMode}
        isHomePage={isHomePage}
      />
    </div>
  );
};

export default Express;
