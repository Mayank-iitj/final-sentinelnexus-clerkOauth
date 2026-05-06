# Auth Workflow Testing Checklist

**Purpose**: Verify complete authentication flow works before production deployment  
**Estimated Time**: 15-20 minutes  
**Environments**: Local Dev, Staging, Production

---

## Phase 1: Backend Health Check

### 1.1 Database Connection
```bash
# Local
curl -X GET http://localhost:8000/health

# Expected Response:
# {
#   "status": "healthy",
#   "db": "ok",
#   "redis": "ok"
# }
```

**Pass/Fail**: ___________

### 1.2 Clerk Configuration Verification
```python
# Run this in backend Python shell
from app.core.config import get_settings
settings = get_settings()

print(f"CLERK_JWKS_URL: {settings.CLERK_JWKS_URL}")
print(f"CLERK_ISSUER: {settings.CLERK_ISSUER}")
print(f"CLERK_SECRET_KEY: {'SET' if settings.CLERK_SECRET_KEY else 'NOT SET'}")
```

**All three must be set** ___________

---

## Phase 2: Frontend Configuration Check

### 2.1 Clerk Provider Loaded
```bash
# Open browser developer tools
# Go to: http://localhost:3000/login

# In Console, run:
window.__clerk

# Should show Clerk object ___________
```

### 2.2 Environment Variables
```bash
# Check .env.local
grep "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY" .env.local
grep "NEXT_PUBLIC_API_URL" .env.local

# Both should be set ___________
```

---

## Phase 3: Manual Auth Flow Test

### Step 3.1: Sign Up Test

1. Open: `http://localhost:3000/signup`
2. Click "Sign up with Clerk"
3. Complete OAuth flow
4. Should be redirected to `/dashboard`

**Result**: Pass _____ | Fail _____

**Issues**: ____________________________________________________

### Step 3.2: User Sync Verification

After sign up, check database:

```sql
SELECT id, email, username, oauth_provider, oauth_provider_id, is_active 
FROM users 
WHERE oauth_provider = 'clerk' 
ORDER BY id DESC 
LIMIT 1;
```

**Record exists**: Yes _____ | No _____

**Expected values**:
- oauth_provider: `clerk` ✓
- oauth_provider_id: `user_*` (not empty) ✓
- is_active: `true` ✓

### Step 3.3: Dashboard Access

1. After sign up redirect
2. Page should show stats
3. Try accessing `/api/v1/users/me`

```bash
curl -X GET http://localhost:8000/api/v1/users/me \
  -H "Authorization: Bearer <your_token_from_cookie>"
```

**Response**: 200 OK with user data ___________

### Step 3.4: Logout Test

1. Click user profile button
2. Click "Sign Out"
3. Should redirect to home page
4. Try accessing `/dashboard` directly
5. Should redirect to `/login`

**Behavior correct**: Yes _____ | No _____

---

## Phase 4: Error Handling Tests

### Test 4.1: Invalid Token Handling

```bash
# Try with invalid token
curl -X GET http://localhost:8000/api/v1/users/me \
  -H "Authorization: Bearer invalid_token_12345"

# Expected: 401 Unauthorized
```

**Status**: ___________

### Test 4.2: Missing Token Handling

```bash
# Request without token
curl -X GET http://localhost:8000/api/v1/users/me

# Expected: 401 Unauthorized (production) or 200 OK (development)
```

**Status**: ___________

### Test 4.3: Expired Token Handling

1. Get an access token
2. Wait for it to expire (or mock expiration)
3. Try to access protected endpoint
4. Should show error or redirect to login

**Behavior**: ____________________________________________________

---

## Phase 5: Clerk Webhook Test

### Test 5.1: Webhook Delivery

In Clerk Dashboard:
1. Go to **Webhooks**
2. Click on webhook endpoint
3. Check **Recent deliveries**
4. Latest delivery should show `200` status

**Last delivery status**: ___________

**Last delivery timestamp**: ___________

### Test 5.2: User Update via Webhook

1. In Clerk Dashboard, update a user's name
2. Check webhook delivery
3. Query database:

```sql
SELECT id, email, full_name 
FROM users 
WHERE oauth_provider_id = '<clerk_user_id>'
```

4. `full_name` should reflect the update

**Updated correctly**: Yes _____ | No _____

### Test 5.3: User Deletion via Webhook

1. In Clerk Dashboard, deactivate/delete a user
2. Check webhook delivery
3. Query database:

```sql
SELECT id, email, is_active 
FROM users 
WHERE oauth_provider_id = '<deleted_clerk_user_id>'
```

4. `is_active` should be `false`

**Deactivated correctly**: Yes _____ | No _____

### Test 5.4: Signature Verification
1. Try to send a manual POST request to `/clerk/webhook` without `svix` headers.
2. Expected: `400 Bad Request` (Missing svix headers).
3. Try to send a POST with invalid `svix-signature`.
4. Expected: `400 Bad Request` (Invalid signature).

**Verification working**: Yes _____ | No _____

---

## Phase 6: API Authentication Flow

### Test 6.1: Get Auth Token

