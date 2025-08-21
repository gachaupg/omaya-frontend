# Google OAuth Setup Guide

## 🔧 Fixing the "redirect_uri_mismatch" Error

### Step 1: Google Cloud Console Configuration

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Select your project
   - Navigate to "APIs & Services" > "Credentials"

2. **Find Your OAuth 2.0 Client ID**
   - Look for: `271869110142-pipollidmfj2v26dvgt9oumru543v84p.apps.googleusercontent.com`
   - Click on it to edit

3. **Add Authorized JavaScript Origins**
   Add these origins to the "Authorized JavaScript origins" section:
   ```
   http://localhost:3000
   http://localhost:3001
   http://localhost:3002
   https://your-production-domain.com
   ```

4. **Add Authorized Redirect URIs**
   Add these URIs to the "Authorized redirect URIs" section:
   ```
   http://localhost:3000
   http://localhost:3001
   http://localhost:3002
   https://your-production-domain.com
   ```

5. **Save Changes**
   - Click "Save"
   - Wait 2-3 minutes for changes to propagate

### Step 2: Environment Configuration

Create a `.env.local` file in your project root with:

```env
# Google OAuth Configuration
NEXT_PUBLIC_GOOGLE_CLIENT_ID=271869110142-pipollidmfj2v26dvgt9oumru543v84p.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

### Step 3: Verify Configuration

1. **Check your development server port**
   - Make sure your Next.js app is running on the correct port
   - The error shows `localhost:3001`, so ensure your app is on port 3001

2. **Restart your development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

3. **Clear browser cache**
   - Clear browser cache and cookies
   - Try in an incognito/private window

### Step 4: Test the Integration

1. **Test Google OAuth**
   - Go to your login/register page
   - Click the Google button
   - Should open Google OAuth popup without errors

2. **Check Console for Errors**
   - Open browser developer tools
   - Look for any OAuth-related errors

## 🚨 Common Issues and Solutions

### Issue 1: "redirect_uri_mismatch"
**Solution**: Add the correct origins and redirect URIs to Google Cloud Console

### Issue 2: "popup_closed_by_user"
**Solution**: Allow popups for your domain in browser settings

### Issue 3: "access_denied"
**Solution**: User denied permission - this is normal user behavior

### Issue 4: "invalid_client"
**Solution**: Check that your client ID is correct and the OAuth API is enabled

## 🔍 Debugging Steps

1. **Check Network Tab**
   - Open browser developer tools
   - Go to Network tab
   - Try Google OAuth
   - Look for failed requests

2. **Check Console Logs**
   - Look for any JavaScript errors
   - Check for OAuth-related messages

3. **Verify API Endpoints**
   - Ensure your backend `/api/auth/google/` endpoint is working
   - Test with Postman or similar tool

## 📋 Checklist

- [ ] Google Cloud Console configured with correct origins
- [ ] Google Cloud Console configured with correct redirect URIs
- [ ] Environment variables set correctly
- [ ] Development server running on correct port
- [ ] Browser popups allowed
- [ ] Backend API endpoint working
- [ ] No console errors

## 🆘 Still Having Issues?

1. **Double-check Google Cloud Console settings**
2. **Verify your client ID is correct**
3. **Ensure Google+ API is enabled**
4. **Check if your Google account has access to the project**
5. **Try with a different browser**
6. **Check if your IP is not blocked by Google**

## 📞 Support

If you're still experiencing issues:
1. Check the Google OAuth documentation
2. Verify your Google Cloud project settings
3. Ensure all required APIs are enabled
4. Contact Google Cloud support if needed
