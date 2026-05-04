# Google OAuth Setup Guide

This guide walks you through creating and configuring a new Google OAuth 2.0 client for SentinelNexus.

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Click **Select a Project** (top-left)
3. Click **NEW PROJECT**
4. Enter project name: `SentinelNexus` (or your preferred name)
5. Click **CREATE**
6. Wait for the project to be created, then select it

## Step 2: Enable Google+ API

1. In the console, go to **APIs & Services** → **Library**
2. Search for `Google+ API`
3. Click on **Google+ API**
4. Click **ENABLE**
5. Wait for it to enable (takes ~30 seconds)

## Step 3: Create OAuth 2.0 Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **+ CREATE CREDENTIALS** (top)
3. Select **OAuth client ID**
4. If prompted, click **CONFIGURE CONSENT SCREEN** first:
   - Choose **External** user type
   - Click **CREATE**
   - Fill in **App name**: `SentinelNexus`
   - Fill in **User support email**: your email
   - Under **Authorized domains**, add your domain (e.g., `sentinelnexus.ai` or `localhost` for local dev)
   - Under **Developer contact**, add your email
   - Click **SAVE AND CONTINUE** through all screens
   - Click **BACK TO CREDENTIALS**

5. Click **+ CREATE CREDENTIALS** → **OAuth client ID** again
6. Choose **Web application**
7. Set a **Name**: `SentinelNexus Web Client`
8. Under **Authorized JavaScript origins**, add:
   - `http://localhost:3000` (local frontend)
   - `http://localhost:8000` (local backend)
   - `https://your-vercel-domain.vercel.app` (production frontend)
   - `https://your-backend-host.run.app` (production backend, e.g., Cloud Run)

9. Under **Authorized redirect URIs**, add:
   - `http://localhost:8000/api/v1/auth/callback/google` (local backend callback)
   - `https://your-backend-host.run.app/api/v1/auth/callback/google` (production backend callback)

10. Click **CREATE**
11. A modal will show your credentials:
    - **Client ID**: Copy this
    - **Client Secret**: Copy this (keep this secret!)
12. Click **CLOSE**

## Step 4: Store Credentials in Environment

### Local Development

Create or update `backend/.env`:

```bash
GOOGLE_CLIENT_ID=<your-client-id-from-step-3>
GOOGLE_CLIENT_SECRET=<your-client-secret-from-step-3>
```

### Production (Vercel + Cloud Run)

1. **Backend (Cloud Run)**:
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Navigate to **Cloud Run**
   - Click on your service (e.g., `sentinelnexus-backend`)
   - Click **EDIT & DEPLOY NEW REVISION**
   - Under **Environment variables**, add:
     - `GOOGLE_CLIENT_ID`: `<your-client-id>`
     - `GOOGLE_CLIENT_SECRET`: `<your-client-secret>`
     - `FRONTEND_BASE_URL`: `https://your-vercel-domain.vercel.app`
     - `BACKEND_BASE_URL`: `https://your-backend-host.run.app`
   - Click **DEPLOY**

2. **Frontend (Vercel)**:
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Select your project
   - Go to **Settings** → **Environment Variables**
   - Add `BACKEND_URL`: `https://your-backend-host.run.app`
   - Click **Save**

## Step 5: Test the OAuth Flow

### Local Testing

1. **Start the backend**:
   ```powershell
   cd backend
   $env:DATABASE_URL='sqlite:///./dev.db'
   $env:REDIS_URL='redis://localhost:6379/0'
   $env:SECRET_KEY='devsecret'
   $env:JWT_SECRET_KEY='devjwt'
   $env:GOOGLE_CLIENT_ID='<your-client-id>'
   $env:GOOGLE_CLIENT_SECRET='<your-client-secret>'
   python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
   ```

2. **Start the frontend** (in another terminal):
   ```powershell
   cd frontend
   npm run dev
   ```

3. **Navigate to login**:
   - Open http://localhost:3000/login
   - Click "Continue with Google"
   - You should be redirected to Google's login
   - After signing in, you should be redirected back to the dashboard

### Production Testing

1. Verify that your Vercel frontend and Cloud Run backend are deployed
2. Set all environment variables as described in Step 4
3. Navigate to `https://your-vercel-domain.vercel.app/login`
4. Test the Google OAuth flow end-to-end

## Troubleshooting

### Error: "Google OAuth not configured"
- Ensure `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set in environment variables
- Restart the backend after setting env vars

### Error: "redirect_uri_mismatch"
- The redirect URI in your request doesn't match what's registered in Google Cloud
- Make sure you've added the exact callback URL to **Authorized redirect URIs** in Step 3
- For local dev: `http://localhost:8000/api/v1/auth/callback/google`
- For production: `https://your-backend-host.run.app/api/v1/auth/callback/google`

### Error: "invalid_client"
- Your Client ID or Client Secret is incorrect or expired
- Re-copy from Google Cloud Console (Step 3, Step 11)
- Make sure there are no extra spaces or quotes

### Error: "Invalid redirect_uri in OAuth request"
- Check that your **Authorized JavaScript origins** includes your frontend origin
- For local dev: `http://localhost:3000`
- For production: `https://your-vercel-domain.vercel.app`

### User not appearing in SentinelNexus after login
- Check the backend logs for "Google user sync error"
- Ensure the database is reachable (`DATABASE_URL` is correct)
- Verify email is available in Google profile

## Security Best Practices

1. **Never commit credentials**: Add `.env` to `.gitignore`
2. **Rotate secrets regularly**: Delete old OAuth clients and create new ones
3. **Use HTTPS in production**: Always use `https://` for production URLs
4. **Enable 2FA on Google Account**: Protect your Google Cloud Console
5. **Monitor OAuth events**: Check logs for suspicious authentication attempts
6. **Scope minimization**: SentinelNexus only requests `openid email profile` (not calendar, drive, etc.)

## References

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Authlib Starlette Integration](https://docs.authlib.org/en/latest/integrations/starlette_oauth_client.html)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Cloud Run Environment Variables](https://cloud.google.com/run/docs/configuring/services/environment-variables)
