import React, { useState, useEffect, useRef } from "react";
import Button from "../../Common/Button";
import { FaCheckCircle, FaRegClock, FaTimes } from "react-icons/fa";
import { ThumbsUp } from "lucide-react";
import { TiArrowUnsorted } from "react-icons/ti";
import { MarketTableProps } from "./types";
import TradePreview from "./sections/tradePreview";
import { UserStatusBadge } from "./sections/UserStatusBadge";
import Loader from "../../Common/Loader";
import Image from "next/image";

import { logger } from '@/lib/utils/logger';

const DUMMY_PAYMENT_LOGO = "/default-provider-logo.svg";

const PAYMENT_LOGOS: Record<string, string> = {
  "salam bank": "/images/salam.svg",
  "salaam bank": "/images/salam.svg",
};

const getPaymentLogo = (provider?: string | null) => {
  if (!provider) return DUMMY_PAYMENT_LOGO;
  const normalized = provider.trim().toLowerCase();
  return PAYMENT_LOGOS[normalized] || DUMMY_PAYMENT_LOGO;
};

const MarketTable: React.FC<MarketTableProps> = ({
  data = [],
  currentPage = 1,
  totalPages = 1,
  onPageChange = () => { },
  loading = false,
  activeTab = "buy",
}) => {
  const [selectedRowIndex, setSelectedRowIndex] = useState<number | null>(null);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);
  const [imageModal, setImageModal] = useState<{
    isOpen: boolean;
    imageUrl: string;
    advertiserName: string;
  }>({
    isOpen: false,
    imageUrl: "",
    advertiserName: "",
  });

  // Toggle the trade preview when clicking BUY/SELL
  // - First click on a row opens its preview
  // - Clicking the same row again closes the preview
  // - Clicking a different row switches the preview to that advertiser
  const handleTradeClick = (i: number) => {
    setSelectedRowIndex((current) => (current === i ? null : i));
  };

  const handleMessagesClick = (row: any) => {
    // Open messages in new tab using the order ID
    const orderId = row.id;
    if (orderId) {
      window.open(`/p2p/messages/${orderId}`, '_blank');
    } else {
      console.error('No order ID found for trade:', row);
    }
  };

  const handleImageClick = (imageUrl: string, advertiserName: string) => {
    setImageModal({
      isOpen: true,
      imageUrl,
      advertiserName,
    });
  };

  const closeImageModal = () => {
    setImageModal({
      isOpen: false,
      imageUrl: "",
      advertiserName: "",
    });
  };

  const modalScrollRef = useRef<HTMLDivElement | null>(null);

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && imageModal.isOpen) {
        closeImageModal();
      }
    };

    if (imageModal.isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [imageModal.isOpen]);


  const handleSort = (key: string) => {
    setSortConfig((prev) => ({
      key,
      direction: prev?.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const getSortIcon = (key: string) => {
    return <TiArrowUnsorted className="w-3 h-3 ml-1 text-gray-400" />;
  };

  // Display all data from parent - no extra filtering (parent already filters)
  const filteredData = data;

  // Reset selection when data changes to avoid stale/wrong row in modal
  const dataIds = data.map((r) => r?.id).join(",");
  useEffect(() => {
    setSelectedRowIndex(null);
  }, [dataIds]);

  // Build pagination pages with ellipsis when there are many pages
  // Ensures current page is always visible and stays active when selected
  const getPaginationPages = () => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: (number | string)[] = [];
    pages.push(1);

    // Always include current page and its neighbors
    const centerStart = Math.max(2, currentPage - 1);
    const centerEnd = Math.min(totalPages - 1, currentPage + 1);
    if (currentPage > 4) {
      pages.push("...");
    }
    for (let p = centerStart; p <= centerEnd; p++) {
      if (!pages.includes(p)) pages.push(p);
    }
    if (currentPage < totalPages - 3) {
      pages.push("...");
    }
    if (totalPages > 1 && !pages.includes(totalPages)) {
      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <div className="w-full mt-4">
      <div className="overflow-x-auto rounded-2xl">
        <div className="min-w-0 md:min-w-[920px] w-full overflow-hidden border bg-white border-gray-200 rounded-2xl dark:bg-[var(--card-color)] dark:border-[#35353E]">
          {/* ---------------- Desktop header row ---------------- */}
          <div className="hidden md:grid grid-cols-6 py-3 px-4 border-b bg-gray-50 border-gray-200 text-xs font-semibold text-gray-500 dark:bg-[#35353E] dark:border-[#35353E] dark:text-[#788099]">
            <div
              className="min-w-[200px] flex items-center cursor-pointer hover:text-gray-700 dark:hover:text-gray-300"
              onClick={() => handleSort("advertiser")}
            >
              Advertiser {getSortIcon("advertiser")}
            </div>
            <div className="min-w-[100px] flex items-center justify-center">
              Status
            </div>
            <div
              className="min-w-[120px] flex items-center cursor-pointer hover:text-gray-700 dark:hover:text-gray-300"
              onClick={() => handleSort("commission")}
            >
              Rate {getSortIcon("commission")}
            </div>
            <div
              className="min-w-[180px] flex items-center cursor-pointer hover:text-gray-700 dark:hover:text-gray-300"
              onClick={() => handleSort("available")}
            >
              Available/Order Limit {getSortIcon("available")}
            </div>
            <div
              className="min-w-[200px] flex items-center cursor-pointer hover:text-gray-700 dark:hover:text-gray-300"
            // onClick={() => handleSort("payment")}
            >
              Payment
            </div>
            <div className="min-w-[120px] text-center">Trade</div>
          </div>

          {/* ---------------- empty state --------------- */}
          {filteredData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 sm:py-10 md:py-12 px-2 sm:px-3 md:px-4 bg-white dark:bg-[var(--bg-color)]">
              <div className="w-16 h-16 mb-4 rounded-full bg-gray-100 dark:bg-[#35353E] flex items-center justify-center">
                <FaRegClock className="text-gray-400 dark:text-[#788099] text-2xl" />
              </div>
              <h3 className="text-lg font-semibold text-gray-500 dark:text-[#788099] mb-2">
                No Orders Found
              </h3>
              <p className="text-sm text-gray-400 dark:text-[#8C8CA1] text-center max-w-md">
                There are currently no {activeTab === "buy" ? "buy" : "sell"}{" "}
                orders available. Please check back later or try adjusting your
                filters.
              </p>
            </div>
          ) : (
            /* ---------------- table rows --------------- */
            filteredData.map((row, idx) => (
              <React.Fragment key={row.id ?? `row-${idx}`}>
                {/* Desktop Grid View */}
                <div className="hidden md:grid grid-cols-6 items-center py-4 px-4 border-b last:border-b-0 bg-white hover:bg-gray-50 border-gray-200 dark:bg-[var(--card-color)] dark:hover:bg-[#2d2d36] dark:border-[#35353E]">
                  {/* Advertiser */}
                  <div className="flex flex-col gap-1 min-w-[200px]">
                    <div className="flex items-center gap-2">
                      {row.advertiser_photo ? (
                        <img
                          src={row.advertiser_photo}
                          alt={row.advertiser}
                          className="w-10 h-10 rounded-full object-cover cursor-pointer hover:opacity-80 transition-opacity bg-[#1D8751]"
                          onClick={() => handleImageClick(row.advertiser_photo, row.advertiser)}
                          onError={(e) => {
                            // Hide image and show fallback
                            (e.target as HTMLImageElement).style.display = 'none';
                            (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      <span className={`bg-[#1D8751] text-white h-10 w-10 rounded-[10px] text-xs font-bold flex items-center justify-center ${row.advertiser_photo ? 'hidden' : ''}`}>
                        {row.advertiserInitials}
                      </span>
                      <span className="font-medium flex items-center text-sm text-gray-900 dark:text-[#E4E4E6]">
                        {row.advertiser}
                        <FaCheckCircle className="text-[#FFD600] ml-1" />
                      </span>
                    </div>
                    <span className="text-xs text-gray-400 dark:text-[#8C8CA1]">
                      <span className="text-[#1D8751]">{row.orders}</span>{" "}
                      Orders |{" "}
                      <span className="text-[#1D8751]">{row.completion}</span>{" "}
                      Completion
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="flex items-center gap-1 text-xs text-[#1D8751] font-semibold">
                        <ThumbsUp height={10} /> {row.exchange_rate || '0'} %
                      </span>
                      <span className="flex items-center gap-1 text-xs text-[#1D8751] font-semibold">
                        <FaRegClock className="text-xs" /> {row.timeLimit || "—"}
                      </span>
                    </div>
                  </div>
                  {/* Advertiser online / offline */}
                  <div className="min-w-[100px] flex items-center justify-center">
                    <UserStatusBadge isLive={row.online} variant="presence" />
                  </div>
                  {/* Commission */}
                  <div className="text-sm font-semibold ml-7 text-gray-900 dark:text-[#E4E4E6] min-w-[120px]">
                    {row.commission}
                  </div>
                  {/* Available */}
                  <div className="flex flex-col min-w-[180px]">
                    <span className="font-semibold text-sm text-gray-900 dark:text-[#E4E4E6]">
                      {row.available}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-[#8C8CA1]">
                      Limit: {row.limit}
                    </span>
                  </div>
                  {/* Payment */}
                  <div className="flex flex-wrap gap-2 min-w-[200px] items-center">
                    {/* Show all when expanded, otherwise show 2 */}
                    {row.payment_details?.slice(0, selectedRowIndex === idx ? undefined : 2).map((method, i) => {
                      // Safely check if method exists before accessing properties
                      if (!method || typeof method !== 'object') {
                        return null;
                      }

                      const imageUrl =
                        (typeof method.provider_logo === "string" &&
                          method.provider_logo.trim()) ||
                        getPaymentLogo(method.provider);

                      return (
                        <span
                          key={i}
                          className="flex items-center gap-2 text-base font-medium text-gray-900 dark:text-white w-1/2"
                        >
                          <img
                            src={imageUrl}
                            alt={method.provider || ''}
                            className="w-6 h-6 rounded object-contain shrink-0"
                            style={{
                              width: '24px',
                              height: '24px',
                              display: 'block'
                            }}
                            loading="lazy"
                            onError={(e) => {
                              if (e.currentTarget.src !== DUMMY_PAYMENT_LOGO) {
                                e.currentTarget.src = DUMMY_PAYMENT_LOGO;
                              }
                            }}
                          />
                          {method.provider || ''}
                        </span>
                      );
                    })}
                    {/* Show +X only when row is NOT expanded */}
                    {selectedRowIndex !== idx && row.payment_details && row.payment_details.length > 2 && (
                      <span className="text-xs font-semibold text-muted-foreground bg-gray-100 dark:bg-accent px-2 py-1 rounded">
                        +{row.payment_details.length - 2}
                      </span>
                    )}
                  </div>

                  {/* Trade */}
                  <div className="flex justify-center gap-2 min-w-[120px]">
                    <Button
                      width={116}
                      height={35}
                      borderRadius={10}
                      variant={activeTab === "sell" ? "secondary" : "primary"}
                      size="sm"
                      className="min-w-[90px] font-semibold"
                      onClick={() => handleTradeClick(idx)}
                    >
                      {activeTab === "sell" ? "SELL USDT" : "BUY USDT"}
                    </Button>

                  </div>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden flex flex-col gap-2 sm:gap-3 p-2 sm:p-3 md:p-4 border-b last:border-b-0 bg-white hover:bg-gray-50 border-gray-200 dark:bg-[var(--card-color)] dark:hover:bg-[#2d2d36] dark:border-[#35353E]">
                  {/* Advertiser Section */}
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-accent">
                    {row.advertiser_photo ? (
                      <img
                        src={row.advertiser_photo}
                        alt={row.advertiser}
                        className="w-10 h-10 rounded-full object-cover cursor-pointer hover:opacity-80 transition-opacity bg-[#1D8751]"
                        onClick={() => handleImageClick(row.advertiser_photo, row.advertiser)}
                        onError={(e) => {
                          // Hide image and show fallback
                          (e.target as HTMLImageElement).style.display = 'none';
                          (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <span className={`bg-[#1D8751] text-white h-10 w-10 rounded-[10px] text-xs font-bold flex items-center justify-center ${row.advertiser_photo ? 'hidden' : ''}`}>
                      {row.advertiserInitials}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center gap-1">
                        <span className="font-medium text-sm text-gray-900 dark:text-[#E4E4E6]">
                          {row.advertiser}
                        </span>
                        <FaCheckCircle className="text-[#FFD600] text-xs" />
                      </div>
                      <div className="text-xs text-gray-400 dark:text-[#8C8CA1] mt-0.5">
                        <span className="text-[#1D8751]">{row.orders}</span> Orders | <span className="text-[#1D8751]">{row.completion}</span> Completion
                      </div>
                      <div className="mt-1">
                        <UserStatusBadge isLive={row.online} variant="presence" />
                      </div>
                    </div>
                  </div>

                  {/* Rate and Stats */}
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-gray-500 dark:text-[#8C8CA1]">Rate</span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-[#E4E4E6]">
                        {row.commission}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-xs text-[#1D8751] font-semibold">
                        <ThumbsUp height={10} /> {row.exchange_rate || '0'}%
                      </div>
                      <div className="flex items-center gap-1 text-xs text-[#1D8751] font-semibold">
                        <FaRegClock className="text-xs" /> {row.timeLimit || "—"}
                      </div>
                    </div>
                  </div>

                  {/* Available/Limit */}
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-500 dark:text-[#8C8CA1]">Available</span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-[#E4E4E6]">
                        {row.available}
                      </span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-xs text-gray-500 dark:text-[#8C8CA1]">Limit</span>
                      <span className="text-xs text-gray-400 dark:text-[#8C8CA1]">
                        {row.limit}
                      </span>
                    </div>
                  </div>

                  {/* Payment Methods */}
                  <div className="flex flex-col gap-2 pt-2 border-t border-gray-200 dark:border-accent">
                    <span className="text-xs text-gray-500 dark:text-[#8C8CA1]">Payment Methods</span>
                    <div className="flex flex-wrap gap-2">
                      {/* Show all when expanded, otherwise show 2 */}
                      {row.payment_details?.slice(0, selectedRowIndex === idx ? undefined : 2).map((method, i) => {
                        // Safely check if method exists before accessing properties
                        if (!method || typeof method !== 'object') {
                          return null;
                        }

                        const imageUrl =
                          (typeof method.provider_logo === "string" &&
                            method.provider_logo.trim()) ||
                          getPaymentLogo(method.provider);

                        return (
                          <span
                            key={i}
                            className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white"
                          >
                            <img
                              src={imageUrl}
                              alt={method.provider || ''}
                              className="w-5 h-5 rounded object-contain shrink-0"
                              style={{
                                width: '20px',
                                height: '20px',
                                display: 'block'
                              }}
                              loading="lazy"
                              onError={(e) => {
                                if (e.currentTarget.src !== DUMMY_PAYMENT_LOGO) {
                                  e.currentTarget.src = DUMMY_PAYMENT_LOGO;
                                }
                              }}
                            />
                            {method.provider || ''}
                          </span>
                        );
                      })}
                      {/* Show +X only when row is NOT expanded */}
                      {selectedRowIndex !== idx && row.payment_details && row.payment_details.length > 2 && (
                        <span className="text-xs text-gray-500 dark:text-[#8C8CA1]">
                          +{row.payment_details.length - 2} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Trade Button */}
                  <div className="pt-2 px-1">
                    <Button
                      width="100%"
                      height={40}
                      borderRadius={10}
                      variant={activeTab === "sell" ? "secondary" : "primary"}
                      size="sm"
                      className="w-full font-semibold"
                      onClick={() => handleTradeClick(idx)}
                    >
                      {activeTab === "sell" ? "SELL USDT" : "BUY USDT"}
                    </Button>
                  </div>
                </div>
              </React.Fragment>
            ))
          )}

          {/* Trade Preview Modal - Centered on screen */}
          {selectedRowIndex !== null && filteredData[selectedRowIndex] && (
            <div 
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
              onClick={() => setSelectedRowIndex(null)}
            >
              <div 
                ref={modalScrollRef}
                className="w-full max-w-5xl max-h-[100vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <TradePreview
                  advertiserData={filteredData[selectedRowIndex]}
                  onClose={() => setSelectedRowIndex(null)}
                  tradeType={activeTab as "buy" | "sell"}
                  paymentDetails={filteredData[selectedRowIndex].payment_details}
                  scrollContainerRef={modalScrollRef}
                />
              </div>
            </div>
          )}

          {/* ---------------- pagination --------------- */}
          {(filteredData.length > 0 || currentPage > 1) && (() => {
            const pagesToRender = getPaginationPages();
            // Disable next button if current page is empty or at last page
            const isNextDisabled = currentPage >= totalPages || filteredData.length === 0;
            return (
              <div className="flex justify-center items-center gap-2 py-4 bg-gray-50 dark:bg-[var(--bg-color)]">
                <button
                  onClick={() => onPageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`px-3 py-1 rounded-md text-sm font-medium border bg-white border-gray-200 text-gray-500 ${currentPage === 1
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-gray-100"
                    } dark:bg-[var(--card-color)] dark:border-[#35353E] dark:text-[#8C8CA1] dark:hover:bg-[#35353E]`}
                >
                  &lt;
                </button>

                {pagesToRender.map((page, idx) => {
                  if (page === "...") {
                    return (
                      <span
                        key={`ellipsis-${idx}`}
                        className="px-2 py-1 text-sm text-gray-400 dark:text-[#8C8CA1]"
                      >
                        ...
                      </span>
                    );
                  }

                  const pageNumber = page as number;
                  const isCurrentPage = Number(currentPage) === Number(pageNumber);
                  // Don't disable the button if it's a previous page we can navigate to
                  const isDisabled = isCurrentPage && filteredData.length === 0 && pageNumber >= currentPage;

                  return (
                    <button
                      key={pageNumber}
                      onClick={() => onPageChange(pageNumber)}
                      disabled={isDisabled}
                      className={`px-3 py-1 rounded-md text-sm font-medium border ${
                        isCurrentPage && !isDisabled
                          ? "bg-[#1D8751] text-white border-[#1D8751]"
                          : "bg-white text-gray-500 border-gray-200 hover:bg-gray-100 dark:bg-[var(--card-color)] dark:text-[#8C8CA1] dark:border-[#35353E] dark:hover:bg-[#35353E]"
                      } ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      {pageNumber}
                    </button>
                  );
                })}

                <button
                  onClick={() => onPageChange(currentPage + 1)}
                  disabled={isNextDisabled}
                  className={`px-3 py-1 rounded-md text-sm font-medium border bg-white border-gray-200 text-gray-500 ${isNextDisabled
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-gray-100"
                    } dark:bg-[var(--card-color)] dark:border-[#35353E] dark:text-[#8C8CA1] dark:hover:bg-[#35353E]`}
                >
                  &gt;
                </button>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Image Modal */}
      {imageModal.isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
          onClick={closeImageModal}
        >
          <div
            className="relative bg-white dark:bg-[var(--card-color)] rounded-2xl max-w-2xl max-h-[90vh] w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-[#35353E]">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {imageModal.advertiserName}'s Photo
              </h3>
              <button
                onClick={closeImageModal}
                className="p-2 hover:bg-gray-100 dark:hover:bg-[#35353E] rounded-full transition-colors"
              >
                <FaTimes className="w-5 h-5 text-gray-500 dark:text-[#8C8CA1]" />
              </button>
            </div>

            {/* Image */}
            <div className="p-4">
              <div className="relative w-full h-96 bg-gray-100 dark:bg-[#35353E] rounded-xl overflow-hidden">
                <img
                  src={imageModal.imageUrl}
                  alt={imageModal.advertiserName}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = "https://via.placeholder.com/400x400/1D8751/ffffff?text=Image+Not+Found";
                  }}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end p-4 border-t border-gray-200 dark:border-[#35353E]">
              <Button
                onClick={closeImageModal}
                variant="secondary"
                size="sm"
                className="px-6"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketTable;
