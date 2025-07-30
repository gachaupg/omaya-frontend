# Express Exchange WebSocket Integration

This feature implements real-time transaction status monitoring for both deposit and withdrawal transactions using WebSocket connections.

## How it Works

### 1. Transaction Flow

#### Deposit Flow

- User submits a deposit request through the deposit form
- The API returns a transaction ID in the response
- The user is redirected to the status page (`exchnaging.tsx`)
- WebSocket connection is established using the transaction ID to monitor deposit status

#### Withdrawal Flow

- User submits a withdrawal request through the withdrawal form
- The API returns a transaction ID in the response
- The user is redirected to the status page (`exchnaging.tsx`)
- WebSocket connection is established using the transaction ID to monitor withdrawal status

### 2. WebSocket Integration

- **Both Deposit and Withdrawal Transactions**: WebSocket is used for both transaction types
- **Real-time Updates**: The status page shows live updates of transaction progress
- **Auto-navigation**: When transaction status becomes "completed" or "confirmed", user is automatically redirected to success page

### 3. Status Mapping

The WebSocket receives status updates that are mapped to the UI stepper:

- `pending` → "Awaiting Deposit" (active)
- `awaiting_payment` → "Awaiting Payment" (active)
- `processing` → "Processing" (active)
- `exchanging` → "Exchanging" (active)
- `sending` → "Sending to you" (active)
- `completed`/`confirmed` → Auto-navigate to success page

### 4. Components

#### `websockets.tsx`

- `BaseTransactionStatusWebSocket` class: Base class for WebSocket functionality
- `DepositStatusWebSocket` class: Handles deposit status WebSocket connections
- `WithdrawalStatusWebSocket` class: Handles withdrawal status WebSocket connections
- `TransactionStatusWebSocket` class: Legacy class for backward compatibility
- `useTransactionStatusWebSocket` hook: React hook for both deposit and withdrawal
- `useDepositStatusWebSocket` hook: Specific hook for deposit status
- `useWithdrawalStatusWebSocket` hook: Specific hook for withdrawal status

#### `deposit.tsx` (Deposit Form)

- Extracts transaction ID from deposit API response
- Passes transaction ID to status page via `onExchange` callback

#### `withdrwal.tsx` (Withdrawal Form)

- Extracts transaction ID from withdrawal API response
- Passes transaction ID to status page via `onExchange` callback

#### `exchnaging.tsx` (Status Page)

- Uses WebSocket hook to monitor transaction status for both deposit and withdrawal
- Automatically determines transaction type and uses appropriate WebSocket endpoint
- Shows real-time status updates in the stepper
- Displays WebSocket connection status
- Auto-navigates to success page when transaction completes

### 5. WebSocket Endpoints

The system uses different WebSocket endpoints based on transaction type:

- **Deposit Status**: `ws://localhost:8000/ws/deposit-status/{transaction_id}/`
- **Withdrawal Status**: `ws://localhost:8000/ws/withdrawal-status/{transaction_id}/`

### 6. Features

#### Real-time Status Display

- Live connection indicator (green/yellow)
- Current transaction status with timestamp
- Block number and confirmations (if available)
- Error messages (if any)

#### Fallback Options

- Manual success button for testing/fallback scenarios
- Graceful handling of WebSocket connection failures
- Auto-reconnection with exponential backoff

#### Debug Information

- Console logging for transaction ID, status, and connection state
- WebSocket URL construction using API configuration
- Transaction type detection and logging

### 7. Configuration

The WebSocket URLs are constructed using the API configuration:

```typescript
// For deposits
API_CONFIG.EXCHANGE.SOCKETS.DEPOSIT_STATUS(transactionId);

// For withdrawals
API_CONFIG.EXCHANGE.SOCKETS.TRANSACTION_STATUS(transactionId);
```

This generates URLs like:

- `wss://api.example.com/ws/deposit-status/{transaction_id}/`
- `wss://api.example.com/ws/withdrawal-status/{transaction_id}/`

### 8. Error Handling

- WebSocket connection errors are logged to console
- Failed connections trigger auto-reconnection (up to 5 attempts)
- Transaction errors are displayed in the UI
- Graceful fallback to manual navigation if WebSocket fails

### 9. Usage Examples

#### Using the WebSocket Classes Directly

```typescript
// For deposits
const depositWs = new DepositStatusWebSocket(transactionId, {
  onMessage: (data) => console.log("Deposit status:", data),
  autoReconnect: true,
});

// For withdrawals
const withdrawalWs = new WithdrawalStatusWebSocket(transactionId, {
  onMessage: (data) => console.log("Withdrawal status:", data),
  autoReconnect: true,
});
```

#### Using the React Hooks

```typescript
// For deposits
const { isConnected, lastMessage } = useDepositStatusWebSocket(transactionId, {
  onMessage: (data) => setStatus(data.data.status),
  autoReconnect: true,
});

// For withdrawals
const { isConnected, lastMessage } = useWithdrawalStatusWebSocket(
  transactionId,
  {
    onMessage: (data) => setStatus(data.data.status),
    autoReconnect: true,
  }
);

// Generic hook (auto-detects type)
const { isConnected, lastMessage } = useTransactionStatusWebSocket(
  transactionId,
  "deposit", // or "withdrawal"
  {
    onMessage: (data) => setStatus(data.data.status),
    autoReconnect: true,
  }
);
```

### 10. Testing

To test the WebSocket integration:

1. Submit a deposit or withdrawal request
2. Check browser console for WebSocket connection logs
3. Verify status updates in the UI
4. Test auto-navigation to success page
5. Use manual success button as fallback

### 11. Future Enhancements

- Add sound notifications for status changes
- Implement push notifications for mobile
- Add transaction history with WebSocket replay
- Support for multiple concurrent transactions
- Enhanced error handling and retry mechanisms
