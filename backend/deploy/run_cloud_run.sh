#!/usr/bin/env bash
set -euo pipefail

# Simple deploy helper for Google Cloud Run
# Usage: ./run_cloud_run.sh PROJECT_ID [REGION] [SERVICE_NAME]

PROJECT_ID=${1:-}
REGION=${2:-us-central1}
SERVICE_NAME=${3:-sentinelnexus-api}

if [ -z "$PROJECT_ID" ]; then
  echo "Usage: $0 PROJECT_ID [REGION] [SERVICE_NAME]"
  exit 1
fi

echo "Project: $PROJECT_ID"
echo "Region: $REGION"
echo "Service: $SERVICE_NAME"

# Build & deploy using source-to-cloud-run (Cloud Build will use backend/cloudbuild.yaml)
gcloud config set project "$PROJECT_ID"

echo "Submitting build & deploying to Cloud Run..."
gcloud builds submit . --config=cloudbuild.yaml --substitutions=_SERVICE_NAME="$SERVICE_NAME"

echo "Done. Run 'gcloud run services describe $SERVICE_NAME --region $REGION' to view details."
