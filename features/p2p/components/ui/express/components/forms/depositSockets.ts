/**
 * Deposit WebSocket Connection Manager
 * 
 * Handles WebSocket connections for monitoring deposit transaction status.
 * Includes automatic retry logic, protocol fallback, and comprehensive error handling.
 */

import { showToast } from "@/lib/utils/toast";
import { appendTokenToWebSocketUrl, normalizeWebSocketUrl } from "@/lib/utils/websocketUtils";

export interface WebSocketCallbacks {
  onStatusUpdate: (status: string) => void;
  onError: (error: string | null) => void;
  onConnection: (ws: WebSocket | null) => void;
  onRetryCountUpdate: (count: number) => void;
}

export interface WebSocketConfig {
  retryCount: number;
  maxRetries?: number;
  connectionTimeout?: number;
  retryDelay?: number;
}

/**
 * Establishes a WebSocket connection for deposit monitoring
 * 
 * @param websocketUrl - The WebSocket URL to connect to
 * @param callbacks - Callbacks for state updates
 * @param config - Configuration for retry logic and timeouts
 * @param isRetry - Whether this is a retry attempt
 * @returns WebSocket instance or null on failure
 */
export const connectDepositWebSocket = (
  websocketUrl: string,
  callbacks: WebSocketCallbacks,
  config: WebSocketConfig & { token?: string | null },
  isRetry: boolean = false
): WebSocket | null => {
  try {
    // Validate WebSocket URL
    if (!websocketUrl || websocketUrl.trim() === "") {
      callbacks.onError("WebSocket URL is empty or undefined");
      return null;
    }

    const maxRetries = config.maxRetries ?? 3;
    const connectionTimeout = config.connectionTimeout ?? 10000;
    const retryDelay = config.retryDelay ?? 2000;

    // Clean up malformed URLs (remove //http: or //https: from WebSocket URLs)
    let cleanedUrl = normalizeWebSocketUrl(websocketUrl);
    if (websocketUrl.includes('//http:') || websocketUrl.includes('//https:')) {
      cleanedUrl = websocketUrl.replace('//http:', '').replace('//https:', '');
    }

    // Ensure proper WebSocket protocol - always use wss for production/secure contexts
    let finalUrl = cleanedUrl;
    
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
      }
    } else if (!websocketUrl.startsWith('wss://')) {
      // If URL doesn't have protocol, try to determine from current location
      const isSecure = window.location.protocol === 'https:';
      const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
      const isDevBackend = websocketUrl.includes('dev.backend.omaya.io');
      const useWss = isSecure || isProduction || isDevBackend;
      
      finalUrl = `${useWss ? 'wss://' : 'ws://'}${websocketUrl}`;
    }

    finalUrl = appendTokenToWebSocketUrl(finalUrl, config.token);

    // Validate the constructed URL
    try {
      new URL(finalUrl);
    } catch (urlError) {
      callbacks.onError(`Invalid WebSocket URL: ${finalUrl}`);
      return null;
    }

    const ws = new WebSocket(finalUrl);
    
    // Set up connection timeout
    const timeout = setTimeout(() => {
      if (ws.readyState === WebSocket.CONNECTING) {
        ws.close();
        callbacks.onError("WebSocket connection timeout. Please check your network connection.");
        callbacks.onConnection(null);
      }
    }, connectionTimeout);
    
    ws.onopen = () => {
      clearTimeout(timeout);
      callbacks.onConnection(ws);
      callbacks.onError(null);
      callbacks.onRetryCountUpdate(0);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.status) {
          callbacks.onStatusUpdate(data.status);
          
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
        // Silent error handling
      }
    };

    ws.onclose = (event) => {
      clearTimeout(timeout);
      callbacks.onConnection(null);
      
      // Attempt retry if connection was not clean and we haven't exceeded retry limit
      if (!event.wasClean && config.retryCount < maxRetries) {
        callbacks.onRetryCountUpdate(config.retryCount + 1);
        setTimeout(() => {
          const retryWs = connectDepositWebSocket(
            websocketUrl, 
            callbacks, 
            { ...config, retryCount: config.retryCount + 1 },
            true
          );
          if (!retryWs) {
            if (config.retryCount >= maxRetries - 1) {
              callbacks.onError("WebSocket connection failed after multiple retry attempts. Please refresh the page to try again.");
            }
          }
        }, retryDelay * (config.retryCount + 1)); // Exponential backoff
      } else if (!event.wasClean && config.retryCount >= maxRetries) {
        callbacks.onError("WebSocket connection failed after multiple retry attempts. Please refresh the page to try again.");
      }
    };

    ws.onerror = (error) => {
      clearTimeout(timeout);
      
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
      
      // Try alternative protocol if this is the first attempt
      if (config.retryCount === 0 && finalUrl.startsWith('ws://')) {
        const fallbackUrl = finalUrl.replace('ws://', 'wss://');
        setTimeout(() => {
          connectDepositWebSocket(
            fallbackUrl, 
            callbacks, 
            { ...config, retryCount: config.retryCount + 1 },
            true
          );
        }, 1000);
        return; // Don't set error yet, let the fallback try first
      }
      
      callbacks.onError(errorMessage);
      callbacks.onConnection(null);
    };

    return ws;
  } catch (error) {
    const errorMessage = `Failed to create WebSocket connection: ${error instanceof Error ? error.message : 'Unknown error'}`;
    
    callbacks.onError(errorMessage);
    return null;
  }
};

/**
 * Disconnects and cleans up a WebSocket connection
 * 
 * @param ws - The WebSocket instance to disconnect
 */
export const disconnectDepositWebSocket = (ws: WebSocket | null) => {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.close(1000, "Component unmounting");
  }
};

