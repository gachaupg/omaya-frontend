# Development HTTPS Setup for Facebook Login

Facebook login requires HTTPS in production and for security reasons. Here's how to set up HTTPS for local development:

## Option 1: Using Next.js with HTTPS (Recommended)

### 1. Install mkcert for local certificates
```bash
# Windows (using Chocolatey)
choco install mkcert

# Or download from: https://github.com/FiloSottile/mkcert/releases
```

### 2. Create local certificates
```bash
# Install the local CA
mkcert -install

# Create certificates for localhost
mkcert localhost 127.0.0.1 ::1
```

This will create `localhost+2.pem` and `localhost+2-key.pem` files.

### 3. Update package.json
```json
{
  "scripts": {
    "dev": "next dev",
    "dev:https": "next dev --experimental-https --experimental-https-key ./localhost+2-key.pem --experimental-https-cert ./localhost+2.pem"
  }
}
```

### 4. Run with HTTPS
```bash
npm run dev:https
```

Your app will be available at: `https://localhost:3000`

## Option 2: Using a reverse proxy (nginx)

### 1. Install nginx
```bash
# Windows
choco install nginx

# Or download from: http://nginx.org/en/download.html
```

### 2. Configure nginx
Create `nginx.conf`:
```nginx
events {
    worker_connections 1024;
}

http {
    upstream nextjs {
        server 127.0.0.1:3000;
    }

    server {
        listen 443 ssl;
        server_name localhost;

        ssl_certificate localhost+2.pem;
        ssl_certificate_key localhost+2-key.pem;

        location / {
            proxy_pass http://nextjs;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

### 3. Run both services
```bash
# Terminal 1: Start Next.js
npm run dev

# Terminal 2: Start nginx
nginx -c /path/to/nginx.conf
```

## Option 3: Using a development tunnel (ngrok)

### 1. Install ngrok
```bash
# Download from: https://ngrok.com/download
```

### 2. Start your Next.js app
```bash
npm run dev
```

### 3. Create HTTPS tunnel
```bash
ngrok http 3000
```

This will give you a public HTTPS URL like: `https://abc123.ngrok.io`

### 4. Update Facebook App Settings
Add the ngrok URL to your Facebook App's Valid OAuth Redirect URIs:
- `https://abc123.ngrok.io/accounts/facebook/login/callback/`

## Facebook App Configuration

### 1. Update Valid OAuth Redirect URIs
In your Facebook App settings, add:
- `https://localhost:3000/accounts/facebook/login/callback/` (for local development)
- `https://your-ngrok-url.ngrok.io/accounts/facebook/login/callback/` (for ngrok)

### 2. Update App Domains
Add to App Domains:
- `localhost`
- `ngrok.io` (if using ngrok)

### 3. Update Site URL
Set Site URL to:
- `https://localhost:3000` (for local development)
- `https://your-ngrok-url.ngrok.io` (for ngrok)

## Troubleshooting

### Common Issues

1. **"FB.login can no longer be called from http pages"**
   - Solution: Use HTTPS (any of the options above)

2. **"Invalid OAuth redirect_uri"**
   - Solution: Make sure the redirect URI in Facebook App settings matches exactly

3. **Certificate errors**
   - Solution: Install mkcert CA: `mkcert -install`

4. **CORS errors**
   - Solution: Make sure your backend allows the HTTPS domain

### Testing

1. Open `https://localhost:3000` in your browser
2. Accept the security warning (if using self-signed certificates)
3. Try Facebook login
4. Check browser console for any errors

## Production Deployment

For production, make sure:
1. Your domain has a valid SSL certificate
2. Facebook App settings include your production domain
3. All redirect URIs use HTTPS
4. Your backend is configured for HTTPS

## Security Notes

- Never commit certificate files to version control
- Use environment variables for sensitive configuration
- Regularly rotate certificates in production
- Monitor for security vulnerabilities
