/**
 * Token Expiration Test Utility
 * Use this to test token expiration scenarios in development
 */

import { storage } from '@/features/auth/utils/storage';

export const simulateTokenExpiration = () => {
  const profile = storage.getProfile();
  if (profile?.tokens?.access) {
    // Create an expired token by modifying the exp claim
    const tokenParts = profile.tokens.access.split('.');
    if (tokenParts.length === 3) {
      try {
        const payload = JSON.parse(atob(tokenParts[1]));
        // Set expiration to 1 second ago
        payload.exp = Math.floor(Date.now() / 1000) - 1;
        
        // Recreate the token with expired payload
        const newPayload = btoa(JSON.stringify(payload));
        const expiredToken = `${tokenParts[0]}.${newPayload}.${tokenParts[2]}`;
        
        // Update storage with expired token
        storage.setProfile({
          ...profile,
          tokens: {
            ...profile.tokens,
            access: expiredToken,
          },
        });
        
        // Update localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('access_token', expiredToken);
        }
        
                return true;
      } catch (error) {
                return false;
      }
    }
  }
  return false;
};

export const simulateInvalidRefreshToken = () => {
  const profile = storage.getProfile();
  if (profile?.tokens?.refresh) {
    // Set an invalid refresh token
    storage.setProfile({
      ...profile,
      tokens: {
        ...profile.tokens,
        refresh: 'invalid_refresh_token',
      },
    });
    
        return true;
  }
  return false;
};

export const restoreValidTokens = () => {
  // This would need to be called with valid tokens from your login flow
    return false;
};

// Development helper - add to window for easy testing
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).tokenTest = {
    simulateExpiration: simulateTokenExpiration,
    simulateInvalidRefresh: simulateInvalidRefreshToken,
    restore: restoreValidTokens,
  };
  
  }

