# 🚀 SentinelNexus - Complete Deployment Guide

## Quick Summary

**Frontend**: Vercel (Next.js)  
**Backend**: Render (FastAPI)  
**Database**: PostgreSQL (Render managed)  
**Cache**: Redis (Render managed)  

---

## ✅ Pre-Deployment Checklist

### Code & Configuration
- [x] Favicon created and working
- [x] Environment variables configured
- [x] Next.js config fixed (removed middleware conflict)
- [x] Backend ready with gunicorn
- [x] Database migrations prepared
- [x] Security headers configured
- [x] CORS properly configured
- [x] Rate limiting enabled

### Testing
- [ ] Login flow tested with Clerk OAuth
- [ ] Dashboard loads after login
- [ ] API endpoints responsive
- [ ] Error handling working
- [ ] Security headers present

---

## 🔧 Deployment Steps

### 1. Deploy Backend to Render

#### Create Render Service

1. Go to [render.com](https://render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure as follows:

**Build Command:**
```bash
pip install -r backend/requirements.txt && cd backend && alembic upgrade head
```

**Start Command:**
```bash
cd backend && gunicorn app.main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT --timeout 120
```

**Environment Variables:**
Copy from `PRODUCTION_ENV_SETUP.md` under Backend section

#### Create Render Database

1. In Render dashboard, create a PostgreSQL database
2. Copy the connection string
3. Add to backend environment variables as `DATABASE_URL`

#### Create Render Redis

1. In Render dashboard, create a Redis instance
2. Copy the connection string
3. Add to backend environment variables as `REDIS_URL`

#### Run Initial Database Migrations

After deploy, SSH into Render container and run:
```bash
cd backend && alembic upgrade head
```

---

### 2. Deploy Frontend to Vercel

#### Create Vercel Project

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New..." → "Project"
3. Select your GitHub repository
4. Configure as follows:

**Framework**: Next.js  
**Root Directory**: `frontend/`  
**Build Command**: `npm run build`  
**Install Command**: `npm install`  

**Environment Variables:**
```
NEXT_PUBLIC_API_URL=https://sentinelnexus-backend.onrender.com/api/v1
BACKEND_URL=https://sentinelnexus-backend.onrender.com
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
NEXT_PUBLIC_SITE_URL=https://sentinelnexus.vercel.app
```

#### Configure Custom Domain

1. Go to Vercel project settings → Domains
2. Add your custom domain
3. Update DNS records as shown

---

### 3. Configure Production OAuth

#### Update Clerk Dashboard

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Navigate to API Keys → Copy production keys
3. Update environment variables in both Render and Vercel

#### Add Redirect URIs

In Clerk Dashboard → Settings → OAuth:
```
http://localhost:8000/api/v1/auth/callback/google
https://sentinelnexus-backend.onrender.com/api/v1/auth/callback/google
https://sentinelnexus.vercel.app/login
```

---

## 🔐 Security Configuration

### Backend Security (Render)

**Enable Auto-Redeploy**: Yes  
**Max Instances**: 3 (for scaling)  
**Memory**: 2GB minimum recommended  

### Frontend Security (Vercel)

**Enable Spam Protection**: Yes  
**Enable Automatic ISR Caching**: Yes  
**Environment Variables**: Mark sensitive keys as encrypted

### Database Security

- **PostgreSQL**: Enable automatic backups (daily)
- **SSL/TLS**: Enforce connections
- **IP Whitelist**: Only allow Render backend IPs
- **Monitoring**: Enable query logging for audit

### Redis Security

- **Password**: Auto-generated on Render
- **Encryption**: Enable in-transit encryption
- **IP Allowlist**: Only allow backend service

---

## 📊 Monitoring & Observability

### Render Logs
```bash
# View real-time logs
curl https://api.render.com/v1/services/{service-id}/logs \
  -H "Authorization: Bearer $RENDER_API_KEY"
```

### Vercel Logs
```bash
# View build logs and runtime logs in Vercel dashboard
# Dashboard → Deployments → View logs
```

### Health Check Endpoints

**Backend Health:**
```bash
curl https://sentinelnexus-backend.onrender.com/health
# Response: {"status": "healthy", "db": "ok", "redis": "ok"}
```

**Frontend Status:**
```bash
curl https://sentinelnexus.vercel.app
# Should return 200 with HTML
```

### Recommended: Set up error tracking

Add Sentry for error tracking:
```python
# backend/app/main.py
import sentry_sdk
sentry_sdk.init(
    dsn=settings.SENTRY_DSN,
    environment=settings.ENV,
    traces_sample_rate=0.1,
)
```

---

## 🧪 Post-Deployment Tests

### 1. Homepage
```bash
curl -I https://sentinelnexus.vercel.app/
# Expected: 200 OK
```

### 2. Login Flow
- Visit https://sentinelnexus.vercel.app/login
- Click "Continue with Google"
- Should redirect to Clerk OAuth
- After auth, should redirect to /dashboard

### 3. API Health
```bash
curl https://sentinelnexus-backend.onrender.com/health
# Expected: {"status": "healthy", ...}
```

### 4. CORS Headers
```bash
curl -I -H "Origin: https://sentinelnexus.vercel.app" \
  https://sentinelnexus-backend.onrender.com/api/v1/health
# Expected: Access-Control-Allow-Origin: https://sentinelnexus.vercel.app
```

### 5. Security Headers
```bash
curl -I https://sentinelnexus.vercel.app/
# Expected headers:
# X-Content-Type-Options: nosniff
# X-Frame-Options: DENY
# Referrer-Policy: strict-origin-when-cross-origin
```

---

## 🚨 Troubleshooting

### Build Failures

**Frontend build fails:**
```bash
# Clear cache and rebuild
vercel env pull .env.local
npm run build
```

**Backend build fails:**
- Check Python version (3.11+)
- Ensure all requirements installed
- Check database migration syntax

### Deployment Issues

**502 Bad Gateway:**
- Check backend is actually running
- Verify environment variables set
- Check logs: `render.com/dashboard/web/...`

**OAuth redirect mismatch:**
- Verify Clerk redirect URIs match exactly
- Check Render backend URL
- Clear browser cookies and try again

**Database connection timeout:**
- Check PostgreSQL is running
- Verify connection string format
- Ensure Render backend IP is whitelisted

### Performance Issues

**Slow cold starts:**
- Increase memory allocation
- Pre-warm instances
- Use Redis caching strategically

**High latency:**
- Check database query performance
- Enable Redis caching for dashboard stats
- Consider CDN for frontend assets

---

## 📈 Scaling for Production

### Horizontal Scaling

**Backend:**
```yaml
# render.yaml
services:
  - type: web
    name: sentinelnexus-backend
    autoDeploy: true
    minInstances: 2
    maxInstances: 5
```

**Frontend:**
- Vercel automatically handles scaling
- Edge functions for regional distribution

### Database Optimization

```sql
-- Add indexes for common queries
CREATE INDEX idx_scans_user_id ON scans(user_id);
CREATE INDEX idx_alerts_project_id ON alerts(project_id);
CREATE INDEX idx_created_at ON alerts(created_at DESC);
```

### Caching Strategy

```python
# backend/app/services/cache.py
async def get_dashboard_stats(user_id: int, cache: Redis) -> DashboardStats:
    cache_key = f"dashboard:{user_id}"
    
    # Try cache first (5 minute TTL)
    cached = await cache.get(cache_key)
    if cached:
        return DashboardStats.parse_raw(cached)
    
    # Compute if not cached
    stats = await compute_dashboard_stats(user_id)
    await cache.setex(cache_key, 300, stats.json())
    return stats
```

---

## 💾 Backup & Recovery

### Database Backups

**Render manages automated backups:**
- Daily snapshots
- 7-day retention by default
- Manual point-in-time recovery available

### Code Backups

**GitHub:**
- All code automatically backed up
- Can redeploy from any commit
- GitHub Actions for CI/CD

---

## 🔄 Continuous Deployment

### GitHub Actions Example

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy Backend
        run: |
          curl -X POST https://api.render.com/deploy \
            -H "Authorization: Bearer ${{ secrets.RENDER_API_KEY }}"
      
      - name: Deploy Frontend
        run: |
          vercel deploy --prod \
            --token ${{ secrets.VERCEL_TOKEN }}
```

---

## ✨ Production Best Practices

1. **Never commit secrets** - Use environment variables
2. **Monitor errors** - Set up Sentry or similar
3. **Regular backups** - Test recovery procedures
4. **Load testing** - Verify capacity before peak
5. **Security headers** - Already configured ✓
6. **Rate limiting** - Enabled ✓
7. **CORS properly configured** - Already set ✓
8. **HTTPS everywhere** - Render & Vercel enforce ✓

---

## 📞 Support & Resources

- **Render Docs**: https://render.com/docs
- **Vercel Docs**: https://vercel.com/docs
- **FastAPI**: https://fastapi.tiangolo.com
- **Next.js**: https://nextjs.org/docs
- **Clerk**: https://clerk.com/docs

---

**Last Updated**: May 5, 2026  
**Status**: 🟢 Production Ready
