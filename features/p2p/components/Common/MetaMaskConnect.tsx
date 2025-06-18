import React from "react";
import { useMetaMask } from "@/features/p2p/hooks/useMetaMask";
import Button from "./Button";
import { FaWallet } from "react-icons/fa";

interface MetaMaskConnectProps {
  onConnect?: (account: string) => void;
  className?: string;
}

const MetaMaskConnect: React.FC<MetaMaskConnectProps> = ({
  onConnect,
  className = "",
}) => {
  const { isInstalled, isConnected, isConnecting, account, connect } =
    useMetaMask();

  const handleConnect = async () => {
    const connectedAccount = await connect();
    if (connectedAccount && onConnect) {
      onConnect(connectedAccount);
    }
  };

  if (!isInstalled) {
    return (
      <Button
        variant="outline"
        className={`flex items-center gap-2 ${className}`}
        onClick={() => window.open("https://metamask.io/download/", "_blank")}
      >
        <FaWallet />
        Install MetaMask
      </Button>
    );
  }

  if (isConnected && account) {
    return (
      <Button
        variant="outline"
        className={`flex items-center gap-2 ${className}`}
        disabled
      >
        <FaWallet />
        {`${account.slice(0, 6)}...${account.slice(-4)}`}
      </Button>
    );
  }

  return (
    <Button
      variant="primary"
      className={`flex items-center gap-2 ${className}`}
      onClick={handleConnect}
      disabled={isConnecting}
    >
      <FaWallet />
      {isConnecting ? "Connecting..." : "Connect Wallet"}
    </Button>
  );
};

export default MetaMaskConnect;
