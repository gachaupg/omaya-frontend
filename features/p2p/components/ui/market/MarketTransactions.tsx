import React, { useState } from "react";
import Input from "../../Common/Input";
import Select from "../../Common/Select";
import Button from "../../Common/Button";
import { FaFilter, FaSyncAlt } from "react-icons/fa";
import { tokens } from "@/styles/tokens";
import { marketTableData } from "@/features/p2p/data";
import MarketTable from "./Table";

const currencyOptions = [
  { label: "USD", value: "USD" },
  { label: "EUR", value: "EUR" },
  { label: "BTC", value: "BTC" },
];

const paymentTypeOptions = [
  { label: "Payment Type", value: "" },
  { label: "Bank Transfer", value: "bank" },
  { label: "PayPal", value: "paypal" },
];

const providerOptions = [
  { label: "Select Provider", value: "" },
  { label: "Provider 1", value: "provider1" },
  { label: "Provider 2", value: "provider2" },
];

const MarketTransactions = () => {
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [paymentType, setPaymentType] = useState("");
  const [provider, setProvider] = useState("");

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full md:w-auto">
          <div
            className={`flex items-center w-full sm:w-auto bg-[#1D1D23] border border-[#35353E] rounded-md`}
          >
            <Input
              bgColor={tokens.colors.dark.card}
              borderColor={tokens.colors.dark.card}
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              className="bg-transparent border-none focus:ring-0 w-full sm:w-28"
            />
            <Select
              bgColor={tokens.colors.dark.card}
              borderColor={tokens.colors.dark.card}
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              options={currencyOptions}
              className="bg-transparent border-none focus:ring-0 w-full sm:w-16"
            />
          </div>
          <Select
            bgColor={tokens.colors.dark.card}
            borderColor={tokens.colors.dark.border}
            value={paymentType}
            onChange={(e) => setPaymentType(e.target.value)}
            options={paymentTypeOptions}
            placeholder="Payment Type"
            className="w-full sm:w-48 text-[#788099]"
          />
          <Select
            bgColor={tokens.colors.dark.card}
            borderColor={tokens.colors.dark.border}
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            options={providerOptions}
            placeholder="Select Provider"
            className="w-full sm:w-48 text-[#788099]"
          />
          <Button
            borderColor="#35353E"
            width={44}
            height={40}
            borderRadius={10}
            variant="outline"
            size="md"
            className="!bg-[#23232B] !border-[#35353E] border rounded-md"
            icon={<FaFilter className="text-[#1D8751]" size={26} />}
          />
        </div>

        <Button
          width={145}
          height={40}
          borderRadius={9}
          variant="primary"
          size="md"
          icon={<FaSyncAlt />}
          iconPosition="left"
          className="w-full sm:w-auto"
        >
          Refresh
        </Button>
      </div>
      <div className="w-full overflow-x-auto">
        <MarketTable data={marketTableData} />
      </div>
    </div>
  );
};

export default MarketTransactions;
