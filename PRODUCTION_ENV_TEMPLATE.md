# Production Environment Template (Clerk OAuth)

**⚠️ IMPORTANT**: This file contains placeholder secrets. Replace all `{{PLACEHOLDER}}` values before deploying. Never commit actual secrets to git.

---

## Backend (.env for Production / Render)

```bash
# ── Core ──────────────────────────────────────────────────────────────────────
APP_NAME=SentinelNexus Guard
APP_VERSION=1.0.0
ENV=production
DEBUG=false

# ── Database (Production Postgres) ────────────────────────────────────────────
# Format: postgresql://username:password@host:port/database
DATABASE_URL=postgresql://{{DB_USER}}:{{DB_PASSWORD}}@{{DB_HOST}}:5432/{{DB_NAME}}

# ── Redis (Production) ────────────────────────────────────────────────────────
REDIS_URL=redis://:{{REDIS_AUTH_TOKEN}}@{{REDIS_HOST}}:6379/0

# ── Security (GENERATE NEW VALUES) ────────────────────────────────────────────
# Generate with: openssl rand -base64 64
SECRET_KEY={{GENERATE_NEW_SECRET_KEY}}
JWT_SECRET_KEY={{GENERATE_NEW_JWT_SECRET_KEY}}
JWT_ALGORITHM=HS256

# ── CORS / Hosts ──────────────────────────────────────────────────────────────
ALLOWED_ORIGINS=https://sentinelnexus.ai,https://{{VERCEL_DOMAIN}}.vercel.app,http://localhost:3000
ALLOWED_HOSTS=sentinelnexus.ai,{{BACKEND_RENDER_DOMAIN}},localhost

# ── Clerk Auth (BACKEND) ──────────────────────────────────────────────────────
# Find these in Clerk Dashboard -> API Keys
CLERK_SECRET_KEY=sk_live_{{CLERK_SECRET_KEY}}
CLERK_JWKS_URL=https://{{CLERK_FRONTEND_API}}/.well-known/jwks.json
CLERK_ISSUER=https://{{CLERK_FRONTEND_API}}

# Clerk Webhook Secret (Clerk Dashboard -> Webhooks -> Select endpoint)
CLERK_WEBHOOK_SECRET=whsec_{{CLERK_WEBHOOK_SECRET}}

# ── Frontend / Backend URLs ───────────────────────────────────────────────────
FRONTEND_BASE_URL=https://{{FRONTEND_DOMAIN}}
BACKEND_BASE_URL=https://{{BACKEND_DOMAIN}}

# ── Rate Limiting ─────────────────────────────────────────────────────────────
RATE_LIMIT_ENABLED=true
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW_SECONDS=60
```

---

## Frontend (.env.production for Vercel)

```bash
# ── Clerk Auth (FRONTEND) ─────────────────────────────────────────────────────
# Find these in Clerk Dashboard -> API Keys
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_{{CLERK_PUBLISHABLE_KEY}}
CLERK_SECRET_KEY=sk_live_{{CLERK_SECRET_KEY}}

# ── Clerk UI URLs ─────────────────────────────────────────────────────────────
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/signup
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# ── Backend API ───────────────────────────────────────────────────────────────
BACKEND_URL=https://{{BACKEND_RENDER_DOMAIN}}
NEXT_PUBLIC_API_URL=https://{{BACKEND_RENDER_DOMAIN}}/api/v1
```

---

## Verification Checklist

- [ ] **Clerk Keys**: Both frontend and backend keys are populated.
- [ ] **Webhook Secret**: `CLERK_WEBHOOK_SECRET` matches the one in Clerk dashboard.
- [ ] **JWKS URL**: Points to the correct `.well-known/jwks.json` for your instance.
- [ ] **CORS**: `ALLOWED_ORIGINS` includes your Vercel production domain.
- [ ] **Database**: `DATABASE_URL` points to your production PostgreSQL.
- [ ] **Environment**: `ENV` is set to `production`.
- [ ] **Debug**: `DEBUG` is set to `false`.

---

## Deployment Commands

### Backend (Render)
1. Ensure `svix` is in `requirements.txt`.
2. Set the above environment variables in the Render Dashboard.
3. Deploy!

### Frontend (Vercel)
1. Set the above environment variables in Vercel Settings.
2. Build command: `npm run build`
3. Framework: `Next.js`
