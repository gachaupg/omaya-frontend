# Google OAuth Django Allauth Fix

## Problem
The frontend was using a custom API endpoint (`/api/auth/google/`) instead of Django Allauth's standard OAuth flow, causing `invalid_grant` errors because authorization codes were being used twice.

## Root Cause
1. Frontend initiated OAuth with Django Allauth (`/accounts/google/login/`)
2. Google redirected back to Django Allauth callback (`/accounts/google/login/callback/`)
3. Django Allauth processed the callback successfully (302 redirect)
4. Frontend then tried to exchange the code using custom API endpoint (`/api/auth/google/`)
5. This failed because the authorization code was already used by Django Allauth

## Solution
Replaced the custom API endpoint approach with Django Allauth's standard redirect-based OAuth flow.

## Changes Made

### 1. Updated API Configuration (`lib/appConfig.ts`)
```typescript
// Before
GOOGLE_AUTH: {
  GOOGLE_AUTH: "/api/auth/google/",
}

// After
GOOGLE_AUTH: {
  LOGIN: "/accounts/google/login/",
  LOGIN_CALLBACK: "/accounts/google/login/callback/",
  LOGOUT: "/accounts/logout/",
}
```

### 2. Updated Google OAuth Configuration (`utils/googleOAuthConfig.ts`)
- Changed `uxMode` from "popup" to "redirect"
- Updated redirect URI to point to `/auth/google/callback`
- Added Django Allauth endpoints

### 3. Rewrote Google OAuth Slice (`features/auth/slices/googleOAuthSlice.ts`)
- Removed `authenticateWithGoogle` thunk (custom API call)
- Added `initiateGoogleOAuth` thunk (redirects to Django Allauth)
- Added `checkAuthStatus` thunk (checks authentication after callback)
- Added `logoutGoogle` thunk (redirects to Django Allauth logout)

### 4. Updated Google Auth Button (`features/auth/components/GoogleAuthButton.tsx`)
- Removed popup-based OAuth flow
- Now uses redirect-based flow with Django Allauth
- Simplified error handling

### 5. Created OAuth Callback Handler (`features/auth/components/GoogleOAuthCallback.tsx`)
- Handles the OAuth callback from Django Allauth
- Checks authentication status after OAuth completion
- Provides user feedback and redirects appropriately

### 6. Created OAuth Callback Page (`app/auth/google/callback/page.tsx`)
- Page that handles the OAuth callback
- Uses the GoogleOAuthCallback component

## How It Works Now

1. **User clicks "Continue with Google"**
   - Frontend calls `initiateGoogleOAuth()`
   - User is redirected to `/accounts/google/login/` (Django Allauth)

2. **Django Allauth handles OAuth**
   - Redirects user to Google OAuth consent screen
   - User completes authentication with Google
   - Google redirects back to Django Allauth callback

3. **Django Allauth processes callback**
   - Exchanges authorization code for tokens
   - Creates/updates user account
   - Redirects to frontend callback page

4. **Frontend callback page**
   - Receives redirect from Django Allauth
   - Calls `checkAuthStatus()` to verify authentication
   - Redirects user to dashboard on success

## Testing

### Test Page
Visit `/test-oauth` to test the OAuth flow:
- Shows current authentication status
- Provides Google OAuth button
- Displays debug information
- Shows step-by-step instructions

### Manual Testing Steps
1. Go to `/test-oauth`
2. Click "Continue with Google"
3. Complete Google authentication
4. Verify you're redirected back to the callback page
5. Check that authentication status shows as "Authenticated"
6. Verify you're redirected to the dashboard

## Backend Requirements

The Django backend must be configured with:
1. Django Allauth properly set up
2. Google OAuth provider configured
3. Redirect URI set to: `{FRONTEND_URL}/auth/google/callback`
4. Profile API endpoint at `/api/profile/` that returns user data

## Key Benefits

1. **No more `invalid_grant` errors** - Authorization codes are only used once
2. **Standard Django Allauth flow** - Uses proven, well-tested OAuth implementation
3. **Better security** - No custom API endpoints handling sensitive OAuth data
4. **Simpler maintenance** - Leverages Django Allauth's built-in features
5. **Better user experience** - Standard OAuth flow that users are familiar with

## Files Modified

- `lib/appConfig.ts` - Updated API endpoints
- `utils/googleOAuthConfig.ts` - Updated OAuth configuration
- `features/auth/slices/googleOAuthSlice.ts` - Rewrote OAuth logic
- `features/auth/components/GoogleAuthButton.tsx` - Updated button component
- `features/auth/components/GoogleOAuthCallback.tsx` - New callback handler
- `app/auth/google/callback/page.tsx` - New callback page
- `app/test-oauth/page.tsx` - New test page

## Next Steps

1. Test the OAuth flow thoroughly
2. Update any other components that might be using the old OAuth implementation
3. Remove any unused OAuth-related code
4. Update documentation for other developers
