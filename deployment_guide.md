# Deployment Guide: SentinelNexus

This guide outlines the steps to deploy the SentinelNexus full-stack platform.

## 1. Backend (FastAPI on Google Cloud Run)

### Prerequisites
- Google Cloud Project with Billing enabled.
- Google Cloud CLI installed.

### Steps
1. **Configure Google OAuth**:
   Follow the [OAuth Setup Guide](./OAUTH_SETUP.md) to create a new Google OAuth 2.0 client.
   You'll need:
   - `GOOGLE_CLIENT_ID`: From Google Cloud Console
   - `GOOGLE_CLIENT_SECRET`: From Google Cloud Console
   - Register your backend callback URL: `https://[BACKEND_DOMAIN]/api/v1/auth/callback/google`

2. **Prepare Environment**:
   Copy `.env.example` to a secure location (or set these in Google Cloud Secret Manager):
   - `DATABASE_URL`: Production Postgres URL (e.g., Cloud SQL).
   - `REDIS_URL`: Production Redis URL (e.g., Memorystore).
   - `SECRET_KEY`: Long random string (generate with `openssl rand -base64 64`).
   - `JWT_SECRET_KEY`: Long random string (generate with `openssl rand -base64 64`).
   - `GOOGLE_CLIENT_ID`: From OAuth setup (Step 3).
   - `GOOGLE_CLIENT_SECRET`: From OAuth setup (Step 3).
   - `FRONTEND_BASE_URL`: Your production frontend URL.
   - `BACKEND_BASE_URL`: Your production backend URL.

2. **Build and Push**:
   ```bash
   cd backend
   gcloud builds submit --config cloudbuild.yaml
   ```

3. **Deploy to Cloud Run**:
   Ensure you set the environment variables during deployment.
   ```bash
   gcloud run deploy sentinelnexus-api \
     --image gcr.io/[PROJECT_ID]/sentinelnexus-api \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated
   ```

## 2. Frontend (Next.js on Vercel)

### Steps
1. **Connect Repository**:
   Import the `frontend` folder into a new Vercel project.

2. **Configure Environment Variables**:
   In Vercel Project Settings, add:
   - `NEXTAUTH_URL`: Your production frontend URL (e.g., `https://sentinelnexus.ai`).
   - `NEXTAUTH_SECRET`: A long random string.
   - `BACKEND_URL`: The URL of your Cloud Run service (e.g., `https://sentinelnexus-api-xyz.a.run.app`).
   - `NEXT_PUBLIC_API_URL`: Optional. Use the absolute backend API URL if you want to bypass the in-app proxy, otherwise the frontend will use `/api/v1` locally and in production.

3. **Deploy**:
   Vercel will automatically build and deploy the app. The frontend now includes an internal `/api/v1/*` proxy route, so Google login and API calls do not depend on a hosting rewrite.

## 3. Post-Deployment
- Update **Google OAuth Authorized Redirect URIs**:
  - `https://[FRONTEND_DOMAIN]/api/v1/auth/callback/google`
  - `https://[BACKEND_DOMAIN]/api/v1/auth/callback/google`
- Ensure CORS settings in the backend (`ALLOWED_ORIGINS`) include your production frontend domain.
