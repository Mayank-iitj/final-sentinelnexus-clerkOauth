# 🔑 Clerk Auth - Quick Reference Card

**Print This & Keep Handy During Deployment**

---

## Critical Environment Variables

### Render Backend
```bash
CLERK_SECRET_KEY        = sk_live_XXXXXXXXXXXX
CLERK_JWKS_URL         = https://your-domain/.well-known/jwks.json
CLERK_ISSUER           = https://your-domain
```

### Vercel Frontend
```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = pk_live_XXXXXXXXXXXX
NEXT_PUBLIC_API_URL                = https://backend-domain/api/v1
```

---

## Critical Endpoints

| Purpose | Endpoint | Method | Auth |
|---------|----------|--------|------|
| Health Check | `/health` | GET | None |
| User Sync Webhook | `/api/v1/auth/clerk/webhook` | POST | None |
| Current User | `/api/v1/auth/me` | GET | JWT |
| Get Profile | `/api/v1/users/me` | GET | JWT |
| Sign Out | `/api/v1/auth/logout` | POST | JWT |

---

## Deployment Sequence

```
1. Set Backend Env Vars (Render)
   ├─ CLERK_SECRET_KEY
   ├─ CLERK_JWKS_URL
   └─ CLERK_ISSUER

2. Deploy Backend
   └─ git push render main

3. Verify Backend
   └─ curl https://backend-domain/health

4. Set Frontend Env Vars (Vercel)
   ├─ NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
   └─ NEXT_PUBLIC_API_URL

5. Deploy Frontend
   └─ git push origin main

6. Configure Clerk Dashboard
   ├─ Add domains
   ├─ Enable OAuth
   └─ Set webhook: /api/v1/auth/clerk/webhook

7. Test Auth Flow
   ├─ Visit /login
   ├─ Complete sign-in
   ├─ Check /dashboard
   └─ Verify database user
```

---

## Debug Checklist

### If Auth Fails

```
□ Backend health: https://backend-domain/health
□ Render logs: Dashboard → Environment → Logs
□ Vercel logs: Dashboard → Deployments → Logs
□ Clerk status: status.clerk.com
□ Database connectivity: psql connect test
□ Redis connectivity: redis-cli ping
```

### If User Not Synced

```
□ Clerk webhook configured: Yes/No
□ Webhook URL correct: Yes/No
□ Backend at webhook endpoint: Check logs
□ Recent deliveries: Clerk Dashboard → Webhooks
□ Database query: SELECT * FROM users WHERE oauth_provider='clerk'
```

### If Login Redirects Wrong

```
□ Clerk domain in Vercel env: Yes/No
□ Backend ALLOWED_ORIGINS correct: Yes/No
□ CORS headers present: Check DevTools
□ Redirect URL in Clerk dashboard: Set?
```

---

## Quick Commands

```bash
# Check backend health
curl https://backend-domain/health

# Check database connection
psql postgresql://user:pass@host/db -c "SELECT 1"

# Check Redis
redis-cli ping

# View Render logs (install render-cli)
render-cli logs sentinelnexus-backend

# View Vercel logs (install vercel)
vercel logs --prod

# Restart backend
render-cli deploy

# Restart frontend
vercel --prod
```

---

## Clerk Dashboard Quick Links

- **Create App**: https://dashboard.clerk.com/apps/create
- **Webhooks**: https://dashboard.clerk.com/webhooks
- **Social Providers**: https://dashboard.clerk.com/apps/social-providers
- **Domains**: https://dashboard.clerk.com/apps/domains
- **Documentation**: https://clerk.com/docs

---

## Error Response Codes

| Code | Meaning | Action |
|------|---------|--------|
| 200 | OK | Success ✅ |
| 401 | Unauthorized | Check token |
| 403 | Forbidden | Check permissions |
| 404 | Not Found | Check endpoint |
| 422 | Validation Error | Check payload |
| 429 | Rate Limited | Wait/retry |
| 500 | Server Error | Check logs |
| 503 | Service Down | Check status page |

---

## File Locations

```
Production Setup Guide:    CLERK_PRODUCTION_SETUP.md
Testing Checklist:         AUTH_WORKFLOW_TESTING.md
Verification Report:       PRODUCTION_DEPLOYMENT_VERIFICATION.md
Final Status:              FINAL_STATUS.md
This Quick Ref:            CLERK_QUICK_REFERENCE.md
```

---

## Contact & Escalation

- **Technical Support**: Check logs first
- **Clerk Support**: support@clerk.com
- **On-Call**: Page from Render/Vercel dashboard
- **Emergency**: Contact DevOps team

---

**Last Updated**: May 6, 2026  
**Status**: PRODUCTION READY  
**Version**: 1.0
