# Production Deployment Guide

Complete guide for deploying SentinelNexus to production on Google Cloud Run (backend) and Vercel (frontend).

## Prerequisites

- Google Cloud Project with billing enabled
- `gcloud` CLI installed and configured
- `docker` installed locally
- Vercel account
- Domain configured (sentinelnexus.ai or similar)

---

## Part 1: Backend Deployment (Google Cloud Run)

### 1.1 Set Up Google Cloud Project

```bash
# Set your project ID
export PROJECT_ID="your-gcp-project-id"
gcloud config set project $PROJECT_ID

# Enable required APIs
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable sqladmin.googleapis.com
gcloud services enable compute.googleapis.com

# Create service account for Cloud Run
gcloud iam service-accounts create sentinelnexus-app \
  --display-name="SentinelNexus Application"

# Grant necessary roles
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member=serviceAccount:sentinelnexus-app@$PROJECT_ID.iam.gserviceaccount.com \
  --role=roles/cloudsql.client

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member=serviceAccount:sentinelnexus-app@$PROJECT_ID.iam.gserviceaccount.com \
  --role=roles/secretmanager.secretAccessor
```

### 1.2 Set Up Database

```bash
# Create Cloud SQL instance (Postgres 15)
gcloud sql instances create sentinel-nexus-db \
  --database-version POSTGRES_15 \
  --tier db-g1-small \
  --region us-central1 \
  --backup-start-time 03:00

# Create database
gcloud sql databases create sentinel_nexus \
  --instance sentinel-nexus-db

# Create app user
gcloud sql users create sentinel \
  --instance sentinel-nexus-db \
  --password  # Will prompt for password

# Get connection string
export INSTANCE_CONNECTION_NAME=$(gcloud sql instances describe sentinel-nexus-db --format='value(connectionName)')
echo "Connection: $INSTANCE_CONNECTION_NAME"
```

### 1.3 Set Up Redis (Optional but Recommended)

```bash
# Create Memorystore Redis instance
gcloud redis instances create sentinel-redis \
  --size 1 \
  --region us-central1 \
  --redis-version 7.0

# Get Redis host and port
gcloud redis instances describe sentinel-redis \
  --region us-central1 --format="value(host,port)"
```

### 1.4 Store Secrets in Secret Manager

```bash
# Generate secrets
echo -n "$(openssl rand -base64 64)" | gcloud secrets create sentinel-secret-key --data-file=-
echo -n "$(openssl rand -base64 64)" | gcloud secrets create sentinel-jwt-secret-key --data-file=-

# Store OAuth credentials
echo -n "{{GOOGLE_CLIENT_ID}}" | \
  gcloud secrets create google-client-id --data-file=-

echo -n "{{GOOGLE_CLIENT_SECRET}}" | \
  gcloud secrets create google-client-secret --data-file=-

# Store database URL
echo -n "postgresql://sentinel:PASSWORD@cloudsql-proxy.local:5432/sentinel_nexus" | \
  gcloud secrets create database-url --data-file=-

# Store Redis URL (if using Redis)
echo -n "redis://REDIS_HOST:6379/0" | \
  gcloud secrets create redis-url --data-file=-

# Verify secrets created
gcloud secrets list
```

### 1.5 Build and Deploy to Cloud Run

