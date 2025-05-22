"use client";
import React from "react";
import { Table } from "@/components/ui/Table";
import { transactions } from "@/utils/data";

const Transactions = () => {
  return (
    <div className="bg-[#1D1D23] border-2 border-[#35353E] rounded-2xl p-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
        <h2 className="text-xl sm:text-2xl font-semibold text-white">
          My Transactions
        </h2>
        <div className="flex flex-wrap gap-2 sm:gap-4">
          <button className="bg-[#1D8751] text-white px-4 sm:px-6 py-2 rounded-full font-medium text-sm sm:text-base">
            Exchange
          </button>
          <button className="border border-[#1D8751] text-[#1D8751] px-4 sm:px-6 py-2 rounded-full font-medium text-sm sm:text-base">
            P2P
          </button>
          <button className="border border-[#1D8751] text-[#1D8751] px-4 sm:px-6 py-2 rounded-full font-medium text-sm sm:text-base">
            Swap
          </button>
          <button className="border border-[#1D8751] text-[#1D8751] px-4 sm:px-6 py-2 rounded-full font-medium text-sm sm:text-base">
            Buy
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <Table
          type="transactions"
          title=""
          data={transactions}
          withBorder={false}
        />
      </div>
    </div>
  );
};

export default Transactions;
