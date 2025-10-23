# Google OAuth Setup Guide

## Overview
This guide explains how to configure Google OAuth authentication in your application using the provided credentials.

## Credentials Configuration

Your Google OAuth credentials have been integrated into the following files:
- `config/googleOAuth.ts`
- `utils/googleOAuthConfig.ts`

### Current Configuration

**Client ID:** `866830600136-atu6lg341gn9snr1pkbmjhssebh9luqb.apps.googleusercontent.com`
**Client Secret:** `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`

**Authorized JavaScript Origins:**
- `http://localhost:3000`
- `https://dev.omaya.io`

**Authorized Redirect URIs:**
- `http://localhost:3000/`
- `https://dev.omaya.io`

## Environment Variables Setup

### For Local Development

Create a `.env.local` file in your project root with:

```env
# Google OAuth Configuration
NEXT_PUBLIC_GOOGLE_CLIENT_ID=866830600136-atu6lg341gn9snr1pkbmjhssebh9luqb.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000

# API Configuration (adjust based on your backend)
NEXT_PUBLIC_BASE_URL=http://localhost:8000/api/v1
```

### For Production (dev.omaya.io)

Set these environment variables in your deployment platform:

```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=866830600136-atu6lg341gn9snr1pkbmjhssebh9luqb.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
NEXT_PUBLIC_APP_URL=https://dev.omaya.io
NEXT_PUBLIC_BASE_URL=https://your-backend-api-url.com/api/v1
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

**2. "redirect_uri_mismatch" error**
- Solution: Ensure your redirect URI in Google Console exactly matches your app URL
- Check: `http://localhost:3000/` vs `http://localhost:3000` (trailing slash matters)

**3. "invalid_client" error**
- Solution: Verify your Client ID and Client Secret are correct
- Check: Environment variables are properly loaded

**4. CORS errors**
- Solution: Ensure JavaScript origins are configured in Google Console
- Check: Both `http://localhost:3000` and `https://dev.omaya.io` are listed

## Google Cloud Console Configuration

To modify these settings, go to:
1. [Google Cloud Console](https://console.cloud.google.com/)
2. Select project: **farmedge-4b422**
3. Navigate to: **APIs & Services > Credentials**
4. Find your OAuth 2.0 Client ID
5. Edit the authorized domains and redirect URIs as needed

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