```bash
# Method 1: Via cookie (from browser)
curl -X GET http://localhost:8000/api/v1/auth/me \
  -b "access_token=<from_browser_cookie>"

# Should return: 200 OK with user object
```

**Status**: ___________

### Test 6.2: Protected Endpoint Access

Try these protected endpoints:

```bash
# Users endpoint
curl -X GET http://localhost:8000/api/v1/users/me \
  -H "Authorization: Bearer <token>"
# Expected: 200 OK

# Scans endpoint (if user has scans)
curl -X GET http://localhost:8000/api/v1/scans \
  -H "Authorization: Bearer <token>"
# Expected: 200 OK or 404 if no scans
```

**Users endpoint**: _____ | **Scans endpoint**: _____

---

## Phase 7: Cross-Environment Tests

### Test 7.1: Frontend (Vercel) → Backend (Render)

In production/staging:

1. Go to: `https://sentinelnexus.vercel.app/login`
2. Sign in
3. Check Network tab → verify API calls go to correct backend
4. Should see requests to: `https://sentinelnexus-backend.onrender.com/api/v1/...`

**Correct backend**: Yes _____ | No _____

### Test 7.2: CORS Headers

```bash
curl -X OPTIONS https://sentinelnexus-backend.onrender.com/api/v1/users/me \
  -H "Origin: https://sentinelnexus.vercel.app"

# Check response headers:
# Access-Control-Allow-Origin: https://sentinelnexus.vercel.app
# Access-Control-Allow-Credentials: true
```

**CORS correct**: Yes _____ | No _____

---

## Phase 8: Performance & Load Tests

### Test 8.1: Rate Limiting

```bash
# Run 20 requests rapidly
for i in {1..20}; do
  curl -X GET http://localhost:8000/api/v1/auth/me \
    -H "Authorization: Bearer <token>" &
done

# After ~5 requests should get 429 Too Many Requests
```

**Rate limiting works**: Yes _____ | No _____

### Test 8.2: Response Time

```bash
# Measure response time
curl -w "Time: %{time_total}s\n" \
  -X GET http://localhost:8000/api/v1/auth/me \
  -H "Authorization: Bearer <token>"

# Expected: < 500ms
```

**Response time**: _____ ms

---

## Phase 9: Security Tests

### Test 9.1: Session Security

1. Open browser DevTools → Application → Cookies
2. Login
3. Verify:
   - `access_token` cookie is `HttpOnly` ✓
   - `access_token` cookie is `Secure` (HTTPS only) ✓
   - `access_token` cookie has `SameSite=Lax` ✓

**All secure**: Yes _____ | No _____

### Test 9.2: XSS Prevention

In browser console, try:

```javascript
// Should NOT have access to token
console.log(document.cookie)
// Should show empty or non-token cookies only
```

**Token not exposed**: Yes _____ | No _____

### Test 9.3: CSRF Prevention

Check headers returned by backend:

```bash
curl -I http://localhost:8000/api/v1/auth/me

# Look for:
# X-Frame-Options: DENY
# Content-Security-Policy: ...
# Referrer-Policy: ...
```

**Security headers present**: Yes _____ | No _____

---

## Phase 10: Error Scenarios

### Test 10.1: Network Error Handling

1. Disconnect internet during login
2. Should show error message to user
3. Can retry when connection restored

**Handled gracefully**: Yes _____ | No _____

### Test 10.2: Timeout Handling

1. Slow network (via DevTools throttling)
2. Try to login
3. Should either timeout gracefully or retry

**Handled gracefully**: Yes _____ | No _____

### Test 10.3: Backend Down Handling

1. Stop backend API
2. Try to login
3. Should show "Backend unavailable" error
4. Restart backend
5. Login should work again

**Handled gracefully**: Yes _____ | No _____

---

## Final Checklist

### Must Pass (Critical)
- [ ] User can sign up
- [ ] User can login
- [ ] User is synced to database
- [ ] User can access dashboard
- [ ] Logout works
- [ ] Protected endpoints require auth
- [ ] Invalid tokens rejected
- [ ] Security headers present

### Should Pass (Important)
- [ ] Webhook deliveries working
- [ ] CORS properly configured
- [ ] Rate limiting active
- [ ] Error messages helpful
- [ ] Response times acceptable

### Nice to Have
- [ ] Performance optimized
- [ ] Comprehensive logging
- [ ] Analytics tracking

---

## Sign-Off

**Tested By**: ____________________  
**Date**: ____________________  
**Environment**: ☐ Local | ☐ Staging | ☐ Production  
**Result**: ☐ PASS | ☐ FAIL  

**Issues Found**:
```
[List any issues]
```

**Next Steps**:
```
[Approval status and next steps]
```

---

## Quick Fix Commands

If issues found, try these:

```bash
# Restart backend
render-cli deploy

# Restart frontend
vercel --prod

# Clear Clerk cache
# (In backend Python shell)
from app.core.clerk import get_jwks
get_jwks(force_refresh=True)

# Sync missing users
# (SQL - sync all Clerk users as inactive)
UPDATE users SET is_active = true WHERE oauth_provider = 'clerk';

# Check logs
tail -f backend/logs/app.log
```
