# 🛡️ SentinelNexus Guard - Enterprise AI Security Platform

**Production-ready AI security & compliance SaaS**

Website: [mayyanks.app](https://mayyanks.app) · [mayankiitj.in](https://mayankiitj.in) · GitHub: [Mayank-iitj](https://github.com/Mayank-iitj)

---

## ✨ What is SentinelNexus?

SentinelNexus is an **enterprise-grade AI security platform** that protects modern LLM workflows from:
- 🎯 **Prompt Injection Attacks**
- 🔐 **PII Data Leakage**
- ⚠️ **Compliance Violations**
- 🚨 **AI Security Threats**

Real-time monitoring, risk intelligence, and compliance reporting for production AI systems.

---

## 🚀 Quick Start

### Option 1: Run Locally with Docker (Recommended)

1. **Set up Google OAuth**:
   - Follow [OAuth Setup Guide](./OAUTH_SETUP.md)
   - Get `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`

2. **Create environment files**:
   ```bash
   # backend/.env
   DATABASE_URL=sqlite:///./dev.db
   REDIS_URL=redis://localhost:6379/0
   SECRET_KEY=dev-secret-key
   JWT_SECRET_KEY=dev-jwt-key
   GOOGLE_CLIENT_ID=your-client-id
   GOOGLE_CLIENT_SECRET=your-client-secret
   
   # frontend/.env.local
   NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
   BACKEND_URL=http://localhost:8000
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   ```

3. **Start the stack**:
   ```bash
   docker compose up --build
   ```

4. **Access**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

### Option 2: Run Locally Without Docker

**Terminal 1 - Backend**:
```powershell
cd backend
python -m venv venv
# Windows: .\venv\Scripts\Activate.ps1
# Mac/Linux: source venv/bin/activate
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

**Terminal 2 - Frontend**:
```powershell
cd frontend
npm install
npm run dev
```

Visit http://localhost:3000

---

## 📊 Technology Stack

### Frontend
- **Next.js 16** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **Clerk** for OAuth authentication
- **Hosting**: Vercel

### Backend
- **FastAPI** for API
- **Python 3.11+** runtime
- **PostgreSQL** for data
- **Redis** for caching/rate-limiting
- **JWT** for authentication
- **Gunicorn** + Uvicorn for production
- **Hosting**: Render

### DevOps
- **Docker** for containerization
- **Alembic** for database migrations
- **GitHub Actions** for CI/CD
- **Pytest** for testing
- **Prometheus** for monitoring

---

## 🏗️ Project Structure

```
sentinelnexus/
├── backend/
│   ├── app/
│   │   ├── api/v1/          # API routes
│   │   ├── core/            # Config, security
│   │   ├── db/              # Database setup
│   │   ├── models/          # ORM models
│   │   ├── schemas/         # Pydantic schemas
│   │   └── services/        # Business logic
│   ├── alembic/             # Database migrations
│   ├── tests/               # Test suite
│   └── requirements.txt     # Python dependencies
│
├── frontend/
│   ├── src/
│   │   ├── app/             # Next.js pages
│   │   ├── components/      # React components
│   │   └── lib/             # Utilities & API clients
│   ├── public/              # Static assets
│   └── package.json         # Node dependencies
│
├── docker/                  # Dockerfiles
├── docker-compose.yml       # Local dev stack
├── render.yaml              # Render deployment
├── vercel.json              # Vercel deployment
└── DEPLOYMENT_GUIDE.md      # Production guide
```

---

## 🔐 Security Features

✅ **OAuth 2.0** - Clerk authentication  
✅ **JWT Tokens** - Secure API authentication  
✅ **Rate Limiting** - 100 req/min per IP  
✅ **CORS Protection** - Cross-origin validation  
✅ **SQL Injection Prevention** - SQLAlchemy ORM  
✅ **XSS Protection** - Security headers  
✅ **Encryption** - At rest & in transit  
✅ **Audit Logging** - Complete request tracking  

---

## 📈 Performance

| Metric | Value |
|--------|-------|
| Frontend Load | < 2s |
| API Response | < 500ms |
| Dashboard Load | < 3s |
| Lighthouse Score | 95+ |
| Uptime Target | 99.9% |

---

## 🧪 Testing

```bash
# Backend tests
cd backend
pytest --cov=app tests/

# Frontend tests
cd frontend
npm test

# Run all tests
npm run test:all
```

---

## 📚 Documentation

- [Platform Overview](./PLATFORM_OVERVIEW.md) - Features & architecture
- [Complete Deployment Guide](./COMPLETE_DEPLOYMENT_GUIDE.md) - Production deployment
- [Production Readiness Report](./PRODUCTION_READINESS_REPORT.md) - QA checklist
- [OAuth Setup](./OAUTH_SETUP.md) - Authentication configuration
- [API Reference](./backend/API.md) - API endpoints
- [Development Guide](./DEVELOPMENT.md) - Contributing

---

## 🚀 Deployment

### Deploy to Render (Backend)
1. Connect GitHub repository to Render
2. Use `render.yaml` for auto-configuration
3. Environment variables auto-synced from Clerk

### Deploy to Vercel (Frontend)
1. Connect GitHub repository to Vercel
2. Set `frontend/` as root directory
3. Environment variables auto-configured

See [COMPLETE_DEPLOYMENT_GUIDE.md](./COMPLETE_DEPLOYMENT_GUIDE.md) for details.

---

## 🆘 Troubleshooting

### "Favicon not loading"
✅ **Fixed** - Favicon.png now in `/frontend/public/`

### "OAuth redirect_uri_mismatch"
- Check Clerk redirect URIs match your domain
- Update environment variables
- Clear browser cookies

### "Redis connection timeout"
- Backend works without Redis (degraded mode)
- Optional: Install Redis locally with `redis-server`

### "Database migration errors"
```bash
cd backend
alembic upgrade head
```

---

## 📞 Support

- **Documentation**: See docs folder
- **Issues**: GitHub Issues
- **Email**: support@sentinelnexus.ai
- **Community**: GitHub Discussions

---

## 👤 Author

**Mayank Sharma**
- Website: [mayankiitj.in](https://mayankiitj.in)
- GitHub: [@Mayank-iitj](https://github.com/Mayank-iitj)
- LinkedIn: [/in/mayank-sharma-iitj](https://linkedin.com/in/mayank-sharma-iitj)

---

## 📄 License

Proprietary - All rights reserved

---

## ✅ Production Status

🟢 **PRODUCTION READY** 

All features implemented and tested. Security measures in place. Ready for enterprise deployment.

**Last Updated**: May 5, 2026  
**Version**: 1.0.0
