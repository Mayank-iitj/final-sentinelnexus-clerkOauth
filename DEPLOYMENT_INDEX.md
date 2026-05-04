# SentinelNexus Production Deployment Guide

**Complete documentation package for deploying SentinelNexus to production.**

All files in this package are production-ready and have been tested.

---

## 📋 Documentation Index

### Quick Start (Read These First)

1. **[DEPLOYMENT_QUICK_REF.md](./DEPLOYMENT_QUICK_REF.md)** ⚡
   - 5-step deployment summary
   - Common commands reference
   - Emergency rollback procedures
   - **Read this first for a quick overview**

2. **[DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)** ✅
   - Pre-deployment verification
   - Step-by-step checklist for both backend and frontend
   - Post-deployment health checks
   - **Use this during deployment to ensure nothing is missed**

### Detailed Guides

3. **[DEPLOYMENT_SCRIPT.md](./DEPLOYMENT_SCRIPT.md)** 📖
   - Complete step-by-step deployment walkthrough
   - Google Cloud Run setup
   - Vercel deployment
   - OAuth configuration
   - Troubleshooting guide
   - **Reference this for detailed explanations**

4. **[OPERATIONS_RUNBOOK.md](./OPERATIONS_RUNBOOK.md)** 🔧
   - Daily operations procedures
   - Monitoring and alerting setup
   - Backup and recovery procedures
   - Incident response playbook
   - Maintenance windows
   - **Keep this handy for operational tasks**

### Configuration

5. **[PRODUCTION_ENV_TEMPLATE.md](./PRODUCTION_ENV_TEMPLATE.md)** 🔐
   - Backend environment variable template
   - Frontend environment variable template
   - Secret generation scripts
   - Google Cloud Secret Manager integration
   - **Use this as a template for your production .env files**

### Validation

6. **validate_deployment.py** 🧪
   - Automated health check script
   - Verifies backend connectivity
   - Checks SSL/HTTPS setup
   - Validates CORS configuration
   - **Run after deployment to verify everything works**

   ```bash
   python validate_deployment.py \
     --backend-url https://your-backend.cloud.run.app \
     --frontend-url https://your-domain.com
   ```

---

## 🚀 Quick Deployment (5 Minutes)

### Prerequisites

```bash
# Install tools
gcloud config set project YOUR_PROJECT_ID
cd YOUR_REPO_ROOT
```

### Deploy Backend (Cloud Run)

```bash
cd backend
gcloud builds submit --tag gcr.io/$PROJECT_ID/sentinelnexus-api:latest

gcloud run deploy sentinelnexus-api \
  --image gcr.io/$PROJECT_ID/sentinelnexus-api:latest \
  --platform managed --region us-central1 \
  --allow-unauthenticated --memory 512Mi --cpu 1
```

### Deploy Frontend (Vercel)

```bash
cd frontend
vercel --prod  # or: git push origin main
```

### Verify

```bash
python validate_deployment.py \
  --backend-url $(gcloud run services describe sentinelnexus-api \
    --platform managed --region us-central1 --format='value(status.url)') \
  --frontend-url https://sentinelnexus.ai
```

---

## 📁 Directory Structure

```
.
├── DEPLOYMENT_QUICK_REF.md          # Start here
├── DEPLOYMENT_CHECKLIST.md          # Use during deployment
├── DEPLOYMENT_SCRIPT.md             # Detailed steps
├── OPERATIONS_RUNBOOK.md            # Daily operations
├── PRODUCTION_ENV_TEMPLATE.md       # Env variables
├── validate_deployment.py           # Health checker
├── backend/
│   ├── cloudbuild.yaml             # Cloud Run build config
│   ├── requirements.txt            # Python dependencies
│   └── app/
│       ├── main.py                 # FastAPI app
│       ├── core/config.py          # Settings & validation
│       └── ...
├── frontend/
│   ├── package.json                # Dependencies
│   └── src/
│       └── ...
├── docker/
│   ├── Dockerfile.backend          # Backend Docker image
│   └── Dockerfile.frontend         # Frontend Docker image
└── docker-compose.yml              # Local development setup
```

---

## ✅ What's Included

### Documentation (5 guides)
- ✅ Quick reference
- ✅ Step-by-step checklist
- ✅ Detailed deployment guide
- ✅ Operations runbook
- ✅ Environment configuration templates

### Code & Infrastructure
- ✅ Production-grade backend (FastAPI, SQLAlchemy, Pydantic)
- ✅ Production-grade frontend (Next.js 14, TypeScript)
- ✅ OAuth 2.0 implementation (Google)
- ✅ Docker configurations (multi-stage builds)
- ✅ Cloud Run deployment configuration
- ✅ Database migrations (Alembic)

### Tooling
- ✅ Automated deployment validator
- ✅ Linting configuration (ESLint)
- ✅ Build scripts (npm, gcloud)
- ✅ Test setup (pytest)

### Security
- ✅ JWT authentication (HTTPOnly cookies)
- ✅ CORS configuration
- ✅ Environment variable validation
- ✅ Secret management (Google Cloud Secret Manager)
- ✅ Rate limiting (Redis)

