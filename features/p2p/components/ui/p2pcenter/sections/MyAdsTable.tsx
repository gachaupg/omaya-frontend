import React, { useState, useEffect, useRef } from "react";
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
import { ArrowUpCircle, MoreVertical, Pencil, Upload, XCircle } from "lucide-react";

const columns = [
  "Asset",
  "Type",
  "Limit",
  "Price",
  "Commission",
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
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState<any>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  /** Derived values */
  const totalPages = Math.ceil(trades.length / ITEMS_PER_PAGE);
  const paginatedTrades = trades.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  /** Utils */
  const getActionOptions = (trade: any) => {
    const baseOptions = ["Edit", "Delete"];
    const statusOption = trade.status === "pending" ? "Put Offline" : "Publish";
    const options = [...baseOptions];
    if (trade.status === "completed") options.unshift("Duplicate");
    options.unshift(statusOption);
    return options;
  };

  /** Effects */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuIdx(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /** Handlers */
  const handleMenuToggle = (idx: number) =>
    setOpenMenuIdx(openMenuIdx === idx ? null : idx);

  const handleMenuAction = async (action: string, trade: any) => {
    setOpenMenuIdx(null);
    try {
      switch (action) {
        case "Delete":
          await dispatch(deleteP2POrderThunk(trade.id) as any);
          break;
        case "Put Offline":
          await dispatch(
            toggleP2POrderStatusThunk({
              id: trade.id,
              status: "offline",
            }) as any
          );
          break;
        case "Publish":
          await dispatch(
            toggleP2POrderStatusThunk({
              id: trade.id,
              status: "pending",
            }) as any
          );
          break;
        case "Duplicate":
          await dispatch(duplicateP2POrderThunk(trade.id) as any);
          break;
        case "Edit":
          setSelectedTrade(trade);
          setIsEditModalOpen(true);
          return;
        default:
          return;
      }
      dispatch(fetchMyOrders(1) as any);
      toast.success(`Trade ${action.toLowerCase()}d successfully`);
    } catch {
      toast.error(`Failed to ${action.toLowerCase()} trade`);
    }
  };

  const handleEditSave = async (formData: any) => {
    try {
      // TODO: implement update thunk
      toast.success("Trade updated successfully");
      setIsEditModalOpen(false);
      // Refetch the data after successful edit
      dispatch(fetchMyOrders(1) as any);
    } catch (error) {
      toast.error("Failed to update trade");
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
                  {col}
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
                      "https://res.cloudinary.com/pitz/image/upload/v1752248529/2b5c7d80-7bcd-4cfb-8bd9-d1760a752afc.png_mhuppr.png"
                    }
                    alt={trade.asset || "Asset"}
                    className="w-7 h-7"
                  />
                  <span className="text-base font-semibold text-gray-900 dark:text-white">{trade.asset}</span>
                </td>
                {/* Type */}
                <td className="px-4 py-4">
                  <span
                    className={`text-base font-semibold ${
                      trade.order_type === "buy"
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
                {/* Commission */}
                <td className="px-4 py-4">
                  <span className="text-base font-semibold text-gray-900 dark:text-white">{trade.commission_rate}%</span>
                </td>
                {/* Payment */}
                <td className="px-4 py-4 min-width-[150px]">
                  {Array.isArray(trade.payment_details) && trade.payment_details.length > 0
                    ? trade.payment_details
                        .filter((p: any) => p && typeof p === 'object') // Filter out null/undefined
                        .map((p: any, i: number) => (
                          <div key={i} className="flex items-center gap-2">
                            <div>
                              <img 
                                src={p?.provider_logo || "https://res.cloudinary.com/dam1sxczj/image/upload/v1748884335/image_7_dqkxkj.png"} 
                                alt="" 
                                className="w-5 h-5 rounded"
                                onError={(e) => {
                                  // Fallback to default image if logo fails to load
                                  (e.target as HTMLImageElement).src = "https://res.cloudinary.com/dam1sxczj/image/upload/v1748884335/image_7_dqkxkj.png";
                                }}
                              />
                            </div>
                            <div className="text-base font-medium text-gray-900 dark:text-white">{p?.provider || ''}</div>
                          </div>
                        ))
                    : <span className="text-base font-medium text-gray-900 dark:text-white">
                        {trade.payment_details?.[0]?.provider || 'No payment methods'}
                      </span>}
                </td>
                {/* Last update */}
                <td className="px-4 py-4">
                  <span className="text-base font-medium text-gray-900 dark:text-white">{formatDate(trade.created_on)}</span>
                </td>
                {/* Status */}
                <td className="px-4 py-4">
                  <span
                  className={`text-base font-semibold ${
                    trade.status === "published"
                    ? "text-[#1D8751]": 
                    trade.status === "pending"
                    ? "text-[#FFB800]":
                    trade.status === "completed"
                    ? "text-[#1D8751]"
                    : "text-[#FF4D4D]"
                  }`}
                  >
                  {trade.status}
                  </span>
                </td>
                {/* Action */}
                <td className="px-4 py-4 relative">
                  <button
                  className="bg-[#1D8751] p-2.5 rounded-full hover:bg-[#176e43] transition-colors"
                  onClick={() => handleMenuToggle(idx)}
                  >
                  <MoreVertical className="w-5 h-5 text-white" />
                  </button>
                  {openMenuIdx === idx && (
                  <div
                    ref={menuRef}
                    className="absolute right-0 mt-2 w-32 rounded-md shadow-lg bg-white dark:bg-[var(--card-color)] border border-[#1D8751] dark:border-[#1D8751] z-10"
                  >
                    <ul className="py-1">
                    {getActionOptions(trade).map((option) => (
                        <li
                        key={option}
                        className="px-4 py-2.5 text-base font-medium text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-[#35353E] cursor-pointer flex items-center gap-2.5"
                        onClick={() => handleMenuAction(option, trade)}
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
                        {option}
                        </li>
                    ))}
                    </ul>
                  </div>
                  )}
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
                    "https://res.cloudinary.com/pitz/image/upload/v1752248529/2b5c7d80-7bcd-4cfb-8bd9-d1760a752afc.png_mhuppr.png"
                  }
                  alt={trade.asset || "Asset"}
                  className="w-7 h-7"
                />
                <span className="font-bold text-base text-gray-900 dark:text-white">{trade.asset}</span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`font-bold text-base ${
                    trade.order_type === "buy"
                      ? "text-[#1D8751]"
                      : "text-[#FF4D4D]"
                  }`}
                >
                  {trade.order_type}
                </span>
                <button
                  className="bg-[#1D8751] p-2 rounded-full hover:bg-[#176e43] transition-colors"
                  onClick={() => handleMenuToggle(idx)}
                >
                  <MoreVertical className="w-5 h-5 text-white" />
                </button>
                {openMenuIdx === idx && (
                  <div
                    ref={menuRef}
                    className="absolute top-12 right-4 w-32 rounded-md shadow-lg bg-white dark:bg-[var(--card-color)] border border-[#1D8751] dark:border-[#1D8751] z-10"
                  >
                    <ul className="py-1">
                      {getActionOptions(trade).map((option) => (
                        <li
                          key={option}
                          className="px-4 py-2.5 text-base font-medium text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-[#35353E] cursor-pointer flex items-center gap-2.5"
                          onClick={() => handleMenuAction(option, trade)}
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
                          {option}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Price and Commission Row */}
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-500 dark:text-[#8C8CA1] mb-1">Price</span>
                <span className="text-base font-bold text-gray-900 dark:text-white">{trade.amount}</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-sm font-medium text-gray-500 dark:text-[#8C8CA1] mb-1">Commission</span>
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
                {Array.isArray(trade.payment_details) && trade.payment_details.length > 0
                  ? trade.payment_details
                      .filter((p: any) => p && typeof p === 'object') // Filter out null/undefined
                      .slice(0, 2)
                      .map((p: any, i: number) => (
                        <div key={i} className="flex items-center gap-1.5">
                          <img 
                            src={p?.provider_logo || "https://res.cloudinary.com/dam1sxczj/image/upload/v1748884335/image_7_dqkxkj.png"} 
                            alt="" 
                            className="w-5 h-5 rounded"
                            onError={(e) => {
                              // Fallback to default image if logo fails to load
                              (e.target as HTMLImageElement).src = "https://res.cloudinary.com/dam1sxczj/image/upload/v1748884335/image_7_dqkxkj.png";
                            }}
                          />
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{p?.provider || ''}</span>
                        </div>
                      ))
                  : <span className="text-sm font-medium text-gray-500 dark:text-[#8C8CA1]">No payment methods</span>}
                {Array.isArray(trade.payment_details) && 
                 trade.payment_details.filter((p: any) => p && typeof p === 'object').length > 2 && (
                  <span className="text-sm font-medium text-gray-500 dark:text-[#8C8CA1]">
                    +{trade.payment_details.filter((p: any) => p && typeof p === 'object').length - 2} more
                  </span>
                )}
              </div>
            </div>

            {/* Status and Last Update Row */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-[#35353E]">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-500 dark:text-[#8C8CA1] mb-1">Status</span>
                <span
                  className={`text-base font-bold ${
                    trade.status === "published"
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
              className={`px-4 py-2 rounded-md text-base font-semibold border border-gray-200 dark:border-[#35353E] ${
                currentPage === i + 1
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
