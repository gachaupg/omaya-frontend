import { showToast } from "./toast";

export const checkMetaMaskInstalled = (): boolean => {
  return (
    typeof window !== "undefined" && typeof window.ethereum !== "undefined"
  );
};

export const connectMetaMask = async (): Promise<string | null> => {
  try {
    if (!checkMetaMaskInstalled()) {
      showToast.error(
        "MetaMask is not installed. Please install MetaMask to continue."
      );
      return null;
    }

    if (!window.ethereum) {
      showToast.error("MetaMask not available. Please refresh and try again.");
      return null;
    }

    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });
    return accounts[0];
  } catch (error: any) {
    if (error.code === 4001) {
      // User rejected the connection
      showToast.error("Please connect your MetaMask wallet to continue.");
    } else {
      showToast.error("Failed to connect to MetaMask. Please try again.");
    }
    return null;
  }
};

export const getMetaMaskProvider = () => {
  if (!checkMetaMaskInstalled()) {
    return null;
  }
  return window.ethereum;
};

// Add type declaration for window.ethereum
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, callback: (...args: any[]) => void) => void;
      removeListener: (
        event: string,
        callback: (...args: any[]) => void
      ) => void;
      isMetaMask?: boolean;
    };
  }
}