---

## 🎯 Deployment Flow

### Before Deployment

1. Read: [DEPLOYMENT_QUICK_REF.md](./DEPLOYMENT_QUICK_REF.md)
2. Review: [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) — Pre-Deployment section
3. Prepare: [PRODUCTION_ENV_TEMPLATE.md](./PRODUCTION_ENV_TEMPLATE.md) — Generate secrets
4. Verify: Run `python scripts/validate_oauth.py` locally

### During Deployment

1. Follow: [DEPLOYMENT_SCRIPT.md](./DEPLOYMENT_SCRIPT.md) for step-by-step instructions
2. Check: [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) at each phase
3. Deploy Backend (Cloud Run) → Run migrations → Deploy Frontend (Vercel)

### After Deployment

1. Run: `python validate_deployment.py` for automated checks
2. Check: [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) — Post-Deployment section
3. Monitor: [OPERATIONS_RUNBOOK.md](./OPERATIONS_RUNBOOK.md) — First 24 hours

---

## 📊 Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                   Production Setup                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Users → Vercel (Frontend)  ←→  Cloud Run (Backend)    │
│    |        Next.js                 FastAPI            │
│    |      (React 18)              (Python 3.11)        │
│    |                                                    │
│    └─ NextAuth ← Cookies → JWT Auth                    │
│                                                         │
│         Backend Dependencies:                           │
│         • Cloud SQL (PostgreSQL 15)                    │
│         • Memorystore Redis (optional)                 │
│         • Google Cloud Secret Manager                  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🔑 Key Features

✅ **Transactional OAuth Sync** - Atomic user creation with row-level locking
✅ **API Proxy** - Frontend proxy routes to backend via `/api/v1/*`
✅ **JWT Authentication** - Secure HTTPOnly cookies
✅ **Rate Limiting** - 100 requests/60 seconds via Redis
✅ **Database Migrations** - Alembic versioning with 3 migration files
✅ **Production Validation** - Settings checked at startup
✅ **Health Checks** - Database and Redis connectivity monitoring
✅ **Docker Multi-Stage** - Optimized images for faster deploys
✅ **Auto-Scaling** - Cloud Run scales 0-10 instances
✅ **Automated Backups** - Daily database backups

---

## ⚙️ System Requirements

### Backend
- Python 3.11+
- PostgreSQL 15+
- Redis 7+ (optional, degrades gracefully)

### Frontend
- Node.js 24+
- npm 10+

### Infrastructure
- Google Cloud Project with billing
- Vercel account
- Domain name

---

## 🔐 Security Considerations

- ✅ All secrets in Google Cloud Secret Manager (not in code)
- ✅ JWT tokens in HTTPOnly, Secure cookies
- ✅ CORS properly configured for your domain
- ✅ HTTPS enforced (Vercel auto-manages SSL)
- ✅ Rate limiting enabled
- ✅ Database passwords not committed
- ✅ OAuth credentials validated

---

## 💰 Cost Estimate

| Service | Cost | Notes |
|---------|------|-------|
| Cloud Run | ~$0.40/day | Only when handling requests |
| Cloud SQL | ~$13/month | db-g1-small tier |
| Redis | ~$10/month | Optional, 1GB |
| Domain | ~$10/year | External registrar |
| Vercel | $0 | Free tier for most use cases |
| **Total** | **~$35-40/month** | Scales with usage |

---

## 📞 Support

- **Google Cloud**: https://support.google.com
- **Vercel**: https://vercel.com/support
- **OAuth Issues**: [CONSOLE_CONFIG.md](./CONSOLE_CONFIG.md)
- **Code Issues**: Check repository issues/PRs

---

## 🔄 Next Steps

1. ✅ Verify all code is production-ready (done)
2. ✅ Read quick reference (start here)
3. Generate production secrets (Step 1)
4. Set up Google Cloud resources (Step 2)
5. Deploy backend to Cloud Run (Step 3)
6. Deploy frontend to Vercel (Step 4)
7. Run automated validator (Step 5)
8. Test full OAuth flow (Step 6)
9. Set up monitoring (Step 7)
10. Begin operations (Step 8)

---

## 📝 Related Documentation

- `OAUTH_SETUP.md` - Google OAuth configuration details
- `CONSOLE_CONFIG.md` - Google Cloud Console setup
- `QUICKSTART.md` - Quick start for local development
- `deployment_guide.md` - High-level deployment overview

---

## ✨ Status

- **Backend Code**: ✅ Production-ready
- **Frontend Code**: ✅ Production-ready
- **Docker Images**: ✅ Optimized
- **Documentation**: ✅ Complete
- **Tests**: ✅ Passing (CI/CD validated)
- **Security**: ✅ Validated
- **Ready to Deploy**: ✅ Yes

---

## 🎉 You're Ready!

Your application is fully prepared for production deployment. 

**Start here**: [DEPLOYMENT_QUICK_REF.md](./DEPLOYMENT_QUICK_REF.md)

Good luck! 🚀
