import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  deleteP2POrderThunk,
  duplicateP2POrderThunk,
  toggleP2POrderStatusThunk,
} from "@/features/p2p/slices/orderSlice";
import { p2pBuyandSell } from "@/features/p2p/slices/p2pbuysell";
import { RootState } from "@/store/rootReducer";
import { toast } from "sonner";
import EditAdModal from "./EditAdModal";
import { formatDate, formatNumber } from "@/utils/formatters";
import { NoDataFound } from "@/components/dashboard/ui/Transactions";

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
      dispatch(p2pBuyandSell(1) as any);
      toast.success(`Trade ${action.toLowerCase()}d successfully`);
    } catch {
      toast.error(`Failed to ${action.toLowerCase()} trade`);
    }
  };

  const handleEditSave = async (formData: any) => {
    // TODO: implement update thunk
    toast.success("Trade updated successfully");
    setIsEditModalOpen(false);
  };

  // Add check for empty trades
  if (!trades || trades.length === 0) {
    return (
      <div className="w-full min-h-[600px] bg-white dark:bg-[#23232b] rounded-2xl p-4 text-gray-900 dark:text-white border dark:border-[#35353E] border-gray-200">
        <NoDataFound
          title="No Ads Found"
          message="You haven't created any ads yet. Create your first ad to start trading."
        />
      </div>
    );
  }
  return (
    <div className="w-full min-h-[600px] bg-white dark:bg-[#18181D] rounded-2xl p-4 text-gray-900 dark:text-white">
      <div className="overflow-x-auto rounded-[16px]">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b bg-gray-50 dark:bg-[#23232B] border-gray-200 dark:border-[#35353E]">
              {columns.map((col) => (
                <th
                  key={col}
                  className="px-4 py-3 text-sm font-medium text-gray-500 dark:text-[#8C8CA1] whitespace-nowrap"
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
                className="border-b border-gray-200 dark:border-[#35353E] hover:bg-gray-100 dark:hover:bg-[#23232B] transition-colors relative"
              >
                {/* Asset */}
                <td className="px-4 py-3 flex items-center gap-2">
                  <img
                    src={
                      trade.assetImage ||
                      "https://res.cloudinary.com/pitz/image/upload/v1746710369/TRC20_tvugf8.png"
                    }
                    alt={trade.assetSymbol || "Asset"}
                    className="w-6 h-6"
                  />
                  <span>{trade.assetSymbol || trade.asset}</span>
                </td>
                {/* Type */}
                <td className="px-4 py-3">
                  <span
                    className={
                      trade.order_type === "buy"
                        ? "text-[#1D8751]"
                        : "text-[#FF4D4D]"
                    }
                  >
                    {trade.order_type}
                  </span>
                </td>
                {/* Limit */}
                <td className="px-4 py-3">
                  {formatNumber(trade.min_order_amount)} -{" "}
                  {formatNumber(trade.max_order_amount)}
                </td>
                {/* Price */}
                <td className="px-4 py-3">{trade.amount}</td>
                {/* Commission */}
                <td className="px-4 py-3">{trade.commission_rate}%</td>
                {/* Payment */}
                <td className="px-4 py-3">
                  {Array.isArray(trade.payment)
                    ? trade.payment.map((p: { bank: string }, i: number) => (
                        <div key={i}>{p.bank}</div>
                      ))
                    : trade.payment?.bank}
                </td>
                {/* Last update */}
                <td className="px-4 py-3">{formatDate(trade.created_on)}</td>
                {/* Status */}
                <td className="px-4 py-3">
                  <span
                    className={
                      trade.status === "Published"
                        ? "text-[#1D8751]"
                        : "text-[#FF4D4D]"
                    }
                  >
                    {trade.status}
                  </span>
                </td>
                {/* Action */}
                <td className="px-4 py-3 relative">
                  <button
                    className="text-[#1D8751] px-2 py-1 text-xs"
                    onClick={() => handleMenuToggle(idx)}
                  >
                    •••
                  </button>
                  {openMenuIdx === idx && (
                    <div
                      ref={menuRef}
                      className="absolute right-0 mt-2 w-32 rounded-md shadow-lg bg-white dark:bg-[#23232B] border border-gray-200 dark:border-[#35353E] z-10"
                    >
                      <ul className="py-1">
                        {getActionOptions(trade).map((option) => (
                          <li
                            key={option}
                            className="px-4 py-2 text-sm text-gray-500 dark:text-[#8C8CA1] hover:bg-gray-100 dark:hover:bg-[#35353E] cursor-pointer"
                            onClick={() => handleMenuAction(option, trade)}
                          >
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 py-4">
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 rounded-md text-sm font-medium border border-gray-200 dark:border-[#35353E] bg-gray-100 dark:bg-[#23232B] text-gray-500 dark:text-[#8C8CA1] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            &lt;
          </button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              className={`px-3 py-1 rounded-md text-sm font-medium border border-gray-200 dark:border-[#35353E] ${
                currentPage === i + 1
                  ? "bg-[#1D8751] text-white"
                  : "bg-gray-100 dark:bg-[#23232B] text-gray-500 dark:text-[#8C8CA1] hover:bg-gray-200 dark:hover:bg-[#35353E]"
              }`}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 rounded-md text-sm font-medium border border-gray-200 dark:border-[#35353E] bg-gray-100 dark:bg-[#23232B] text-gray-500 dark:text-[#8C8CA1] disabled:opacity-50 disabled:cursor-not-allowed"
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
