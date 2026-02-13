
import React, { useEffect, useMemo } from "react";
import P2pProfile from "../ui/p2pcenter/P2pProfile";
import Stats from "../ui/p2pcenter/Stats";
import { fetchWallets } from "../../slices/walletSlice";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store/rootReducer";
import {
  selectTransactionSummary,
  fetchTransactionSummary,
} from "../../slices/transactionSummarySlice";
import { AppDispatch } from "@/store";
import { p2pBuyandSell } from "../../slices/p2pbuysell";
import { fetchMyOrders } from "../../slices/myOrdersSlice";
import FiterTabs from "../ui/p2pcenter/FilterTabs";

// Error boundary component to catch rendering errors
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("P2PCenter Error:", error, errorInfo);
    this.setState({ error });
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex flex-col items-center justify-center min-h-[280px] px-4 py-8 gap-4">
          <p className="text-red-500 dark:text-red-400 text-center font-medium">
            Something went wrong. Please refresh the page.
          </p>
          {this.state.error && (
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center max-w-md break-words">
              {this.state.error.message}
            </p>
          )}
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-4 py-2 text-sm font-medium text-white bg-[#1D8751] hover:bg-[#166b3e] rounded-lg transition-colors"
          >
            Refresh page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const P2PCenter: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch<AppDispatch>();
  const { data: wallets, loading, error: walletsError } = useSelector(
    (state: RootState) => state.wallets
  );
  const summary = useSelector(selectTransactionSummary);
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  const {
    orders,
    loading: ordersLoading,
    error,
    currentPage,
  } = useSelector((state: RootState) => state.p2pBuySell);

  const { orders: myOrders, loading: myOrdersLoading } = useSelector(
    (state: RootState) => state.myOrders
  );

  useEffect(() => {
    if (isAuthenticated) {
      // ✅ fetchWallets() and fetchTransactionSummary() now handled by P2PDataProvider
      // Only fetch data specific to P2P Center tab
      // dispatch(fetchWallets()); // Removed - handled by provider
      // Use catch to prevent errors from crashing the app
      dispatch(p2pBuyandSell(1)).catch(() => {
        // Silently handle errors
      });
      dispatch(fetchMyOrders(1)).catch(() => {
        // Silently handle errors
      });
      // dispatch(fetchTransactionSummary()); // Removed - handled by provider
    }
  }, [dispatch, isAuthenticated]);

  // Transform the trades data to include commission, payment, and last update
  const transformedTrades = useMemo(() => {
    try {
    const buyOrders = (orders as any)?.buy_orders?.results || [];
    const sellOrders = (orders as any)?.sell_orders?.results || [];
    const allOrders = [...buyOrders, ...sellOrders];

      return allOrders
        .filter((trade: any) => trade && typeof trade === 'object') // Filter out null/undefined
        .map((trade: any) => {
          try {
            // Safely extract payment_details with extra defensive checks
            const safePaymentDetails = Array.isArray(trade.payment_details)
              ? trade.payment_details.filter((detail: any) => 
                  detail && 
                  typeof detail === 'object' && 
                  detail !== null &&
                  !Array.isArray(detail)
                )
              : [];

            return {
      ...trade,
      commission_rate: `${trade.commission_rate || 0}%`,
              payment: safePaymentDetails
                .filter((detail: any) => {
                  // Extra defensive check - ensure detail exists and is a valid object
                  return detail && 
                         detail !== null && 
                         detail !== undefined &&
                         typeof detail === 'object' && 
                         !Array.isArray(detail);
                })
                .map((detail: any) => {
                  try {
                    // Double-check detail is still valid inside map
                    if (!detail || typeof detail !== 'object' || Array.isArray(detail)) {
                      return {
                        bank: "",
                        logo: "https://res.cloudinary.com/pitz/image/upload/v1764667057/salam_vizvxy.svg",
                      };
                    }
                    
                    const provider = detail?.provider;
                    const providerString = typeof provider === 'string' ? provider : '';
                    
                    return {
                      bank: providerString || "",
                      logo: providerString
                        ? `/banks/${providerString
                            .toLowerCase()
                            .replace(/\s+/g, "")}.png`
                        : "https://res.cloudinary.com/pitz/image/upload/v1764667057/salam_vizvxy.svg",
                    };
                  } catch (e) {
                    // If any error occurs, return safe defaults
                    console.warn('Error processing payment detail in transformedTrades:', e, detail);
                    return {
                      bank: "",
                      logo: "https://res.cloudinary.com/pitz/image/upload/v1764667057/salam_vizvxy.svg",
                    };
                  }
                })
                .filter((item: any) => item && typeof item === 'object'), // Final safety filter
              lastUpdate: trade.timestamp ? new Date(trade.timestamp).toLocaleString() : '',
            };
          } catch (error) {
            // If transformation fails for a single trade, return a safe default
            console.warn('Error transforming trade:', error, trade);
            return {
              ...trade,
              commission_rate: '0%',
              payment: [],
              lastUpdate: '',
            };
          }
        });
    } catch (error) {
      // If entire transformation fails, return empty array
      console.error('Error transforming trades:', error);
      return [];
    }
  }, [orders]);

  // Transform the "My Orders" data
  const transformedMyOrders = useMemo(() => {
    try {
    // My orders come in the structure: { buy_orders: [], sell_orders: [], buy_pagination: {}, sell_pagination: {} }
    // Handle both array and paginated response structures
    if (!myOrders || typeof myOrders !== 'object') {
      return [];
    }

    // Extract buy_orders - handle both array and paginated { results: [] } structure
    let buyOrders: any[] = [];
    if (Array.isArray((myOrders as any)?.buy_orders)) {
      buyOrders = (myOrders as any).buy_orders;
    } else if ((myOrders as any)?.buy_orders?.results && Array.isArray((myOrders as any).buy_orders.results)) {
      buyOrders = (myOrders as any).buy_orders.results;
    }

    // Extract sell_orders - handle both array and paginated { results: [] } structure
    let sellOrders: any[] = [];
    if (Array.isArray((myOrders as any)?.sell_orders)) {
      sellOrders = (myOrders as any).sell_orders;
    } else if ((myOrders as any)?.sell_orders?.results && Array.isArray((myOrders as any).sell_orders.results)) {
      sellOrders = (myOrders as any).sell_orders.results;
    }

    const allOrders = [...buyOrders, ...sellOrders];

    const transformed = allOrders
        .filter((trade: any) => trade && typeof trade === 'object' && !Array.isArray(trade)) // Filter out null/undefined/arrays
      .map((trade: any) => {
          try {
            // Safely extract payment_details, filtering out null/undefined items with extra checks
        const safePaymentDetails = Array.isArray(trade.payment_details)
              ? trade.payment_details.filter((detail: any) => 
                  detail && 
                  typeof detail === 'object' && 
                  detail !== null &&
                  !Array.isArray(detail)
                )
          : [];

            // Safely get first payment detail for provider_logo with extra validation
            let firstPaymentDetail: any = null;
            if (safePaymentDetails.length > 0) {
              const first = safePaymentDetails[0];
              if (first && typeof first === 'object' && first !== null && !Array.isArray(first)) {
                firstPaymentDetail = first;
              }
            }

            // Safely extract provider_logo with multiple layers of checks
            let providerLogo: string | null = null;
            if (firstPaymentDetail) {
              try {
                if (typeof firstPaymentDetail === 'object' && 
                    firstPaymentDetail !== null && 
                    'provider_logo' in firstPaymentDetail &&
                    typeof firstPaymentDetail.provider_logo === 'string' &&
                    firstPaymentDetail.provider_logo.trim()) {
                  providerLogo = firstPaymentDetail.provider_logo.trim();
                }
              } catch (e) {
                // If any error occurs accessing provider_logo, set to null
                providerLogo = null;
              }
            }

        return {
          ...trade,
              assetSymbol: typeof trade?.currency === 'string' ? trade.currency : '',
          assetImage:
                (typeof trade?.asset_image === 'string' && trade.asset_image) ||
            "https://res.cloudinary.com/pitz/image/upload/v1752248529/2b5c7d80-7bcd-4cfb-8bd9-d1760a752afc.png_mhuppr.png",
              commission_rate: (() => {
              const cr = trade?.commission_rate;
              if (typeof cr === 'number' && !Number.isNaN(cr)) return cr;
              if (typeof cr === 'string') {
                const parsed = parseFloat(cr);
                return Number.isNaN(parsed) ? 0 : parsed;
              }
              return 0;
            })(),
              payment: safePaymentDetails
                .filter((detail: any) => {
                  // Extra defensive check - ensure detail exists and is a valid object
                  return detail && 
                         detail !== null && 
                         detail !== undefined &&
                         typeof detail === 'object' && 
                         !Array.isArray(detail) &&
                         Object.keys(detail).length > 0;
                })
                .map((detail: any) => {
                  try {
                    // Double-check detail is still valid inside map
                    if (!detail || typeof detail !== 'object' || Array.isArray(detail)) {
                      return {
                        bank: '',
                        logo: "https://res.cloudinary.com/dam1sxczj/image/upload/v1748884335/image_7_dqkxkj.png",
                      };
                    }
                    
                    const provider = typeof detail?.provider === 'string' ? detail.provider : '';
                    const detailLogo = detail && 
                                      typeof detail === 'object' && 
                                      'provider_logo' in detail &&
                                      typeof detail.provider_logo === 'string' && 
                                      detail.provider_logo.trim()
                      ? detail.provider_logo.trim()
                      : "https://res.cloudinary.com/dam1sxczj/image/upload/v1748884335/image_7_dqkxkj.png";
                    
                    return {
                      bank: provider || '',
                      logo: detailLogo,
                    };
                  } catch (e) {
                    // If any error occurs, return safe defaults
                    console.warn('Error processing payment detail:', e, detail);
                    return {
                      bank: '',
                      logo: "https://res.cloudinary.com/dam1sxczj/image/upload/v1748884335/image_7_dqkxkj.png",
                    };
                  }
                })
                .filter((item: any) => item && typeof item === 'object'), // Final safety filter
          payment_details: safePaymentDetails, // Preserve original structure for MyAdsTable
              provider_logo: providerLogo,
              lastUpdate: trade?.created_on ? new Date(trade.created_on).toLocaleString() : '',
        };
          } catch (error) {
            // If transformation fails for a single order, return a safe default
            console.warn('Error transforming my order:', error, trade);
            return {
              ...trade,
              assetSymbol: trade?.currency || '',
              assetImage: "https://res.cloudinary.com/pitz/image/upload/v1752248529/2b5c7d80-7bcd-4cfb-8bd9-d1760a752afc.png_mhuppr.png",
              commission_rate: 0,
              payment: [],
              payment_details: [],
              provider_logo: null,
              lastUpdate: '',
            };
          }
      });
    
    return transformed;
    } catch (error) {
      // If entire transformation fails, return empty array
      console.error('Error transforming my orders:', error);
      return [];
    }
  }, [myOrders]);

  // Handle wallet error gracefully - provide fallback empty object
  // Add extra safety checks for production
  const safeWallets = (wallets && typeof wallets === 'object' && !Array.isArray(wallets)) 
    ? wallets 
    : ({} as any);
  
  // Safely handle summary data with extra checks
  const safeSummary = (summary && typeof summary === 'object') ? summary : null;

  // Ensure transformed data is always an array to prevent crashes
  const safeTransformedTrades = Array.isArray(transformedTrades) ? transformedTrades : [];
  const safeTransformedMyOrders = Array.isArray(transformedMyOrders) ? transformedMyOrders : [];

  return (
    <ErrorBoundary>
      <div className="flex flex-col gap-4 sm:gap-5 md:gap-6 w-full h-full min-h-screen pl-1 sm:pl-2 md:pl-4 pr-2 sm:pr-0">
        <P2pProfile wallets={safeWallets} summary={safeSummary} loading={loading} />
        <Stats summary={safeSummary} />
        <FiterTabs
          transformedTrades={safeTransformedTrades}
          myOrders={safeTransformedMyOrders}
          loading={ordersLoading}
          myOrdersLoading={myOrdersLoading}
        />
      </div>
    </ErrorBoundary>
  );
};

export default P2PCenter;
