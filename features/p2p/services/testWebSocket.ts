/**
 * Test WebSocket Connection Utility
 * Run this in browser console to diagnose WebSocket issues
 */

import { cookieUtils } from "@/lib/utils/cookieUtils";

import { logger } from '@/lib/utils/logger';

export const testWebSocketConnection = async () => {
  logger.debug('p2p', "🧪 Starting WebSocket Diagnostics...\n");

  // Step 1: Check for access token
  logger.debug('p2p', "📋 Step 1: Checking for access token...");
  const cookieToken = cookieUtils.getCookie("access_token");
  const localToken = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

  if (!cookieToken && !localToken) {
                    return;
  }

  const token = cookieToken || localToken;
  logger.debug('p2p', "✅ Token found in:", cookieToken ? "cookies" : "localStorage");
  logger.debug('p2p', "Token length:", token?.length, "characters");

  // Step 2: Validate token format
  logger.debug('p2p', "\n📋 Step 2: Validating token format...");
  const tokenParts = token?.split('.') || [];
  if (tokenParts.length !== 3) {
            return;
  }
  logger.debug('p2p', "✅ Valid JWT format");

  // Step 3: Decode and check expiration
  logger.debug('p2p', "\n📋 Step 3: Checking token expiration...");
  try {
    const payload = JSON.parse(atob(tokenParts[1]));
    const expirationDate = new Date(payload.exp * 1000);
    const isExpired = payload.exp * 1000 < Date.now();
    
    logger.debug('p2p', "Token expires:", expirationDate.toLocaleString());
    logger.debug('p2p', "Is expired:", isExpired ? "❌ YES" : "✅ NO");
    
    if (isExpired) {
                  return;
    }
  } catch (e) {
      }

  // Step 4: Test WebSocket connection
  logger.debug('p2p', "\n📋 Step 4: Testing WebSocket connection...");
  
  const { API_BASE_URL } = await import("@/config/api");
  const baseUrl = API_BASE_URL;
  const wsUrl = baseUrl.replace(/^https/, "wss").replace(/^http/, "ws");
  const fullUrl = `${wsUrl}/ws/matched-trades/?token=${token}`;
  
  logger.debug('p2p', "Connecting to:", fullUrl.replace(/token=.+/, 'token=[REDACTED]'));
  
  const testWs = new WebSocket(fullUrl);
  
  const timeout = setTimeout(() => {
                        testWs.close();
  }, 10000);

  testWs.onopen = () => {
    clearTimeout(timeout);
    logger.debug('p2p', "✅ WebSocket connection successful!");
    logger.debug('p2p', "ReadyState:", testWs.readyState, "(1 = OPEN)");
  };

  testWs.onmessage = (event) => {
    logger.debug('p2p', "📨 Message received:", event.data);
    try {
      const data = JSON.parse(event.data);
      logger.debug('p2p', "Message type:", data.type);
    } catch (e) {
      logger.debug('p2p', "Raw message:", event.data);
    }
  };

  testWs.onerror = (error) => {
    clearTimeout(timeout);
                const states = ["CONNECTING (0)", "OPEN (1)", "CLOSING (2)", "CLOSED (3)"];
      };

  testWs.onclose = (event) => {
    clearTimeout(timeout);
    logger.debug('p2p', "🔌 WebSocket connection closed");
    logger.debug('p2p', "Close code:", event.code);
    logger.debug('p2p', "Close reason:", event.reason || "(no reason provided)");
    logger.debug('p2p', "Was clean:", event.wasClean);
    
    const closeCodeInfo: Record<number, { name: string; description: string; solution: string }> = {
      1000: {
        name: "Normal Closure",
        description: "Connection closed normally",
        solution: "This is fine - normal closure"
      },
      1006: {
        name: "Abnormal Closure",
        description: "Connection closed without close frame",
        solution: "Backend may not be running or network issues. Check backend logs."
      },
      1008: {
        name: "Policy Violation",
        description: "Authentication or authorization failed",
        solution: "Token may be invalid or expired. Log out and log in again."
      },
      1011: {
        name: "Internal Server Error",
        description: "Server encountered an error",
        solution: "Check backend logs for errors"
      }
    };

    const info = closeCodeInfo[event.code];
    if (info) {
      logger.debug('p2p', "\n📖 Close Code Info:");
      logger.debug('p2p', "Name:", info.name);
      logger.debug('p2p', "Description:", info.description);
      logger.debug('p2p', "Solution:", info.solution);
    }
  };

  logger.debug('p2p', "\n⏳ Waiting for connection (max 10 seconds)...");
  logger.debug('p2p', "💡 Check the messages above for results");
  
  // Return the WebSocket instance so user can interact with it
  return testWs;
};

// Make it available globally for easy console access
if (typeof window !== "undefined") {
  (window as any).testWebSocket = testWebSocketConnection;
}

