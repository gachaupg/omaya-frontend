import { useState, useEffect, useCallback } from "react";
import {
  checkMetaMaskInstalled,
  connectMetaMask,
  getMetaMaskProvider,
} from "@/lib/utils/web3";
import { showToast } from "@/lib/utils/toast";

export const useMetaMask = () => {
  const [isInstalled, setIsInstalled] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [account, setAccount] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Check if MetaMask is installed on mount
  useEffect(() => {
    const installed = checkMetaMaskInstalled();
    setIsInstalled(installed);

    if (installed) {
      // Check if already connected
      const provider = getMetaMaskProvider();
      if (provider) {
        provider
          .request({ method: "eth_accounts" })
          .then((accounts: string[]) => {
            if (accounts.length > 0) {
              setAccount(accounts[0]);
              setIsConnected(true);
            }
          })
          .catch(() => {
            setIsConnected(false);
            setAccount(null);
          });
      }
    }
  }, []);

  // Handle account changes
  useEffect(() => {
    if (!isInstalled) return;

    const provider = getMetaMaskProvider();
    if (!provider) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        // User disconnected
        setIsConnected(false);
        setAccount(null);
        showToast.info("MetaMask disconnected");
      } else {
        setAccount(accounts[0]);
        setIsConnected(true);
      }
    };

    provider.on("accountsChanged", handleAccountsChanged);

    return () => {
      provider.removeListener("accountsChanged", handleAccountsChanged);
    };
  }, [isInstalled]);

  // Connect to MetaMask
  const connect = useCallback(async () => {
    if (!isInstalled) {
      showToast.error("Please install MetaMask to continue");
      return null;
    }

    try {
      setIsConnecting(true);
      const connectedAccount = await connectMetaMask();
      if (connectedAccount) {
        setAccount(connectedAccount);
        setIsConnected(true);
        showToast.success("Connected to MetaMask");
      }
      return connectedAccount;
    } catch (error) {
      console.error("Failed to connect to MetaMask:", error);
      return null;
    } finally {
      setIsConnecting(false);
    }
  }, [isInstalled]);

  return {
    isInstalled,
    isConnected,
    isConnecting,
    account,
    connect,
  };
};
