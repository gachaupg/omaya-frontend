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
        
        console.log('🔒 Token expiration simulated. Next API call should trigger refresh.');
        return true;
      } catch (error) {
        console.error('Failed to simulate token expiration:', error);
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
    
    console.log('🔒 Invalid refresh token simulated. Next API call should trigger logout.');
    return true;
  }
  return false;
};

export const restoreValidTokens = () => {
  // This would need to be called with valid tokens from your login flow
  console.log('⚠️  You need to log in again to restore valid tokens.');
  return false;
};

// Development helper - add to window for easy testing
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).tokenTest = {
    simulateExpiration: simulateTokenExpiration,
    simulateInvalidRefresh: simulateInvalidRefreshToken,
    restore: restoreValidTokens,
  };
  
  console.log('🧪 Token test utilities available at window.tokenTest');
}

