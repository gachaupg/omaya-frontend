"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/store/rootReducer";
import ChatBox from "@/features/p2p/components/ui/market/sections/ChatBox";
import { getTradeMessages, getGroupedMessages, GroupedMessage } from "@/features/p2p/api";
import { logger } from "@/lib/utils/logger";

interface TradeData {
  id: string;
  trade_id: string;
  buyer: string;
  seller: string;
  buyer_name?: string;
  seller_name?: string;
  buyer_photo?: string;
  seller_photo?: string;
  owner: string;
  autoreply?: string;
  status: string;
  amount: string;
  currency: string;
}

const TradeMessagesPage = () => {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tradeId = params?.tradeId as string;
  
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const [tradeData, setTradeData] = useState<TradeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'p2p' | 'support'>('p2p');
  const [peerName, setPeerName] = useState<string | undefined>(undefined);
  const [supportMessages, setSupportMessages] = useState<GroupedMessage[] | null>(null);

  // Mock trade data for demonstration
  const mockTradeData: TradeData = {
    id: tradeId,
    trade_id: tradeId,
    buyer: "buyer@example.com",
    seller: "seller@example.com", 
    buyer_name: "John Buyer",
    seller_name: "Alice Seller",
    buyer_photo: "",
    seller_photo: "",
    owner: "seller@example.com",
    autoreply: "Thank you for your interest in this trade. Please complete the payment within 15 minutes.",
    status: "pending",
    amount: "100.00",
    currency: "USDT"
  };

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    if (!tradeId) {
      setError("Invalid trade ID");
      setLoading(false);
      return;
    }

    // Check if support messages are passed via URL params
    const urlMessageType = searchParams?.get('type');
    const urlMessages = searchParams?.get('messages');
    
    if (urlMessageType === 'support' && urlMessages) {
      // Support messages passed as props - use them directly
      try {
        const parsedMessages = JSON.parse(urlMessages) as GroupedMessage[];
        setSupportMessages(parsedMessages);
        setMessageType('support');
        setPeerName(searchParams?.get('sender_name') || 'Support');
        setTradeData(mockTradeData);
        setLoading(false);
        return;
      } catch (err) {
        logger.error("p2p", "Error parsing support messages from URL:", err);
      }
    }

    // For P2P messages or if no URL params, fetch from API
    const fetchMessageInfo = async () => {
      try {
        const groupedMessages = await getGroupedMessages(100);
        const userGroup = groupedMessages.data.users.find(
          (user) => user.entity_id === tradeId
        );
        
        if (userGroup) {
          setMessageType(userGroup.message_type as 'p2p' | 'support');
          // For P2P, use peer_name; for support, use sender_name or "Support"
          if (userGroup.message_type === 'p2p' && userGroup.peer_name) {
            setPeerName(userGroup.peer_name);
          } else if (userGroup.message_type === 'support') {
            // For support, show the sender name or "Support"
            setPeerName(userGroup.sender_name || "Support");
            setSupportMessages(userGroup.messages);
          }
        }
      } catch (err) {
        logger.error("p2p", "Error fetching message info:", err);
        // Continue with defaults
      }
    };

    // Fetch message info and set trade data
    const initialize = async () => {
      await fetchMessageInfo();
      
      // For now, use mock data
      // In a real implementation, you would fetch trade data from API
      setTradeData(mockTradeData);
      setLoading(false);

      // Example of how to fetch real trade data:
      // const fetchTradeData = async () => {
      //   try {
      //     const data = await getTradeData(tradeId);
      //     setTradeData(data);
      //   } catch (err) {
      //     setError("Failed to load trade data");
      //     logger.error("p2p", "Error fetching trade data:", err);
      //   } finally {
      //     setLoading(false);
      //   }
      // };
      // fetchTradeData();
    };

    initialize();
  }, [tradeId, isAuthenticated, router, searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0A0A0B] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1D8751] mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading trade messages...</p>
        </div>
      </div>
    );
  }

  // Handle case where tradeId is not available
  if (!tradeId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Trade Not Found
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            The requested trade could not be found.
          </p>
          <button
            onClick={() => router.push('/dashboard/p2p')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to P2P
          </button>
        </div>
      </div>
    );
  }

  if (error || !tradeData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0A0A0B] flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {error || "Trade not found"}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error || "The trade you're looking for doesn't exist or you don't have permission to view it."}
          </p>
          <button
            onClick={() => router.push('/dashboard/p2p/?tab=orders')}
            className="px-6 py-3 bg-[#1D8751] text-white rounded-lg hover:bg-[#166b3e] transition-colors"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0A0A0B]">
      {/* Header */}
      <div className="bg-white dark:bg-[#1A1A1D] border-b border-gray-200 dark:border-[#35353E]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/dashboard/p2p/?tab=orders')}
                className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-[#1D8751] transition-colors"
              >
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
                Back to Orders
              </button>
              <div className="h-6 w-px bg-gray-300 dark:bg-gray-600"></div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Trade Messages
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Trade ID: {tradeId}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {tradeData.amount} {tradeData.currency}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                  {tradeData.status}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-[#1A1A1D] rounded-lg border border-gray-200 dark:border-[#35353E] p-6">
          <ChatBox
            tradeId={tradeId}
            userId={user?.id?.toString() || ""}
            userName={user?.email || ""}
            autoreply={tradeData.autoreply || ""}
            seller_photo={tradeData.seller_photo || ""}
            buyer_photo={tradeData.buyer_photo || ""}
            buyer={tradeData.buyer}
            seller={tradeData.seller}
            currentUserEmail={user?.email || ""}
            owner={tradeData.owner}
            buyerName={tradeData.buyer_name}
            sellerName={tradeData.seller_name}
            messageType={messageType}
            peerName={peerName}
            supportMessages={supportMessages || undefined}
            onClose={() => router.push('/dashboard/p2p/?tab=orders')}
          />
        </div>
      </div>
    </div>
  );
};

export default TradeMessagesPage;
