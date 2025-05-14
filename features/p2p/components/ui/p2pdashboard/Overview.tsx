import React from "react";
import { tokens } from "@/styles/tokens";
import Card from "../../Common/Card";
import { transactionData1 } from "@/features/p2p/data";

// Define constants for colors that aren't in tokens
const PROGRESS_COLOR = tokens.colors.brand.primary;
const P2P_COLOR = tokens.colors.brand.secondary;

const Overview = () => {
  const {
    total = 0,
    deposits = 0,
    withdrawals = 0,
    inProgress = 0,
    p2p = 0,
  } = transactionData1 || {};

  return (
    <div>
      <h3 className={`text-[${tokens.colors.dark.textTitle}] mb-2 text-sm`}>
        Overview Total
      </h3>
      <Card
        borderColor={`border-[${tokens.colors.dark.border}]`}
        width="w-full"
        bgColor={`bg-[${tokens.colors.dark.card}]`}
        borderRadius="rounded-[14px]"
        className="p-4"
      >
        <div className="flex flex-col items-center justify-center">
          {/* SVG Circle Chart */}
          <div className="mb-4">
            <svg width="240" height="240" viewBox="0 0 260 260">
              <circle
                cx="130"
                cy="130"
                r="110"
                fill="transparent"
                stroke={tokens.colors.dark.border}
                strokeWidth="12"
              />
              {/* Deposits segment (green) - Top left */}
              <circle
                cx="130"
                cy="130"
                r="110"
                fill="transparent"
                stroke={tokens.colors.brand.primary}
                strokeWidth="14"
                strokeDasharray={`${(deposits / total) * 691} ${
                  691 - (deposits / total) * 691
                }`}
                strokeDashoffset="173"
              />
              {/* P2P segment (blue) - Top right */}
              <circle
                cx="130"
                cy="130"
                r="110"
                fill="transparent"
                stroke={tokens.colors.brand.secondary}
                strokeWidth="14"
                strokeDasharray={`${(p2p / total) * 691} ${
                  691 - (p2p / total) * 691
                }`}
                strokeDashoffset={`${173 - (deposits / total) * 691}`}
              />
              {/* In progress segment (yellow) - Bottom left */}
              <circle
                cx="130"
                cy="130"
                r="110"
                fill="transparent"
                stroke={tokens.colors.brand.primary}
                strokeWidth="14"
                strokeDasharray={`${(inProgress / total) * 691} ${
                  691 - (inProgress / total) * 691
                }`}
                strokeDashoffset={`${173 - ((deposits + p2p) / total) * 691}`}
              />
              {/* Withdrawals segment (red) - Bottom right */}
              <circle
                cx="130"
                cy="130"
                r="110"
                fill="transparent"
                stroke={tokens.colors.brand.secondary}
                strokeWidth="14"
                strokeDasharray={`${(withdrawals / total) * 691} ${
                  691 - (withdrawals / total) * 691
                }`}
                strokeDashoffset={`${
                  173 - ((deposits + p2p + inProgress) / total) * 691
                }`}
              />

              {/* Center text */}
              <text
                x="130"
                y="120"
                textAnchor="middle"
                fill={tokens.colors.dark.textTitle}
                fontSize="22"
                fontWeight="bold"
              >
                {total.toLocaleString()} USD
              </text>
              <text
                x="130"
                y="150"
                textAnchor="middle"
                fill={tokens.colors.dark.textBody}
                fontSize="16"
              >
                Transactions
              </text>
            </svg>
          </div>

          {/* Transaction data details */}
          <div className="w-full flex flex-col gap-3 mt-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full bg-[${tokens.colors.brand.primary}]`}
                ></div>
                <span
                  className={`text-sm text-[${tokens.colors.dark.textBody}]`}
                >
                  Deposits
                </span>
              </div>
              <span
                className={`text-sm text-[${tokens.colors.dark.textTitle}]`}
              >
                {deposits.toLocaleString()} USD
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full bg-[${tokens.colors.brand.secondary}]`}
                ></div>
                <span
                  className={`text-sm text-[${tokens.colors.dark.textBody}]`}
                >
                  Withdrawals
                </span>
              </div>
              <span
                className={`text-sm text-[${tokens.colors.dark.textTitle}]`}
              >
                {withdrawals.toLocaleString()} USD
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full bg-[${tokens.colors.brand.primary}]`}
                ></div>
                <span
                  className={`text-sm text-[${tokens.colors.dark.textBody}]`}
                >
                  In Progress
                </span>
              </div>
              <span
                className={`text-sm text-[${tokens.colors.dark.textTitle}]`}
              >
                {inProgress.toLocaleString()} USD
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full bg-[${tokens.colors.brand.secondary}]`}
                ></div>
                <span
                  className={`text-sm text-[${tokens.colors.dark.textBody}]`}
                >
                  P2P
                </span>
              </div>
              <span
                className={`text-sm text-[${tokens.colors.dark.textTitle}]`}
              >
                {p2p.toLocaleString()} USD
              </span>
            </div>
          </div>
        </div>
      </Card>

      <div className="flex gap-4 flex-col mt-4">
        {/* P2P Buys Card */}
        <Card
          borderColor={`border-[${tokens.colors.dark.border}]`}
          width="w-full"
          bgColor={`bg-[${tokens.colors.dark.card}]`}
          borderRadius="rounded-[14px]"
          className="p-3"
        >
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h3
                className={`font-medium text-sm text-[${tokens.colors.dark.textTitle}]`}
              >
                P2P Buys
              </h3>
              <div className="relative">
                <select
                  className={`px-2 py-1 rounded text-xs appearance-none pr-8 bg-[${tokens.colors.dark.card}] border border-[${tokens.colors.dark.border}] text-[${tokens.colors.dark.textTitle}]`}
                >
                  <option>Month</option>
                </select>
                <span
                  className={`absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none text-[${tokens.colors.dark.textTitle}]`}
                >
                  ▼
                </span>
              </div>
            </div>

            <div
              className={`text-xl font-bold mb-3 text-[${tokens.colors.dark.textTitle}]`}
            >
              30,000 USD
            </div>

            <div
              className={`mb-2 w-full rounded-full h-4 bg-[${tokens.colors.dark.border}]`}
            >
              <div
                className={`h-4 rounded-full w-[66.7%] bg-[${tokens.colors.brand.primary}]`}
              ></div>
            </div>

            <div className="flex flex-col gap-3 mt-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-3 h-3 rounded-full bg-[${tokens.colors.brand.primary}]`}
                  ></div>
                  <span
                    className={`text-sm text-[${tokens.colors.dark.textBody}]`}
                  >
                    Completed
                  </span>
                </div>
                <span className={`text-[${tokens.colors.dark.textTitle}]`}>
                  20,000 USD
                </span>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-3 h-3 rounded-full bg-[${tokens.colors.brand.primary}]`}
                  ></div>
                  <span
                    className={`text-sm text-[${tokens.colors.dark.textBody}]`}
                  >
                    In Escrow
                  </span>
                </div>
                <span className={`text-[${tokens.colors.dark.textTitle}]`}>
                  10,000 USD
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* P2P Sells Card */}
        <Card
          borderColor={`border-[${tokens.colors.dark.border}]`}
          width="w-full"
          bgColor={`bg-[${tokens.colors.dark.card}]`}
          borderRadius="rounded-[14px]"
          className="p-3"
        >
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h3
                className={`font-medium text-sm text-[${tokens.colors.dark.textTitle}]`}
              >
                P2P Sells
              </h3>
              <div className="relative">
                <select
                  className={`px-2 py-1 rounded text-xs appearance-none pr-8 bg-[${tokens.colors.dark.card}] border border-[${tokens.colors.dark.border}] text-[${tokens.colors.dark.textTitle}]`}
                >
                  <option>Month</option>
                </select>
                <span
                  className={`absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none text-[${tokens.colors.dark.textTitle}]`}
                >
                  ▼
                </span>
              </div>
            </div>

            <div
              className={`text-xl font-bold mb-3 text-[${tokens.colors.dark.textTitle}]`}
            >
              5,000 USD
            </div>

            <div
              className={`mb-2 w-full rounded-full h-4 bg-[${tokens.colors.dark.border}]`}
            >
              <div
                className={`h-4 rounded-full w-[80%] bg-[${tokens.colors.brand.secondary}]`}
              ></div>
            </div>

            <div className="flex flex-col gap-3 mt-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-3 h-3 rounded-full bg-[${tokens.colors.brand.secondary}]`}
                  ></div>
                  <span
                    className={`text-sm text-[${tokens.colors.dark.textBody}]`}
                  >
                    Completed
                  </span>
                </div>
                <span className={`text-[${tokens.colors.dark.textTitle}]`}>
                  4,000 USD
                </span>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-3 h-3 rounded-full bg-[${tokens.colors.brand.primary}]`}
                  ></div>
                  <span
                    className={`text-sm text-[${tokens.colors.dark.textBody}]`}
                  >
                    In Escrow
                  </span>
                </div>
                <span className={`text-[${tokens.colors.dark.textTitle}]`}>
                  1,000 USD
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Overview;
