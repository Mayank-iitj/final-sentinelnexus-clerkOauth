# Deployment Quick Reference

**Quick lookup guide for common deployment tasks.**

---

## Pre-Deployment Checklist

```bash
# ✓ Code ready
npm run build        # frontend/
pytest              # backend/ (if tests exist)

# ✓ Environment
python scripts/validate_oauth.py

# ✓ Git
git status          # Clean
git log --oneline   # Recent commits reviewed
```

---

## Deploy to Production (5 Steps)

### Step 1: Backend (Google Cloud Run)

```bash
gcloud config set project YOUR_PROJECT_ID

# Build and deploy
cd backend
gcloud builds submit --tag gcr.io/$PROJECT_ID/sentinelnexus-api:latest

gcloud run deploy sentinelnexus-api \
  --image gcr.io/$PROJECT_ID/sentinelnexus-api:latest \
  --platform managed --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars "ENV=production,DEBUG=false" \
  --memory 512Mi --cpu 1

# Get URL
gcloud run services describe sentinelnexus-api --format='value(status.url)'
```

### Step 2: Run Database Migrations

```bash
# Use Cloud SQL Proxy
cloud_sql_proxy -instances=INSTANCE_CONNECTION_NAME=tcp:5432 &

cd backend
export DATABASE_URL="postgresql://sentinel:PASSWORD@localhost:5432/sentinel_nexus"
alembic upgrade head
```

### Step 3: Frontend (Vercel)

```bash
cd frontend
vercel --prod

# Or push to main:
git push origin main
```

### Step 4: Update Google OAuth Console

Add to **Authorized Redirect URIs**:
```
https://YOUR_CLOUD_RUN_URL/api/v1/auth/callback/google
```

Add to **Authorized JavaScript Origins**:
```
https://sentinelnexus.ai
https://www.sentinelnexus.ai
```

### Step 5: Verify Deployment

```bash
python validate_deployment.py \
  --backend-url https://YOUR_CLOUD_RUN_URL \
  --frontend-url https://sentinelnexus.ai

# Manual test
# 1. Open https://sentinelnexus.ai/login
# 2. Click "Continue with Google"
# 3. Verify redirect and login
```

---

## Environment Variables Needed

### Backend (Google Cloud Secret Manager)

```
SECRET_KEY                 (generated random)
JWT_SECRET_KEY            (generated random)
GOOGLE_CLIENT_ID          (from Google console)
GOOGLE_CLIENT_SECRET      (from Google console)
DATABASE_URL              (Cloud SQL connection string)
REDIS_URL                 (optional, for Memorystore)
FRONTEND_BASE_URL         (https://sentinelnexus.ai)
BACKEND_BASE_URL          (your Cloud Run URL)
```

### Frontend (Vercel)

```
BACKEND_URL               (your Cloud Run URL)
NEXTAUTH_URL              (https://sentinelnexus.ai)
NEXTAUTH_SECRET           (generated random)
```

**Generate secrets:**
```bash
openssl rand -base64 64
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Backend won't start | Check logs: `gcloud run logs read sentinelnexus-api` |
| OAuth redirect fails | Verify URI in Google Console matches exactly |
| Frontend can't reach backend | Check BACKEND_URL env var in Vercel |
| Database connection error | Verify DATABASE_URL and test with Cloud SQL Proxy |
| CORS errors | Check ALLOWED_ORIGINS in backend config |

---

## Emergency Rollback

```bash
# Backend - redeploy previous image
gcloud run deploy sentinelnexus-api \
  --image gcr.io/$PROJECT_ID/sentinelnexus-api:PREVIOUS_TAG

# Frontend - in Vercel Dashboard
# Deployments → Previous version → Promote to Production

# Database - if schema changed
cd backend && alembic downgrade -1
```

---

## Post-Deployment

```bash
# Monitor logs
gcloud run logs read sentinelnexus-api --follow

# Check metrics
gcloud monitoring dashboards list

# Daily health check
python validate_deployment.py --backend-url=... --frontend-url=...
```

---

## Useful Commands

```bash
# Set default project
gcloud config set project YOUR_PROJECT_ID

# List resources
gcloud run services list
gcloud sql instances list
gcloud secrets list

# View service details
gcloud run services describe sentinelnexus-api

# Update env var
gcloud run services update sentinelnexus-api \
  --set-env-vars KEY=value

# View logs
gcloud run logs read sentinelnexus-api --limit 100

# Connect to database
gcloud sql connect sentinel-nexus-db --user=sentinel

# Create backup
gcloud sql backups create --instance=sentinel-nexus-db

# View Cloud SQL info
gcloud sql instances describe sentinel-nexus-db
```

---

## Important URLs

| Resource | URL |
|----------|-----|
| Google Cloud Console | https://console.cloud.google.com |
| Vercel Dashboard | https://vercel.com/dashboard |
| Google OAuth Console | https://console.cloud.google.com/apis/credentials |
| Production Frontend | https://sentinelnexus.ai |
| Production Backend | https://sentinelnexus-api-*.a.run.app |

---

## Full Guides

- [DEPLOYMENT_SCRIPT.md](./DEPLOYMENT_SCRIPT.md) — Complete step-by-step guide
- [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) — Pre and post-deployment checklist
- [OPERATIONS_RUNBOOK.md](./OPERATIONS_RUNBOOK.md) — Daily operations and incident response
- [PRODUCTION_ENV_TEMPLATE.md](./PRODUCTION_ENV_TEMPLATE.md) — Environment variable templates
