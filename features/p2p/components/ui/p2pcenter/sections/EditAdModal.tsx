import React, { useState, useEffect } from "react";
import { Dialog } from "@headlessui/react";
import { editP2POrderThunk } from "@/features/p2p/slices/orderSlice";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "@/store";
import type { P2PResponse } from "@/features/p2p/types";
import type { PayloadAction } from "@reduxjs/toolkit";

import { logger } from '@/lib/utils/logger';

interface EditAdModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  initialData: any;
}

const EditAdModal: React.FC<EditAdModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: "",
    commission_rate: "1",
    min_order_amount: "",
    max_order_amount: "",
    order_type: "",
    exchange_rate: "0.3",
    limit_duration: "10",
    payment_details_ids: [initialData?.payment_details?.[0]?.id || "1"],
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        amount: initialData.amount || "",
        commission_rate: initialData.commission_rate?.toString() || "1",
        min_order_amount: initialData.min_order_amount || "",
        max_order_amount: initialData.max_order_amount || "",
        order_type: initialData.order_type || "",
        exchange_rate: initialData.exchange_rate || "0.3",
        limit_duration: initialData.limit_duration?.toString() || "10",
        payment_details_ids: [initialData?.payment_details?.[0]?.id || "1"],
      });
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
   

      // Ensure all numeric values are properly formatted and payment details are valid
      const submitData = {
        ...formData,
        commission_rate: parseFloat(formData.commission_rate) || 1,
        limit_duration: parseInt(formData.limit_duration) || 10,
        amount: parseFloat(formData.amount) || 0,
        min_order_amount: parseFloat(formData.min_order_amount) || 0,
        max_order_amount: parseFloat(formData.max_order_amount) || 0,
        payment_details_ids: [initialData?.payment_details?.[0]?.id || "1"],
      };

    

      logger.debug('p2p', "Submitting data:", submitData);

      const result = (await dispatch(
        editP2POrderThunk({
          id: initialData.id,
          data: submitData,
        })
      )) as PayloadAction<P2PResponse>;

      if (result.payload) {
        onSave(submitData);
        onClose();
      } else {
        throw new Error("Failed to update order");
      }
    } catch (error) {
      console.error("Error updating order:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto w-full max-w-2xl rounded-xl dark:bg-[var(--card-color)] bg-white dark:text-white text-gray-900 max-h-[85vh] overflow-hidden">
          <div className="p-6 overflow-y-auto max-h-[85vh]">
            <Dialog.Title className="text-xl font-semibold mb-4 flex items-center justify-between">
              <span>Edit Ad Details</span>
              <button
                onClick={onClose}
                className="dark:text-[#8C8CA1] text-gray-500 dark:hover:text-white hover:text-gray-700 transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </Dialog.Title>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Left Column */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm dark:text-[#8C8CA1] text-gray-600 mb-1.5">
                      Amount
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) =>
                        setFormData({ ...formData, amount: e.target.value })
                      }
                      className="w-full px-3 py-2 dark:bg-[#35353E] bg-gray-100 rounded-lg dark:text-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1D8751] text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm dark:text-[#8C8CA1] text-gray-600 mb-1.5">
                      Minimum Order
                    </label>
                    <input
                      type="number"
                      step="0.00000001"
                      value={formData.min_order_amount}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          min_order_amount: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 dark:bg-[#35353E] bg-gray-100 rounded-lg dark:text-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1D8751] text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm dark:text-[#8C8CA1] text-gray-600 mb-1.5">
                      Maximum Order
                    </label>
                    <input
                      type="number"
                      step="0.00000001"
                      value={formData.max_order_amount}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          max_order_amount: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 dark:bg-[#35353E] bg-gray-100 rounded-lg dark:text-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1D8751] text-sm"
                      required
                    />
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm dark:text-[#8C8CA1] text-gray-600 mb-1.5">
                      Commission Rate (%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={formData.commission_rate}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          commission_rate: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 dark:bg-[#35353E] bg-gray-100 rounded-lg dark:text-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1D8751] text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm dark:text-[#8C8CA1] text-gray-600 mb-1.5">
                      Order Type
                    </label>
                    <select
                      value={formData.order_type}
                      onChange={(e) =>
                        setFormData({ ...formData, order_type: e.target.value })
                      }
                      className="w-full px-3 py-2 dark:bg-[#35353E] bg-gray-100 rounded-lg dark:text-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1D8751] text-sm"
                      required
                    >
                      <option value="">Select Type</option>
                      <option value="buy">Buy</option>
                      <option value="sell">Sell</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm dark:text-[#8C8CA1] text-gray-600 mb-1.5">
                      Time Limit (minutes)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.limit_duration}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          limit_duration: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 dark:bg-[#35353E] bg-gray-100 rounded-lg dark:text-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1D8751] text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#35353E]">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium dark:text-[#8C8CA1] text-gray-600 dark:hover:text-white hover:text-gray-800 transition-colors"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium bg-[#1D8751] text-white rounded-lg hover:bg-[#166c41] transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <svg
                        className="animate-spin h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </form>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default EditAdModal;
