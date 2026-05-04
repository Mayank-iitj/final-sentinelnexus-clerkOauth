# Quick Start Guide

Get SentinelNexus running locally in 2 minutes.

## Prerequisites

- Python 3.11+
- Node.js 20+
- Git

## Option 1: Without Docker (Recommended for Development)

### Terminal 1: Start Backend

```powershell
cd backend
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Backend will start at **http://127.0.0.1:8000**

### Terminal 2: Start Frontend

```powershell
cd frontend
npm install  # only needed on first run
npm run dev
```

Frontend will start at **http://localhost:3000**

### Test OAuth Flow

1. Open **http://localhost:3000/login**
2. Click **"Continue with Google"**
3. Sign in with your Google account
4. You should be redirected to the dashboard

## Option 2: With Docker Compose

```bash
docker compose up --build
```

Then open **http://localhost:3000**

## Environment Configuration

Both `.env` files are already configured:

- **backend/.env**: SQLite + local OAuth credentials
- **frontend/.env.local**: Points to local backend at http://localhost:8000

### OAuth Credentials (Already Set Up)

```
Client ID:     {{GOOGLE_CLIENT_ID}}
Client Secret: {{GOOGLE_CLIENT_SECRET}}
Redirect URI:  http://localhost:8000/api/v1/auth/callback/google
```

## Verify Setup

```powershell
cd backend
python scripts/validate_oauth.py
```

Should show all ✅ checkmarks.

## Troubleshooting

### "Google OAuth not configured"
- Ensure `backend/.env` has `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
- Restart the backend server

### "redirect_uri_mismatch"
- Check that OAuth callback URL is registered in Google Cloud Console
- For local: `http://localhost:8000/api/v1/auth/callback/google`

### Frontend can't reach backend
- Ensure backend is running on `http://127.0.0.1:8000`
- Check that `BACKEND_URL=http://localhost:8000` in `frontend/.env.local`

### Redis not available
- If Redis isn't running locally, the backend will work in degraded mode (refresh tokens disabled)
- To fix: Start Redis with `redis-server` or install via Docker: `docker run -d -p 6379:6379 redis:7-alpine`

## Next Steps

- For production deployment, see [deployment_guide.md](./deployment_guide.md)
- For OAuth setup details, see [OAUTH_SETUP.md](./OAUTH_SETUP.md)
- API documentation available at http://localhost:8000/docs (Swagger)