```bash
# From repository root, build the backend image
cd backend

# Option A: Build locally and push
docker build -t gcr.io/$PROJECT_ID/sentinelnexus-api:latest .
docker push gcr.io/$PROJECT_ID/sentinelnexus-api:latest

# Option B: Build on Cloud Build (recommended)
gcloud builds submit --tag gcr.io/$PROJECT_ID/sentinelnexus-api:latest

# Deploy to Cloud Run
gcloud run deploy sentinelnexus-api \
  --image gcr.io/$PROJECT_ID/sentinelnexus-api:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars "ENV=production,DEBUG=false" \
  --set-secrets "SECRET_KEY=sentinel-secret-key:latest" \
  --set-secrets "JWT_SECRET_KEY=sentinel-jwt-secret-key:latest" \
  --set-secrets "GOOGLE_CLIENT_ID=google-client-id:latest" \
  --set-secrets "GOOGLE_CLIENT_SECRET=google-client-secret:latest" \
  --set-secrets "DATABASE_URL=database-url:latest" \
  --set-secrets "REDIS_URL=redis-url:latest" \
  --memory 512Mi \
  --cpu 1 \
  --timeout 120 \
  --min-instances 0 \
  --max-instances 10 \
  --service-account sentinelnexus-app@$PROJECT_ID.iam.gserviceaccount.com

# Get the service URL
export BACKEND_URL=$(gcloud run services describe sentinelnexus-api --platform managed --region us-central1 --format='value(status.url)')
echo "Backend URL: $BACKEND_URL"
```

### 1.6 Run Migrations

```bash
# Connect to database via Cloud SQL Proxy
cloud_sql_proxy -instances=$INSTANCE_CONNECTION_NAME=tcp:5432 &

# Run Alembic migrations
cd backend
export DATABASE_URL="postgresql://sentinel:PASSWORD@localhost:5432/sentinel_nexus"
alembic upgrade head
```

### 1.7 Verify Backend Deployment

```bash
# Test health endpoint
curl -s $BACKEND_URL/health | jq .

# Expected output:
# {
#   "status": "healthy",
#   "db": "ok",
#   "redis": "ok"
# }

# Test OAuth providers endpoint
curl -s $BACKEND_URL/api/v1/auth/providers | jq .

# Expected output:
# {
#   "google": true
# }
```

---

## Part 2: Frontend Deployment (Vercel)

### 2.1 Connect Vercel Project

```bash
# Install Vercel CLI
npm install -g vercel

# From repository root frontend directory
cd frontend

# Link to Vercel
vercel link

# Select your team and project name: "sentinelnexus"
```

### 2.2 Set Environment Variables in Vercel

```bash
# Via CLI
vercel env add BACKEND_URL $BACKEND_URL
vercel env add NEXTAUTH_URL https://sentinelnexus.ai
vercel env add NEXTAUTH_SECRET $(openssl rand -base64 64)

# Or in Vercel Dashboard:
# 1. Go to your project
# 2. Settings → Environment Variables
# 3. Add for Production:
#    - BACKEND_URL: Your Cloud Run URL
#    - NEXTAUTH_URL: https://sentinelnexus.ai
#    - NEXTAUTH_SECRET: Generated random string
```

### 2.3 Deploy to Vercel

```bash
# Deploy production
vercel --prod

# Or push to main branch to trigger automatic deployment
git push origin main
```

### 2.4 Configure Custom Domain

```bash
# Add domain in Vercel Dashboard:
# 1. Go to Settings → Domains
# 2. Enter domain: sentinelnexus.ai
# 3. Add DNS records (Vercel will provide)
# 4. Wait for DNS propagation (~30 min)

# Verify deployment
curl -I https://sentinelnexus.ai
```

---

## Part 3: OAuth Configuration (Google Cloud Console)

### 3.1 Update Authorized URLs

