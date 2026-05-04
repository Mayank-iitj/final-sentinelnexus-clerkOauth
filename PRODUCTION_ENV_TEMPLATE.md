# Production Environment Template

**⚠️ IMPORTANT**: This file contains placeholder secrets. Replace all `{{PLACEHOLDER}}` values before deploying.

Never commit actual secrets to git. Use Google Cloud Secret Manager or Vercel environment variables.

---

## Backend (.env for Production)

```bash
# ── Core ──────────────────────────────────────────────────────────────────────
APP_NAME=SentinelNexus Guard
APP_VERSION=1.0.0
ENV=production
DEBUG=false

# ── Database (Production Postgres) ────────────────────────────────────────────
# Format: postgresql://username:password@host:port/database
# For Google Cloud SQL:
#   postgresql://sentinel:PASSWORD@cloudsql-proxy.local:5432/sentinel_nexus
DATABASE_URL=postgresql://{{DB_USER}}:{{DB_PASSWORD}}@{{DB_HOST}}:5432/{{DB_NAME}}

# ── Redis (Production Memorystore) ────────────────────────────────────────────
# For Google Cloud Memorystore:
#   redis://sentinel:AUTH_STRING@redis-host:6379/0
REDIS_URL=redis://:{{REDIS_AUTH_TOKEN}}@{{REDIS_HOST}}:6379/0

# ── Security (GENERATE NEW VALUES) ────────────────────────────────────────────
# Generate with: openssl rand -base64 64
SECRET_KEY={{GENERATE_NEW_SECRET_KEY}}
JWT_SECRET_KEY={{GENERATE_NEW_JWT_SECRET_KEY}}
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=7

# ── CORS / Hosts ──────────────────────────────────────────────────────────────
ALLOWED_ORIGINS=https://sentinelnexus.ai,https://www.sentinelnexus.ai,https://{{VERCEL_DOMAIN}}.vercel.app
ALLOWED_HOSTS=sentinelnexus.ai,www.sentinelnexus.ai,{{BACKEND_CLOUD_RUN_DOMAIN}}

# ── Google OAuth ──────────────────────────────────────────────────────────────
GOOGLE_CLIENT_ID={{GOOGLE_CLIENT_ID}}
GOOGLE_CLIENT_SECRET={{GOOGLE_CLIENT_SECRET}}

# ── Frontend / Backend URLs (PRODUCTION) ──────────────────────────────────────
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
# NextAuth Configuration
NEXTAUTH_URL=https://{{VERCEL_DOMAIN}}.vercel.app
NEXTAUTH_SECRET={{GENERATE_NEW_NEXTAUTH_SECRET}}

# Backend URL
BACKEND_URL=https://{{BACKEND_CLOUD_RUN_DOMAIN}}
NEXT_PUBLIC_API_URL=https://{{BACKEND_CLOUD_RUN_DOMAIN}}/api/v1
```

---

## Generating Secrets

### Python Script

```python
import secrets
import base64

# Generate for backend
print("Backend Secrets:")
print(f"SECRET_KEY: {base64.b64encode(secrets.token_bytes(64)).decode()}")
print(f"JWT_SECRET_KEY: {base64.b64encode(secrets.token_bytes(64)).decode()}")

# Generate for frontend
print("\nFrontend Secrets:")
print(f"NEXTAUTH_SECRET: {secrets.token_urlsafe(64)}")
```

### Bash Script

```bash
# Backend secrets
echo "Backend Secrets:"
echo "SECRET_KEY: $(openssl rand -base64 64)"
echo "JWT_SECRET_KEY: $(openssl rand -base64 64)"

# Frontend secret
echo -e "\nFrontend Secrets:"
echo "NEXTAUTH_SECRET: $(openssl rand -base64 64)"
```

---

## Google Cloud Secret Manager

Store these in Google Cloud Secret Manager instead of environment variables:

1. Go to **Secret Manager** in Google Cloud Console
2. Click **Create Secret**
3. For each secret:
   - Name: `sentinel-{{SECRET_NAME}}`
   - Value: paste the secret
   - Replication: Automatic

Then reference in Cloud Run:

```yaml
env:
  - name: SECRET_KEY
    valueFrom:
      secretKeyRef:
        name: sentinel-secret-key
        key: latest
```

---

## Vercel Environment Variables

In Vercel Project Settings → Environment Variables:

1. Add for all environments (Production, Preview, Development):
   - `BACKEND_URL`: Your Cloud Run backend URL
   - `NEXTAUTH_SECRET`: Production secret
   - `NEXTAUTH_URL`: Your production domain

2. For each environment:
   - Production: `https://sentinelnexus.ai`
   - Preview: `https://{{PR_BRANCH}}.vercel.app`

---

## Verification Checklist

- [ ] All `{{PLACEHOLDER}}` values replaced with actual values
- [ ] Database URL tested and accessible
- [ ] Redis connection tested
- [ ] Secrets are 64+ characters (randomly generated)
- [ ] Frontend/Backend URLs match registered OAuth origins
- [ ] CORS origins include your production domain
- [ ] Rate limiting is enabled
- [ ] DEBUG is set to `false`
- [ ] Google OAuth credentials are production-ready

---

## Storage Options

**Never commit `.env` files. Use:**

1. **Google Cloud Secret Manager** (recommended for Cloud Run)
   - More secure
   - Audit logging
   - Automatic rotation

2. **Vercel Environment Variables** (for frontend)
   - Built-in to Vercel
   - Easy to manage per-environment

3. **GitHub Secrets** (for CI/CD only)
   - Use in workflows, not runtime
