# Google OAuth Setup Guide

## Overview
This guide explains how to configure Google OAuth authentication in your application using the provided credentials.

## Credentials Configuration

Your Google OAuth credentials have been integrated into the following files:
- `config/googleOAuth.ts`
- `utils/googleOAuthConfig.ts`

### Current Configuration

**Client ID:** `454150377252-nhnl44hh48rfh8v2hdt0skagf03vr05r.apps.googleusercontent.com`  
**Client Secret:** (set in backend env only; see below)

**Authorised JavaScript origins:** (add every origin you use)
- `http://localhost:3000`
- `http://127.0.0.1:3000` ← add if you open the app via 127.0.0.1
- `https://dev.omaya.io`

**Authorised redirect URIs:** (must match exactly; no trailing slash)
- `http://localhost:3000/auth/google/callback`
- `http://127.0.0.1:3000/auth/google/callback` ← add if you use 127.0.0.1
- `https://dev.omaya.io/auth/google/callback`

## Environment Variables Setup

### For Local Development (Frontend)

Create a `.env.local` file in your project root with:

```env
# Google OAuth – Frontend (Login with Google)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=454150377252-nhnl44hh48rfh8v2hdt0skagf03vr05r.apps.googleusercontent.com
NEXT_PUBLIC_GOOGLE_REDIRECT_URI=https://dev.omaya.io/auth/google/callback

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000

# API Configuration (adjust based on your backend)
NEXT_PUBLIC_BASE_URL=http://localhost:8000/api/v1
```

### For Production (dev.omaya.io) – Frontend

Set these in your frontend deployment (Vercel, Docker, etc.):

```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=454150377252-nhnl44hh48rfh8v2hdt0skagf03vr05r.apps.googleusercontent.com
NEXT_PUBLIC_GOOGLE_REDIRECT_URI=https://dev.omaya.io/auth/google/callback
NEXT_PUBLIC_APP_URL=https://dev.omaya.io
NEXT_PUBLIC_BASE_URL=https://your-backend-api-url.com/api/v1
```

### Backend / Django Allauth

Set these **only in your backend** environment (never in frontend):

```env
GOOGLE_OAUTH_CLIENT_ID=454150377252-nhnl44hh48rfh8v2hdt0skagf03vr05r.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=GOCSPX-***
GOOGLE_REDIRECT_URI=https://dev.omaya.io/auth/google/callback

SOCIAL_AUTH_GOOGLE_OAUTH2_KEY=454150377252-nhnl44hh48rfh8v2hdt0skagf03vr05r.apps.googleusercontent.com
SOCIAL_AUTH_GOOGLE_OAUTH2_SECRET=GOCSPX-***
SOCIAL_AUTH_GOOGLE_OAUTH2_REDIRECT_URI=https://dev.omaya.io/auth/google/callback
```

## How It Works

1. **Client-Side Flow:**
   - User clicks the Google login button (`GoogleAuthButton` component)
   - A popup opens with Google's OAuth consent screen
   - User authorizes the application
   - Google returns an authorization code

2. **Backend Authentication:**
   - The authorization code is sent to your backend
   - Your backend exchanges the code for access tokens
   - Backend validates the user and creates a session

3. **Configuration Used:**
   - The app uses the `GOOGLE_OAUTH_CONFIG` from `config/googleOAuth.ts`
   - It automatically uses environment variables if set, otherwise falls back to hardcoded values

## Security Considerations

⚠️ **Important Security Notes:**

1. **Client Secret:** The `GOOGLE_CLIENT_SECRET` should NEVER be exposed to the client-side code. It should only be used in your backend API.

2. **Environment Variables:** 
   - Use `.env.local` for local development (this file should be in `.gitignore`)
   - Never commit sensitive credentials to version control
   - Use your hosting platform's environment variable settings for production

3. **HTTPS Required:** Google OAuth requires HTTPS for production environments (except localhost)

## Testing Your Setup

1. **Start your development server:**
   ```bash
   npm run dev
   ```

2. **Navigate to the login page**

3. **Click the "Sign in with Google" button**

4. **Verify:**
   - Popup opens correctly
   - Google consent screen appears
   - After authorization, you're redirected back with proper authentication

## Troubleshooting

### Common Issues

**1. "Popup blocked" error**
- Solution: Allow popups for localhost:3000 in your browser settings

**2. "redirect_uri_mismatch" (Error 400)**  
   When you see: *"redirect_uri=..."* in the error:
   - **Cause:** That exact redirect URI is not in your OAuth client’s **Authorised redirect URIs** in Google Cloud Console.
   - **Fix:** Copy the `redirect_uri` from the error and add it **exactly** in Console (no trailing slash). Also add the same origin to **Authorised JavaScript origins**.
   - If you use **127.0.0.1** instead of localhost, add `http://127.0.0.1:3000` and `http://127.0.0.1:3000/auth/google/callback`; the app sends the **current page origin**, so it must be listed.

**3. "invalid_client" error**
- Solution: Verify your Client ID and Client Secret are correct
- Check: Environment variables are properly loaded

**4. CORS errors**
- Solution: Ensure JavaScript origins are configured in Google Console
- Check: Both `http://localhost:3000` and `https://dev.omaya.io` are listed

## Google Cloud Console – Fix redirect_uri_mismatch

1. Open **[Google Cloud Console](https://console.cloud.google.com/)** and sign in.
2. Select the project that owns the OAuth client (Client ID: `454150377252-...`).
3. Go to **APIs & Services** → **Credentials**.
4. Under **OAuth 2.0 Client IDs**, click the client you use for this app (e.g. "Web client").
5. Under **Authorized redirect URIs**, click **+ ADD URI** and add **each** of these (if not already there):
   - `http://localhost:3000/auth/google/callback`  ← required for local dev
   - `https://dev.omaya.io/auth/google/callback`  ← for production/dev.omaya.io
6. Under **Authorized JavaScript origins**, ensure you have:
   - `http://localhost:3000`
   - `https://dev.omaya.io`
7. Click **Save**. Changes can take 5 minutes to a few hours to apply.

**If you still get redirect_uri_mismatch:**
- Open the error details and copy the exact `redirect_uri=` value. Add that **exact** URI (and its origin in JavaScript origins) in the Console.
- If you open the app at **http://127.0.0.1:3000**, add `http://127.0.0.1:3000` and `http://127.0.0.1:3000/auth/google/callback`; the app sends the current page origin.
- Ensure the **frontend** has `NEXT_PUBLIC_GOOGLE_CLIENT_ID` set in `.env.local` (same value as backend; the frontend uses the `NEXT_PUBLIC_` prefix).

## Additional OAuth Endpoints

The application uses these Google OAuth endpoints:
- **Authorization:** `https://accounts.google.com/o/oauth2/auth`
- **Token Exchange:** `https://oauth2.googleapis.com/token`
- **User Info:** `https://www.googleapis.com/oauth2/v2/userinfo`

## Implementation Files

- `config/googleOAuth.ts` - Main configuration
- `utils/googleOAuthConfig.ts` - Helper functions and types
- `features/auth/components/GoogleAuthButton.tsx` - UI component
- `features/auth/slices/googleOAuthSlice.ts` - Redux state management

## Support

If you encounter issues, check:
1. Console logs for detailed error messages
2. Network tab to see OAuth request/response
3. Google Cloud Console for credential status

---

**Last Updated:** October 16, 2025
**Project:** OMAYA Exchange Frontend

