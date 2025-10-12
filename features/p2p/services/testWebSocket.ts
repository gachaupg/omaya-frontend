/**
 * Test WebSocket Connection Utility
 * Run this in browser console to diagnose WebSocket issues
 */

import { cookieUtils } from "@/lib/utils/cookieUtils";

export const testWebSocketConnection = () => {
  console.log("🧪 Starting WebSocket Diagnostics...\n");

  // Step 1: Check for access token
  console.log("📋 Step 1: Checking for access token...");
  const cookieToken = cookieUtils.getCookie("access_token");
  const localToken = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

  if (!cookieToken && !localToken) {
    console.error("❌ FAILED: No access token found!");
    console.error("Solutions:");
    console.error("1. Log out and log back in");
    console.error("2. Check if your session expired");
    return;
  }

  const token = cookieToken || localToken;
  console.log("✅ Token found in:", cookieToken ? "cookies" : "localStorage");
  console.log("Token length:", token?.length, "characters");

  // Step 2: Validate token format
  console.log("\n📋 Step 2: Validating token format...");
  const tokenParts = token?.split('.') || [];
  if (tokenParts.length !== 3) {
    console.error("❌ FAILED: Invalid JWT format!");
    console.error("Expected 3 parts (header.payload.signature), got:", tokenParts.length);
    return;
  }
  console.log("✅ Valid JWT format");

  // Step 3: Decode and check expiration
  console.log("\n📋 Step 3: Checking token expiration...");
  try {
    const payload = JSON.parse(atob(tokenParts[1]));
    const expirationDate = new Date(payload.exp * 1000);
    const isExpired = payload.exp * 1000 < Date.now();
    
    console.log("Token expires:", expirationDate.toLocaleString());
    console.log("Is expired:", isExpired ? "❌ YES" : "✅ NO");
    
    if (isExpired) {
      console.error("❌ FAILED: Token is expired!");
      console.error("Solution: Log out and log back in");
      return;
    }
  } catch (e) {
    console.warn("⚠️ Could not decode token payload:", e);
  }

  // Step 4: Test WebSocket connection
  console.log("\n📋 Step 4: Testing WebSocket connection...");
  
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://dev.backend.omaya.io";
  const wsUrl = baseUrl.replace(/^https/, "wss").replace(/^http/, "ws");
  const fullUrl = `${wsUrl}/ws/matched-trades/?token=${token}`;
  
  console.log("Connecting to:", fullUrl.replace(/token=.+/, 'token=[REDACTED]'));
  
  const testWs = new WebSocket(fullUrl);
  
  const timeout = setTimeout(() => {
    console.error("❌ Connection timeout (10 seconds)");
    console.error("Possible causes:");
    console.error("- Backend WebSocket server is not running");
    console.error("- Network/firewall blocking WebSocket");
    console.error("- CORS issues");
    testWs.close();
  }, 10000);

  testWs.onopen = () => {
    clearTimeout(timeout);
    console.log("✅ WebSocket connection successful!");
    console.log("ReadyState:", testWs.readyState, "(1 = OPEN)");
  };

  testWs.onmessage = (event) => {
    console.log("📨 Message received:", event.data);
    try {
      const data = JSON.parse(event.data);
      console.log("Message type:", data.type);
    } catch (e) {
      console.log("Raw message:", event.data);
    }
  };

  testWs.onerror = (error) => {
    clearTimeout(timeout);
    console.error("❌ WebSocket error occurred");
    console.error("Error object:", error);
    console.error("ReadyState:", testWs.readyState);
    const states = ["CONNECTING (0)", "OPEN (1)", "CLOSING (2)", "CLOSED (3)"];
    console.error("State meaning:", states[testWs.readyState]);
  };

  testWs.onclose = (event) => {
    clearTimeout(timeout);
    console.log("🔌 WebSocket connection closed");
    console.log("Close code:", event.code);
    console.log("Close reason:", event.reason || "(no reason provided)");
    console.log("Was clean:", event.wasClean);
    
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
      console.log("\n📖 Close Code Info:");
      console.log("Name:", info.name);
      console.log("Description:", info.description);
      console.log("Solution:", info.solution);
    }
  };

  console.log("\n⏳ Waiting for connection (max 10 seconds)...");
  console.log("💡 Check the messages above for results");
  
  // Return the WebSocket instance so user can interact with it
  return testWs;
};

// Make it available globally for easy console access
if (typeof window !== "undefined") {
  (window as any).testWebSocket = testWebSocketConnection;
}

