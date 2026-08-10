#!/bin/sh
# Production entrypoint: run alembic migrations before starting the server.
set -e

echo "==> Running Alembic migrations..."
alembic upgrade head
echo "==> Migrations complete. Starting Gunicorn..."

exec gunicorn app.main:app \
  --bind "0.0.0.0:" \
  --workers 2 \
  --worker-class uvicorn.workers.UvicornWorker \
  --timeout 120 \
  --graceful-timeout 30 \
  --access-logfile - \
  --error-logfile -