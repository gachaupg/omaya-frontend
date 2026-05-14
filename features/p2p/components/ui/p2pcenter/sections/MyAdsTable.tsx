import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  deleteP2POrderThunk,
  duplicateP2POrderThunk,
  toggleP2POrderStatusThunk,
} from "@/features/p2p/slices/orderSlice";
import { fetchMyOrders } from "@/features/p2p/slices/myOrdersSlice";
import { RootState } from "@/store/rootReducer";
import { toast } from "sonner";
import EditAdModal from "./EditAdModal";
import { formatDate, formatNumber } from "@/utils/formatters";
import { NoDataFound } from "@/components/dashboard/ui/Transactions";
import { SortArrowsIcon } from "@/components/ui/SortArrowsIcon";
import { ArrowUpCircle, MoreVertical, Pencil, Upload, XCircle } from "lucide-react";

const columns = [
  "Asset",
  "Type",
  "Limit",
  "Price",
  "Rates",
  "Payment",
  "Last Update",
  "Status",
  "Action",
];

type Props = {
  trades: any[];
  loading: boolean;
};

const ITEMS_PER_PAGE = 7;

const MyAdsTable: React.FC<Props> = ({ trades, loading }) => {
  /** Hooks */
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated
  );

  /** Local state */
  const [currentPage, setCurrentPage] = useState(1);
  const [openMenuIdx, setOpenMenuIdx] = useState<number | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState<any>(null);
  /** Refs */
  const menuRef = useRef<HTMLDivElement>(null);
  const toggleButtonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  /** Derived values */
  const totalPages = Math.ceil(trades.length / ITEMS_PER_PAGE);
  const paginatedTrades = trades.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  /** Utils */
  const getActionOptions = (trade: any) => {
    const baseOptions = ["Edit", "Delete"];
    const statusOption = trade.status === "published" ? "Put Offline" : "Publish";
    const options = [...baseOptions];
    if (trade.status === "completed") options.unshift("Duplicate");
    options.unshift(statusOption);
    return options;
  };

  /** Effects */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      // Don't close if clicking inside the menu
      if (menuRef.current && menuRef.current.contains(target)) {
        return;
      }
      // Don't close if clicking on any toggle button
      for (const [, buttonRef] of toggleButtonRefs.current) {
        if (buttonRef && buttonRef.contains(target)) {
          return;
        }
      }
      setOpenMenuIdx(null);
      setMenuPosition(null);
    };

    const handleScroll = () => {
      setOpenMenuIdx(null);
      setMenuPosition(null);
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScroll, true);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, []);

  /** Handlers */
  const handleMenuToggle = (idx: number, event: React.MouseEvent) => {
    if (openMenuIdx === idx) {
      setOpenMenuIdx(null);
      setMenuPosition(null);
      return;
    }
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();

    // Calculate position ensuring it doesn't overflow viewport
    const menuWidth = 140;
    const viewportWidth = window.innerWidth;
    let left = rect.right - menuWidth;

    // Adjust if menu would overflow left edge
    if (left < 10) {
      left = Math.max(10, rect.left);
    }

    // Adjust if menu would overflow right edge
    if (left + menuWidth > viewportWidth - 10) {
      left = viewportWidth - menuWidth - 10;
    }

    setMenuPosition({ top: rect.bottom + 4, left });
    setOpenMenuIdx(idx);
  };

  const handleMenuAction = async (action: string, trade: any) => {
    setOpenMenuIdx(null);
    setMenuPosition(null);
    try {
      let result: any;
      switch (action) {
        case "Delete":
          result = await dispatch(deleteP2POrderThunk(trade.id) as any);
          break;
        case "Put Offline":
          result = await dispatch(
            toggleP2POrderStatusThunk({
              id: trade.id,
              status: "offline",
            }) as any
          );
          break;
        case "Publish":
          result = await dispatch(
            toggleP2POrderStatusThunk({
              id: trade.id,
              status: "pending",
            }) as any
          );
          break;
        case "Duplicate":
          result = await dispatch(duplicateP2POrderThunk(trade.id) as any);
          break;
        case "Edit":
          setSelectedTrade(trade);
          setIsEditModalOpen(true);
          return;
        default:
          return;
      }
      // Only show success toast if the action was not rejected
      if (result?.error) {
        toast.error(result.payload || `Failed to ${action.toLowerCase()} trade`);
      } else {
        dispatch(fetchMyOrders(1) as any);
        toast.success(`Trade ${action.toLowerCase()}d successfully`);
      }
    } catch {
      toast.error(`Failed to ${action.toLowerCase()} trade`);
    }
  };

  const handleEditSave = async (formData: any) => {
    try {
      // The EditAdModal handles the API call and success/error is handled there
      // Don't show duplicate toast here
      setIsEditModalOpen(false);
      // Refetch the data after successful edit
      dispatch(fetchMyOrders(1) as any);
    } catch (error) {
      // Error is already handled in EditAdModal
    }
  };

  // Removed debug logging to reduce console noise

  // Add check for empty trades
  if (!trades || trades.length === 0) {
    return (
      <div className="w-full min-h-[600px] bg-white dark:bg-[var(--card-color)] rounded-2xl p-4 text-gray-900 dark:text-white border dark:border-[#35353E] border-gray-200">
        <NoDataFound
          title="No Ads Found"
          message="You haven't created any ads yet. Create your first ad to start trading."
        />
      </div>
    );
  }
  return (
    <div className="w-full min-h-[600px] bg-white dark:bg-[var(--card-color)] rounded-2xl p-4 text-gray-900 dark:text-white">
      {/* Popout menu (fixed position, renders outside table) */}
      {openMenuIdx !== null &&
        menuPosition !== null &&
        paginatedTrades[openMenuIdx] != null &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={menuRef}
            className="fixed w-[140px] rounded-md shadow-xl bg-white dark:bg-[var(--card-color)] border border-[#1D8751] dark:border-[#1D8751] z-[100] py-1"
            style={{ top: menuPosition.top, left: menuPosition.left }}
          >
            <ul className="py-1">
              {getActionOptions(paginatedTrades[openMenuIdx]).map((option) => (
                <li
                  key={option}
                  className="px-4 py-2.5 text-base font-medium text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-[#35353E] cursor-pointer flex items-center gap-2.5"
                  onClick={() => handleMenuAction(option, paginatedTrades[openMenuIdx])}
                >
                  {(option === "Put Offline" || option === "Publish") && (
                    <ArrowUpCircle size={20} className="text-[#1D8751]" />
                  )}
                  {option === "Edit" && (
                    <Pencil size={20} className="text-[#1D8751]" />
                  )}
                  {option === "Delete" && (
                    <XCircle size={20} className="text-[#1D8751]" />
                  )}
                  {option === "Duplicate" && (
                    <Upload size={20} className="text-[#1D8751] rotate-90" />
                  )}
                  Cancle
                </li>
              ))}
            </ul>
          </div>,
          document.body
        )}

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto rounded-[16px]">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b bg-gray-50 dark:bg-[#35353E] border-gray-200 dark:border-[#35353E]">
              {columns.map((col) => (
                <th
                  key={col}
                  className="px-4 py-4 text-base font-bold text-gray-900 dark:text-white whitespace-nowrap"
                >
                  <span className="inline-flex items-center">
                    {col}
                    <SortArrowsIcon />
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedTrades.map((trade, idx) => (
              <tr
                key={trade.id || idx}
                className="border-b border-gray-200 dark:border-[#35353E] hover:bg-gray-100 dark:hover:bg-[var(--card-color)] transition-colors relative"
              >
                {/* Asset */}
                <td className="px-4 py-4 flex items-center gap-2">
                  <img
                    src={
                      trade.asset_image ||
                      "/images/tether.svg"
                    }
                    alt={trade.asset || "Asset"}
                    className="w-7 h-7"
                  />
                  <span className="text-base font-semibold text-gray-900 dark:text-white">{trade.asset}</span>
                </td>
                {/* Type */}
                <td className="px-4 py-4">
                  <span
                    className={`text-base font-semibold ${trade.order_type === "buy"
                        ? "text-[#1D8751]"
                        : "text-[#FF4D4D]"
                      }`}
                  >
                    {trade.order_type}
                  </span>
                </td>
                {/* Limit */}
                <td className="px-4 py-4">
                  <span className="text-base font-medium text-gray-900 dark:text-white">
                    {formatNumber(trade.min_order_amount)} -{" "}
                    {formatNumber(trade.max_order_amount)}
                  </span>
                </td>
                {/* Price */}
                <td className="px-4 py-4">
                  <span className="text-base font-semibold text-gray-900 dark:text-white">{trade.amount}</span>
                </td>
                {/* Rates */}
                <td className="px-4 py-4">
                  <span className="text-base font-semibold text-gray-900 dark:text-white">{trade.commission_rate}%</span>
                </td>
                {/* Payment */}
                <td className="px-4 py-4" style={{ minWidth: '150px' }}>
                  {(() => {
                    const details = trade.payment_details;
                    // Handle array of payment details
                    if (Array.isArray(details) && details.length > 0) {
                      const validDetails = details.filter((p: any) => p && typeof p === 'object');
                      if (validDetails.length > 0) {
                        return validDetails.map((p: any, i: number) => (
                          <div key={i} className="flex items-center gap-2">
                            <img
                              src={p?.provider_logo || "/assets/image_7_dqkxkj.png"}
                              alt=""
                              className="w-5 h-5 rounded"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "/assets/image_7_dqkxkj.png";
                              }}
                            />
                            <span className="text-base font-medium text-gray-900 dark:text-white">{p?.provider || p?.payment_method || p?.name || 'Payment method'}</span>
                          </div>
                        ));
                      }
                    }
                    // Handle object payment_details (non-array)
                    if (details && typeof details === 'object' && !Array.isArray(details)) {
                      const provider = (details as any)?.provider || (details as any)?.payment_method || (details as any)?.name;
                      if (provider) {
                        return (
                          <div className="flex items-center gap-2">
                            <img
                              src={(details as any)?.provider_logo || "/assets/image_7_dqkxkj.png"}
                              alt=""
                              className="w-5 h-5 rounded"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "/assets/image_7_dqkxkj.png";
                              }}
                            />
                            <span className="text-base font-medium text-gray-900 dark:text-white">{provider}</span>
                          </div>
                        );
                      }
                    }
                    // Fallback
                    return <span className="text-sm text-gray-500 dark:text-[#8C8CA1] italic">—</span>;
                  })()}
                </td>
                {/* Last update */}
                <td className="px-4 py-4">
                  <span className="text-base font-medium text-gray-900 dark:text-white">{formatDate(trade.created_on)}</span>
                </td>
                {/* Status */}
                <td className="px-4 py-4">
                  <span
                    className={`text-base font-semibold ${trade.status === "published"
                        ? "text-[#1D8751]" :
                        trade.status === "pending"
                          ? "text-[#FFB800]" :
                          trade.status === "completed"
                            ? "text-[#1D8751]"
                            : "text-[#FF4D4D]"
                      }`}
                  >
                    {trade.status}
                  </span>
                </td>
                {/* Action */}
                <td className="px-4 py-4">
                  <button
                    ref={(el) => {
                      const key = `desktop-${idx}`;
                      if (el) toggleButtonRefs.current.set(key, el);
                      else toggleButtonRefs.current.delete(key);
                    }}
                    className="bg-[#1D8751] p-2.5 rounded-full hover:bg-[#176e43] transition-colors"
                    onClick={(e) => handleMenuToggle(idx, e)}
                  >
                    <MoreVertical className="w-5 h-5 text-white" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {paginatedTrades.map((trade, idx) => (
          <div
            key={trade.id || idx}
            className="bg-white dark:bg-[var(--card-color)] rounded-2xl border border-gray-200 dark:border-[#35353E] p-4 space-y-3 relative"
          >
            {/* Top Row: Asset, Type, and Action Menu */}
            <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-[#35353E]">
              <div className="flex items-center gap-2">
                <img
                  src={
                    trade.asset_image ||
                    "/images/tether.svg"
                  }
                  alt={trade.asset || "Asset"}
                  className="w-7 h-7"
                />
                <span className="font-bold text-base text-gray-900 dark:text-white">{trade.asset}</span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`font-bold text-base ${trade.order_type === "buy"
                      ? "text-[#1D8751]"
                      : "text-[#FF4D4D]"
                    }`}
                >
                  {trade.order_type}
                </span>
                <button
                  ref={(el) => {
                    const key = `mobile-${idx}`;
                    if (el) toggleButtonRefs.current.set(key, el);
                    else toggleButtonRefs.current.delete(key);
                  }}
                  className="bg-[#1D8751] p-2 rounded-full hover:bg-[#176e43] transition-colors"
                  onClick={(e) => handleMenuToggle(idx, e)}
                >
                  <MoreVertical className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            {/* Price and Rates Row */}
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-500 dark:text-[#8C8CA1] mb-1">Price</span>
                <span className="text-base font-bold text-gray-900 dark:text-white">{trade.amount}</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-sm font-medium text-gray-500 dark:text-[#8C8CA1] mb-1">Rates</span>
                <span className="text-base font-bold text-gray-900 dark:text-white">{trade.commission_rate}%</span>
              </div>
            </div>

            {/* Limit Row */}
            <div className="flex flex-col pt-2 border-t border-gray-200 dark:border-[#35353E]">
              <span className="text-sm font-medium text-gray-500 dark:text-[#8C8CA1] mb-1">Order Limit</span>
              <span className="text-base font-semibold text-gray-900 dark:text-white">
                {formatNumber(trade.min_order_amount)} - {formatNumber(trade.max_order_amount)}
              </span>
            </div>

            {/* Payment Methods */}
            <div className="flex flex-col gap-2 pt-2 border-t border-gray-200 dark:border-[#35353E]">
              <span className="text-sm font-medium text-gray-500 dark:text-[#8C8CA1]">Payment Methods</span>
              <div className="flex flex-wrap gap-2">
                {(() => {
                  const details = trade.payment_details;
                  if (Array.isArray(details) && details.length > 0) {
                    const validDetails = details.filter((p: any) => p && typeof p === 'object');
                    if (validDetails.length > 0) {
                      return (
                        <>
                          {validDetails.slice(0, 2).map((p: any, i: number) => (
                            <div key={i} className="flex items-center gap-1.5">
                              <img
                                src={p?.provider_logo || "/assets/image_7_dqkxkj.png"}
                                alt=""
                                className="w-5 h-5 rounded"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = "/assets/image_7_dqkxkj.png";
                                }}
                              />
                              <span className="text-sm font-medium text-gray-900 dark:text-white">{p?.provider || p?.payment_method || p?.name || 'Payment method'}</span>
                            </div>
                          ))}
                          {validDetails.length > 2 && (
                            <span className="text-sm font-medium text-gray-500 dark:text-[#8C8CA1]">
                              +{validDetails.length - 2} more
                            </span>
                          )}
                        </>
                      );
                    }
                  }
                  if (details && typeof details === 'object' && !Array.isArray(details)) {
                    const provider = (details as any)?.provider || (details as any)?.payment_method || (details as any)?.name;
                    if (provider) {
                      return (
                        <div className="flex items-center gap-1.5">
                          <img
                            src={(details as any)?.provider_logo || "/assets/image_7_dqkxkj.png"}
                            alt=""
                            className="w-5 h-5 rounded"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "/assets/image_7_dqkxkj.png";
                            }}
                          />
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{provider}</span>
                        </div>
                      );
                    }
                  }
                  return <span className="text-sm text-gray-500 dark:text-[#8C8CA1] italic">—</span>;
                })()}
              </div>
            </div>

            {/* Status and Last Update Row */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-[#35353E]">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-500 dark:text-[#8C8CA1] mb-1">Status</span>
                <span
                  className={`text-base font-bold ${trade.status === "published"
                      ? "text-[#1D8751]"
                      : trade.status === "pending"
                        ? "text-[#FFB800]"
                        : trade.status === "completed"
                          ? "text-[#1D8751]"
                          : "text-[#FF4D4D]"
                    }`}
                >
                  {trade.status}
                </span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-sm font-medium text-gray-500 dark:text-[#8C8CA1] mb-1">Last Update</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{formatDate(trade.created_on)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 py-4">
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 rounded-md text-base font-semibold border border-gray-200 dark:border-[#35353E] bg-gray-100 dark:bg-[var(--card-color)] text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-[#35353E] transition-colors"
          >
            &lt;
          </button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              className={`px-4 py-2 rounded-md text-base font-semibold border border-gray-200 dark:border-[#35353E] ${currentPage === i + 1
                  ? "bg-[#1D8751] text-white"
                  : "bg-gray-100 dark:bg-[var(--card-color)] text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-[#35353E]"
                } transition-colors`}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 rounded-md text-base font-semibold border border-gray-200 dark:border-[#35353E] bg-gray-100 dark:bg-[var(--card-color)] text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-[#35353E] transition-colors"
          >
            &gt;
          </button>
        </div>
      )}

      {/* Edit modal */}
      <EditAdModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleEditSave}
        initialData={selectedTrade}
      />
    </div>
  );
};

export default MyAdsTable;
