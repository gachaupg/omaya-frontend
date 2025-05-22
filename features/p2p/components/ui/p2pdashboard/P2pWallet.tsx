import React from "react";
import { tokens } from "@/styles/tokens";
import Card from "../../Common/Card";
import Button from "../../Common/Button";

const P2pWallet = ({
  isOpenForm,
  setIsOpenForm,
}: {
  isOpenForm: string;
  setIsOpenForm: (isOpenForm: string) => void;
}) => {
  return (
    <div>
      <Card
        borderColor={`border-[${tokens.colors.dark.border}]`}
        width="w-full"
        bgColor={`bg-[${tokens.colors.dark.card}]`}
        borderRadius="rounded-[16px]"
        className="p-3"
      >
        <div className="flex flex-col space-y-3">
          <p
            className={`text-base opacity-70 text-[${tokens.colors.dark.textBody}]`}
          >
            Balance
          </p>

          <div className="flex flex-wrap justify-between items-center">
            <div className="flex text-[14px]  flex-wrap items-baseline">
              <p
                className={`text-[15px] font-medium mr-2 text-[${tokens.colors.dark.textTitle}]`}
              >
                1900.8648 USDT
              </p>
              <span
                className={`text-[${tokens.colors.dark.textBody}] text-lg flex items-center`}
              >
                <span className="mx-1 opacity-50">≈</span>
                <span
                  className={`text-[${tokens.colors.dark.textBody}] opacity-80`}
                >
                  1,900 USD
                </span>
              </span>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => setIsOpenForm("deposit")}
                width={120}
                height={40}
                borderRadius={24}
                variant={isOpenForm === "deposit" ? "primary" : "outline"}
                borderColor={tokens.colors.brand.primary}
                size="md"
                icon={
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12 5V19M12 5L19 12M12 5L5 12"
                      className={
                        isOpenForm === "deposit"
                          ? `stroke-[#ffff]`
                          : `stroke-[${tokens.colors.brand.primary}]`
                      }
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                }
              >
                <p className={`text-[${tokens.colors.dark.textTitle}]`}>
                  Deposit
                </p>
              </Button>

              <Button
                onClick={() => setIsOpenForm("withdraw")}
                width={120}
                height={40}
                borderRadius={24}
                variant={isOpenForm === "withdraw" ? "secondary" : "outline"}
                borderColor={tokens.colors.brand.secondary}
                size="md"
                icon={
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12 19V5M12 19L19 12M12 19L5 12"
                      className={
                        isOpenForm === "withdraw"
                          ? `stroke-[#ffff]`
                          : `stroke-[${tokens.colors.brand.secondary}]`
                      }
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                }
              >
                <p className={`text-[${tokens.colors.dark.textTitle}]`}>
                  Withdraw
                </p>
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default P2pWallet;
