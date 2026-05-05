# Production Environment Setup

## Backend (.env for Render)

```env
# ── Application ──────────────────────────────────────────────────────────────
APP_NAME=SentinelNexus Guard
APP_VERSION=1.0.0
ENV=production
DEBUG=false

# ── Database ──────────────────────────────────────────────────────────────────
# On Render, this will be auto-filled
DATABASE_URL=postgresql://user:password@host:5432/db

# ── Redis ─────────────────────────────────────────────────────────────────────
# On Render, managed Redis connection
REDIS_URL=redis://host:6379/0

# ── Security ──────────────────────────────────────────────────────────────────
# Generate with: python -c "import secrets; print(secrets.token_urlsafe(32))"
SECRET_KEY=generate-a-secure-random-string
JWT_SECRET_KEY=generate-a-secure-random-string
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=7

# ── CORS / Hosts ──────────────────────────────────────────────────────────────
ALLOWED_ORIGINS=["https://sentinelnexus.vercel.app", "https://www.sentinelnexus.vercel.app", "https://sentinelnexus.mayyanks.app"]
ALLOWED_HOSTS=[".onrender.com", ".vercel.app", "sentinelnexus.mayyanks.app", "www.sentinelnexus.mayyanks.app"]
FRONTEND_BASE_URL=https://sentinelnexus.vercel.app
BACKEND_BASE_URL=https://sentinelnexus-backend.onrender.com

# ── Clerk Auth ──────────────────────────────────────────────────────────────
# Get from Clerk Dashboard
CLERK_SECRET_KEY=sk_live_...
CLERK_JWKS_URL=https://clerk.your-domain.com/.well-known/jwks.json
CLERK_ISSUER=https://clerk.your-domain.com

# ── Rate Limiting ─────────────────────────────────────────────────────────────
RATE_LIMIT_ENABLED=true
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW_SECONDS=60
```

## Frontend (.env.local for Vercel)

```env
# API Configuration
NEXT_PUBLIC_API_URL=https://sentinelnexus-backend.onrender.com/api/v1
BACKEND_URL=https://sentinelnexus-backend.onrender.com

# Clerk (Production Keys)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...

# Site Configuration
NEXT_PUBLIC_SITE_URL=https://sentinelnexus.vercel.app
```

## Deployment Checklist

### Before Deploying to Render (Backend):
- [ ] Set `DEBUG=false` in .env
- [ ] Generate secure `SECRET_KEY` and `JWT_SECRET_KEY`
- [ ] Configure PostgreSQL connection string
- [ ] Configure Redis URL
- [ ] Set production Clerk credentials
- [ ] Update `ALLOWED_ORIGINS` and `ALLOWED_HOSTS`
- [ ] Run database migrations on Render

### Before Deploying to Vercel (Frontend):
- [ ] Set production Clerk keys
- [ ] Update backend URL to Render endpoint
- [ ] Set `NEXT_PUBLIC_SITE_URL` to final domain
- [ ] Run `npm run build` locally to verify
- [ ] Configure custom domain in Vercel

### Post-Deployment:
- [ ] Test OAuth flow end-to-end
- [ ] Verify dashboard loads after login
- [ ] Check API health: `GET /health`
- [ ] Monitor Render and Vercel logs
- [ ] Set up error tracking (Sentry, etc.)
- [ ] Enable HSTS headers
