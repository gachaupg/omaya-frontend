import React, { useState } from "react";
import Button from "@/features/p2p/components/Common/Button";
import Input from "@/features/p2p/components/Common/Input";
import Select from "@/features/p2p/components/Common/Select";
import { tokens } from "@/styles/tokens";

const bankOptions = [
  { value: "premier", label: "Premier Bank", icon: "🏦" },
  { value: "salam", label: "Salam Bank", icon: "🏦" },
];

const mobileMoneyOptions = [{ value: "taaj", label: "Taaj Money", icon: "💸" }];

const methodOptions = [
  { value: "bank", label: "Bank Transfer" },
  { value: "mobile", label: "Mobile Money" },
  { value: "merchant", label: "Merchant" },
];

type BankMethod = {
  bank: string;
  holder: string;
  number: string;
  editable: boolean;
};
type MobileMethod = {
  provider: string;
  name: string;
  number: string;
  editable: boolean;
};
type MerchantMethod = {
  merchant?: string;
  name: string;
  number: string;
  editable: boolean;
};

const PaymentMethods = () => {
  const [bankMethods, setBankMethods] = useState<BankMethod[]>([
    { bank: "premier", holder: "", number: "", editable: false },
    { bank: "salam", holder: "", number: "", editable: false },
  ]);
  const [mobileMethods, setMobileMethods] = useState<MobileMethod[]>([
    {
      provider: "taaj",
      name: "Omar Ali",
      number: "123456789",
      editable: false,
    },
  ]);
  const [merchantMethods, setMerchantMethods] = useState<MerchantMethod[]>([]); // Stub for merchant
  const [addMethodType, setAddMethodType] = useState<string>("");

  // Add method handler
  const handleAddMethod = () => {
    if (addMethodType === "bank") {
      setBankMethods((prev) => [
        ...prev,
        { bank: bankOptions[0].value, holder: "", number: "", editable: true },
      ]);
    } else if (addMethodType === "mobile") {
      setMobileMethods((prev) => [
        ...prev,
        {
          provider: mobileMoneyOptions[0].value,
          name: "",
          number: "",
          editable: true,
        },
      ]);
    } else if (addMethodType === "merchant") {
      setMerchantMethods((prev) => [
        ...prev,
        { merchant: "", name: "", number: "", editable: true },
      ]);
    }
    setAddMethodType("");
  };

  // Remove method handler
  const handleRemoveMethod = (type: string, idx: number) => {
    if (type === "bank") {
      setBankMethods((prev) => prev.filter((_, i) => i !== idx));
    } else if (type === "mobile") {
      setMobileMethods((prev) => prev.filter((_, i) => i !== idx));
    } else if (type === "merchant") {
      setMerchantMethods((prev) => prev.filter((_, i) => i !== idx));
    }
  };

  // Handle input change
  const handleInputChange = (
    type: string,
    idx: number,
    field: string,
    value: string
  ) => {
    if (type === "bank") {
      setBankMethods((prev) =>
        prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item))
      );
    } else if (type === "mobile") {
      setMobileMethods((prev) =>
        prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item))
      );
    } else if (type === "merchant") {
      setMerchantMethods((prev) =>
        prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item))
      );
    }
  };

  return (
    <div className="w-full min-h-[600px] bg-[#23232b] rounded-2xl p-4 text-white">
      {/* Bank Section */}
      <div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
          <span className="text-[18px] sm:text-[22px] font-semibold">Bank</span>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Select
              options={methodOptions}
              value={addMethodType}
              onChange={(e) => {
                const value = e.target.value;
                setAddMethodType("");
                if (value === "bank") {
                  setBankMethods((prev) => [
                    ...prev,
                    {
                      bank: bankOptions[0].value,
                      holder: "",
                      number: "",
                      editable: true,
                    },
                  ]);
                } else if (value === "mobile") {
                  setMobileMethods((prev) => [
                    ...prev,
                    {
                      provider: mobileMoneyOptions[0].value,
                      name: "",
                      number: "",
                      editable: true,
                    },
                  ]);
                } else if (value === "merchant") {
                  setMerchantMethods((prev) => [
                    ...prev,
                    { merchant: "", name: "", number: "", editable: true },
                  ]);
                }
              }}
              placeholder={"+ Add Method"}
              className="w-full sm:min-w-[180px] rounded-full border-[#1D8751] bg-[#23232b]"
              borderColor="#1D8751"
              bgColor={tokens.colors.dark.background}
            />
          </div>
        </div>
        {bankMethods.map((method, idx) => (
          <div key={idx} className="mb-4">
            {/* Bank Icon and Name in a row */}
            <div className="flex items-center mb-2">
              <img
                src="https://res.cloudinary.com/pitz/image/upload/v1746705424/1d80d34ccb0f17b03572fe01e820f090edc3e463_y13v5u.jpg"
                alt="Bank Icon"
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full mr-2 object-cover"
              />
              <span className="text-white font-medium flex items-center text-base sm:text-lg">
                {method.bank === "premier" ? "Premier Bank" : "Salam Bank"}
                <svg
                  className="w-4 h-4 ml-1 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </span>
              <button
                className="ml-auto text-[#1D8751] text-2xl flex items-center"
                title="Delete"
                onClick={() => handleRemoveMethod("bank", idx)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5 sm:w-6 sm:h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2"
                  />
                </svg>
              </button>
            </div>
            {/* Inputs in a row */}
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                placeholder="Account Holder"
                value={method.holder}
                className="w-full sm:w-[539px] h-[52px] rounded-3xl border-[#353535] bg-[#353535] text-white px-[14px] py-[10px] text-base"
                bgColor="#353535"
                borderColor="#353535"
                disabled={!method.editable}
                onChange={(e) =>
                  handleInputChange("bank", idx, "holder", e.target.value)
                }
              />
              <Input
                placeholder="Account Number"
                value={method.number}
                className="w-full sm:w-[539px] h-[52px] rounded-3xl border border-[#35353E] bg-[#18181D] text-white px-[14px] py-[10px] text-base"
                bgColor="#18181D"
                borderColor="#35353E"
                disabled={!method.editable}
                onChange={(e) =>
                  handleInputChange("bank", idx, "number", e.target.value)
                }
              />
            </div>
          </div>
        ))}
      </div>

      {/* Mobile Money Section */}
      <div className="mt-8">
        <div className="text-[18px] sm:text-[22px] font-semibold mb-4">
          Mobile Money
        </div>
        {mobileMethods.map((method, idx) => (
          <div key={idx} className="mb-4">
            {/* Provider Icon and Name in a row */}
            <div className="flex items-center mb-2">
              <img
                src="https://res.cloudinary.com/pitz/image/upload/v1746705424/1d80d34ccb0f17b03572fe01e820f090edc3e463_y13v5u.jpg"
                alt="Provider Icon"
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full mr-2 object-cover"
              />
              <span className="text-white font-medium flex items-center text-base sm:text-lg">
                {method.provider === "taaj" ? "Taaj Money" : method.provider}
                <svg
                  className="w-4 h-4 ml-1 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </span>
              <button
                className="ml-auto text-[#1D8751] text-2xl flex items-center"
                title="Delete"
                onClick={() => handleRemoveMethod("mobile", idx)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5 sm:w-6 sm:h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2"
                  />
                </svg>
              </button>
            </div>
            {/* Inputs in a row */}
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                placeholder="Wallet Name"
                value={method.name}
                className="w-full sm:w-[539px] h-[52px] rounded-3xl border-[#353535] bg-[#353535] text-white px-[14px] py-[10px] text-base"
                bgColor="#353535"
                borderColor="#353535"
                disabled={!method.editable}
                onChange={(e) =>
                  handleInputChange("mobile", idx, "name", e.target.value)
                }
              />
              <Input
                placeholder="Wallet Number"
                value={method.number}
                className="w-full sm:w-[539px] h-[52px] rounded-3xl border border-[#35353E] bg-[#18181D] text-white px-[14px] py-[10px] text-base"
                bgColor="#18181D"
                borderColor="#35353E"
                disabled={!method.editable}
                onChange={(e) =>
                  handleInputChange("mobile", idx, "number", e.target.value)
                }
              />
            </div>
          </div>
        ))}
      </div>

      {/* Merchant Section (Stub) */}
      {merchantMethods.length > 0 && (
        <div className="mt-8">
          <div className="text-[18px] sm:text-[22px] font-semibold mb-4">
            Merchant
          </div>
          {merchantMethods.map((method, idx) => (
            <div
              key={idx}
              className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-[#1D1D23] rounded-xl p-4 sm:p-5 mb-4 border border-[#35353E]"
            >
              <Input
                placeholder="Merchant Name"
                value={method.name}
                className="w-full sm:flex-1 bg-[#23232b] text-white"
                bgColor="#23232b"
                borderColor="#35353E"
                disabled={!method.editable}
                onChange={(e) =>
                  handleInputChange("merchant", idx, "name", e.target.value)
                }
              />
              <Input
                placeholder="Merchant Number"
                value={method.number}
                className="w-full sm:flex-1 bg-[#18181D] text-white"
                bgColor="#18181D"
                borderColor="#35353E"
                disabled={!method.editable}
                onChange={(e) =>
                  handleInputChange("merchant", idx, "number", e.target.value)
                }
              />
              <button
                className="text-[#1D8751] text-2xl flex items-center"
                title="Delete"
                onClick={() => handleRemoveMethod("merchant", idx)}
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Update Button */}
      <div className="mt-8 w-full">
        <Button
          height={40}
          borderRadius={24}
          variant="outline"
          className="border-2 border-[#1D8751] w-full text-white"
          size="md"
        >
          <p className="text-white">Update</p>
        </Button>
      </div>
    </div>
  );
};

export default PaymentMethods;
