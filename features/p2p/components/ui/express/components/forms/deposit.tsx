"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { FaExchangeAlt, FaExclamationCircle } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "@/store";
import {
  fetchAdminPaymentDetails,
  fetchUserPaymentDetails,
} from "@/features/exchange/slices/paymentSlice";
import { fetchAssets } from "@/features/exchange/slices/exchangeSlice";
import { createDeposit, updateDepositAddress } from "@/features/exchange/slices/exchangeSlice";
import { fetchDepositAddress } from "@/features/p2p/slices/depositSlice";
import {
  fetchSupportedAssets,
  fetchSwapEstimate,
} from "@/features/swap/slices/swapSlice";
import { API_CONFIG } from "@/lib/appConfig";

// import { showToast } from "../../../../lib/utils/toast";
import { DepositResponse } from "@/features/exchange/types";
import { SupportedAsset } from "@/features/swap/types";
import { FaSearch } from "react-icons/fa";
import InfoModal from "./info";
import { useTheme } from "@/context/theme";
import QRCode from "qrcode";
import { showToast } from "@/lib/utils/toast";
import { createExpressDeposit } from "../../api";
import { ExpressDepositResponse } from "../../types";

import { logger } from '@/lib/utils/logger';

// Add UserPaymentDetail interface
interface UserPaymentDetail {
  id: number;
  payment_provider_name: string;
  payment_method_name: string;
  account_name: string;
  account_number: string;
  wallet_address?: string;
  // Add fallback properties for compatibility
  provider_name?: string;
  payment_provider?: string;
}


interface DepositFormProps {
  onExchange?: (transactionData: {
    type: "deposit";
    amount: number;
    asset: any;
    paymentDetail: any;
    walletAddress: string;
    network: any;
    // Additional fields for complex assets (optional)
    transactionId?: string;
    depositCode?: string;
    websocket_url?: string;
    expectedAmount?: string;
    netAmount?: string;
    changenowId?: string;
    finalDepositAddress?: string;
  }) => void;
  mode: "deposit" | "withdrawal";
  onModeChange?: (mode: "deposit" | "withdrawal") => void;
  balance?: number;
  skipAmountValidation?: boolean; // New prop to skip amount validation when posting ads
  onCancel?: () => void;
}

