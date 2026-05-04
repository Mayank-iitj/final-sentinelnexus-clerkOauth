# Deployment Checklist

Complete this checklist before deploying to production.

## Pre-Deployment (Local Verification)

- [ ] **Code Quality**
  - [ ] `npm run build` passes in `frontend/`
  - [ ] `npm run lint` passes with no errors
  - [ ] `pytest` passes in `backend/` (or CI passes)
  - [ ] No console errors or warnings

- [ ] **Environment Configuration**
  - [ ] All required env vars are set locally
  - [ ] `python scripts/validate_oauth.py` shows all ✅
  - [ ] Database connection works
  - [ ] Redis connection works (or degraded mode acceptable)

- [ ] **OAuth Configuration**
  - [ ] Google OAuth credentials are valid
  - [ ] Console has localhost URLs registered for testing
  - [ ] OAuth flow works locally (test at http://localhost:3000/login)

- [ ] **Git Status**
  - [ ] All changes committed (`git status` is clean)
  - [ ] Remote is up to date (`git log origin/main`)
  - [ ] No sensitive data in any commits

---

## Backend Deployment (Cloud Run)

### Step 1: Prepare

- [ ] Generate new production secrets:
  ```bash
  python PRODUCTION_ENV_TEMPLATE.md  # or use bash script
  ```

- [ ] Create Google Cloud Secret Manager secrets:
  - [ ] `sentinel-secret-key`
  - [ ] `sentinel-jwt-secret-key`
  - [ ] `sentinel-db-password` (if needed)
  - [ ] `sentinel-redis-token` (if needed)

- [ ] Verify secrets in Cloud Console → Secret Manager

### Step 2: Build and Deploy

- [ ] Set up Cloud SQL Proxy (if using Cloud SQL):
  ```bash
  cloud_sql_proxy -instances=PROJECT:REGION:INSTANCE=tcp:5432 &
  ```

- [ ] Run migrations (if first deploy or schema changes):
  ```bash
  cd backend
  alembic upgrade head
  ```

- [ ] Build and push Docker image:
  ```bash
  cd backend
  gcloud builds submit --config cloudbuild.yaml
  ```

- [ ] Deploy to Cloud Run:
  ```bash
  gcloud run deploy sentinelnexus-api \
    --image gcr.io/PROJECT_ID/sentinelnexus-api:latest \
    --platform managed \
    --region us-central1 \
    --allow-unauthenticated \
    --set-env-vars "ENV=production,DEBUG=false" \
    --set-secrets "DATABASE_URL=sentinel-db-url:latest" \
    --set-secrets "SECRET_KEY=sentinel-secret-key:latest" \
    --set-secrets "JWT_SECRET_KEY=sentinel-jwt-secret-key:latest" \
    --memory 512Mi \
    --cpu 1
  ```

- [ ] Verify deployment:
  ```bash
  curl https://YOUR_CLOUD_RUN_URL/health
  ```
  
  Expected response:
  ```json
  {"status": "healthy", "db": "ok", "redis": "ok"}
  ```

### Step 3: Update Google OAuth Console

- [ ] Add Cloud Run URL to **Authorized redirect URIs**:
  - Example: `https://sentinelnexus-api-xyz.a.run.app/api/v1/auth/callback/google`

- [ ] Add Cloud Run domain to **Authorized JavaScript origins** (if applicable)

---

## Frontend Deployment (Vercel)

### Step 1: Prepare

- [ ] Generate `NEXTAUTH_SECRET`:
  ```bash
  openssl rand -base64 64
  ```

- [ ] Get Cloud Run backend URL from Cloud Console

### Step 2: Configure Vercel

- [ ] Go to Vercel Dashboard → Your Project → Settings → Environment Variables

- [ ] Add for **Production**:
  - [ ] `BACKEND_URL`: `https://YOUR_CLOUD_RUN_URL`
  - [ ] `NEXTAUTH_URL`: `https://sentinelnexus.ai`
  - [ ] `NEXTAUTH_SECRET`: Paste generated secret

- [ ] Trigger rebuild (or push a commit to main)

### Step 3: Update Google OAuth Console

- [ ] Add Vercel domain to **Authorized JavaScript origins**:
  - Examples: `https://sentinelnexus.ai`, `https://www.sentinelnexus.ai`

- [ ] Add Vercel redirect (if different from Cloud Run callback):
  - Not needed if frontend proxies through backend

### Step 4: Verify

- [ ] Visit `https://sentinelnexus.ai`
- [ ] Verify it loads without errors
- [ ] Check browser console (F12) for errors

---

## Post-Deployment Verification

### Backend Health

- [ ] [ ] GET `/health` returns healthy status
- [ ] [ ] Logs are flowing to Cloud Logging
- [ ] [ ] No errors in Cloud Run logs
- [ ] [ ] Database connectivity verified
- [ ] [ ] Redis connectivity verified (or graceful degradation)

### OAuth Flow

- [ ] [ ] Login page loads at `/login`
- [ ] [ ] "Continue with Google" button works
- [ ] [ ] Redirects to Google login
- [ ] [ ] After login, redirects to dashboard
- [ ] [ ] User is created in database
- [ ] [ ] JWT cookies are set

### API Connectivity

- [ ] [ ] Frontend can reach backend APIs
- [ ] [ ] Proxy routes work at `/api/v1/*`
- [ ] [ ] CORS headers are correct
- [ ] [ ] Rate limiting is active

### Security

- [ ] [ ] HTTPS is enforced
- [ ] [ ] Security headers are present:
  ```bash
  curl -I https://sentinelnexus.ai | grep -E "X-Content-Type-Options|X-Frame-Options|Strict-Transport-Security"
  ```

- [ ] [ ] No sensitive data in logs
- [ ] [ ] No debug mode enabled in production

---

## DNS and Domain Setup

- [ ] [ ] Domain registrar points to Vercel nameservers
- [ ] [ ] Vercel shows domain as connected
- [ ] [ ] SSL certificate is issued (Vercel auto-manages)
- [ ] [ ] HTTPS works and redirects from HTTP

---

## Monitoring and Alerts

- [ ] [ ] Set up Cloud Logging alerts for errors
- [ ] [ ] Set up uptime monitoring (e.g., UptimeRobot)
- [ ] [ ] Configure error notifications (e.g., Sentry)
- [ ] [ ] Set up performance monitoring

---

## Backup and Recovery

- [ ] [ ] Database backups are configured
  ```bash
  gcloud sql backups create --instance=YOUR_INSTANCE
  ```

- [ ] [ ] Backup retention is set to 30+ days
- [ ] [ ] Test restore procedure
- [ ] [ ] Document recovery steps

---

## Post-Deployment Tasks

- [ ] [ ] Update status page if applicable
- [ ] [ ] Notify users/stakeholders of deployment
- [ ] [ ] Monitor error rates for 24 hours
- [ ] [ ] Check analytics/metrics are flowing
- [ ] [ ] Document deployment date and version

---

## Rollback Plan

If something goes wrong:

1. **Quick Rollback (Cloud Run)**:
   ```bash
   gcloud run deploy sentinelnexus-api --image gcr.io/PROJECT_ID/sentinelnexus-api:PREVIOUS_TAG
   ```

2. **Quick Rollback (Vercel)**:
   - Go to Deployments
   - Click the previous stable version
   - Click "Promote to Production"

3. **Database Rollback** (if schema changed):
   ```bash
   alembic downgrade -1  # Revert last migration
   ```

---

## Reference Guides

- [deployment_guide.md](./deployment_guide.md) — Full deployment walkthrough
- [CONSOLE_CONFIG.md](./CONSOLE_CONFIG.md) — Google Cloud Console setup
- [OAUTH_SETUP.md](./OAUTH_SETUP.md) — OAuth configuration details
- [PRODUCTION_ENV_TEMPLATE.md](./PRODUCTION_ENV_TEMPLATE.md) — Environment variable template
