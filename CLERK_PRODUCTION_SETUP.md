# Clerk Authentication - Production Setup Guide

**Last Updated**: May 6, 2026  
**Status**: Production Ready  
**Auth Provider**: Clerk (https://clerk.com)

---

## 1. Pre-Deployment Checklist

### ✅ Required Accounts & Configuration
- [ ] Create Clerk account at https://clerk.com
- [ ] Create new Clerk application
- [ ] Get **Publishable Key** and **Secret Key**
- [ ] Get **JWKS URL** (Usually: `https://<your-clerk-domain>/.well-known/jwks.json`)
- [ ] Get **Issuer URL** (Usually: `https://<your-clerk-domain>`)

### ✅ Frontend Configuration (Vercel)
- [ ] Add `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` to Vercel environment variables
- [ ] Ensure `NEXT_PUBLIC_SITE_URL` is set to your production domain

### ✅ Backend Configuration (Render)
- [ ] Add `CLERK_SECRET_KEY` to Render environment variables
- [ ] Add `CLERK_JWKS_URL` to Render environment variables
- [ ] Add `CLERK_ISSUER` to Render environment variables
- [ ] Ensure `ALLOWED_ORIGINS` includes your frontend domain

---

## 2. Clerk Dashboard Configuration

### Step 1: Set Frontend URLs

In Clerk Dashboard → **Applications → Your App → Domains**:

1. **Production URL**:
   - Add your frontend domain: `https://sentinelnexus.vercel.app`
   - Also add: `https://www.sentinelnexus.vercel.app`

2. **Redirect URLs** (After Sign In):
   - Add: `https://sentinelnexus.vercel.app/dashboard`
   - Add: `https://sentinelnexus.vercel.app/login`

3. **After Sign Out URL**:
   - Add: `https://sentinelnexus.vercel.app/`

### Step 2: Configure OAuth (Google)

In Clerk Dashboard → **Applications → Your App → Social Providers**:

1. Enable **Google**:
   - You'll need Google OAuth Client ID and Secret
   - Get these from Google Cloud Console → APIs & Services → Credentials
   - Client ID and Secret from OAuth 2.0 Client

2. Add Authorized Redirect URIs in Google Cloud:
   - `https://your-clerk-domain/oauth/authorize`

### Step 3: Set Webhook for User Sync

In Clerk Dashboard → **Webhooks**:

1. Add new endpoint:
   - **URL**: `https://sentinelnexus-backend.onrender.com/api/v1/auth/clerk/webhook`
   - **Events**: Select:
     - `user.created`
     - `user.updated`
     - `user.deleted`

2. Verify the webhook is active

---

## 3. Environment Variables

### Backend (.env or Render dashboard)

```bash
# Clerk Configuration
CLERK_SECRET_KEY=sk_live_your_secret_key_here
CLERK_JWKS_URL=https://your-clerk-domain/.well-known/jwks.json
CLERK_ISSUER=https://your-clerk-domain

# CORS Configuration (add Clerk domains)
ALLOWED_ORIGINS=["https://sentinelnexus.vercel.app","https://your-clerk-domain"]
ALLOWED_HOSTS=sentinelnexus.vercel.app,your-clerk-domain

# Production settings
ENV=production
DEBUG=false
```

### Frontend (.env.production or Vercel dashboard)

```bash
# Clerk Configuration
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_your_publishable_key_here

# Site Configuration
NEXT_PUBLIC_SITE_URL=https://sentinelnexus.vercel.app

# Backend API
NEXT_PUBLIC_API_URL=https://sentinelnexus-backend.onrender.com/api/v1
```

---

## 4. Deployment Steps

### Step 1: Deploy Backend First

```bash
# Push to Render (or your backend provider)
git push render main

# Monitor logs in Render dashboard
# Check /health endpoint: https://sentinelnexus-backend.onrender.com/health
```

### Step 2: Deploy Frontend

```bash
# Push to Vercel
git push origin main

# Monitor deployment in Vercel dashboard
# Check homepage loads: https://sentinelnexus.vercel.app
```

### Step 3: Test Authentication

1. **Visit Login Page**:
   - Go to: `https://sentinelnexus.vercel.app/login`
   - Click "Continue with Clerk"
   - Complete OAuth flow

2. **Verify User Sync**:
   - After login, check backend database:
   ```sql
   SELECT * FROM users WHERE oauth_provider = 'clerk';
   ```

3. **Check Dashboard**:
   - Should redirect to `/dashboard` after login
   - Verify stats load properly

4. **Logout Test**:
   - Click User button → Sign Out
   - Should redirect to `/`
   - Verify cannot access `/dashboard` without login

---

## 5. Troubleshooting

### Issue: "Clerk token verification failed"

**Solution**:
1. Verify `CLERK_JWKS_URL` is correct
2. Check `CLERK_ISSUER` matches your Clerk domain
3. Verify `CLERK_SECRET_KEY` is valid
4. Check backend logs: `docker logs sentinelnexus-backend`

### Issue: User not synced to database

**Solution**:
1. Verify webhook is configured in Clerk dashboard
2. Check webhook delivery in Clerk → Webhooks → Recent deliveries
3. Verify backend `/api/v1/auth/clerk/webhook` endpoint is accessible
4. Check backend logs for webhook errors

### Issue: "Invalid origin" error

**Solution**:
1. Add frontend URL to Clerk dashboard → Applications → Domains
2. Verify `ALLOWED_ORIGINS` in backend includes frontend URL
3. Clear browser cache and try again

### Issue: User can login but can't access dashboard

**Solution**:
1. Verify Clerk token is being sent correctly
2. Check backend logs for authentication errors
3. Verify user record exists in database
4. Check user is_active = true in database

---

## 6. Security Checklist

- [ ] Use HTTPS everywhere (both frontend and backend)
- [ ] Store secrets in Render/Vercel secret manager (never in code)
- [ ] Enable rate limiting on auth endpoints
- [ ] Monitor webhook deliveries for errors
- [ ] Set strong JWT secrets (64+ characters, random)
- [ ] Keep Clerk SDK updated
- [ ] Regularly audit user access logs
- [ ] Test password/secret rotation procedure
- [ ] Enable MFA for Clerk dashboard access
- [ ] Set up alerts for authentication failures

---

## 7. Monitoring & Maintenance

### Daily Checks
```bash
# Check backend health
curl https://sentinelnexus-backend.onrender.com/health

# Monitor Clerk webhook deliveries
# → Clerk Dashboard → Webhooks → Recent deliveries
```

### Weekly Checks
1. Review auth error logs
2. Check user sync completion
3. Verify no failed webhook deliveries

### Monthly Checks
1. Update Clerk SDK if updates available
2. Review and rotate secrets if necessary
3. Test disaster recovery procedure

---

## 8. API Endpoints

### Authentication Endpoints

#### POST `/api/v1/auth/clerk/webhook`
**Description**: Receive Clerk user events  
**Body**: Clerk webhook payload  
**Response**: `{ "status": "ok", "action": "created|updated|deleted" }`

#### GET `/api/v1/auth/me`
**Description**: Get current authenticated user  
**Auth**: Clerk JWT or local JWT  
**Response**: User object with profile

#### POST `/api/v1/auth/logout`
**Description**: Clear auth cookies  
**Response**: `{ "ok": true }`

#### POST `/api/v1/auth/demo`
**Description**: Create temporary demo user  
**Response**: `{ "access_token": "...", "token_type": "bearer" }`

---

## 9. Performance Optimization

### Caching
- Clerk JWKS cached for 1 hour (auto-refreshes)
- User lookups by clerk_id optimized with indexes

### Rate Limiting
- Auth endpoints: 5 requests/min per IP
- Webhook endpoint: No rate limit (from Clerk IPs)
- Token refresh: 10 requests/min per IP

### Database
- Indexes on `oauth_provider` and `oauth_provider_id`
- Connection pooling with psycopg2

---

## 10. Rollback Plan

If authentication breaks in production:

1. **Immediate**:
   - Redirect users to maintenance page
   - Alert on-call team

2. **Investigation** (Check in order):
   - Verify backend is healthy: `/health`
   - Check Clerk status page: status.clerk.com
   - Review webhook logs in Clerk dashboard
   - Check backend auth logs

3. **Recovery**:
   - If Clerk is down: Wait for recovery + restart backend
   - If JWKS is stale: Force refresh JWKS cache in backend
   - If webhook broken: Manually sync users via SQL
   - If credentials wrong: Update env vars and restart

---

## References

- Clerk Docs: https://clerk.com/docs
- Clerk Node.js Reference: https://clerk.com/docs/references/node
- NextAuth.js: https://next-auth.js.org
- FastAPI Security: https://fastapi.tiangolo.com/tutorial/security/
