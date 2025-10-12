# Matched Trades WebSocket Service

This directory contains the WebSocket service for real-time matched trades updates.

## Overview

The matched trades WebSocket service provides real-time notifications when:
- A new trade match is created
- An existing trade is updated
- The list of matched trades changes

## Architecture

### Components

1. **matchedTradesWebSocket.ts** - Core WebSocket service
2. **useMatchedTradesWebSocket.ts** (hook) - React hook for easy integration
3. **matchedTradesSlice.ts** (Redux) - State management with WebSocket support

## WebSocket API

### Connection

```
wss://dev.backend.omaya.io/ws/matched-trades/?token={access_token}
```

### Message Types

#### 1. Connection Established
```json
{
  "type": "connection_established",
  "data": {
    "message": "Successfully connected to matched trades",
    "connection_id": "uuid",
    "user_id": 123,
    "group_name": "matched_trades_user_123",
    "timestamp": "ISO 8601 datetime"
  }
}
```

#### 2. Initial Data
Sent immediately after connection is established.
```json
{
  "type": "initial_data",
  "data": {
    "trades": [...],
    "count": 5,
    "timestamp": "ISO 8601 datetime"
  }
}
```

#### 3. Trades Update
Sent when the full list of matched trades is updated.
```json
{
  "type": "trades_update",
  "data": {
    "trades": [...],
    "count": 6,
    "timestamp": "ISO 8601 datetime"
  }
}
```

#### 4. Trade Update
Sent when a single trade is created or updated.
```json
{
  "type": "trade_update",
  "data": {
    "trade_id": "uuid",
    "status": "matched",
    "action": "created" | "updated",
    "trade": {...},
    "timestamp": "ISO 8601 datetime"
  }
}
```

## Usage

### Using the Hook (Recommended)

The easiest way to integrate WebSocket updates is using the `useMatchedTradesWebSocket` hook:

```tsx
import { useMatchedTradesWebSocket } from "@/features/p2p/hooks/useMatchedTradesWebSocket";

function MyComponent() {
  const { isConnected, connectionError } = useMatchedTradesWebSocket({
    enabled: true,                // Enable/disable WebSocket
    fallbackToPolling: true,      // Fall back to HTTP polling if WebSocket fails
    pollingInterval: 30000,       // Polling interval in ms (default: 30s)
  });

  return (
    <div>
      {isConnected ? (
        <span>🟢 Real-time updates active</span>
      ) : (
        <span>🟡 Using fallback polling</span>
      )}
    </div>
  );
}
```

### Using the Service Directly

For more control, you can use the WebSocket service directly:

```tsx
import { getMatchedTradesWebSocket } from "@/features/p2p/services/matchedTradesWebSocket";

const ws = getMatchedTradesWebSocket();

// Connect
const token = localStorage.getItem("access_token");
ws.connect(token);

// Listen for messages
const unsubscribe = ws.onMessage((message) => {
  console.log("Received:", message);
});

// Clean up
unsubscribe();
ws.disconnect();
```

## Features

### Automatic Reconnection
- Automatically reconnects on connection loss
- Exponential backoff (max 5 attempts)
- Configurable reconnect delay

### Fallback to HTTP Polling
- Seamlessly falls back to HTTP polling if WebSocket fails
- Configurable polling interval
- Automatically stops polling when WebSocket reconnects

### State Management
- Integrates with Redux for global state
- Actions for all WebSocket message types
- Optimistic updates for better UX

### Audio Notifications
- Plays sound when new trades are matched
- Requires user interaction to enable (browser policy)
- Visual indicator showing notification count

## Error Handling

The service handles various error scenarios:
- No access token → Falls back to polling
- Connection failure → Retries with backoff
- Message parsing errors → Logs and continues
- Network issues → Automatic reconnection

## Visual Indicators

The UserCard component shows:
- **Red badge** - Number of matched trades
- **Green dot** - WebSocket is connected (real-time updates active)
- **No green dot** - Using HTTP polling fallback

## Testing

To test the WebSocket connection:

1. Open browser console
2. Look for messages:
   - ✅ "Matched Trades WebSocket connected"
   - 📨 "WebSocket message: {type}"
   - 🔄 "Reconnecting in Xs"

3. Check network tab:
   - Should see WebSocket connection to `/ws/matched-trades/`
   - Messages tab shows real-time data

## Configuration

WebSocket URL is configured in `lib/appConfig.ts`:

```typescript
P2P: {
  SOCKETS: {
    MATCHED_TRADES: (token: string) =>
      `${getWebSocketBaseUrl()}/ws/matched-trades/?token=${token}`,
  },
}
```

## Troubleshooting

### WebSocket not connecting?
1. **Check access token**: The token is stored in cookies (not localStorage)
   - Open DevTools → Application → Cookies
   - Look for `access_token` cookie
   - If missing, user needs to log in again
   
2. **Verify backend WebSocket endpoint is running**
   - Check `wss://dev.backend.omaya.io/ws/matched-trades/`
   - Test connection in Postman or similar tool
   
3. **Check browser console for errors**
   - Look for "No access token found" warning
   - Check for WebSocket connection errors
   - Verify no CORS issues

### No access token found?
The hook retrieves the token from:
1. **Cookies first** (primary): `document.cookie` → `access_token`
2. **localStorage** (fallback): `localStorage.getItem("access_token")`

If neither exists:
- User is not authenticated
- User needs to log in
- Token may have expired

### Not receiving updates?
- Verify WebSocket is connected (green dot indicator)
- Check network tab for WebSocket messages
- Ensure user is authenticated
- Check if token has expired

### Audio not playing?
- User must interact with page first (browser policy)
- Check browser console for audio errors
- Verify `/sounds/notification.mp3` exists

### Debugging Tips

Enable detailed logging:
```javascript
// In browser console
localStorage.setItem('debug', 'websocket');

// Then refresh the page
// You'll see detailed WebSocket logs
```

Check connection state:
```javascript
// In browser console
const ws = require('@/features/p2p/services/matchedTradesWebSocket').getMatchedTradesWebSocket();
console.log('Connected:', ws.isConnected());
console.log('Ready state:', ws.getReadyState());
```

## Future Enhancements

- [ ] Add message queue for offline support
- [ ] Implement message compression
- [ ] Add connection quality indicator
- [ ] Support for binary messages
- [ ] Heartbeat/ping-pong for connection health

