"use client";
import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/store/rootReducer";
import { FaUserCircle } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { fetchMatchedTrades } from "@/features/p2p/slices/matchedTradesSlice";
import { MatchedTradesResponse } from "@/features/p2p/types";
import { div } from "framer-motion/client";

const getOrderType = (order_type: string) => {
  if (order_type === "buy") {
    return { label: "Sell", color: "text-red-400" };
  } else {
    return { label: "Buy", color: "text-[#1D8751]" };
  }
};

const getStatus = (trade: any, userEmail: string) => {
  if (trade.owner === userEmail) {
    return { text: "Pending Incoming Trade", color: "text-[#1D8751]" };
  } else {
    return {
      text: `Pending ${trade.order_type} Trade`,
      color: "text-yellow-500",
    };
  }
};

const truncate = (str: string, n: number) =>
  str.length > n ? str.slice(0, n - 3) + "..." : str;

const Notifications = () => {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { data: matchedTrades, loading } = useSelector(
    (state: RootState) => state.matchedTrades
  );
  const { user } = useSelector((state: RootState) => state.auth);
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (isAuthenticated) {
      // First, get page 1 to determine total count and pages
      dispatch(fetchMatchedTrades(1)).then((result) => {
        const payload = result.payload as MatchedTradesResponse;
        if (payload && payload.count) {
          const itemsPerPage = 10; // Assuming 10 items per page based on the data
          const calculatedTotalPages = Math.ceil(payload.count / itemsPerPage);
          setTotalPages(calculatedTotalPages);

          // Always start from the last page to show latest notifications
          if (calculatedTotalPages > 0) {
            setCurrentPage(calculatedTotalPages);
            dispatch(fetchMatchedTrades(calculatedTotalPages));
          }
        }
      });
    }
  }, [dispatch, isAuthenticated]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    dispatch(fetchMatchedTrades(page));
  };

  // Reverse pagination: Next = go to previous page, Previous = go to next page
  const handleNextPage = () => {
    if (currentPage > 1) {
      handlePageChange(currentPage - 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage < totalPages) {
      handlePageChange(currentPage + 1);
    }
  };
  // console.log(user?.email);
  // console.log(matchedTrades?.results);
  const handleViewOrder = (trade: any) => {
    // Store the full order in local storage
    try {
      const fullOrderData = {
        ...trade, // Store the complete trade object
        storedAt: new Date().toISOString(),
        viewedFrom: "notifications",
      };

      localStorage.setItem("new_order", JSON.stringify(fullOrderData));

      // Also store in a general orders list for easy access
      const existingOrders = JSON.parse(
        localStorage.getItem("p2p_orders") || "[]"
      );
      const orderExists = existingOrders.find(
        (order: any) => order.id === trade.id
      );

      if (!orderExists) {
        existingOrders.push(fullOrderData);
        localStorage.setItem("p2p_orders", JSON.stringify(existingOrders));
      } else {
        // Update existing order with latest data
        const orderIndex = existingOrders.findIndex(
          (order: any) => order.id === trade.id
        );
        existingOrders[orderIndex] = fullOrderData;
        localStorage.setItem("p2p_orders", JSON.stringify(existingOrders));
      }
    } catch (error) {
      console.error("Error storing order in localStorage:", error);
    }

    const status = getStatus(trade, user?.email || "");
    if (
      status.text ===
      `Pending ${trade.order_type} Trade`
    ) {
      if (trade.owner === user?.email) {
        router.push(
          `/p2p/${trade.id}/matched?order_type=${
            trade.order_type === "buy" ? "sell" : "buy"
          }&trade=buyer`
        );
      } else {
        const searchParams = new URLSearchParams();
        searchParams.set(
          "orderData",
          JSON.stringify({
            order_type: trade.order_type === "buy" ? "sell" : "buy",
          })
        );

        router.push(`/p2p/${trade.id}/matched?${searchParams.toString()}`);
      }
    } else {
      router.push(
        `/p2p/${trade.id}/matched?order_type=${
          trade.order_type === "buy" ? "sell" : "buy"
        }&trade=seller`
      );
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#1D8751]"></div>
      </div>
    );

  if (!matchedTrades || !matchedTrades.results)
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <div className="w-24 h-24 mb-4 text-[#A3A3C2]">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-[#A3A3C2] mb-2">
          No Notifications
        </h3>
        <p className="text-[#A3A3C2] max-w-md">
          You don't have any notifications at the moment. When you receive
          notifications, they will appear here.
        </p>
      </div>
    );

  return (
    <div className="max-w-5xl mx-auto px-4">
      <div className="flex items-center justify-between mb-6">
        <h6 className="text-[#A3A3C2] text-xl font-semibold">
          Notifications Center
        </h6>
        <span className="text-sm text-[#A3A3C2]">
          {matchedTrades.count || matchedTrades.results.length}{" "}
          {(matchedTrades.count || matchedTrades.results.length) === 1
            ? "notification"
            : "notifications"}
        </span>
      </div>

      <div className="bg-[#23232B] rounded-xl p-4 text-white font-sans shadow-lg">
        {matchedTrades.results.map((trade: any) => {
          const orderType = getOrderType(trade.order_type);
          const status = getStatus(trade, user?.email || "");
          const name = truncate(trade.advertiser_name || trade.owner || "", 14);
          return (
            <div
              key={trade.id}
              className="flex items-center bg-[#23232B] rounded-lg py-3 px-4 mb-2 border-b border-[#31313C] hover:bg-[#2A2A33] transition-colors duration-200"
            >
              {/* Avatar and name/amount */}
              <div className="flex items-center min-w-[160px]">
                <div className="relative">
                  <FaUserCircle size={36} className="text-[#A3A3C2] mr-3" />
                  <div
                    className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full ${
                      orderType.color === "text-[#1D8751]"
                        ? "bg-[#1D8751]"
                        : "bg-red-400"
                    }`}
                  ></div>
                </div>
                <div>
                  <div className="font-medium text-sm text-[#c7c7d9]">
                    {name}
                  </div>
                  <div className="text-xs text-white font-semibold">
                    {trade.amount} USDT
                  </div>
                </div>
              </div>
              {/* Order type and time */}
              <div className="flex-1 ml-3">
                <div className="text-sm">
                  Order Type:{" "}
                  <span className={orderType.color + " font-semibold"}>
                    {orderType.label}
                  </span>
                </div>
                <div className="text-xs text-[#A3A3C2] mt-1">
                  {new Date(trade.timestamp).toLocaleString()}
                </div>
              </div>
              {/* Status */}
              <div className="min-w-[140px] text-right">
                <span
                  className={`${
                    status.color
                  } font-semibold text-sm px-3 py-1 rounded-full bg-opacity-10 ${
                    status.color === "text-[#1D8751]"
                  }`}
                >
                  {status.text}
                </span>
              </div>
              {/* View Order button */}
              <div className="min-w-[100px] text-right ml-4">
                <button
                  onClick={() => handleViewOrder(trade)}
                  className="bg-[#1D8751] hover:bg-[#17693F] text-white px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 hover:shadow-lg hover:scale-105"
                >
                  View Order
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center mt-6 space-x-2">
          <button
            onClick={handlePreviousPage}
            disabled={currentPage === totalPages}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
              currentPage === totalPages
                ? "bg-[#31313C] text-[#A3A3C2] cursor-not-allowed"
                : "bg-[#1D8751] text-white hover:bg-[#17693F]"
            }`}
          >
            Previous
          </button>

          <div className="flex space-x-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                    currentPage === pageNum
                      ? "bg-[#1D8751] text-white"
                      : "bg-[#31313C] text-[#A3A3C2] hover:bg-[#2A2A33]"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button
            onClick={handleNextPage}
            disabled={currentPage === 1}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
              currentPage === 1
                ? "bg-[#31313C] text-[#A3A3C2] cursor-not-allowed"
                : "bg-[#1D8751] text-white hover:bg-[#17693F]"
            }`}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default Notifications;
