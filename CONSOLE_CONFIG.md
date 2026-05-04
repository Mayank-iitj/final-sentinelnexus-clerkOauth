# Google Cloud Console Configuration

Complete setup for the OAuth credentials: `{{GOOGLE_CLIENT_ID}}`

## Current Configuration Status

✅ **Client ID**: `{{GOOGLE_CLIENT_ID}}`  
✅ **Client Secret**: Already set in `backend/.env`  
✅ **Project**: SentinelNexus (Google Cloud Console)

## Console Configuration Checklist

### 1. Authorized JavaScript Origins

**Path**: Google Cloud Console → APIs & Services → Credentials → (Click the OAuth client) → Edit

Register these origins where your app frontend will be hosted:

#### Local Development
```
http://localhost:3000
http://127.0.0.1:3000
```

#### Production
```
https://sentinelnexus.ai
https://www.sentinelnexus.ai
https://your-vercel-domain.vercel.app
```

**How to add:**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select project: **SentinelNexus**
3. Go to **APIs & Services** → **Credentials**
4. Click on your OAuth 2.0 Client ID (Web application)
5. Under **Authorized JavaScript origins**, click **Add URI**
6. Paste each origin above
7. Click **Save**

---

### 2. Authorized Redirect URIs

**Path**: Google Cloud Console → APIs & Services → Credentials → (Click the OAuth client) → Edit

These are the URLs where Google will redirect after user authenticates. **Must be exact.**

#### Local Development
```
http://localhost:8000/api/v1/auth/callback/google
http://127.0.0.1:8000/api/v1/auth/callback/google
```

#### Production
```
https://your-backend-host.run.app/api/v1/auth/callback/google
https://sentinelnexus-api-xyz.a.run.app/api/v1/auth/callback/google
```

**How to add:**
1. Click on the OAuth client (same as above)
2. Under **Authorized redirect URIs**, click **Add URI**
3. Paste each redirect URI above
4. Click **Save**

⚠️ **Important**: The redirect URI MUST match exactly what the backend sends, including:
- Protocol (http/https)
- Domain
- Path (/api/v1/auth/callback/google)
- Port (if needed)

---

### 3. OAuth Consent Screen Configuration

**Path**: Google Cloud Console → APIs & Services → OAuth consent screen

Verify these settings are correct:

| Setting | Value |
|---------|-------|
| **App name** | SentinelNexus |
| **User support email** | your-email@example.com |
| **App logo** | (Optional, can add logo later) |
| **Authorized domains** | localhost, sentinelnexus.ai |
| **Developer contact** | your-email@example.com |

**How to verify:**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select project: **SentinelNexus**
3. Go to **APIs & Services** → **OAuth consent screen**
4. Review all sections and verify settings
5. Make any needed updates and click **Save and Continue**

---

### 4. Required API

**Path**: Google Cloud Console → APIs & Services → Library

Ensure **Google+ API** is enabled:

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select project: **SentinelNexus**
3. Go to **APIs & Services** → **Library**
4. Search for: `Google+ API`
5. Click on result
6. Verify status shows **"Enabled"** (blue button)
7. If disabled, click **Enable**

---

### 5. Application Type

**Path**: Google Cloud Console → APIs & Services → Credentials

Your OAuth client must be configured as:

| Setting | Value |
|---------|-------|
| **Application type** | Web application |
| **Client type** | Public (for web) |

---

## Configuration for Different Environments

### Local Development

**Console Settings:**
```
JavaScript Origins:
  - http://localhost:3000
  - http://127.0.0.1:3000

Redirect URIs:
  - http://localhost:8000/api/v1/auth/callback/google
  - http://127.0.0.1:8000/api/v1/auth/callback/google
```

**Backend .env:**
```
GOOGLE_CLIENT_ID={{GOOGLE_CLIENT_ID}}
GOOGLE_CLIENT_SECRET={{GOOGLE_CLIENT_SECRET}}
FRONTEND_BASE_URL=http://localhost:3000
BACKEND_BASE_URL=http://localhost:8000
```

### Production (Vercel + Cloud Run)

**Console Settings:**
```
JavaScript Origins:
  - https://sentinelnexus.ai
  - https://www.sentinelnexus.ai
  - https://your-vercel-domain.vercel.app

Redirect URIs:
  - https://sentinelnexus-api-xyz.a.run.app/api/v1/auth/callback/google
  - https://your-backend-host.run.app/api/v1/auth/callback/google
```

**Cloud Run Environment Variables:**
```
GOOGLE_CLIENT_ID={{GOOGLE_CLIENT_ID}}
GOOGLE_CLIENT_SECRET={{GOOGLE_CLIENT_SECRET}}
FRONTEND_BASE_URL=https://your-vercel-domain.vercel.app
BACKEND_BASE_URL=https://your-backend-host.run.app
```

**Vercel Environment Variables:**
```
BACKEND_URL=https://your-backend-host.run.app
NEXTAUTH_URL=https://your-vercel-domain.vercel.app
NEXTAUTH_SECRET=<generate-random-secret>
```

---

## Verification Steps

### 1. Test Local Redirect URL

```bash
# Should return 405 (method not allowed) or similar, NOT 404
curl -X POST http://localhost:8000/api/v1/auth/callback/google
```

Expected: Error response (not 404)

### 2. Test OAuth Provider Registration

```bash
cd backend
python scripts/validate_oauth.py
```

Expected: All ✅ checkmarks

### 3. Test Full OAuth Flow

1. Open `http://localhost:3000/login`
2. Click "Continue with Google"
3. You should be redirected to Google login
4. After login, should redirect back to dashboard

---

## Troubleshooting

### Error: "redirect_uri_mismatch"

**Cause**: The redirect URL in your request doesn't match what's registered in Console.

**Solution**:
1. Check the exact URL in error message
2. Add it to **Authorized redirect URIs** in Console
3. Verify protocol (http vs https), domain, path, and port all match exactly

Example: If error says redirect is `/api/v1/auth/callback/google` but you registered `/api/v1/auth/google`, fix the mismatch.

### Error: "invalid_client"

**Cause**: Client ID or Secret is wrong.

**Solution**:
1. Go to Google Cloud Console
2. APIs & Services → Credentials
3. Click on your OAuth 2.0 Client ID
4. Copy the exact Client ID
5. Verify Secret matches what's in `backend/.env`

### Error: "Access blocked: This app, Google hasn't verified"

**Cause**: OAuth app is in development mode and needs verification.

**Solution** (for testing):
1. In OAuth consent screen, make sure your email is added as a test user
2. Or verify the app (requires providing app details, privacy policy, etc.)

---

## Security Reminders

1. ✅ **Never commit `.env` files** — Already in `.gitignore`
2. ✅ **Use HTTPS in production** — Console accepts both http://localhost and https://domains
3. ✅ **Rotate credentials periodically** — Create new OAuth client quarterly
4. ✅ **Restrict origins** — Don't use wildcards; specify exact domains
5. ✅ **Protect your Secret** — Treat it like a password; rotate if exposed

---

## Reference Links

- [Google Cloud Console](https://console.cloud.google.com)
- [OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2/web-server)
- [Authlib Integration](https://docs.authlib.org/en/latest/integrations/starlette_oauth_client.html)
- [Troubleshooting OAuth Errors](https://support.google.com/cloud/answer/10311584)
