import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { RootState, AppDispatch } from "@/store/rootReducer";
import { fetchMatchedTrades } from "@/features/p2p/slices/matchedTradesSlice";
import { NoDataFound } from "@/components/dashboard/ui/Transactions";
import ChatBox from "@/features/p2p/components/ui/market/sections/ChatBox";
import { logger } from '@/lib/utils/logger';

interface UnreadMessage {
  id: string;
  orderId: string;
  sender: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  orderType: 'buy' | 'sell';
  amount: string;
  currency: string;
}

interface UnreadMessagesProps {
  loading?: boolean;
  onBackToOrders?: () => void;
}

const UnreadMessages: React.FC<UnreadMessagesProps> = ({
  loading = false,
  onBackToOrders
}) => {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { data: matchedTrades, loading: tradesLoading } = useSelector(
    (state: RootState) => state.matchedTrades
  );
  const { user } = useSelector((state: RootState) => state.auth);
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  const [selectedMessage, setSelectedMessage] = useState<UnreadMessage | null>(null);
  const [activeTab, setActiveTab] = useState<'messages' | 'chat'>('messages');
  const [selectedTradeId, setSelectedTradeId] = useState<string | null>(null);
  const [selectedTrade, setSelectedTrade] = useState<any>(null);
  const [messages, setMessages] = useState<UnreadMessage[]>([]);

  // Fetch matched trades on component mount
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchMatchedTrades(1));
    }
  }, [dispatch, isAuthenticated]);

  // Convert matched trades to unread messages format
  useEffect(() => {
    if (matchedTrades?.results) {
      const convertedMessages: UnreadMessage[] = matchedTrades.results.map((trade: any) => {
        const orderType = trade.order_type === "buy" ? "buy" : "sell";
        const sender = trade.advertiser_name || trade.seller || trade.buyer || "Unknown";
        const amount = trade.amount || "0";
        
        return {
          id: trade.id,
          orderId: trade.id,
          sender: sender,
          message: `New ${orderType} order for ${amount} USDT`,
          timestamp: trade.timestamp || new Date().toISOString(),
          isRead: false,
          orderType: orderType,
          amount: amount,
          currency: 'USDT'
        };
      });
      
      // Sort messages by timestamp in descending order (newest first)
      const sortedMessages = convertedMessages.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      
      setMessages(sortedMessages);
    }
  }, [matchedTrades]);

  const handleMessageClick = (message: UnreadMessage) => {
    setSelectedMessage(message);
    // Mark as read
    setMessages(prev => 
      prev.map(msg => 
        msg.id === message.id ? { ...msg, isRead: true } : msg
      )
    );
  };

  const handleMarkAsRead = (messageId: string) => {
    setMessages(prev => 
      prev.map(msg => 
        msg.id === messageId ? { ...msg, isRead: true } : msg
      )
    );
  };

  const handleMarkAllAsRead = () => {
    setMessages(prev => 
      prev.map(msg => ({ ...msg, isRead: true }))
    );
  };

  const handleViewMessages = (orderId: string) => {
    // Find the original trade data
    const originalTrade = matchedTrades?.results?.find((trade: any) => trade.id === orderId);
    setSelectedTradeId(orderId);
    setSelectedTrade(originalTrade);
    setActiveTab('chat');
  };

  const handleViewDetails = (message: UnreadMessage) => {
    // Find the original trade data from matchedTrades
    const originalTrade = matchedTrades?.results?.find((trade: any) => trade.id === message.orderId);
    
    if (originalTrade) {
      // Store the full order in local storage - EXACT same logic as notifications page
      try {
        const fullOrderData = {
          ...originalTrade, // Store the complete trade object
          storedAt: new Date().toISOString(),
          viewedFrom: "unread_messages",
        };

        localStorage.setItem("new_order", JSON.stringify(fullOrderData));

        // Also store in a general orders list for easy access
        const existingOrders = JSON.parse(
          localStorage.getItem("p2p_orders") || "[]"
        );
        const orderExists = existingOrders.find(
          (order: any) => order.id === originalTrade.id
        );

        if (!orderExists) {
          existingOrders.push(fullOrderData);
          localStorage.setItem("p2p_orders", JSON.stringify(existingOrders));
        } else {
          // Update existing order with latest data
          const orderIndex = existingOrders.findIndex(
            (order: any) => order.id === originalTrade.id
          );
          existingOrders[orderIndex] = fullOrderData;
          localStorage.setItem("p2p_orders", JSON.stringify(existingOrders));
        }
      } catch (error) {
        console.error("Error storing order in localStorage:", error);
      }

      // Navigation logic - same as notifications page but using router.push instead of window.open
      const status = getStatus(originalTrade, user?.email || "");
      if (status.text === `Pending ${originalTrade.order_type} Trade`) {
        if (originalTrade.owner === user?.email) {
          router.push(
            `/p2p/${originalTrade.id}/matched?order_type=${
              originalTrade.order_type === "sell" ? "sell" : "buy"
            }&trade=buyer`
          );
        } else {
          const searchParams = new URLSearchParams();
          searchParams.set(
            "orderData",
            JSON.stringify({
              order_type: originalTrade.order_type === "sell" ? "sell" : "buy",
            })
          );

          router.push(`/p2p/${originalTrade.id}/matched?${searchParams.toString()}`);
        }
      } else {
        if (originalTrade.owner === user?.email) {
          router.push(
            `/p2p/${originalTrade.id}/matched?order_type=${
              originalTrade.order_type === "sell" ? "sell" : "buy"
            }&trade=seller`
          );
        } else {
          router.push(
            `/p2p/${originalTrade.id}/matched?order_type=${
              originalTrade.order_type === "buy" ? "sell" : "buy"
            }&trade=buyer`
          );
        }
      }
    }
  };

  // Helper function from notifications page
  const getStatus = (trade: any, userEmail: string) => {
    if (trade.owner === userEmail) {
      return { text: "Pending Incoming Trade", color: "text-[#1D8751]" };
    } else {
      return {
        text: `Pending ${trade.order_type === "sell" ? "Buy" : "Sell"} Trade`,
        color: "text-yellow-500",
      };
    }
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const unreadCount = messages.filter(msg => !msg.isRead).length;
  const isLoading = loading || tradesLoading;

  if (isLoading) {
    return (
      <div className="w-full flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1D8751]"></div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="w-full">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Unread Messages
          </h2>
          {onBackToOrders && (
            <button
              onClick={onBackToOrders}
              className="px-4 py-2 text-sm font-medium text-[#1D8751] border border-[#1D8751] rounded-lg hover:bg-[#1D8751]/10 transition-colors"
            >
              Back to Orders
            </button>
          )}
        </div>
        <NoDataFound
          title="No Unread Messages"
          message="You have no unread messages at the moment."
        />
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Unread Messages
          </h2>
          <span className="bg-[#F79330] text-white text-xs font-medium px-2 py-1 rounded-full">
            {unreadCount} unread
          </span>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="px-3 py-1 text-sm font-medium text-[#1D8751] border border-[#1D8751] rounded-lg hover:bg-[#1D8751]/10 transition-colors"
            >
              Mark All as Read
            </button>
          )}
          {onBackToOrders && (
            <button
              onClick={onBackToOrders}
              className="px-4 py-2 text-sm font-medium text-[#1D8751] border border-[#1D8751] rounded-lg hover:bg-[#1D8751]/10 transition-colors"
            >
              Back to Orders
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-0 bg-transparent rounded-[10px] border border-[#1D8751] w-fit px-1 py-1 mb-6">
        <button
          onClick={() => setActiveTab('messages')}
          className={`px-4 py-2 font-medium text-sm transition-all flex items-center gap-1 shadow-none border-none min-w-[100px] rounded-lg ${
            activeTab === 'messages'
              ? "bg-[#1D8751] text-white"
              : "bg-transparent text-[#788099] hover:bg-[#788099]/10"
          }`}
        >
          Messages List
        </button>
       
      </div>

      {/* Tab Content */}
      {activeTab === 'messages' ? (
        /* Messages List */
        <div className="space-y-3">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md 
                 'bg-white dark:bg-[#1D1D23] border-[#35353] dark:border-[#444454]' 
                 shadow-sm'
              }`}
              onClick={() => handleMessageClick(message)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      message.orderType === 'buy' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                    }`}>
                      {message.orderType.toUpperCase()}
                    </span>
                   
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {message.amount} {message.currency}
                    </span>
                    {!message.isRead && (
                      <div className="w-2 h-2 bg-[#F79330] rounded-full"></div>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {message.sender}:
                    </span>{' '}
                    {message.message}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDate(message.timestamp)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewDetails(message);
                    }}
                    className="px-3 py-1 text-xs font-medium text-[#1D8751] border border-[#1D8751] rounded hover:bg-[#1D8751] hover:text-white transition-colors flex items-center gap-1"
                    title="View Details"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                    View Details
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewMessages(message.orderId);
                    }}
                    className="px-3 py-1 text-xs font-medium text-[#F79330] border border-[#F79330] rounded hover:bg-[#F79330] hover:text-white transition-colors flex items-center gap-1"
                    title="View Messages"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                    View Messages
                  </button>

                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Chat View */
        <div className="w-full">
          {selectedTradeId ? (
            <div className="bg-white dark:bg-[#1A1A1D] rounded-lg border border-gray-200 dark:border-[#35353E] p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Chat for Order #{selectedTradeId}
                </h3>
                <button
                  onClick={() => setActiveTab('messages')}
                  className="px-3 py-1 text-sm font-medium text-[#1D8751] border border-[#1D8751] rounded-lg hover:bg-[#1D8751]/10 transition-colors"
                >
                  Back to Messages
                </button>
              </div>
              
              {/* Real ChatBox Component */}
              {selectedTrade && (
                <ChatBox
                  tradeId={selectedTradeId}
                  userId={user?.id?.toString() || ""}
                  userName={user?.first_name || ""}
                  autoreply=""
                  seller_photo={selectedTrade.seller_photo || ""}
                  buyer_photo={selectedTrade.buyer_photo || ""}
                  buyer={selectedTrade.buyer || ""}
                  seller={selectedTrade.seller || ""}
                  currentUserEmail={user?.email || ""}
                  owner={selectedTrade.owner || ""}
                  buyerName={selectedTrade.buyer_name || ""}
                  sellerName={selectedTrade.seller_name || ""}
                />
              )}
            </div>
          ) : (
            <div className="bg-white dark:bg-[#1A1A1D] rounded-lg border border-gray-200 dark:border-[#35353E] p-6 text-center">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mx-auto mb-4 text-[#1D8751]">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              <p className="text-gray-600 dark:text-gray-400">
                Select a message to view the chat
              </p>
            </div>
          )}
        </div>
      )}

      {/* Message Detail Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#1D1D23] rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Message Details
              </h3>
              <button
                onClick={() => setSelectedMessage(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Order ID:</span>
                <p className="text-sm text-gray-900 dark:text-white">{selectedMessage.orderId}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">From:</span>
                <p className="text-sm text-gray-900 dark:text-white">{selectedMessage.sender}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Amount:</span>
                <p className="text-sm text-gray-900 dark:text-white">
                  {selectedMessage.amount} {selectedMessage.currency}
                </p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Message:</span>
                <p className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-[#2A2A2D] p-3 rounded-lg">
                  {selectedMessage.message}
                </p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Time:</span>
                <p className="text-sm text-gray-900 dark:text-white">
                  {formatDate(selectedMessage.timestamp)}
                </p>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setSelectedMessage(null)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-[#444454] rounded-lg hover:bg-gray-50 dark:hover:bg-[#2A2A2D] transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleViewDetails(selectedMessage);
                  setSelectedMessage(null);
                }}
                className="flex-1 px-4 py-2 text-sm font-medium text-[#1D8751] border border-[#1D8751] rounded-lg hover:bg-[#1D8751] hover:text-white transition-colors flex items-center justify-center gap-1"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
                View Details
              </button>
              <button
                onClick={() => {
                  handleViewMessages(selectedMessage.orderId);
                  setSelectedMessage(null);
                }}
                className="flex-1 px-4 py-2 text-sm font-medium text-[#F79330] border border-[#F79330] rounded-lg hover:bg-[#F79330] hover:text-white transition-colors flex items-center justify-center gap-1"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                View Messages
              </button>
              <button
                onClick={() => {
                  handleMarkAsRead(selectedMessage.id);
                  setSelectedMessage(null);
                }}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-[#1D8751] rounded-lg hover:bg-[#1D8751]/90 transition-colors"
              >
                Mark as Read
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnreadMessages;