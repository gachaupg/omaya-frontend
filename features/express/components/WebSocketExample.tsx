import React, { useState } from "react";
import {
  useDepositStatusWebSocket,
  useWithdrawalStatusWebSocket,
  useTransactionStatusWebSocket,
  TransactionStatusMessage,
} from "../websockets";

interface WebSocketExampleProps {
  transactionId: string;
  transactionType: "deposit" | "withdrawal";
}

const WebSocketExample: React.FC<WebSocketExampleProps> = ({
  transactionId,
  transactionType,
}) => {
  const [status, setStatus] = useState<string>("pending");
  const [lastMessage, setLastMessage] =
    useState<TransactionStatusMessage | null>(null);

  // Example 1: Using specific hooks
  const { isConnected: isDepositConnected, lastMessage: depositMessage } =
    useDepositStatusWebSocket(
      transactionType === "deposit" ? transactionId : "",
      {
        onMessage: (data) => {
          console.log("Deposit status update:", data);
          setStatus(data.data?.status || data.status || "pending");
          setLastMessage(data);
        },
        autoReconnect: true,
      }
    );

  const { isConnected: isWithdrawalConnected, lastMessage: withdrawalMessage } =
    useWithdrawalStatusWebSocket(
      transactionType === "withdrawal" ? transactionId : "",
      {
        onMessage: (data) => {
          console.log("Withdrawal status update:", data);
          setStatus(data.data?.status || data.status || "pending");
          setLastMessage(data);
        },
        autoReconnect: true,
      }
    );

  // Example 2: Using generic hook
  const { isConnected: isGenericConnected, lastMessage: genericMessage } =
    useTransactionStatusWebSocket(transactionId, transactionType, {
      onMessage: (data) => {
        console.log(`${transactionType} status update:`, data);
        setStatus(data.data?.status || data.status || "pending");
        setLastMessage(data);
      },
      autoReconnect: true,
    });

  // Determine which connection is active
  const isConnected =
    transactionType === "deposit" ? isDepositConnected : isWithdrawalConnected;

  const currentMessage =
    transactionType === "deposit" ? depositMessage : withdrawalMessage;

  return (
    <div className="dark:bg-[#23232b] bg-white dark:border-[#35353E] border-gray-200 border rounded-2xl p-6 dark:text-white text-gray-900">
      <h3 className="text-xl font-bold mb-4">
        WebSocket Status - {transactionType.toUpperCase()}
      </h3>

      {/* Connection Status */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <div
            className={`w-3 h-3 rounded-full ${
              isConnected ? "bg-green-500" : "bg-red-500"
            }`}
          />
          <span className="text-sm">
            {isConnected ? "Connected" : "Disconnected"}
          </span>
        </div>
        <div className="text-xs dark:text-gray-400 text-gray-600">
          Transaction ID: {transactionId}
        </div>
      </div>

      {/* Current Status */}
      <div className="mb-4">
        <h4 className="font-semibold mb-2">Current Status</h4>
        <div className="dark:bg-[#1D1D23] bg-gray-50 rounded-lg p-3">
          <span className="text-lg font-mono">{status}</span>
        </div>
      </div>

      {/* Last Message */}
      {currentMessage && (
        <div className="mb-4">
          <h4 className="font-semibold mb-2">Last Message</h4>
          <div className="dark:bg-[#1D1D23] bg-gray-50 rounded-lg p-3 text-sm">
            <pre className="whitespace-pre-wrap">
              {JSON.stringify(currentMessage, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* Status Steps */}
      <div className="mb-4">
        <h4 className="font-semibold mb-2">Status Steps</h4>
        <div className="space-y-2">
          {[
            "pending",
            "awaiting_payment",
            "processing",
            "exchanging",
            "sending",
            "completed",
          ].map((step) => (
            <div
              key={step}
              className={`flex items-center gap-2 p-2 rounded ${
                status === step
                  ? "bg-[#1D8751] text-white"
                  : "dark:bg-[#1D1D23] bg-gray-50 dark:text-gray-400 text-gray-600"
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  status === step ? "bg-white" : "bg-gray-500"
                }`}
              />
              <span className="capitalize">{step.replace("_", " ")}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Debug Info */}
      <div className="text-xs dark:text-gray-400 text-gray-600">
        <div>Generic Hook Connected: {isGenericConnected ? "Yes" : "No"}</div>
        <div>Specific Hook Connected: {isConnected ? "Yes" : "No"}</div>
      </div>
    </div>
  );
};

export default WebSocketExample;