export default function DepositForm({
  onExchange,
  mode,
  onModeChange,
  balance,
  skipAmountValidation = false,
  onCancel,
}: DepositFormProps) {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { user } = useSelector((state: any) => state.auth);
  const { adminPaymentDetails, userPaymentDetails, loading, error } = useSelector(
    (state: any) => state.payment
  );
  const { depositAddress, addressLoading, error: addressError } = useSelector(
    (state: any) => state.deposits
  );
  const { assets, loading: assetsLoading } = useSelector(
    (state: any) => state.exchange
  );

  // Add swap assets state
  const { supportedAssets: swapAssets, loading: swapAssetsLoading } =
    useSelector((state: any) => state.swap);
  const { isDark } = useTheme();

  const [payAmount, setPayAmount] = useState(0); // Set default amount to $0
  const [payAmountInput, setPayAmountInput] = useState("0"); // String value for input display
  const [payBank, setPayBank] = useState("");
  const [getAmount, setGetAmount] = useState(0); // Default amount after 2% commission (0 - 0 = 0)
  const [getAmountInput, setGetAmountInput] = useState("0"); // String value for input display
  const [selectedAsset, setSelectedAsset] = useState<any>(() => {
    // Initialize with USDT immediately
    return {
      ticker: "USDT",
      symbol: "USDT",
      name: "Tether USD",
      network: "BSC",
      range_commissions: [{ commission: "2" }],
      commission: "2",
      fee_rate: "2",
      image_url: "https://res.cloudinary.com/pitz/image/upload/v1752248529/2b5c7d80-7bcd-4cfb-8bd9-d1760a752afc.png_mhuppr.png",
      asset_id: "usdt-bsc-initial"
    };
  });
  const [selectedNetwork, setSelectedNetwork] = useState<any>(() => {
    // Initialize with BSC network immediately
    return {
      network_id: "BSC",
      network_type: "BSC",
      network: "BSC",
      name: "Binance Smart Chain BEP20",
      icon: "https://res.cloudinary.com/pitz/image/upload/v1752248529/2b5c7d80-7bcd-4cfb-8bd9-d1760a752afc.png_mhuppr.png",
      isDefault: true
    };
  });
  const [isCalculatingFromPay, setIsCalculatingFromPay] = useState(true);
  const [walletAddress, setWalletAddress] = useState("");
  const [walletError, setWalletError] = useState<string | null>(null);
  const [isNetworkDropdownOpen, setIsNetworkDropdownOpen] = useState(false);

  // Network options - only Binance Smart Chain BEP20
  const availableNetworks = [
    {
      network_id: "BSC",
      network_type: "BSC",
      network: "BSC",
      name: "Binance Smart Chain BEP20",
      icon: "https://res.cloudinary.com/pitz/image/upload/v1752248529/2b5c7d80-7bcd-4cfb-8bd9-d1760a752afc.png_mhuppr.png",
      isDefault: true
    }
  ];

  const [forceUpdate, setForceUpdate] = useState(0);
  const [selectedPaymentDetail, setSelectedPaymentDetail] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [confirmPayment, setConfirmPayment] = useState(false);


  // Add deposit response state
  const [depositResponse, setDepositResponse] = useState<ExpressDepositResponse | null>(null);
  const [isTransactionSubmitted, setIsTransactionSubmitted] = useState(false);
  const [websocket, setWebsocket] = useState<WebSocket | null>(null);
  const [transactionStatus, setTransactionStatus] = useState<string>("pending");
  const [websocketRetryCount, setWebsocketRetryCount] = useState<number>(0);
  const [websocketError, setWebsocketError] = useState<string | null>(null);
  // Add transaction code state
  const [transactionCode, setTransactionCode] = useState<string>("");
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [isAddressCopied, setIsAddressCopied] = useState(false);
  const [isCodeCopied, setIsCodeCopied] = useState(false);
  const [isDepositAddressCopied, setIsDepositAddressCopied] = useState(false);
  const paymentDetailsRef = useRef<HTMLDivElement>(null);

  // Generate QR code for deposit address
  const generateQRCode = async (address: string) => {
    try {
      const qrDataUrl = await QRCode.toDataURL(address, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      setQrCodeDataUrl(qrDataUrl);
    } catch (error) {
      logger.error('p2p', "Failed to generate QR code:", error);
    }
  };

  // Debug function to test asset fetching
  const handleDebugAssets = async () => {
    try {
      logger.debug('p2p', "=== Starting debug asset fetch ===");
      logger.debug('p2p', "Current exchange assets:", assets);
      logger.debug('p2p', "Current swap assets:", swapAssets);

      // Force refresh both asset types
      logger.debug('p2p', "🔄 Force refreshing exchange assets...");
      await dispatch(fetchAssets(true)).unwrap();

      logger.debug('p2p', "🔄 Force refreshing swap assets...");
      await dispatch(fetchSupportedAssets(true)).unwrap();

      logger.debug('p2p', "✅ Assets force refreshed");
    } catch (error) {
      console.error("Debug failed:", error);
    }
  };

  // Asset selection state for search functionality
  const [isAssetDropdownOpen, setIsAssetDropdownOpen] = useState(false);
  const [assetSearchTerm, setAssetSearchTerm] = useState("");
  const assetDropdownRef = useRef<HTMLDivElement>(null);
  const networkDropdownRef = useRef<HTMLDivElement>(null);

  // Estimate calculation state
  const [estimate, setEstimate] = useState<any>(null);
  const [estimateLoading, setEstimateLoading] = useState(false);
  const [estimateError, setEstimateError] = useState<string | null>(null);

  // First card submission state
  const [isFirstCardSubmitted, setIsFirstCardSubmitted] = useState(false);

  // Add loading state for "You Receive" calculation
  const [isCalculatingReceive, setIsCalculatingReceive] = useState(false);

  // Add calculation stability state
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationTimeout, setCalculationTimeout] = useState<NodeJS.Timeout | null>(null);
  const [calculationComplete, setCalculationComplete] = useState(false);
  const [estimateTimeout, setEstimateTimeout] = useState<NodeJS.Timeout | null>(null);

  // Add state to store API response
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [isUserModifiedAmount, setIsUserModifiedAmount] = useState(false);

  // Add InfoModal state
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

  // Add validation state for minimum receive amount
  const [receiveAmountError, setReceiveAmountError] = useState<string | null>(null);

  // Enhanced filtering with fallback options (same as withdrawal form)
  const enhancedFilteredUserPaymentDetails = payBank
    ? (userPaymentDetails || []).filter((detail: any) => {
      // Try multiple possible field names for provider name
      const providerName =
        detail.payment_provider_name ||
        detail.provider_name ||
        detail.payment_provider;

      return providerName === payBank;
    })
    : [];


  // WebSocket connection for monitoring deposit status
  const connectWebSocket = (websocketUrl: string, isRetry: boolean = false) => {
    try {
      // Validate WebSocket URL
      if (!websocketUrl || websocketUrl.trim() === "") {
        console.error("WebSocket URL is empty or undefined");
        setWebsocketError("WebSocket URL is empty or undefined");
        return null;
      }

      // Clean up malformed URLs (remove //http: or //https: from WebSocket URLs)
      let cleanedUrl = websocketUrl;
      if (websocketUrl.includes('//http:') || websocketUrl.includes('//https:')) {
        cleanedUrl = websocketUrl.replace('//http:', '').replace('//https:', '');
        logger.debug('p2p', "Cleaned malformed WebSocket URL:", {
          original: websocketUrl,
          cleaned: cleanedUrl
        });
      }

      // Ensure proper WebSocket protocol - always use wss for production/secure contexts
      let finalUrl = cleanedUrl;

      logger.debug('p2p', "WebSocket URL protocol conversion:", {
        originalUrl: websocketUrl,
        currentProtocol: window.location.protocol,
        isSecure: window.location.protocol === 'https:',
        isProduction: window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1',
        isDevBackend: websocketUrl.includes('dev.backend.omaya.io'),
        needsConversion: websocketUrl.startsWith('ws://') && (window.location.protocol === 'https:' || window.location.hostname !== 'localhost' || websocketUrl.includes('dev.backend.omaya.io'))
      });

      // Check if we need to convert ws:// to wss://
      if (websocketUrl.startsWith('ws://')) {
        // Convert ws:// to wss:// for secure contexts or production environments
        const isSecure = window.location.protocol === 'https:';
        const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
        const isDevBackend = websocketUrl.includes('dev.backend.omaya.io');

        // Always use wss:// for:
        // 1. HTTPS contexts
        // 2. Production environments (non-localhost)
        // 3. Dev backend (dev.backend.omaya.io) - as it likely only supports wss://
        if (isSecure || isProduction || isDevBackend) {
          finalUrl = websocketUrl.replace('ws://', 'wss://');
          logger.debug('p2p', "Converted WebSocket URL from ws:// to wss://");
          logger.debug('p2p', "URL conversion:", {
            before: websocketUrl,
            after: finalUrl,
            reason: isSecure ? 'HTTPS context' : isProduction ? 'Production environment' : 'Dev backend requires wss://'
          });
        }
      } else if (!websocketUrl.startsWith('wss://')) {
        // If URL doesn't have protocol, try to determine from current location
        const isSecure = window.location.protocol === 'https:';
        const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
        const isDevBackend = websocketUrl.includes('dev.backend.omaya.io');
        const useWss = isSecure || isProduction || isDevBackend;

        finalUrl = `${useWss ? 'wss://' : 'ws://'}${websocketUrl}`;
        logger.debug('p2p', "Added WebSocket protocol:", {
          before: websocketUrl,
          after: finalUrl,
          protocol: useWss ? 'wss' : 'ws',
          reason: isSecure ? 'HTTPS context' : isProduction ? 'Production environment' : isDevBackend ? 'Dev backend requires wss://' : 'HTTP context'
        });
      }

      // Validate the constructed URL
      try {
        new URL(finalUrl);
      } catch (urlError) {
        console.error("Invalid WebSocket URL:", {
          originalUrl: websocketUrl,
          constructedUrl: finalUrl,
          error: urlError
        });
        setWebsocketError(`Invalid WebSocket URL: ${finalUrl}`);
        return null;
      }

      logger.debug('p2p', `Attempting WebSocket connection to: ${finalUrl}${isRetry ? ' (retry attempt)' : ''}`);

      // Pre-connection validation and logging
      logger.debug('p2p', "WebSocket connection attempt details:", {
        originalUrl: websocketUrl,
        finalUrl: finalUrl,
        protocolChanged: websocketUrl !== finalUrl,
        isRetry: isRetry,
        retryCount: websocketRetryCount,
        isSecure: window.location.protocol === 'https:',
        isProduction: window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1',
        userAgent: navigator.userAgent,
        online: navigator.onLine,
        timestamp: new Date().toISOString()
      });

      const ws = new WebSocket(finalUrl);

      // Set up connection timeout
      const connectionTimeout = setTimeout(() => {
        if (ws.readyState === WebSocket.CONNECTING) {
          console.error("WebSocket connection timeout after 10 seconds");
          ws.close();
          setWebsocketError("WebSocket connection timeout. Please check your network connection.");
          setWebsocket(null);
        }
      }, 10000); // 10 second timeout

      ws.onopen = () => {
        clearTimeout(connectionTimeout);
        logger.debug('p2p', "WebSocket connected for deposit monitoring");
        setWebsocket(ws);
        setWebsocketError(null);
        setWebsocketRetryCount(0);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          logger.debug('p2p', "WebSocket message received:", data);

          if (data.status) {
            setTransactionStatus(data.status);

            if (data.status === "completed") {
              showToast.success("Deposit completed successfully!");
              // Reload the page instead of going to success page
              setTimeout(() => {
                window.location.reload();
              }, 2000); // Wait 2 seconds to show success message
            } else if (data.status === "failed") {
              showToast.error("Deposit failed. Please contact support.");
            }
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

      ws.onclose = (event) => {
        clearTimeout(connectionTimeout);
        logger.debug('p2p', "WebSocket connection closed:", {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean,
          closeCode: event.code,
          closeReason: event.reason
        });
        setWebsocket(null);

        // Attempt retry if connection was not clean and we haven't exceeded retry limit
        if (!event.wasClean && websocketRetryCount < 3) {
          logger.debug('p2p', `Attempting WebSocket retry ${websocketRetryCount + 1}/3`);
          setWebsocketRetryCount(prev => prev + 1);
          setTimeout(() => {
            const retryWs = connectWebSocket(websocketUrl, true);
            if (!retryWs) {
              console.error(`WebSocket retry ${websocketRetryCount + 1} failed`);
              if (websocketRetryCount >= 2) {
                setWebsocketError("WebSocket connection failed after multiple retry attempts. Please refresh the page to try again.");
              }
            }
          }, 2000 * (websocketRetryCount + 1)); // Exponential backoff
        } else if (!event.wasClean && websocketRetryCount >= 3) {
          console.error("WebSocket connection failed after maximum retry attempts");
          setWebsocketError("WebSocket connection failed after multiple retry attempts. Please refresh the page to try again.");
        }
      };

      ws.onerror = (error) => {
        clearTimeout(connectionTimeout);

        // Determine the specific error type based on WebSocket readyState
        let errorType = 'Unknown error';
        let errorDescription = '';
        let suggestedAction = '';

        switch (ws.readyState) {
          case WebSocket.CONNECTING:
            errorType = 'Connection failed';
            errorDescription = 'Failed to establish WebSocket connection';
            suggestedAction = 'Check if the WebSocket server is running and accessible';
            break;
          case WebSocket.OPEN:
            errorType = 'Communication error';
            errorDescription = 'Error occurred during WebSocket communication';
            suggestedAction = 'Check network stability and server response';
            break;
          case WebSocket.CLOSING:
            errorType = 'Connection closing error';
            errorDescription = 'Error occurred while closing WebSocket connection';
            suggestedAction = 'This is usually not critical, connection will be retried';
            break;
          case WebSocket.CLOSED:
            errorType = 'Connection closed';
            errorDescription = 'WebSocket connection was closed unexpectedly';
            suggestedAction = 'Connection will be retried automatically';
            break;
        }

        const errorMessage = `WebSocket ${errorType}: ${errorDescription}`;

        // Safely extract error information from Event object
        const errorInfo = {
          // Basic error information
          error: error,
          eventType: error.type || 'error',
          target: error.target,
          url: finalUrl,
          readyState: ws.readyState,
          readyStateText: ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'][ws.readyState],
          timestamp: new Date().toISOString(),
          errorType: errorType,
          errorDescription: errorDescription,
          suggestedAction: suggestedAction,

          // Event object properties (safely accessed)
          eventDetails: {
            isTrusted: error.isTrusted,
            bubbles: error.bubbles,
            cancelable: error.cancelable,
            defaultPrevented: error.defaultPrevented,
            eventPhase: error.eventPhase,
            timeStamp: error.timeStamp,
            currentTarget: error.currentTarget,
            srcElement: error.srcElement
          },

          // Additional debugging information
          connectionInfo: {
            protocol: ws.protocol || 'none',
            extensions: ws.extensions || 'none',
            binaryType: ws.binaryType || 'blob',
            bufferedAmount: ws.bufferedAmount || 0
          },

          // Network and environment info
          environment: {
            userAgent: navigator.userAgent,
            online: navigator.onLine,
            protocol: window.location.protocol,
            host: window.location.host,
            isSecure: window.location.protocol === 'https:'
          }
        };

        console.error("WebSocket error details:", errorInfo);
        console.error("WebSocket error summary:", {
          url: finalUrl,
          readyState: ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'][ws.readyState],
          errorType: errorType,
          suggestedAction: suggestedAction
        });

        // Try alternative protocol if this is the first attempt
        if (websocketRetryCount === 0 && finalUrl.startsWith('ws://')) {
          logger.debug('p2p', "Attempting fallback to wss:// protocol");
          const fallbackUrl = finalUrl.replace('ws://', 'wss://');
          setTimeout(() => {
            connectWebSocket(fallbackUrl, true);
          }, 1000);
          return; // Don't set error yet, let the fallback try first
        }

        setWebsocketError(errorMessage);
        setWebsocket(null);
      };

      return ws;
    } catch (error) {
      const errorMessage = `Failed to create WebSocket connection: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error("Failed to create WebSocket connection:", {
        error: error,
        url: websocketUrl,
        message: error instanceof Error ? error.message : 'Unknown error'
      });
      setWebsocketError(errorMessage);
      return null;
    }
  };

  // Cleanup WebSocket on component unmount
  useEffect(() => {
    return () => {
      if (websocket) {
        websocket.close();
      }
    };
  }, [websocket]);


  // Handle simple deposit submission
  const handleSubmit = async () => {
    // Clear previous errors
    setValidationErrors([]);

    // Validate form
    const errors = validateForm();
    if (errors.length > 0) {
      setValidationErrors(errors);
      showToast.error("Please fix the following errors: " + errors.join(", "));
      return;
    }

    setIsSubmitting(true);

    try {
      const asset = selectedAsset.ticker || selectedAsset.symbol;
      const network = selectedNetwork.network || selectedNetwork.name;

      logger.debug('p2p', "Submitting deposit request with:", {
        asset,
        network,
        amount: skipAmountValidation ? "NOT INCLUDED" : payAmount,
        skipAmountValidation
      });

      // Call the express deposit API
      const depositPayload: any = {
        asset,
        network,
        user_payment_detail_id: 1 // Default payment detail ID
      };

      // Only include amount if skipAmountValidation is false
      if (!skipAmountValidation && payAmount > 0) {
        depositPayload.amount = payAmount.toString();
      }

      const depositResponse = await createExpressDeposit(depositPayload);

      logger.debug('p2p', "Express deposit response:", depositResponse);

      // Create transaction data for the exchanging page
      const transactionData = {
        type: "deposit" as const,
        amount: skipAmountValidation ? 0 : payAmount,
        asset: {
          name: selectedAsset.name,
          ticker: selectedAsset.ticker || selectedAsset.symbol,
          symbol: selectedAsset.symbol,
          network: selectedNetwork.network || selectedNetwork.name,
          image_url: selectedAsset.image_url || selectedAsset.asset_image || selectedAsset.icon_url || selectedAsset.image,
        },
        paymentDetail: selectedPaymentDetail || { provider_name: "direct", payment_method_type: "crypto" },
        walletAddress: depositResponse.deposit_address,
        network: selectedNetwork,
        depositAddress: depositResponse.deposit_address,
        transactionId: depositResponse.transaction_id,
        depositCode: depositResponse.details?.changenow_id || depositResponse.transaction_id,
        websocket_url: depositResponse.websocket_url,
        expectedAmount: depositResponse.details?.estimated_amount || depositResponse.net_amount,
        netAmount: depositResponse.net_amount,
        changenowId: depositResponse.details?.changenow_id || depositResponse.transaction_id,
        finalDepositAddress: depositResponse.deposit_address,
        details: depositResponse.details || {},
      };

      logger.debug('p2p', "Transaction data:", transactionData);

      // Store transaction data in localStorage for the exchanging page
      localStorage.setItem('express_transaction_data', JSON.stringify(transactionData));

      showToast.success("Deposit request created successfully!");

      // Navigate to exchanging page
      if (onExchange) {
        onExchange(transactionData);
      } else {
        router.push('/dashboard/express-exchange');
      }
    } catch (error: any) {
      console.error("Deposit submission error:", error);
      showToast.error(`Failed to create deposit: ${error.message || error}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    // Try to fetch from cache first, then API if needed
    dispatch(fetchAdminPaymentDetails(false)) // false = don't force refresh
      .unwrap()
      .catch((error: unknown) => {
        showToast.error(`Failed to fetch admin payment details: ${error}`);
      });
  }, [dispatch]);

  useEffect(() => {
    // First try to get from cache, then force refresh if no data
    dispatch(fetchAssets(false))
      .unwrap()
      .then((data) => {
        logger.debug('p2p', "DEBUG: Exchange assets loaded:", {
          hasAssets: !!data?.assets,
          assetsLength: data?.assets?.length || 0,
          totalBalance: data?.total_wallet_balance
        });

        // If no assets in cache, force refresh
        if (!data?.assets || data.assets.length === 0) {
          logger.debug('p2p', "🔄 No assets in cache, forcing refresh...");
          return dispatch(fetchAssets(true)).unwrap();
        }
        return data;
      })
      .catch((error: unknown) => {
        console.error("Failed to fetch assets from cache, trying force refresh:", error);
        // If cache fetch fails, try force refresh
        return dispatch(fetchAssets(true))
          .unwrap()
          .catch((refreshError: unknown) => {
            showToast.error(`Failed to fetch assets: ${refreshError}`);
            throw refreshError;
          });
      });
  }, [dispatch]);

  // Fetch user payment details
  useEffect(() => {
    dispatch(fetchUserPaymentDetails())
      .unwrap()
      .catch((error: unknown) => {
        showToast.error(`Failed to fetch user payment details: ${error}`);
      });
  }, [dispatch]);

  // Fetch deposit address when asset and network are available
  useEffect(() => {
    if (selectedAsset && selectedNetwork) {
      const asset = selectedAsset.ticker || selectedAsset.symbol;
      const network = selectedNetwork.network || selectedNetwork.name;

      dispatch(fetchDepositAddress({ asset, network }))
        .unwrap()
        .then((addressData) => {
          // Auto-fill the wallet address input with the deposit address
          if (addressData && addressData.data && addressData.data.address) {
            setWalletAddress(addressData.data.address);
            setWalletError(null); // Clear any existing errors
            // Generate QR code for the address
            generateQRCode(addressData.data.address);
          }
        })
        .catch((error: unknown) => {
          console.error("Failed to fetch deposit address:", error);
        });
    }
  }, [dispatch, selectedAsset, selectedNetwork]);

  // Fetch swap assets
  useEffect(() => {
    dispatch(fetchSupportedAssets(false))
      .unwrap()
      .then((data) => {
        logger.debug('p2p', "DEBUG: Swap assets loaded:", {
          hasAssets: !!data,
          assetsLength: data?.length || 0
        });

        // If no assets in cache, force refresh
        if (!data || data.length === 0) {
          logger.debug('p2p', "🔄 No swap assets in cache, forcing refresh...");
          return dispatch(fetchSupportedAssets(true)).unwrap();
        }
        return data;
      })
      .catch((error: unknown) => {
        console.error("Failed to fetch swap assets from cache, trying force refresh:", error);
        // If cache fetch fails, try force refresh
        return dispatch(fetchSupportedAssets(true))
          .unwrap()
          .catch((refreshError: unknown) => {
            console.error("Failed to fetch swap assets even with force refresh:", refreshError);

            // Only show error if it's a network issue, not cache issues
            if (refreshError instanceof Error) {
              if (refreshError.message.includes("Network Error") || refreshError.message.includes("Network connection issue")) {
                showToast.warning("Network Issue", "Unable to fetch assets due to network problems. Using fallback data.");
              } else if (refreshError.message.includes("Server Error")) {
                showToast.error("Server Error", "Unable to fetch assets from server. Please try again later.");
              } else if (!refreshError.message.includes("Cache")) {
                // Only show error if it's not a cache-related issue
                showToast.error("Asset Loading Error", `Failed to fetch swap assets: ${refreshError.message}`);
              }
            }

            // Set fallback assets so the form can still work - only USDT Tether
            const fallbackAssets = [
              {
                ticker: "USDT",
                symbol: "USDT",
                name: "Tether USD",
                network: "BSC",
                range_commissions: [{ commission: "2" }],
                commission: "2",
                fee_rate: "2",
                image_url: "https://res.cloudinary.com/pitz/image/upload/v1752248529/2b5c7d80-7bcd-4cfb-8bd9-d1760a752afc.png_mhuppr.png",
                asset_id: "usdt-tether-bsc"
              }
            ];

            // Update the Redux store with fallback assets
            dispatch({
              type: "swap/fetchSupportedAssets/fulfilled",
              payload: fallbackAssets
            });

            throw refreshError;
          });
      });
  }, [dispatch]);

  // Auto-select USDT Tether asset - always ensure USDT is available and selected
  useEffect(() => {
    logger.debug('p2p', "DEBUG: Asset selection effect triggered:", {
      hasSwapAssets: !!swapAssets,
      swapAssetsLength: swapAssets?.length || 0,
      hasSelectedAsset: !!selectedAsset,
      swapAssets: swapAssets
    });

    // Always ensure USDT is selected, regardless of API assets
    if (!selectedAsset) {
      // Try to find USDT Tether from the API assets first (we'll force BSC network)
      let usdtAsset = null;
      if (swapAssets && swapAssets.length > 0) {
        usdtAsset = swapAssets.find((asset: any) => {
          const ticker = (asset.ticker || asset.symbol || "").toString().toLowerCase();
          const name = (asset.name || "").toString().toLowerCase();
          return ticker === "usdt" && (name.includes("tether") || name.includes("usdt"));
        });
        logger.debug('p2p', "DEBUG: Found USDT Tether from API:", usdtAsset);
      }

      // Always create/use a USDT Tether asset - fallback if not found in API
      const selectedUsdtAsset = usdtAsset ? {
        ...usdtAsset,
        network: "BSC", // Force BSC network for USDT Tether
        name: "Tether USD"
      } : {
        ticker: "USDT",
        symbol: "USDT",
        name: "Tether USD",
        network: "BSC",
        range_commissions: [{ commission: "2" }],
        commission: "2",
        fee_rate: "2",
        image_url: "https://res.cloudinary.com/pitz/image/upload/v1752248529/2b5c7d80-7bcd-4cfb-8bd9-d1760a752afc.png_mhuppr.png",
        asset_id: "usdt-tether-bsc"
      };

      logger.debug('p2p', "DEBUG: Setting selected asset:", selectedUsdtAsset);
      setSelectedAsset(selectedUsdtAsset);
      setSelectedNetwork({
        network_id: "BSC",
        network_type: "BSC",
        network: "BSC",
        name: "Binance Smart Chain BEP20",
        icon: "https://res.cloudinary.com/pitz/image/upload/v1752248529/2b5c7d80-7bcd-4cfb-8bd9-d1760a752afc.png_mhuppr.png",
        isDefault: true
      });
    }
  }, [swapAssets, selectedAsset]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        assetDropdownRef.current &&
        !assetDropdownRef.current.contains(event.target as Node)
      ) {
        setIsAssetDropdownOpen(false);
      }
      if (
        networkDropdownRef.current &&
        !networkDropdownRef.current.contains(event.target as Node)
      ) {
        setIsNetworkDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Check if asset is USDT (should use simple calculation)
  const isSimpleCalculationAsset = (asset: any) => {
    if (!asset) return false;
    const ticker = (asset.ticker || asset.symbol || "").toLowerCase();
    return ticker === "usdt";
  };

  // Fetch estimate for non-USDT assets - triggers immediately on asset or amount change
  useEffect(() => {
    logger.debug('p2p', "Estimate useEffect triggered:", {
      selectedAsset: selectedAsset?.ticker,
      isSimple: selectedAsset ? isSimpleCalculationAsset(selectedAsset) : null,
      payAmount,
      shouldFetch: selectedAsset && !isSimpleCalculationAsset(selectedAsset) && payAmount && payAmount > 0
    });

    if (
      selectedAsset &&
      !isSimpleCalculationAsset(selectedAsset) &&
      payAmount &&
      payAmount > 0 &&
      isCalculatingFromPay
    ) {
      setEstimateLoading(true);
      setEstimateError(null);

      // Use the actual fetchSwapEstimate API call for deposit
      // For deposits: fromCurrency is USDT, toCurrency is the selected asset


      // Add timeout to prevent hanging API calls
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Request timeout")), 30000); // 30 second timeout
      });

      Promise.race([
        dispatch(
          fetchSwapEstimate({
            fromCurrency: "USDT",
            fromNetwork: "BSC",
            toCurrency: selectedAsset.ticker,
            toNetwork: selectedAsset.network,
            amount: payAmount,
          })
        ),
        timeoutPromise
      ])
        .then((result: any) => {
          if (result.payload) {
            setEstimate(result.payload);
          }

          // Clear loading states after successful calculation
          setIsCalculating(false);
          setIsCalculatingReceive(false);
        })
        .catch((error) => {
          console.error("Failed to fetch swap estimate:", error);

          // Handle different types of errors gracefully
          if (error.message?.includes("Request timeout")) {
            setEstimateError("Request timeout: Using fallback calculation");
            logger.debug('p2p', "Using fallback calculation due to request timeout");
            showToast.warning("Request timeout: Using estimated rate");
          } else if (error.message?.includes("Network Error") || error.code === "ECONNREFUSED" || error.code === "ENOTFOUND") {
            setEstimateError("Network error: Using fallback calculation");
            logger.debug('p2p', "Using fallback calculation due to network error");
            showToast.warning("Using estimated rate due to network issues");
          } else if (error.message?.includes("Server Error")) {
            setEstimateError("Server error: Using fallback calculation");
            logger.debug('p2p', "Using fallback calculation due to server error");
            showToast.warning("Using estimated rate due to server issues");
          } else if (error.message?.includes("Invalid swap parameters")) {
            setEstimateError("Invalid parameters: Using fallback calculation");

            showToast.warning("Invalid parameters: Using estimated rate");
          } else {
            setEstimateError("API error: Using fallback calculation");

            showToast.warning("Using estimated rate due to API unavailability");
          }

          // Common fallback calculation for all error types
          const commissionRate = selectedAsset?.range_commissions?.[0]?.commission
            ? parseFloat(selectedAsset.range_commissions[0].commission)
            : 2;
          const commissionAmount = (payAmount * commissionRate) / 100;
          const calculatedGetAmount = payAmount - commissionAmount;
          setGetAmount(calculatedGetAmount);
          setGetAmountInput(calculatedGetAmount.toString());

          // Clear loading states after fallback calculation
          setIsCalculating(false);
          setIsCalculatingReceive(false);
        })
        .finally(() => {
          setEstimateLoading(false);
        });
    } else {
      // Clear estimate for USDT or when conditions not met
      setEstimate(null);
      setEstimateError(null);
    }
  }, [selectedAsset, payAmount, isCalculatingFromPay]);

  // Fetch reverse estimate for non-USDT assets when calculating from receive amount
  useEffect(() => {
    logger.debug('p2p', "Reverse estimate useEffect triggered:", {
      selectedAsset: selectedAsset?.ticker,
      isSimple: selectedAsset ? isSimpleCalculationAsset(selectedAsset) : null,
      getAmount,
      shouldFetch: selectedAsset && !isSimpleCalculationAsset(selectedAsset) && getAmount && getAmount > 0 && !isCalculatingFromPay
    });

    if (
      selectedAsset &&
      !isSimpleCalculationAsset(selectedAsset) &&
      getAmount &&
      getAmount > 0 &&
      !isCalculatingFromPay
    ) {
      setEstimateLoading(true);
      setEstimateError(null);

      // For reverse calculation, we need to estimate the pay amount from the receive amount
      // We'll call the API with the correct direction to get the required USDT amount

      logger.debug('p2p', "Fetching reverse estimate for deposit:", {
        fromCurrency: selectedAsset.ticker, // We're converting FROM the selected asset
        fromNetwork: selectedAsset.network,
        toCurrency: "USDT", // TO USDT (since we want to know how much USDT we need)
        toNetwork: "BSC",
        amount: getAmount, // Use the receive amount directly
      });

      // Add timeout to prevent hanging API calls
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Request timeout")), 30000); // 30 second timeout
      });

      Promise.race([
        dispatch(
          fetchSwapEstimate({
            fromCurrency: selectedAsset.ticker, // FROM selected asset
            fromNetwork: selectedAsset.network,
            toCurrency: "USDT", // TO USDT
            toNetwork: "BSC",
            amount: getAmount, // Use receive amount directly
          })
        ),
        timeoutPromise
      ])
        .then((result: any) => {
          logger.debug('p2p', "Reverse estimate result:", result);
          if (result.payload && (result.payload as any)?.estimated_amount) {
            // The API now returns how much USDT we need to get the desired amount
            const requiredUsdtAmount = (result.payload as any)?.estimated_amount;

            if (requiredUsdtAmount && requiredUsdtAmount > 0) {
              // Set the pay amount to the required USDT amount
              setPayAmount(requiredUsdtAmount);
              setPayAmountInput(requiredUsdtAmount.toString());
              setEstimate(result.payload);
              logger.debug('p2p', "Reverse calculation successful:", {
                desiredReceive: getAmount,
                requiredPay: requiredUsdtAmount
              });
            }

            // Clear loading states after successful calculation
            setIsCalculating(false);
            setIsCalculatingReceive(false);
          }
        })
        .catch((error) => {
          console.error("Failed to fetch reverse estimate:", error);

          // Handle different types of errors gracefully
          if (error.message?.includes("Request timeout")) {
            setEstimateError("Request timeout: Using fallback calculation");
            logger.debug('p2p', "Using fallback calculation due to request timeout");
            showToast.warning("Request timeout: Using estimated rate");
          } else if (error.message?.includes("Network Error") || error.code === "ECONNREFUSED" || error.code === "ENOTFOUND") {
            setEstimateError("Network error: Using fallback calculation");
            logger.debug('p2p', "Using fallback calculation due to network error");
            showToast.warning("Using estimated rate due to network issues");
          } else if (error.message?.includes("Server Error")) {
            setEstimateError("Server error: Using fallback calculation");
            logger.debug('p2p', "Using fallback calculation due to server error");
            showToast.warning("Using estimated rate due to server issues");
          } else if (error.message?.includes("Invalid swap parameters")) {
            setEstimateError("Invalid parameters: Using fallback calculation");
            logger.debug('p2p', "Using fallback calculation due to invalid API parameters");
            showToast.warning("Invalid parameters: Using estimated rate");
          } else {
            setEstimateError("API error: Using fallback calculation");
            logger.debug('p2p', "Using fallback calculation due to API error");
            showToast.warning("Using estimated rate due to API unavailability");
          }

          // Common fallback calculation for all error types
          let commissionRate = 2; // Default fallback
          if (selectedAsset?.range_commissions && selectedAsset.range_commissions.length > 0) {
            const firstCommission = selectedAsset.range_commissions[0];
            if (firstCommission?.commission) {
              commissionRate = parseFloat(firstCommission.commission);
            }
          } else if (selectedAsset?.commission) {
            commissionRate = parseFloat(selectedAsset.commission);
          } else if (selectedAsset?.fee_rate) {
            commissionRate = parseFloat(selectedAsset.fee_rate);
          }

          const fallbackPayAmount = getAmount * (1 + commissionRate / 100);
          setPayAmount(fallbackPayAmount);
          setPayAmountInput(fallbackPayAmount.toString());

          // Clear loading states after fallback calculation
          setIsCalculating(false);
          setIsCalculatingReceive(false);
        })
        .finally(() => {
          setEstimateLoading(false);
        });
    }
  }, [selectedAsset, getAmount, isCalculatingFromPay]);

  // Safety timeout to clear loading states if they get stuck
  useEffect(() => {
    const safetyTimeout = setTimeout(() => {
      if (isCalculating || isCalculatingReceive) {
        logger.debug('p2p', "Safety timeout: Clearing stuck loading states");
        setIsCalculating(false);
        setIsCalculatingReceive(false);
      }
    }, 15000); // 15 second safety timeout

    return () => clearTimeout(safetyTimeout);
  }, [isCalculating, isCalculatingReceive]);

  // Filter swap assets based on search term - search by ticker and name
  const filteredSwapAssets =
    swapAssets?.filter((asset: SupportedAsset) => {
      const ticker = asset.ticker?.toUpperCase() || "";
      const name = asset.name?.toUpperCase() || "";
      const symbol = asset.symbol?.toUpperCase() || "";
      const searchTerm = assetSearchTerm.toUpperCase();

      return ticker.includes(searchTerm) ||
        name.includes(searchTerm) ||
        symbol.includes(searchTerm);
    }) || [];

  // Filter to show ONLY USDT Tether - exactly this asset
  const sortedSwapAssets = (() => {
    // Always return exactly this asset - no API filtering needed
    const exactAssets = [
      {
        ticker: "USDT",
        symbol: "USDT",
        name: "Tether USD",
        network: "BSC",
        range_commissions: [{ commission: "2" }],
        commission: "2",
        fee_rate: "2",
        image_url: "https://res.cloudinary.com/pitz/image/upload/v1752248529/2b5c7d80-7bcd-4cfb-8bd9-d1760a752afc.png_mhuppr.png",
        asset_id: "usdt-tether-bsc"
      }
    ];

    // Filter based on search term if provided
    if (assetSearchTerm.trim()) {
      const searchTerm = assetSearchTerm.toUpperCase();
      return exactAssets.filter(asset =>
        asset.ticker.includes(searchTerm) ||
        asset.name.toUpperCase().includes(searchTerm) ||
        "TETHER".includes(searchTerm) ||
        "USD COIN".includes(searchTerm) ||
        "BSC".includes(searchTerm) ||
        "BEP20".includes(searchTerm)
      );
    }

    return exactAssets;
  })();

  // Calculate fees and amounts - Network fee is always 0
  const networkFee = 0;
  // Use default commission rate for swap assets (can be updated based on asset type)
  const commissionRate = selectedAsset?.range_commissions?.[0]?.commission
    ? parseFloat(selectedAsset.range_commissions[0].commission)
    : 2; // Default 2% commission for swap assets
  const commissionAmount = (getAmount * commissionRate) / 100;
  const totalFees = networkFee + commissionAmount;

  // Stable calculation function with debouncing
  const calculateAmounts = (fromAmount: number, fromPay: boolean = true) => {
    logger.debug('p2p', "calculateAmounts called:", {
      fromAmount,
      fromPay,
      selectedAsset: selectedAsset?.ticker,
      isCalculating,
      isCalculatingReceive,
      isCalculatingFromPay
    });

    // Clear any existing timeout
    if (calculationTimeout) {
      clearTimeout(calculationTimeout);
    }

    if (!selectedAsset) {
      setReceiveAmountError(null);
      setIsCalculating(false);
      setIsCalculatingReceive(false);
      return;
    }

    if (fromAmount <= 0) {
      setReceiveAmountError(null);
      setIsCalculating(false);
      setIsCalculatingReceive(false);
      return;
    }

    // Ensure we're not in an infinite loop
    if (isCalculating || isCalculatingReceive) {
      logger.debug('p2p', "Already calculating, skipping...");
      return;
    }

    // For simple calculation assets (USDT), calculate immediately
    if (isSimpleCalculationAsset(selectedAsset)) {
      let commissionRate = 2; // Default fallback

      // Safely access commission rate with multiple fallback options
      if (selectedAsset?.range_commissions && selectedAsset.range_commissions.length > 0) {
        const firstCommission = selectedAsset.range_commissions[0];
        if (firstCommission?.commission) {
          commissionRate = parseFloat(firstCommission.commission);
        }
      } else if (selectedAsset?.commission) {
        // Try alternative commission property
        commissionRate = parseFloat(selectedAsset.commission);
      } else if (selectedAsset?.fee_rate) {
        // Try fee_rate property
        commissionRate = parseFloat(selectedAsset.fee_rate);
      }

      // Ensure commission rate is a valid number
      if (isNaN(commissionRate) || commissionRate <= 0) {
        commissionRate = 2; // Default to 2% if invalid
      }

      if (fromPay) {
        // Forward calculation: from pay amount to receive amount
        const commissionAmount = (fromAmount * commissionRate) / 100;
        const networkFee = 0;
        const totalFees = networkFee + commissionAmount;
        const calculatedGetAmount = fromAmount - totalFees;
        logger.debug('p2p', "Forward calculation result:", { fromAmount, calculatedGetAmount, totalFees });
        setGetAmount(calculatedGetAmount);
        setGetAmountInput(calculatedGetAmount.toString());
      } else {
        // Reverse calculation: from receive amount to pay amount
        const commissionAmount = (fromAmount * commissionRate) / 100;
        const networkFee = 0;
        const totalFees = networkFee + commissionAmount;
        const calculatedPayAmount = fromAmount + totalFees;
        logger.debug('p2p', "Reverse calculation result:", { fromAmount, calculatedPayAmount, totalFees, commissionRate });
        setPayAmount(calculatedPayAmount);
        setPayAmountInput(calculatedPayAmount.toString());
      }

      setReceiveAmountError(null);

      // For simple assets, no loading states needed - calculation is instant
      return;
    }

    // Set calculating state immediately for complex calculations
    setIsCalculating(true);
    setIsCalculatingReceive(true);

    // Debounce calculation to prevent rapid updates
    const timeout = setTimeout(() => {
      if (!selectedAsset) {
        setIsCalculating(false);
        setIsCalculatingReceive(false);
        setReceiveAmountError(null);
        return;
      }

      // Don't reset amounts to 0 - let user keep their input
      if (fromAmount <= 0) {
        setIsCalculating(false);
        setIsCalculatingReceive(false);
        setReceiveAmountError(null);
        return;
      }

      try {
        if (fromPay) {
          // Forward calculation: from pay amount to receive amount
          if (isSimpleCalculationAsset(selectedAsset)) {
            // Simple calculation for USDT
            let commissionRate = 2; // Default fallback

            // Safely access commission rate with multiple fallback options
            if (selectedAsset?.range_commissions && selectedAsset.range_commissions.length > 0) {
              const firstCommission = selectedAsset.range_commissions[0];
              if (firstCommission?.commission) {
                commissionRate = parseFloat(firstCommission.commission);
              }
            } else if (selectedAsset?.commission) {
              // Try alternative commission property
              commissionRate = parseFloat(selectedAsset.commission);
            } else if (selectedAsset?.fee_rate) {
              // Try fee_rate property
              commissionRate = parseFloat(selectedAsset.fee_rate);
            }

            // Ensure commission rate is a valid number
            if (isNaN(commissionRate) || commissionRate <= 0) {
              commissionRate = 2; // Default to 2% if invalid
            }

            const commissionAmount = (fromAmount * commissionRate) / 100;
            const networkFee = 0;
            const totalFees = networkFee + commissionAmount;
            const calculatedGetAmount = fromAmount - totalFees;
            logger.debug('p2p', "Complex forward calculation result:", { fromAmount, calculatedGetAmount, totalFees, commissionRate });
            setGetAmount(calculatedGetAmount);
            setGetAmountInput(calculatedGetAmount.toString());
            setReceiveAmountError(null);
          } else {
            // For non-USDT assets, we need to fetch estimate
            // The estimate fetching is handled in the useEffect above
            if (estimate && estimate.estimated_amount) {
              setGetAmount(estimate.estimated_amount);
              setGetAmountInput(estimate.estimated_amount.toString());
              setReceiveAmountError(null);
            } else if (estimateLoading) {
              // Show loading state while estimate is being fetched
              setIsCalculating(true);
              setIsCalculatingReceive(true);
              // Don't update amounts yet, wait for estimate
            } else {
              // For non-USDT assets, only show loading until API estimate is available
              // Don't do manual calculations - wait for API
              setIsCalculating(true);
              setIsCalculatingReceive(true);
            }
          }
        } else {
          // Reverse calculation: from receive amount to pay amount
          if (isSimpleCalculationAsset(selectedAsset)) {
            // Simple reverse calculation for USDT
            let commissionRate = 2; // Default fallback

            // Safely access commission rate with multiple fallback options
            if (selectedAsset?.range_commissions && selectedAsset.range_commissions.length > 0) {
              const firstCommission = selectedAsset.range_commissions[0];
              if (firstCommission?.commission) {
                commissionRate = parseFloat(firstCommission.commission);
              }
            } else if (selectedAsset?.commission) {
              // Try alternative commission property
              commissionRate = parseFloat(selectedAsset.commission);
            } else if (selectedAsset?.fee_rate) {
              // Try fee_rate property
              commissionRate = parseFloat(selectedAsset.fee_rate);
            }

            // Ensure commission rate is a valid number
            if (isNaN(commissionRate) || commissionRate <= 0) {
              commissionRate = 2; // Default to 2% if invalid
            }

            const commissionAmount = (fromAmount * commissionRate) / 100;
            const networkFee = 0;
            const totalFees = networkFee + commissionAmount;
            const calculatedPayAmount = fromAmount + totalFees;
            logger.debug('p2p', "Complex reverse calculation result:", { fromAmount, calculatedPayAmount, totalFees, commissionRate });
            setPayAmount(calculatedPayAmount);
            setPayAmountInput(calculatedPayAmount.toString());
            setReceiveAmountError(null);
          } else {
            // For non-USDT assets, we need to fetch estimate for reverse calculation
            // Use the API to find the pay amount that gives us the desired receive amount
            setEstimateLoading(true);
            setEstimateError(null);

            // For reverse calculation, we need to estimate from the receive amount
            // We'll use a trial-and-error approach or call the API with different amounts
            // For now, show loading state and calculate a rough estimate
            const roughEstimate = fromAmount * 1.02; // Rough estimate with 2% commission
            setPayAmount(roughEstimate);
            setPayAmountInput(roughEstimate.toString());

            // Set loading states
            setIsCalculating(true);
            setIsCalculatingReceive(true);
          }
        }
      } catch (error) {
        console.error("Calculation error:", error);
        setReceiveAmountError("Calculation error occurred");
      } finally {
        setIsCalculating(false);
        setIsCalculatingReceive(false);
        setCalculationComplete(true);

        // Reset completion status after a short delay
        setTimeout(() => {
          setCalculationComplete(false);
        }, 100);
      }
    }, 50); // Short debounce for better UX

    setCalculationTimeout(timeout);
  };



  // Recalculate when asset changes
  useEffect(() => {
    logger.debug('p2p', "Selected asset changed:", selectedAsset);
    if (selectedAsset && payAmount > 0 && isCalculatingFromPay) {
      // Clear any existing estimate when asset changes
      setEstimate(null);
      setEstimateError(null);
      // Trigger calculation with new asset
      calculateAmounts(payAmount, true);
    }
  }, [selectedAsset]);

  // Forward calculations are now handled directly in the input handlers
  // This useEffect was causing duplicate calculations and loading state conflicts

  // Update amounts when estimate is received or for simple calculation assets
  useEffect(() => {
    logger.debug('p2p', "Estimate effect triggered:", {
      hasEstimate: !!estimate,
      estimateLoading,
      isCalculatingFromPay,
      payAmount,
      getAmount,
      estimateAmount: (estimate as any)?.estimated_amount
    });

    if (estimate && !estimateLoading) {
      if (isCalculatingFromPay && payAmount > 0) {
        // Forward calculation: update receive amount
        logger.debug('p2p', "Estimate received, updating receive amount:", (estimate as any)?.estimated_amount);

        if ((estimate as any)?.estimated_amount && (estimate as any)?.estimated_amount > 0) {
          setGetAmount((estimate as any).estimated_amount);
          setGetAmountInput((estimate as any).estimated_amount.toString());
          setReceiveAmountError(null);
          setIsCalculating(false);
          setIsCalculatingReceive(false);
        } else {
          logger.debug('p2p', "DEBUG: Invalid estimate received, clearing loading state");
          setGetAmount(0);
          setGetAmountInput("");
          setReceiveAmountError("Invalid estimate received");
          setIsCalculating(false);
          setIsCalculatingReceive(false);
        }
      } else if (!isCalculatingFromPay && getAmount > 0) {
        // Reverse calculation: estimate already handled in reverse useEffect
        setIsCalculating(false);
        setIsCalculatingReceive(false);
        setReceiveAmountError(null);
      }
    } else if (estimateLoading) {
      // Loading states are managed by the input handlers and calculateAmounts function
      // Don't interfere with them here
    } else if (!estimate && !estimateLoading) {
      // No estimate available - loading states are managed elsewhere
      // Don't interfere with them here
    }
  }, [estimate, estimateLoading, isCalculatingFromPay, payAmount, getAmount, selectedAsset]);

  // Reverse calculations are now handled directly in the input handlers
  // This useEffect was causing duplicate calculations and loading state conflicts

  // Re-validate wallet address when asset changes (allow all address types)
  useEffect(() => {
    if (walletAddress.trim() && selectedAsset) {
      // Allow all address types - no specific network validation
      if (walletAddress.trim().length < 10) {
        setWalletError("Address seems too short");
      } else {
        setWalletError(null);
      }
    } else if (!walletAddress.trim()) {
      // Clear error when wallet address is empty (optional field for initial submission)
      setWalletError(null);
    }
  }, [selectedAsset, walletAddress]);

  // Auto-validate receive amount whenever it changes
  useEffect(() => {
    // Remove minimum amount validation - any amount is allowed
    setReceiveAmountError(null);
  }, [getAmount]);

  // Validate first card data
  const validateFirstCard = () => {
    const errors: string[] = [];

    // Skip amount validation when skipAmountValidation is true (for posting ads)
    if (!skipAmountValidation) {
      if (!payAmount || payAmount <= 0) {
        errors.push("Please enter a valid amount");
      }
    }

    if (!selectedAsset) {
      errors.push("Please select an asset");
    }

    // Wallet address is optional - no validation needed here

    setValidationErrors(errors);
    return errors.length === 0;
  };


  // Validate form data
  const validateForm = () => {
    const errors: string[] = [];

    // Skip amount validation when skipAmountValidation is true (for posting ads)
    if (!skipAmountValidation) {
      if (!payAmount || payAmount <= 0) {
        errors.push("Please enter a valid amount");
      }
    }

    if (!selectedAsset) {
      errors.push("Please select an asset");
    }


    // Wallet address is optional for initial submission - only required for address update step
    if (walletAddress.trim() && walletError) {
      errors.push("Please enter a valid wallet address");
    }

    if (!selectedNetwork) {
      errors.push("Please select a network");
    } else {
      // Validate that network has required fields
      if (!selectedNetwork.network_id && !selectedNetwork.network_type) {
        errors.push("Selected network is missing required information");
      }
    }

    return errors;
  };

  // Handle proceeding to next step (with or without wallet address)
  /**
   * Handles the two-step deposit process:
   * 
   * For Simple Assets (USDT):
   * - Single API call flow
   * - Uses original response data
   * 
   * For Complex Assets (all others):
   * - Step 1: First API call returns basic info with status "pending_address"
   * - Step 2: After updating address, second response contains:
   *   * websocket_url (different from first response)
   *   * expected_amount, net_amount
   *   * changenow_id
   *   * deposit_address
   *   * status: "pending"
   * 
   * The second response should be used for the final transaction data.
   */
  const handleProceedToNext = async () => {
    if (!apiResponse?.transaction_id) {
      showToast.error("No transaction ID available");
      return;
    }

    // Validate wallet address is required for address update
    if (!walletAddress.trim()) {
      showToast.error("Wallet address is required to proceed");
      return;
    }

    if (walletError) {
      showToast.error("Please enter a valid wallet address");
      return;
    }

    // Check if this is a simple calculation asset (USDT)
    const isSimpleAsset = selectedAsset && isSimpleCalculationAsset(selectedAsset);

    setIsSubmitting(true);

    try {
      let finalResponse = apiResponse;
      let updateResponse;

      // For simple assets (USDT), proceed as before
      if (isSimpleAsset) {
        // Only update deposit address if one is provided
        if (walletAddress.trim()) {
          updateResponse = await dispatch(
            updateDepositAddress({
              transactionId: apiResponse.transaction_id,
              depositAddress: walletAddress,
            })
          ).unwrap();
          showToast.success("Address updated successfully!");
        } else {
          // No wallet address provided - use a placeholder or skip update
          updateResponse = { status: "pending" };
          showToast.success("Proceeding without wallet address!");
        }
      } else {
        // For other assets, implement two-step process
        logger.debug('p2p', "DEBUG: Implementing two-step process for complex asset:", selectedAsset?.ticker);
        logger.debug('p2p', "DEBUG: Expected flow: First response -> update address -> Second response with additional details");

        // According to user description, the expected flow for complex assets is:
        // 1. First API response: { transaction_id, deposit_code, status: "pending_address", requires_deposit_address: true, websocket_url }
        // 2. After updating address, second response: { transaction_id, deposit_address, websocket_url (different), changenow_id, expected_amount, net_amount, status: "pending" }
        // 
        // The second response should be used for the final transaction data, including:
        // - New websocket_url (different from first response)
        // - expected_amount and net_amount for accurate calculations
        // - changenow_id for tracking
        // - deposit_address for final confirmation

        // Step 1: Update deposit address (this triggers the second response)
        if (walletAddress.trim()) {
          updateResponse = await dispatch(
            updateDepositAddress({
              transactionId: apiResponse.transaction_id,
              depositAddress: walletAddress,
            })
          ).unwrap();

          if (updateResponse && typeof updateResponse === 'object') {
            // Try to extract additional fields if they exist
            const responseData = updateResponse as any;

            // According to user description, the second response should contain:
            // websocket_url, changenow_id, expected_amount, net_amount, deposit_address, status: "pending"
            if (responseData.websocket_url || responseData.expected_amount || responseData.net_amount || responseData.changenow_id) {
              // This response contains the additional fields we need
              finalResponse = {
                ...apiResponse,
                ...responseData,
                // Ensure we have the transaction_id and deposit_code
                transaction_id: responseData.transaction_id || apiResponse.transaction_id,
                deposit_code: responseData.deposit_code || apiResponse.deposit_code,
              };

              showToast.success("Address updated successfully! Transaction details updated.");
            } else {

              showToast.success("Address updated successfully!");
            }
          } else {
            showToast.success("Address updated successfully!");
          }
        } else {
          // No wallet address provided - this might not work for complex assets
          updateResponse = { status: "pending" };
          showToast.warning("Warning: Complex assets typically require a deposit address");
        }
      }

      // Prepare transaction data for the status page
      const transactionData = {
        type: "deposit" as const,
        amount: skipAmountValidation ? 0 : payAmount,
        asset: {
          ...selectedAsset,
          icon: selectedAsset.image_url || selectedAsset.asset_image || selectedAsset.icon_url || selectedAsset.image
        },
        paymentDetail: selectedPaymentDetail || { provider_name: "direct", payment_method_type: "crypto" },
        walletAddress: walletAddress.trim() || "Not provided",
        network: selectedNetwork,
        transactionId: finalResponse.transaction_id,
        depositCode: finalResponse.deposit_code,
        status: updateResponse.status,
        websocket_url: finalResponse.websocket_url, // Use the appropriate websocket URL
        // Add additional fields from the final response for complex assets
        ...(finalResponse.expected_amount && { expectedAmount: finalResponse.expected_amount }),
        ...(finalResponse.net_amount && { netAmount: finalResponse.net_amount }),
        ...(finalResponse.changenow_id && { changenowId: finalResponse.changenow_id }),
        ...(finalResponse.deposit_address && { finalDepositAddress: finalResponse.deposit_address }),
      };

      logger.debug('p2p', "DEBUG: Final transaction data:", transactionData);

      // Navigate to the exchanging status page automatically
      if (onExchange) {
        onExchange(transactionData);
      } else {
        // Fallback navigation if onExchange is not provided
        router.push(`/dashboard/express-exchange?transactionId=${finalResponse.transaction_id}`);
      }
    } catch (error: any) {
      console.error("Failed to update deposit address:", error);
      let errorMessage = "Failed to process request";

      if (error.response?.data) {
        const responseData = error.response.data;
        if (responseData.message) {
          // Check for specific error message and show user-friendly message
          if (responseData.message.includes("Transaction not found or not eligible for address update")) {
            errorMessage = "Your address doesn't match the requested asset";
          } else {
            errorMessage = responseData.message;
          }
        } else if (responseData.error) {
          // Check for specific error in error field
          if (responseData.error.includes("Transaction not found or not eligible for address update")) {
            errorMessage = "Your address doesn't match the requested asset";
          } else {
            errorMessage = responseData.error;
          }
        } else if (responseData.details) {
          errorMessage = responseData.details;
        } else if (typeof responseData === "string") {
          // Check for specific error in string response
          if (responseData.includes("Transaction not found or not eligible for address update")) {
            errorMessage = "Your address doesn't match the requested asset";
          } else {
            errorMessage = responseData;
          }
        }
      } else if (error.message) {
        // Check for specific error in error.message
        if (error.message.includes("Transaction not found or not eligible for address update")) {
          errorMessage = "Your address doesn't match the requested asset";
        } else {
          errorMessage = error.message;
        }
      }

      // For address update failures, show more specific message
      if (errorMessage === "Failed to process request" || errorMessage === "Failed to update deposit address") {
        errorMessage = "Your wallet address doesn't match the asset requested";
      }

      showToast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle form submission - REMOVED (duplicate function)
  /*
    // Validate form
    const errors = validateForm();
    if (errors.length > 0) {
      setValidationErrors(errors);
      showToast.error("Please fix the following errors: " + errors.join(", "));
      return;
    }

    setIsSubmitting(true);

    try {
      // Debug logging
      logger.debug('p2p', "DEBUG: Form data being submitted:", {
        payAmount,
        walletAddress,
        selectedPaymentDetail,
        selectedAsset,
        selectedNetwork,
      });

      // Create FormData for API submission
      const depositPayload = new FormData();

      // Validate and append required fields
      if (!payAmount || payAmount <= 0) {
        throw new Error("Invalid amount");
      }
      depositPayload.append("requested_amount", payAmount.toString());

              // Wallet address is optional for initial submission
        if (walletAddress.trim()) {
          depositPayload.append("deposit_address", walletAddress);
        } else {
          // Set empty value when wallet address is not provided
          depositPayload.append("deposit_address", "");
        }

      if (!selectedPaymentDetail.provider_name) {
        throw new Error("Payment provider is missing");
      }
      depositPayload.append(
        "payment_provider",
        selectedPaymentDetail.provider_name
      );

      if (!selectedPaymentDetail.payment_method_type) {
        throw new Error("Payment method is missing");
      }
      depositPayload.append(
        "payment_method",
        selectedPaymentDetail.payment_method_type
      );

      // Handle currency field - use the asset ticker/symbol/name from the selected asset
      let currencyValue = "";
      
      // Try different properties in order of preference
      if (selectedAsset.ticker) {
        currencyValue = selectedAsset.ticker;
      } else if (selectedAsset.symbol) {
        // Handle special case for USDT Tether
        currencyValue = selectedAsset.symbol === "USDT Tether" ? "USDT" : selectedAsset.symbol;
      } else if (selectedAsset.name) {
        currencyValue = selectedAsset.name;
      }
      
      // Clean up the currency value (remove any extra spaces, etc.)
      currencyValue = currencyValue?.trim();
      
      // Fallback: if still no currency value, try to extract from any available property
      if (!currencyValue) {
        // Try to get any string value from the asset object
        const assetKeys = Object.keys(selectedAsset);
        for (const key of assetKeys) {
          const value = selectedAsset[key];
          if (typeof value === 'string' && value.trim()) {
            currencyValue = value.trim();
            break;
          }
        }
      }

      if (!currencyValue) {
        throw new Error("Currency information is missing");
      }
      depositPayload.append("currency", currencyValue);

      // Handle network field - use the network from selected asset or network
      let networkValue = "";
      
      // Try to get network from selected network first
      if (selectedNetwork?.network_id) {
        networkValue = selectedNetwork.network_id;
      } else if (selectedNetwork?.network_type) {
        networkValue = selectedNetwork.network_type;
      } else if (selectedAsset?.network) {
        // Fallback to asset network
        networkValue = selectedAsset.network;
      }
      
      // Clean up the network value
      networkValue = networkValue?.trim();
      
      // Fallback: if still no network value, try to extract from any available property
      if (!networkValue) {
        // Try to get any string value from the network object
        if (selectedNetwork) {
          const networkKeys = Object.keys(selectedNetwork);
          for (const key of networkKeys) {
            const value = selectedNetwork[key];
            if (typeof value === 'string' && value.trim()) {
              networkValue = value.trim();
              break;
            }
          }
        }
      }

      if (!networkValue) {
        throw new Error("Network information is missing");
      }
      depositPayload.append("network", networkValue);

      // Handle asset field - use the asset ticker/symbol/name from the selected asset
      let assetValue = "";
      
      // Try different properties in order of preference
      if (selectedAsset.ticker) {
        assetValue = selectedAsset.ticker;
      } else if (selectedAsset.symbol) {
        // Handle special case for USDT Tether
        assetValue = selectedAsset.symbol === "USDT Tether" ? "USDT" : selectedAsset.symbol;
      } else if (selectedAsset.name) {
        assetValue = selectedAsset.name;
      }
      
      // Clean up the asset value (remove any extra spaces, etc.)
      assetValue = assetValue?.trim();
      
      // Fallback: if still no asset value, try to extract from any available property
      if (!assetValue) {
        // Try to get any string value from the asset object
        const assetKeys = Object.keys(selectedAsset);
        for (const key of assetKeys) {
          const value = selectedAsset[key];
          if (typeof value === 'string' && value.trim()) {
            assetValue = value.trim();
            break;
          }
        }
      }

      if (!assetValue) {
        throw new Error("Asset information is missing");
      }
      depositPayload.append("asset", assetValue);

      // Add additional info
      depositPayload.append(
        "additional_info",
        `Account: ${selectedPaymentDetail.account_name}, Account Number: ${selectedPaymentDetail.account_number}`
      );

      // Log the complete FormData for debugging
      logger.debug('p2p', "DEBUG: Complete FormData entries:");
      for (let [key, value] of depositPayload.entries()) {
        logger.debug('p2p', `${key}:`, value);
      }

      // Submit to API - let axios set the correct Content-Type for FormData
      const depositResponse = (await dispatch(
        createDeposit({
          payload: depositPayload,
          config: {
            // Don't set Content-Type manually for FormData - let axios handle it
          },
        })
      ).unwrap()) as unknown as DepositResponse;

      logger.debug('p2p', "DEBUG: Deposit response:", depositResponse);
    

      // Store the API response and update transaction code
      setApiResponse(depositResponse);
      setTransactionCode(depositResponse.deposit_code || "");

      // Show success message
      showToast.success("Deposit request submitted successfully!");

      // Proceed to next page only after successful submission
      if (onExchange) {
        const transactionData = {
          type: "deposit" as const,
          amount: skipAmountValidation ? 0 : payAmount,
          asset: {
            ...selectedAsset,
            icon: selectedAsset.image_url || selectedAsset.asset_image || selectedAsset.icon_url || selectedAsset.image
          },
          paymentDetail: selectedPaymentDetail,
          walletAddress: walletAddress,
          network: selectedNetwork,
          transactionId: depositResponse.transaction_id,
          depositCode: depositResponse.deposit_code,
          totalAmountDue: depositResponse.total_amount_due,
          commission: depositResponse.commission,
          networkFee: depositResponse.network_fee,
          currency: depositResponse.currency,
          websocketUrl: depositResponse.websocket_url,
        };
        logger.debug('p2p', "DEBUG: Calling onExchange with:", transactionData);
        onExchange(transactionData);
      }
    } catch (error: any) {
     
      let errorMessage = "Failed to submit deposit request";

      if (error.response?.data) {
        // Try to extract specific error message from response
        const responseData = error.response.data;
        if (responseData.message) {
          // Check for specific error message and show user-friendly message
          if (responseData.message.includes("Transaction not found or not eligible for address update")) {
            errorMessage = "Your address doesn't match the requested asset";
          } else {
            errorMessage = responseData.message;
          }
        } else if (responseData.error) {
          // Check for specific error in error field
          if (responseData.error.includes("Transaction not found or not eligible for address update")) {
            errorMessage = "Your address doesn't match the requested asset";
          } else {
            errorMessage = responseData.error;
          }
        } else if (responseData.details) {
          errorMessage = responseData.details;
        } else if (typeof responseData === "string") {
          // Check for specific error in string response
          if (responseData.includes("Transaction not found or not eligible for address update")) {
            errorMessage = "Your address doesn't match the requested asset";
          } else {
            errorMessage = responseData;
          }
        }
      } else if (error.message) {
        // Check for specific error in error.message
        if (error.message.includes("Transaction not found or not eligible for address update")) {
          errorMessage = "Your address doesn't match the requested asset";
        } else {
          errorMessage = error.message;
        }
      }

      // For address update failures, show more specific message
      if (errorMessage === "Failed to process request" || errorMessage === "Failed to submit deposit request") {
        errorMessage = "Your wallet address doesn't match the asset requested";
      }

      showToast.error(errorMessage);
      setValidationErrors([errorMessage]);
    } finally {
      setIsSubmitting(false);
    }
  };
  */

  useEffect(() => {
    if (selectedPaymentDetail && paymentDetailsRef.current) {
      paymentDetailsRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      setTimeout(() => {
        window.scrollBy({ top: -80, left: 0, behavior: "smooth" });
      }, 400);
    }
  }, [selectedPaymentDetail]);

  return (
    <div className="w-full  flex flex-col ">
      <h2 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3 text-[#788099]">
        Transaction Info
      </h2>

      {/* Network Status Indicator */}
      {estimateError && !estimateLoading && (
        <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-[#F79330] bg-opacity-10 border border-[#F79330] rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#F79330]">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                <path d="M12 8v4m0 4h.01" stroke="#F79330" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="12" cy="12" r="10" stroke="#F79330" strokeWidth="2" />
              </svg>
              <span className="text-sm font-medium">
                {estimateError.includes("Network error") ? "Network Issues Detected" :
                  estimateError.includes("Server error") ? "Server Issues Detected" :
                    estimateError.includes("Request timeout") ? "Request Timeout" :
                      "API Issues Detected"}
              </span>
            </div>
            <span className="text-xs text-[#F79330] opacity-75">
              Using fallback calculations
            </span>
          </div>
          <p className="text-xs text-[#F79330] mt-1 opacity-75">
            Live rates are temporarily unavailable. Calculations are based on estimated rates.
          </p>
        </div>
      )}
      <div className="w-full mx-auto text-white">
        {/* Transaction Info Card with Asset and Network selects only */}
        <div className="relative mb-3 sm:mb-4">
          {/* Transaction Info Card Container */}
          <div className="border border-[#D1D2D4FF] dark:border-[#35353E] rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6">

            {/* Two Select Fields Row - Asset and Network only */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">

              {/* Asset Select */}
              <div>
                <label className="block text-base sm:text-[17px] lg:text-[20px] text-[#7e7e8f] dark:text-[#ffffff] mb-2 sm:mb-3 font-semibold">
                  Asset
                </label>
                <div className="relative" ref={assetDropdownRef}>
                  <div
                    className="w-full text-[#35353e] dark:bg-[#1D1D23] dark:text-[#ffffff] rounded-xl sm:rounded-2xl px-3 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base focus:outline-none border border-[#A2A4A9FF] dark:border-[#35353E] flex items-center justify-between cursor-pointer min-h-[44px] sm:min-h-0"
                    onClick={() => setIsAssetDropdownOpen(!isAssetDropdownOpen)}
                  >
                    <div className="flex items-center gap-3">
                      {selectedAsset ? (
                        <>
                          <img
                            src={selectedAsset.image_url || selectedAsset.asset_image || "https://res.cloudinary.com/pitz/image/upload/v1752248529/2b5c7d80-7bcd-4cfb-8bd9-d1760a752afc.png_mhuppr.png"}
                            alt={selectedAsset.name || selectedAsset.ticker || "Asset"}
                            className="w-6 h-6 rounded-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = "https://res.cloudinary.com/pitz/image/upload/v1752248529/2b5c7d80-7bcd-4cfb-8bd9-d1760a752afc.png_mhuppr.png";
                            }}
                          />
                          <span className="text-[#35353e] dark:text-[#788099]">
                            {(selectedAsset.ticker || selectedAsset.symbol || selectedAsset.name || "USDT").toUpperCase()}
                          </span>
                          <span className="ml-2 bg-[#1D8751] text-[#ffffff] dark:text-[#ffffff] text-xs font-semibold px-2 py-0.5 rounded-full">
                            BSC
                          </span>
                        </>
                      ) : (
                        <span className="text-[#7e7e8f] dark:text-[#788099]">Select Asset</span>
                      )}
                    </div>
                    <svg className={`w-5 h-5 text-[#7e7e8f] transition-transform ${isAssetDropdownOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>

                  {/* Asset Dropdown */}
                  {isAssetDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-[#ffffff] dark:bg-[#1D1D23] border border-[#A2A4A9FF] dark:border-[#35353E] rounded-xl sm:rounded-2xl z-50 max-h-[60vh] sm:max-h-80 overflow-hidden">
                      {/* Search Input */}
                      <div className="p-2 sm:p-3 border-b border-[#A2A4A9FF] dark:border-accent">
                        <div className="relative">
                          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#7e7e8f] w-4 h-4" />
                          <input
                            type="text"
                            placeholder="Search assets..."
                            value={assetSearchTerm}
                            onChange={(e) => setAssetSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 sm:py-2 text-sm sm:text-base text-[#35353e] dark:bg-[#35353E] dark:text-[#ffffff] rounded-lg border border-[#A2A4A9FF] dark:border-[#35353E] focus:outline-none focus:border-[#1D8751] min-h-[44px] sm:min-h-0"
                          />
                        </div>
                      </div>

                      {/* Asset List */}
                      <div className="max-h-60 overflow-y-auto">
                        {sortedSwapAssets.length > 0 ? (
                          sortedSwapAssets.map((asset: any, index: number) => (
                            <div
                              key={`${asset.asset_id || 'asset'}-${asset.symbol || asset.ticker || asset.name}-${asset.network}-${index}`}
                              className="flex items-center gap-3 p-3 text-black dark:text-white hover:bg-[#78787AFF] dark:hover:bg-[#35353E] cursor-pointer border-b border-[#A2A4A9FF] dark:border-[#35353E] last:border-b-0"
                              onClick={() => {
                                setSelectedAsset(asset);

                                // Force BSC network for USDT assets
                                const ticker = (asset.ticker || asset.symbol || "").toLowerCase();
                                const isUsdt = ticker === "usdt";

                                setSelectedNetwork({
                                  network_id: isUsdt ? "BSC" : asset.network,
                                  network_type: isUsdt ? "BSC" : asset.network,
                                  network: isUsdt ? "BSC" : asset.network,
                                  name: isUsdt ? "Binance Smart Chain BEP20" : asset.network,
                                  icon: isUsdt ? "https://res.cloudinary.com/pitz/image/upload/v1752248529/2b5c7d80-7bcd-4cfb-8bd9-d1760a752afc.png_mhuppr.png" : "https://cryptologos.cc/logos/ethereum-eth-logo.png",
                                  isDefault: isUsdt
                                });
                                setIsAssetDropdownOpen(false);
                                setAssetSearchTerm("");
                              }}
                            >
                              <img
                                src={asset.image_url || asset.asset_image || "https://res.cloudinary.com/pitz/image/upload/v1752248529/2b5c7d80-7bcd-4cfb-8bd9-d1760a752afc.png_mhuppr.png"}
                                alt={asset.name || asset.ticker || "Asset"}
                                className="w-6 h-6 rounded-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.src = "https://res.cloudinary.com/pitz/image/upload/v1752248529/2b5c7d80-7bcd-4cfb-8bd9-d1760a752afc.png_mhuppr.png";
                                }}
                              />
                              <div className="flex-1">
                                <div className="text-[#35353e] dark:text-[#ffffff] font-medium flex items-center gap-2">
                                  {(asset.ticker || asset.symbol || asset.name || "Unknown").toUpperCase()}
                                  <span className="bg-[#1D8751] text-[#ffffff] dark:text-[#ffffff] text-xs font-semibold px-2 py-0.5 rounded-full">
                                    BSC
                                  </span>
                                </div>
                                <div className="text-[#35353e] dark:text-[#788099] text-sm">
                                  {asset.name || (asset.ticker || "").toUpperCase() || (asset.symbol || "").toUpperCase() || "Unknown Asset"}
                                </div>
                              </div>
                              {selectedAsset?.asset_id === asset.asset_id && (
                                <div className="w-2 h-2 bg-[#1D8751] rounded-full"></div>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="p-4 text-center text-[#7e7e8f] dark:text-[#788099]">
                            {assetSearchTerm ? "No assets found" : "No assets available"}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Network Select */}
              <div>
                <label className="block text-base sm:text-[17px] lg:text-[20px] text-[#7e7e8f] dark:text-[#ffffff] mb-2 sm:mb-3 font-semibold">
                  Network
                </label>
                <div className="relative" ref={networkDropdownRef}>
                  <div
                    className="w-full text-[#35353e] dark:bg-[#1D1D23] dark:text-[#ffffff] rounded-xl sm:rounded-2xl px-3 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base focus:outline-none border border-[#A2A4A9FF] dark:border-[#35353E] flex items-center justify-between cursor-pointer hover:border-[#1D8751] dark:hover:border-[#1D8751] transition-colors min-h-[44px] sm:min-h-0"
                    onClick={() => setIsNetworkDropdownOpen(!isNetworkDropdownOpen)}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={selectedNetwork?.icon || availableNetworks[0].icon}
                        alt="network icon"
                        className="w-6 h-6"
                      />
                      <span className="text-muted-foreground font-medium">
                        {selectedNetwork?.name || "Binance Smart Chain BEP20"}
                      </span>
                    </div>
                    <svg
                      className={`w-5 h-5 text-[#7e7e8f] transition-transform ${isNetworkDropdownOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>

                  {/* Network Dropdown */}
                  {isNetworkDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#1D1D23] border border-[#A2A4A9FF] dark:border-[#35353E] rounded-xl sm:rounded-2xl shadow-lg z-50 max-h-[60vh] sm:max-h-60 overflow-y-auto">
                      <div className="p-2">
                        {availableNetworks.map((network, index) => (
                          <div
                            key={`${network.network_id}-${index}`}
                            className={`flex items-center gap-3 p-2 sm:p-3 text-black dark:text-white hover:bg-[#78787AFF] dark:hover:bg-[#35353E] cursor-pointer rounded-xl transition-colors min-h-[44px] sm:min-h-0 ${selectedNetwork?.network_id === network.network_id
                              ? 'bg-[#1D8751]/10 dark:bg-[#1D8751]/20 border border-[#1D8751]/30'
                              : ''
                              }`}
                            onClick={() => {
                              setSelectedNetwork(network);
                              setIsNetworkDropdownOpen(false);
                            }}
                          >
                            <img
                              src={network.icon}
                              alt={`${network.name} icon`}
                              className="w-6 h-6"
                            />
                            <div className="flex-1">
                              <div className="font-medium text-[#35353e] dark:text-[#ffffff]">
                                {network.name}
                              </div>
                              <div className="text-sm text-[#7e7e8f] dark:text-[#788099]">
                                {network.network_id}
                              </div>
                            </div>
                            {network.isDefault && (
                              <span className="text-xs bg-[#1D8751] text-white px-2 py-1 rounded-full">
                                Default
                              </span>
                            )}
                            {selectedNetwork?.network_id === network.network_id && (
                              <svg className="w-5 h-5 text-[#1D8751]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <>

              {/* Transaction Code Card - below Payment Details, before Wallet Address */}
              {user?.is_verified && apiResponse && apiResponse.deposit_code && (
                <div className="mb-4 sm:mb-6 flex flex-col gap-3 max-w-4xl mx-auto w-full px-2">
                  <h2 className="text-lg sm:text-xl font-bold mb-2 text-[#788099]">
                    <span className="text-[#7e7e8f] dark:text-[#788099]">2-</span> Transaction Code
                  </h2>
                  <div className="dark:bg-[#1D1D23] border-2 border-[#35353E] rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-lg w-full text-[#35353e] dark:text-[#788099]">
                    {/* Transaction Code Row */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-3">
                      {/* Display deposit code from API response - each character in its own box */}
                      <div className="flex gap-1 sm:gap-2 flex-wrap justify-center">
                        {apiResponse.deposit_code.split('').map((char: string, index: number) => (
                          <div
                            key={index}
                            className="w-8 h-10 sm:w-10 sm:h-12 bg-[#35353E] border border-[#4A4A4A] rounded-lg flex items-center justify-center"
                          >
                            <span className="text-lg sm:text-xl font-bold text-white font-mono">
                              {char}
                            </span>
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(apiResponse.deposit_code);
                          setIsCodeCopied(true);
                          setTimeout(() => setIsCodeCopied(false), 1000);
                        }}
                        className="flex items-center gap-2 bg-[#35353E] border border-[#1D8751] text-white rounded-full px-3 py-2 sm:px-4 font-semibold text-xs sm:text-sm hover:bg-[#1D8751] hover:text-white transition-colors min-h-[44px] sm:min-h-0 touch-manipulation"
                      >
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                          <rect
                            x="9"
                            y="9"
                            width="13"
                            height="13"
                            rx="2"
                            stroke="currentColor"
                            strokeWidth="2"
                          />
                          <rect
                            x="3"
                            y="3"
                            width="13"
                            height="13"
                            rx="2"
                            stroke="currentColor"
                            strokeWidth="2"
                          />
                        </svg>
                        {isCodeCopied ? "Copied" : "Copy"}
                      </button>
                    </div>
                    {/* Note Section */}
                    <div className="flex flex-col gap-2 mt-2">
                      <div className="flex items-center mb-2">
                        <span className="mr-2 text-[#1D8751]">
                          <svg
                            width="16"
                            height="16"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="#1D8751"
                              strokeWidth="2"
                            />
                            <line
                              x1="12"
                              y1="8"
                              x2="12"
                              y2="12"
                              stroke="#1D8751"
                              strokeWidth="2"
                              strokeLinecap="round"
                            />
                            <circle cx="12" cy="16" r="1" fill="#1D8751" />
                          </svg>
                        </span>
                        <span className="text-sm font-semibold text-[#7e7e8f] dark:text-[#788099]">
                          Note
                        </span>
                      </div>
                      <div className=" dark:bg-[#1D1D23] border border-[#1D8751] rounded-xl p-3">
                        <ul className="list-none space-y-1">
                          <li className="flex items-start">
                            <span className="w-2 h-2 mt-1 rounded-full bg-[#1D8751] inline-block mr-2 shrink-0"></span>
                            <span className="text-[#35353e] dark:text-[#788099] text-xs">
                              Please write this Transaction Code in the bank message
                              or note section.
                            </span>
                          </li>
                          <li className="flex items-start">
                            <span className="w-2 h-2 mt-1 rounded-full bg-[#1D8751] inline-block mr-2 shrink-0"></span>
                            <span className="text-[#35353e] dark:text-[#788099] text-xs">
                              This helps us process your payment quickly and
                              accurately.
                            </span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Wallet Address Section */}
              <h2 className="text-lg sm:text-xl font-bold mb-2 text-[#788099]">
                <span className="text-[#7e7e8f]">3-</span> Wallet Address
              </h2>
              
              {/* Dynamic Crypto Warning Banner */}
              {selectedAsset && (
                <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                  <div className="flex items-start gap-2">
                    <span className="text-amber-500 mt-0.5 flex-shrink-0">
                      <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                        <path d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </span>
                    <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">
                      Please send only <span className="font-bold">{selectedAsset?.ticker || selectedAsset?.symbol || 'crypto'}</span> on <span className="font-bold">{selectedAsset?.network || 'the selected network'}</span>. Any other Crypto or Network will be lost Permanently.
                    </p>
                  </div>
                </div>
              )}
              
              <div className="flex flex-col dark:bg-[#1D1D23] border-2 border-[#35353E] rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-5 shadow-lg w-full mx-auto text-[#35353e] dark:text-[#788099] mb-4 sm:mb-6">
                {/* Wallet/Account Address Label */}
                <label className="block text-sm sm:text-[17px] text-[#7e7e8f] mb-2 font-semibold">
                  Wallet/Account Address
                </label>

                {/* Loading indicator */}
                {addressLoading && (
                  <div className="mb-4 p-3 bg-[#f8f9fa] dark:bg-[#2a2a2a] border border-[#e9ecef] dark:border-[#404040] rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#1D8751]"></div>
                      <p className="text-sm text-[#495057] dark:text-[#adb5bd]">
                        Generating deposit address...
                      </p>
                    </div>
                  </div>
                )}

                {/* Input group */}
                <div className="flex items-center dark:bg-[#1D1D23] border border-[#39394a] dark:border-[#35353E] rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2.5 sm:py-2 mb-3 sm:mb-4 min-h-[44px] sm:min-h-0">
                  {/* Left icon */}
                  <span className="mr-2 text-[#1D8751] flex-shrink-0">
                    <svg width="20" height="20" className="sm:w-[22px] sm:h-[22px]" fill="none" viewBox="0 0 24 24">
                      <path
                        d="M7 17v2a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"
                        stroke="#1D8751"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <rect
                        x="3"
                        y="3"
                        width="12"
                        height="12"
                        rx="2"
                        stroke="#1D8751"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  <input
                    type="text"
                    value={walletAddress}
                    readOnly={isFirstCardSubmitted}
                    onChange={(e) => {
                      if (!isFirstCardSubmitted) {
                        const value = e.target.value;
                        setWalletAddress(value);
                      }

                      // Validate immediately as user types (wallet address is optional for initial submission)
                      if (e.target.value.trim() === "") {
                        setWalletError(null); // No error when empty - address is optional
                      } else if (!selectedAsset) {
                        setWalletError("Please select an asset first");
                      } else {
                        // Allow all address types - no specific network validation
                        if (e.target.value.trim().length < 10) {
                          setWalletError("Address seems too short");
                          setForceUpdate((prev) => prev + 1);
                        } else {
                          setWalletError(null);
                          setForceUpdate((prev) => prev + 1);
                        }
                      }
                    }}
                    placeholder="Paste your crypto address"
                    className={`flex-1 bg-transparent border-none outline-none text-muted-foreground dark:text-muted placeholder-muted-foreground text-sm sm:text-base min-w-0 ${walletError
                      ? "border-red-500"
                      : walletAddress.trim() && !walletError
                        ? "border-green-500"
                        : ""
                      }`}
                  />
                  {/* Bookmark icon */}
                  <span className="mx-1 sm:mx-2 text-[#788099] cursor-pointer flex-shrink-0">
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                      <path
                        d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"
                        stroke="#788099"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  {/* Copy button */}
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(walletAddress);
                      setIsAddressCopied(true);
                      setTimeout(() => setIsAddressCopied(false), 1500);
                    }}
                    className="flex items-center gap-1 dark:bg-[#1D1D23] border border-[#1D8751] text-[#1D8751] rounded-full px-3 sm:px-4 py-2 sm:py-1 ml-1 sm:ml-2 font-semibold text-sm sm:text-base hover:bg-[#1D8751] hover:text-white transition-colors min-h-[44px] sm:min-h-0 touch-manipulation shrink-0 disabled:cursor-not-allowed disabled:opacity-70                    "
                  disabled={isAddressCopied}
                  >
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                      <rect
                        x="9"
                        y="9"
                        width="13"
                        height="13"
                        rx="2"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                      <rect
                        x="3"
                        y="3"
                        width="13"
                        height="13"
                        rx="2"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                    </svg>
                    {isAddressCopied ? "Copied" : "Copy"}
                  </button>
                </div>

                {/* Show validation messages below the wallet address input */}
                {walletError && (
                  <p className="text-red-500 text-sm mt-2 font-medium">
                    ❌ {walletError}
                  </p>
                )}

                {isFirstCardSubmitted && depositResponse && (
                  <p className="text-[#1D8751] text-sm mt-2 font-medium">
                    ✅ Deposit address generated - Send {depositResponse.amount} {depositResponse.asset} to this address
                  </p>
                )}
                {walletAddress.trim() && !walletError && selectedAsset && !isFirstCardSubmitted && (
                  // <p className="text-[#1D8751] text-sm mt-2 font-medium">
                  //   ✅ Valid address
                  // </p>
                  ''
                )}


                {/* QR Code Display */}
                {qrCodeDataUrl && walletAddress && (
                  <div className="mt-3 sm:mt-4 p-3 sm:p-4 rounded-xl">
                    <div className="flex flex-col items-center">
                      <h3 className="text-xs sm:text-sm font-semibold text-[#495057] dark:text-[#adb5bd] mb-2 sm:mb-3">
                        Scan QR Code to Send
                      </h3>
                      <div className="bg-white dark:bg-[#1a1a1a] p-2 sm:p-3 rounded-lg border border-[#dee2e6] dark:border-[#404040]">
                        <img
                          src={qrCodeDataUrl}
                          alt="Deposit Address QR Code"
                          className="w-40 h-40 sm:w-48 sm:h-48 lg:w-64 lg:h-64"
                        />
                      </div>
                      <p className="text-xs text-[#6c757d] dark:text-[#6c757d] mt-2 text-center max-w-xs">
                        Scan this QR code with your wallet to send {selectedAsset?.ticker || 'crypto'} to the deposit address
                      </p>
                    </div>
                  </div>
                )}





                {/* {!walletAddress.trim() && (
              <p className="text-[#7e7e8f] dark:text-[#788099] text-sm mt-2 font-medium">
                ℹ️ Wallet address is optional. You can provide it later if needed.
              </p>
            )} */}

                {/* Terms and Conditions Summary */}
                <div className="flex items-center mb-2">
                  <span className="mr-2 text-[#1D8751]">
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="#1D8751"
                        strokeWidth="2"
                      />
                      <line
                        x1="12"
                        y1="8"
                        x2="12"
                        y2="12"
                        stroke="#1D8751"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                      <circle cx="12" cy="16" r="1" fill="#1D8751" />
                    </svg>
                  </span>
                  <span className="text-base font-semibold text-[#7e7e8f] dark:text-[#788099]">
                    Terms and Conditions Summary
                  </span>
                </div>
                <div className=" dark:bg-[#1D1D23] border border-[#1D8751] rounded-xl p-4">
                  <ul className="list-none space-y-2">
                    <li className="flex items-start">
                      <span className="w-2 h-2 mt-1 rounded-full bg-[#1D8751] inline-block mr-3 shrink-0"></span>
                      <span className="text-[#35353e] dark:text-[#788099] text-sm">
                        Please send the money from your own account Only
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 mt-1 rounded-full bg-[#1D8751] inline-block mr-3 shrink-0"></span>
                      <span className="text-[#35353e] dark:text-[#788099] text-sm">
                        Put transaction ID in the description field of the bank
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 mt-1 rounded-full bg-[#1D8751] inline-block mr-3 shrink-0  "></span>
                      <span className="text-[#35353e] dark:text-[#788099] text-sm">
                        Please note, If you do not follow above conditions, we will
                        reject your transaction and send you back your money.
                      </span>
                    </li>
                  </ul>
                </div>


              </div>

              {/* Validation Errors Display */}
              {validationErrors.length > 0 && (
                <div className="max-w-4xl mx-auto w-full px-2 mb-3 sm:mb-4">
                  <div className="dark:bg-[#1D1D23] border border-[#1D8751] rounded-xl sm:rounded-2xl p-3 sm:p-4">
                    <h3 className="text-[#1D8751] font-semibold mb-2 text-sm sm:text-base">
                      Please fix the following errors:
                    </h3>
                    <ul className="list-disc list-inside text-[#1D8751] space-y-1">
                      {validationErrors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

            </>


            {/* Deposit Address Display Section */}
            {isTransactionSubmitted && depositResponse && (
              <div className="max-w-4xl mx-auto w-full px-2 mt-4 sm:mt-6">
                <div className="bg-[#1D1D23] rounded-xl sm:rounded-2xl border border-[#39394a] p-3 sm:p-4 lg:p-6">
                  <h3 className="text-white font-semibold mb-3 sm:mb-4 text-base sm:text-lg">Deposit Instructions</h3>
                  <div className="space-y-4">
                    <div className="bg-[#2A2A2A] rounded-xl p-4">
                      <p className="text-[#788099] text-sm mb-2">Send this amount:</p>
                      <p className="text-white font-bold text-xl">
                        {depositResponse.amount} {depositResponse.asset}
                      </p>
                    </div>

                    <div className="bg-[#2A2A2A] rounded-xl p-4">
                      <p className="text-[#788099] text-sm mb-2">To this address:</p>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={depositResponse.deposit_address}
                          readOnly
                          className="flex-1 bg-transparent text-white font-mono text-sm p-2 border border-[#39394a] rounded-lg"
                        />
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(depositResponse.deposit_address);
                            setIsDepositAddressCopied(true);
                            setTimeout(() => setIsDepositAddressCopied(false), 1000);
                          }}
                          className="px-3 py-2 bg-[#1D8751] text-white rounded-lg hover:bg-[#166b3e] transition-colors"
                        >
                          {isDepositAddressCopied ? "Copied" : "Copy"}
                        </button>
                      </div>
                    </div>

                    <div className="bg-[#2A2A2A] rounded-xl p-4">
                      <p className="text-[#788099] text-sm mb-2">Network:</p>
                      <p className="text-white font-medium">{depositResponse.network}</p>
                    </div>

                    <div className="bg-[#2A2A2A] rounded-xl p-4">
                      <p className="text-[#788099] text-sm mb-2">You will receive:</p>
                      <p className="text-white font-bold text-lg">
                        {depositResponse.net_amount} {depositResponse.details.to_currency}
                      </p>
                      <p className="text-[#1D8751] text-sm mt-1">
                        (Estimated: {depositResponse.details.estimated_amount} {depositResponse.details.to_currency})
                      </p>
                    </div>

                    <div className="bg-[#1D8751]/10 border border-[#1D8751] rounded-xl p-4">
                      <p className="text-[#1D8751] font-medium mb-2">Important:</p>
                      <p className="text-[#788099] text-sm">
                        {depositResponse.message}
                      </p>
                    </div>

                    <div className="bg-[#2A2A2A] rounded-xl p-3 sm:p-4">
                      <p className="text-[#788099] text-xs sm:text-sm mb-2">Transaction ID:</p>
                      <p className="text-white font-mono text-xs sm:text-sm break-all">{depositResponse.transaction_id}</p>
                    </div>

                    <div className="bg-[#2A2A2A] rounded-xl p-3 sm:p-4">
                      <p className="text-[#788099] text-xs sm:text-sm mb-2">Status:</p>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${transactionStatus === "completed" ? "bg-green-500" :
                          transactionStatus === "failed" ? "bg-red-500" :
                            transactionStatus === "pending" ? "bg-yellow-500" :
                              "bg-gray-500"
                          }`}></div>
                        <p className="text-white font-medium capitalize">{transactionStatus}</p>
                        {websocket && (
                          <div className="flex items-center gap-1 text-green-500 text-xs">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span>Live</span>
                          </div>
                        )}
                        {websocketError && (
                          <div className="flex items-center gap-1 text-red-500 text-xs">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            <span>Connection Error</span>
                          </div>
                        )}
                        {websocketRetryCount > 0 && websocketRetryCount < 3 && (
                          <div className="flex items-center gap-1 text-yellow-500 text-xs">
                            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                            <span>Retrying... ({websocketRetryCount}/3)</span>
                          </div>
                        )}
                        {websocketError && websocketRetryCount >= 3 && (
                          <div className="flex flex-col gap-2">
                            <div className="text-xs text-red-400">
                              {websocketError}
                            </div>
                            <button
                              onClick={() => {
                                logger.debug('p2p', "Manual WebSocket retry initiated");
                                setWebsocketError(null);
                                setWebsocketRetryCount(0);
                                if (depositResponse?.websocket_url) {
                                  logger.debug('p2p', "Retrying with provided WebSocket URL:", depositResponse.websocket_url);
                                  const ws = connectWebSocket(depositResponse.websocket_url);
                                  if (!ws) {
                                    logger.debug('p2p', "Primary retry failed, trying fallback");
                                    const fallbackUrl = API_CONFIG.EXCHANGE.SOCKETS.DEPOSIT_STATUS(depositResponse.transaction_id);
                                    connectWebSocket(fallbackUrl);
                                  }
                                } else if (depositResponse?.transaction_id) {
                                  logger.debug('p2p', "Retrying with fallback WebSocket URL");
                                  const fallbackUrl = API_CONFIG.EXCHANGE.SOCKETS.DEPOSIT_STATUS(depositResponse.transaction_id);
                                  connectWebSocket(fallbackUrl);
                                }
                              }}
                              className="text-xs text-blue-400 hover:text-blue-300 underline bg-blue-900/20 px-2 py-1 rounded"
                            >
                              Retry Connection
                            </button>
                          </div>
                        )}
                        {/* Debug button for asset fetching */}
                        {(swapAssets?.length === 0 || assets?.length === 0) && (
                          <button
                            onClick={handleDebugAssets}
                            className="text-xs text-yellow-400 hover:text-yellow-300 underline ml-2"
                          >
                            Debug Assets
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>





        {/* Confirmation Checkbox */}
        {!isFirstCardSubmitted && (
          <div className="mx-auto w-full px-2 mt-4 sm:mt-4 mb-2 sm:mb-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="confirmPayment"
                checked={confirmPayment}
                onChange={(e) => setConfirmPayment(e.target.checked)}
                className="w-5 h-5 rounded accent-[#1D8751] cursor-pointer"
              />
              <label htmlFor="confirmPayment" className="text-sm sm:text-base text-[#35353e] dark:text-[#ffffff] select-none cursor-pointer">
                I confirm I sent the payment
              </label>
            </div>
          </div>
        )}

        {/* Submit Button for First Card - only show when user has checked "I confirm I sent payment" */}
        {!isFirstCardSubmitted  && (
          <div className="mx-auto w-full px-2 mt-4 sm:mt-6">
            <div className="flex flex-col sm:flex-row gap-3">
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="w-full text-sm sm:text-base font-medium py-3 sm:py-3 rounded-xl sm:rounded-2xl border border-[#35353e] dark:border-[#35353e] text-[#35353e] dark:text-white flex items-center justify-center gap-2 transition-colors min-h-[44px] sm:min-h-0 hover:bg-[#f3f4f6] dark:hover:bg-[#2a2a34]"
                >
                  Cancel
                </button>
              )}
              <button
                type="button"
                className={`w-full text-white text-sm sm:text-base font-medium py-3 sm:py-3 rounded-xl sm:rounded-2xl flex items-center justify-center gap-2 transition-colors min-h-[44px] sm:min-h-0 ${isSubmitting || !user?.is_verified || !confirmPayment
                  ? "bg-gray-500 cursor-not-allowed"
                  : "bg-[#1D8751] hover:bg-[#166b3e]"
                  }`}
                onClick={handleSubmit}
                disabled={isSubmitting || !selectedAsset || !selectedNetwork || !user?.is_verified}
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Processing...</span>
                  </div>
                ) : (
                  <span>Deposit</span>
                )}
              </button>
            </div>
          </div>
        )}

      </div>




      {/* InfoModal */}
      <InfoModal
        isOpen={isInfoModalOpen}
        onClose={() => setIsInfoModalOpen(false)}
        onContactUs={() => {
          // Handle contact us action - you can customize this
          window.open('https://wa.me/your-whatsapp-number', '_blank');
          setIsInfoModalOpen(false);
        }}
      />


    </div>
  );
}
