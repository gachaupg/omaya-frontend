import { assetBalances } from "@/features/p2p/data";
import { tokens } from "@/styles/tokens";
import React from "react";

const Available = () => {
  return (
    <div className="mt-4">
      {/* <h3 style={{ color: tokens.colors.brand.primary }} className="mb-2">Available</h3> */}
      <div
        className={`rounded-[24px] border border-[#35353E] h-[140px] overflow-hidden bg-[${tokens.colors.dark.card}]`}
      >
        <div className="w-full">
          {/* Header */}
          <div
            className={`grid grid-cols-3 py-4 px-6 border-b border-[#35353E] bg-[${tokens.colors.dark.card}]`}
          >
            <div className={`text-sm text-[${tokens.colors.dark.textBody}]`}>
              Asset
            </div>
            <div
              className={`text-sm text-right text-[${tokens.colors.dark.textBody}]`}
            >
              Available
            </div>
            <div
              className={`text-sm text-right text-[${tokens.colors.dark.textBody}]`}
            >
              In Escrow / Locked
            </div>
          </div>

          {/* Assets List */}
          <div className={`px-6 py-4 bg-[#18181D]`}>
            {assetBalances.map((asset, index) => (
              <div
                key={index}
                className={`grid grid-cols-3 py-3 border-b last:border-b-0 border-[${tokens.colors.dark.border}]`}
              >
                {/* Asset */}
                <div className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center bg-[${tokens.colors.brand.primary}]`}
                  >
                    {asset.icon === "tether" && (
                      <span
                        className={`font-bold text-lg text-[${tokens.colors.dark.textTitle}]`}
                      >
                        ₮
                      </span>
                    )}
                  </div>
                  <div>
                    <div
                      className={`font-medium text-sm text-[${tokens.colors.dark.textTitle}]`}
                    >
                      {asset.symbol}
                    </div>
                    <div
                      className={`text-xs text-[${tokens.colors.dark.textBody}]`}
                    >
                      {asset.name}
                    </div>
                  </div>
                </div>

                {/* Available */}
                <div
                  className={`text-right self-center text-sm text-[${tokens.colors.dark.textTitle}]`}
                >
                  {asset.available.toFixed(4)}
                </div>

                {/* Locked */}
                <div
                  className={`text-right self-center text-sm text-[${tokens.colors.dark.textTitle}]`}
                >
                  {asset.locked.toFixed(4)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Available;
