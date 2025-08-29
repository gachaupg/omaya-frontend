# Settings Feature - Session Management

## Overview

The settings feature includes comprehensive session management functionality that prevents duplicate sessions from the same IP address.

## Session Duplicate Prevention

### How it works

1. **IP Address Detection**: When a user logs in, the system automatically detects their IP address using the `ipify.org` API.

2. **Duplicate Check**: Before creating a new session, the system checks if a session with the same IP address already exists and is active.

3. **Prevention Logic**: If a session with the same IP address is found, no new session is created, preventing duplicates.

### Implementation Details

#### Key Files

- `hooks/useGlobalSessionCreation.ts` - Global hook for session creation with duplicate prevention (used across entire app)
- `utils/sessionUtils.ts` - Utility functions for session management
- `slices/settingsSlice.ts` - Redux slice with session creation logic
- `api.ts` - API endpoints for session management

#### Utility Functions

```typescript
// Check if session with IP already exists
findSessionByIP(ipAddress: string, existingSessions: DeviceSession[]): DeviceSession | null

// Check if new session should be created
shouldCreateSession(ipAddress: string, existingSessions: DeviceSession[]): boolean

// Get current IP address
getCurrentIPAddress(): Promise<string>

// Get location from IP address
getLocationFromIP(ipAddress: string): Promise<string>
```

#### Session Creation Flow

1. User logs in or component mounts
2. `useGlobalSessionCreation` hook is triggered globally
3. System fetches current IP address
4. System loads existing sessions from Redux state or API
5. System checks for existing session with same IP
6. If duplicate found: skip creation and log message
7. If no duplicate: create new session with device info

### Benefits

- **Prevents Duplicate Sessions**: No multiple sessions from the same IP address
- **Better User Experience**: Users see accurate session count
- **Reduced Server Load**: Fewer unnecessary session creation requests
- **Improved Security**: Better session tracking and management

### Error Handling

- If IP address detection fails, session creation proceeds with "Unknown" IP
- If existing sessions can't be fetched, session creation proceeds
- All errors are logged for debugging purposes

### Usage

The duplicate prevention is automatically active when using the `useGlobalSessionCreation` hook:

```typescript
import { useGlobalSessionCreation } from '../../hooks/useGlobalSessionCreation';

const MyComponent = () => {
  const { createSession } = useGlobalSessionCreation();
  // Session creation with duplicate prevention happens automatically
};
```