Go to [Google Cloud Console](https://console.cloud.google.com):

1. **APIs & Services** → **Credentials**
2. Click on your OAuth 2.0 Client ID
3. Add to **Authorized JavaScript Origins**:
   ```
   https://sentinelnexus.ai
   https://www.sentinelnexus.ai
   ```

4. Add to **Authorized Redirect URIs**:
   ```
   https://sentinelnexus-api-HASH.a.run.app/api/v1/auth/callback/google
   ```

Click **Save**

---

## Part 4: Post-Deployment Verification

### 4.1 Test Full OAuth Flow

1. Open `https://sentinelnexus.ai/login`
2. Click "Continue with Google"
3. Sign in with your Google account
4. Verify redirect to dashboard
5. Verify user is created in database

### 4.2 Check Logs

```bash
# Backend logs
gcloud run logs read sentinelnexus-api --limit 50

# Frontend logs (in Vercel Dashboard)
# Settings → Functions → Logs
```

### 4.3 Verify SSL/HTTPS

```bash
# Check SSL certificate
curl -I https://sentinelnexus.ai | grep -i "strict-transport-security"

# Should show SSL headers present
```

### 4.4 Test API Connectivity

```bash
# From frontend origin, test API proxy
curl -I https://sentinelnexus.ai/api/v1/health

# Should return 200 OK
```

---

## Part 5: Monitoring and Maintenance

### 5.1 Set Up Monitoring

```bash
# View Cloud Run metrics
gcloud monitoring metrics-descriptors list --filter="resource.type=cloud_run_revision"

# View logs
gcloud logging read --limit 100 --format=json
```

### 5.2 Set Up Alerts

In Google Cloud Console:

1. Go to **Monitoring** → **Alerting** → **Create Policy**
2. Set up alerts for:
   - High error rate (> 5%)
   - Slow response times (> 1s)
   - Service unavailable (HTTP 503)

### 5.3 Backup Strategy

```bash
# Automated backups (already enabled)
gcloud sql backups list --instance=sentinel-nexus-db

# Manual backup
gcloud sql backups create --instance=sentinel-nexus-db

# Test restore (to verify backups work)
# Document recovery steps
```

---

## Part 6: Scaling and Performance

### 6.1 Cloud Run Auto-Scaling

Already configured in deployment:
- Min instances: 0 (saves costs)
- Max instances: 10 (handles spikes)
- Memory: 512MB
- CPU: 1

### 6.2 Database Optimization

```bash
# Monitor database connections
gcloud sql connect sentinel-nexus-db --user=sentinel
\c sentinel_nexus
SELECT datname, count(*) FROM pg_stat_activity GROUP BY datname;
```

### 6.3 CDN and Caching

Vercel automatically handles:
- Edge caching
- Image optimization
- Static file compression

---

## Troubleshooting

### Backend won't start

```bash
# View logs
gcloud run logs read sentinelnexus-api --limit 100 --format=json | jq '.message'

# Common issues:
# - Secret not found: Verify secrets exist in Secret Manager
# - Database error: Check DATABASE_URL and connections
# - Missing env vars: Verify all required vars are set
```

### OAuth redirect fails

- Verify `BACKEND_BASE_URL` matches registered redirect URI
- Check OAuth Console has exact URL registered
- Verify Google OAuth credentials in secrets

### Frontend can't reach backend

- Verify `BACKEND_URL` env var is set in Vercel
- Check CORS settings in backend
- Verify Cloud Run service is accessible

### Database connection issues

```bash
# Check instance status
gcloud sql instances describe sentinel-nexus-db

# Check connections
gcloud sql ssl-certs list --instance=sentinel-nexus-db

# Create new database user if needed
gcloud sql users create appuser --instance=sentinel-nexus-db --password
```

---

## Rollback Procedure

If deployment has issues:

```bash
# Revert to previous backend image
gcloud run deploy sentinelnexus-api \
  --image gcr.io/$PROJECT_ID/sentinelnexus-api:PREVIOUS_TAG \
  --region us-central1

# Revert frontend in Vercel Dashboard:
# Deployments → Click previous version → Promote to Production

# Rollback database if schema changed:
cd backend
alembic downgrade -1
```

---

## Cost Optimization

- Cloud Run with min=0 instances: ~$0 when not in use
- Database: db-g1-small ~$13/month
- Redis (if used): 1GB ~$10/month
- Domain: ~$10/year
- Total: ~$35/month baseline

---

## Reference

- [deployment_guide.md](./deployment_guide.md)
- [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)
- [PRODUCTION_ENV_TEMPLATE.md](./PRODUCTION_ENV_TEMPLATE.md)
- [CONSOLE_CONFIG.md](./CONSOLE_CONFIG.md)
