# Deploying the backend to Google Cloud Run

Prerequisites
- Install and authenticate `gcloud` CLI: `gcloud init` and `gcloud auth login`.
- Enable APIs: Cloud Run, Cloud Build, Secret Manager, Artifact Registry/Container Registry.

High-level steps
1. Create or select a GCP project and enable required APIs:

```bash
gcloud config set project YOUR_PROJECT_ID
gcloud services enable run.googleapis.com cloudbuild.googleapis.com secretmanager.googleapis.com
```

2. Create secrets (example):

```bash
gcloud secrets create SECRET_KEY --replication-policy="automatic"
echo -n "your-secret-key" | gcloud secrets versions add SECRET_KEY --data-file=-

gcloud secrets create JWT_SECRET_KEY --replication-policy="automatic"
echo -n "your-jwt-secret" | gcloud secrets versions add JWT_SECRET_KEY --data-file=-

gcloud secrets create DATABASE_URL --replication-policy="automatic"
echo -n "postgres://user:pass@host:5432/dbname" | gcloud secrets versions add DATABASE_URL --data-file=-

gcloud secrets create REDIS_URL --replication-policy="automatic"
echo -n "redis://:password@redis-host:6379/0" | gcloud secrets versions add REDIS_URL --data-file=-
```

3. Deploy to Cloud Run (example direct `gcloud run deploy`):

```bash
gcloud run deploy sentinelnexus-api \
  --source backend \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars "ENV=production,DEBUG=false" \
  --set-secrets "SECRET_KEY=SECRET_KEY:latest,JWT_SECRET_KEY=JWT_SECRET_KEY:latest,DATABASE_URL=DATABASE_URL:latest,REDIS_URL=REDIS_URL:latest"
```

4. Or use Cloud Build with the included `cloudbuild.yaml` from the repository root:

```bash
cd backend
gcloud builds submit --config cloudbuild.yaml .
```

Notes & recommendations
- The repository already contains a `Dockerfile` and `cloudbuild.yaml` configured for Cloud Run.
- Ensure `ENV=production` and all required production settings (see `app/core/config.py`) are provided via env vars or secrets.
- Grant the Cloud Build service account access to `Secret Manager` and `Artifact Registry` if using private registries.
- For production, use a managed Cloud SQL / Memorystore instance and connect via private IP or Cloud SQL Auth proxy as appropriate.

Troubleshooting
- If the service fails to start, check `gcloud builds log` and `gcloud run revisions describe` for error details.
- Verify network connectivity to your database/redis and that the secrets are correct.

If you'd like, I can:
- Add a `cloudbuild.yaml` variant that deploys to Artifact Registry instead of Container Registry.
- Add an automated GitHub Action to trigger Cloud Build on push to `main`.
