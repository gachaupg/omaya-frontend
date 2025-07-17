/**
 * Test file for markets API integration
 * Run this to verify the CoinGecko API is working
 */

import { testApiConnection, fetchTopMarkets } from "./api";

async function testMarketsAPI() {
  console.log("🧪 Testing Markets API Integration...");

  try {
    // Test 1: Check API connection
    console.log("1. Testing API connection...");
    const isConnected = await testApiConnection();
    console.log("✅ API Connection:", isConnected ? "SUCCESS" : "FAILED");

    if (!isConnected) {
      console.log(
        "❌ API connection failed. Check your internet connection and API key."
      );
      return;
    }

    // Test 2: Fetch top markets
    console.log("2. Fetching top 5 markets...");
    const response = await fetchTopMarkets(5, "usd");

    if (response.success) {
      console.log("✅ Top markets fetched successfully!");
      console.log("📊 Markets found:", response.data.length);
      console.log("🏆 Top 3 markets:");
      response.data.slice(0, 3).forEach((market, index) => {
        console.log(
          `   ${index + 1}. ${
            market.name
          } (${market.symbol.toUpperCase()}) - $${market.current_price}`
        );
      });
    } else {
      console.log("❌ Failed to fetch markets:", response.error);
    }
  } catch (error) {
    console.error("❌ Test failed with error:", error);
  }
}

// Run the test if this file is executed directly
if (typeof window !== "undefined") {
  // Browser environment
  window.testMarketsAPI = testMarketsAPI;
  (window as any).testMarketsAPI = testMarketsAPI;
  console.log("🌐 Markets API test available. Run: window.testMarketsAPI()");
} else {
  // Node.js environment
  testMarketsAPI();
}

export { testMarketsAPI };
