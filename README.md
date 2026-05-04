# SentinelNexus Guard

Production-ready AI security & compliance SaaS, built by **Mayank Sharma**  
Website: [mayyanks.app](https://mayyanks.app) · [mayankiitj.in](https://mayankiitj.in) · GitHub: [Mayank-iitj](https://github.com/Mayank-iitj)
- **Backend**: FastAPI + PostgreSQL + Redis (JWT cookies, OAuth, rate-limiting, structured logs, health checks)
- **Frontend**: Next.js (App Router) + NextAuth (server-side cookie validation)
- **Infra**: Docker Compose, CI pipeline, Alembic migrations, pytest suite

## Local dev (Docker)

1. **Set up Google OAuth** (required):
   - Follow the [OAuth Setup Guide](./OAUTH_SETUP.md) to create a new Google OAuth 2.0 client.
   - Copy `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` from Google Cloud Console.

2. **Create environment files**:
   - `backend/.env` (see `backend/.env.example`)
   - `frontend/.env.local` (see `frontend/.env.example`)
   - Fill in `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`

3. **Start the stack**:

```bash
docker compose up --build
```

4. **Verify services**:
   - Backend API: `http://localhost:8000` (health: `/health`)
   - Frontend: `http://localhost:3000`
   - Try login at `/login` to test OAuth flow

## Local dev (without Docker)

### Backend
```powershell
cd backend
$env:DATABASE_URL = 'sqlite:///./dev.db'
$env:REDIS_URL = 'redis://localhost:6379/0'
$env:SECRET_KEY = 'devsecret'
$env:JWT_SECRET_KEY = 'devjwt'
$env:GOOGLE_CLIENT_ID = '<your-client-id>'
$env:GOOGLE_CLIENT_SECRET = '<your-client-secret>'
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

### Frontend (new terminal)
```powershell
cd frontend
npm install  # if needed
npm run dev
```

Visit `http://localhost:3000` in your browser.

## Project structure

- `backend/`: FastAPI API server
- `frontend/`: Next.js web app
- `docker/`: Dockerfiles
- `docker-compose.yml`: local/prod-like composition

# final-sentinelnexus-clerkOauth
