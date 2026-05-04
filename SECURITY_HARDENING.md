# Production Security Hardening Guide

Essential security measures for SentinelNexus production deployment.

---

## Table of Contents

1. [Secrets Management](#secrets-management)
2. [Access Control](#access-control)
3. [Network Security](#network-security)
4. [Application Security](#application-security)
5. [Database Security](#database-security)
6. [Monitoring and Audit](#monitoring-and-audit)
7. [Incident Response](#incident-response)

---

## Secrets Management

### ✅ Do's

- ✅ Store all secrets in Google Cloud Secret Manager
- ✅ Rotate secrets every 90 days
- ✅ Use separate secrets for dev, staging, and production
- ✅ Enable audit logging for secret access
- ✅ Use service accounts with minimal permissions
- ✅ Reference secrets by version in Cloud Run

### ❌ Don'ts

- ❌ Never commit secrets to git (use `.gitignore`)
- ❌ Never hardcode secrets in environment files
- ❌ Never share secrets via email or chat
- ❌ Never use the same secrets across environments
- ❌ Never expose secrets in logs

### Implementation

```bash
# Create secrets
echo -n "$(openssl rand -base64 64)" | gcloud secrets create sentinel-secret-key --data-file=-

# Grant access to service account
gcloud secrets add-iam-policy-binding sentinel-secret-key \
  --member=serviceAccount:sentinelnexus-app@$PROJECT_ID.iam.gserviceaccount.com \
  --role=roles/secretmanager.secretAccessor

# Use in Cloud Run
gcloud run deploy sentinelnexus-api \
  --set-secrets "SECRET_KEY=sentinel-secret-key:latest"

# Rotate secrets (quarterly)
echo -n "$(openssl rand -base64 64)" | gcloud secrets versions add sentinel-secret-key --data-file=-
```

### Secret Rotation Schedule

| Secret | Rotation | Method |
|--------|----------|--------|
| SECRET_KEY | 90 days | gcloud secrets versions add |
| JWT_SECRET_KEY | 90 days | gcloud secrets versions add |
| GOOGLE_CLIENT_SECRET | As needed | Update in Google Console |
| DB_PASSWORD | 180 days | gcloud sql users set-password |
| NEXTAUTH_SECRET | 90 days | Update in Vercel |

---

## Access Control

### Principle of Least Privilege

```bash
# Create restrictive service account
gcloud iam service-accounts create sentinelnexus-app \
  --display-name="SentinelNexus Application"

# Grant only required roles
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member=serviceAccount:sentinelnexus-app@$PROJECT_ID.iam.gserviceaccount.com \
  --role=roles/cloudsql.client

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member=serviceAccount:sentinelnexus-app@$PROJECT_ID.iam.gserviceaccount.com \
  --role=roles/secretmanager.secretAccessor
```

### IAM Roles Required

| Service | Required Roles | Notes |
|---------|----------------|-------|
| Cloud Run | compute.admin | Deploy service |
| Cloud SQL | cloudsql.client | Connect to database |
| Secret Manager | secretmanager.secretAccessor | Read secrets |
| Cloud Logging | logging.logWriter | Write logs |

### User Access

```bash
# Grant Cloud Run admin access
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member=user:developer@company.com \
  --role=roles/run.admin

# Grant read-only access
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member=user:ops@company.com \
  --role=roles/viewer
```

---

## Network Security

### VPC Configuration

```bash
# Create VPC for backend
gcloud compute networks create sentinel-vpc \
  --subnet-mode=custom

gcloud compute networks subnets create sentinel-subnet \
  --network=sentinel-vpc \
  --region=us-central1 \
  --range=10.0.0.0/24

# Cloud SQL in VPC
gcloud sql instances patch sentinel-nexus-db \
  --network=sentinel-vpc
```

### Firewall Rules

```bash
# Only allow from Vercel IPs (if possible) or Cloud Run
gcloud compute firewall-rules create allow-cloud-run \
  --network=sentinel-vpc \
  --allow=tcp:5432 \
  --source-tags=cloud-run
```

### HTTPS Enforcement

- ✅ Vercel auto-provides HTTPS
- ✅ Cloud Run auto-provides HTTPS
- ✅ All traffic automatically redirected to HTTPS
- ✅ HSTS headers enabled

**Verify:**
```bash
curl -I https://sentinelnexus.ai | grep -i hsts
# Should show: Strict-Transport-Security: max-age=31536000
```

---

## Application Security

### Input Validation

**Backend (FastAPI/Pydantic):**
```python
# Already implemented in all schemas
from pydantic import BaseModel, EmailStr, validator

class UserCreate(BaseModel):
    email: EmailStr          # Validates email format
    name: str
    
    @validator('name')
    def name_must_not_be_empty(cls, v):
        assert v.strip(), 'Name cannot be empty'
        return v
```

### SQL Injection Prevention

**Using SQLAlchemy ORM (prevents SQL injection):**
```python
# ✅ Safe: Uses parameterized queries
user = db.query(User).filter(User.email == email).first()

# ❌ Never: Raw SQL strings
# db.execute(f"SELECT * FROM users WHERE email = '{email}'")
```

### CORS Configuration

```python
# In backend/app/main.py (FastAPI)
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://sentinelnexus.ai",
        "https://www.sentinelnexus.ai",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)
```

### Authentication & Authorization

```python
# ✅ JWT tokens in HTTPOnly cookies
from fastapi.responses import JSONResponse

response = JSONResponse(content={"status": "authenticated"})
response.set_cookie(
    key="access_token",
    value=token,
    httponly=True,
    secure=True,
    samesite="Lax",
)
return response
```

### Rate Limiting

```python
# Already implemented: 100 requests/60 seconds
# Uses Redis if available, memory fallback
from app.core.rate_limit import rate_limit

@app.post("/api/v1/auth/login/google")
@rate_limit(max_requests=100, window_seconds=60)
async def login_google(code: str):
    ...
```

### Dependency Scanning

```bash
# Check for known vulnerabilities
pip install safety
safety check -r backend/requirements.txt

# Fix vulnerabilities
pip-audit --fix
```

---

## Database Security

### Encryption at Rest

```bash
# Enable automatic backups with encryption
gcloud sql instances patch sentinel-nexus-db \
  --enable-bin-log
```

### Encryption in Transit

```bash
# Force SSL connections
gcloud sql instances patch sentinel-nexus-db \
  --database-flags=cloudsql_iam_authentication=on
```

### Strong Passwords

```bash
# Generate strong password for database user
openssl rand -base64 32

# Create user with strong password
gcloud sql users create sentinel \
  --instance=sentinel-nexus-db \
  --password=$(openssl rand -base64 32)
```

### Backup Strategy

```bash
# Automatic daily backups (configured)
gcloud sql backups list --instance=sentinel-nexus-db

# Retention policy
gcloud sql instances patch sentinel-nexus-db \
  --backup-start-time=03:00 \
  --backup-retention-period=30
```

### Access Control

```bash
# Only allow from Cloud Run
gcloud compute firewall-rules create allow-sql-from-run \
  --allow=tcp:5432 \
  --source-service-accounts=sentinelnexus-app@$PROJECT_ID.iam.gserviceaccount.com
```

---

## Monitoring and Audit

### Enable Cloud Audit Logging

```bash
# Logs API calls to all GCP services
# Enable in Cloud Console:
# IAM & Admin → Audit Logs → Enable for all services
```

### Cloud Logging Configuration

```bash
# Create log sink for security events
gcloud logging sinks create security-events \
  logging.googleapis.com/projects/$PROJECT_ID/logs/security \
  --log-filter='severity>=WARNING'

# View security logs
gcloud logging read --limit=50 --format=json --severity=WARNING
```

### Set Up Alerts

```bash
# Alert on suspicious activity
gcloud alpha monitoring policies create \
  --display-name="Suspicious OAuth activity" \
  --condition-display-name="Multiple failed OAuth attempts" \
  --condition-threshold-value=5
```

### Regular Security Audits

- [ ] Weekly: Review recent logs
- [ ] Monthly: Check for failed authentication attempts
- [ ] Quarterly: Review IAM permissions
- [ ] Annually: Full security assessment

---

## Incident Response

### Security Incident Checklist

If you suspect a security breach:

1. **Immediate (0-5 min)**
   - [ ] Isolate affected systems if possible
   - [ ] Page security team
   - [ ] Enable verbose logging

2. **Investigation (5-60 min)**
   ```bash
   # Collect logs
   gcloud logging read --limit=1000 --format=json > incident-logs.json
   
   # Check for unauthorized access
   gcloud sql instances describe sentinel-nexus-db --format=json
   
   # Review recent deployments
   gcloud run services describe sentinelnexus-api --format=json
   ```

3. **Containment (30-120 min)**
   - [ ] Rotate compromised secrets
   - [ ] Revoke OAuth tokens if needed
   - [ ] Review and update IAM permissions
   - [ ] Force password resets if user data exposed

4. **Recovery (1-24 hours)**
   - [ ] Restore from clean backup if needed
   - [ ] Deploy patched version
   - [ ] Monitor for recurrence

5. **Post-Incident (1-7 days)**
   - [ ] Document incident
   - [ ] Root cause analysis
   - [ ] Implement preventive measures
   - [ ] Update security documentation

### Emergency Contacts

- **Google Cloud Support**: [support.google.com](https://support.google.com)
- **Security Team**: [security@sentinelnexus.ai]
- **Incident Commander**: [On-call rotation]

---

## Compliance Checklist

### GDPR Compliance

- [ ] User consent for data collection
- [ ] Data retention policy (delete old records)
- [ ] Right to be forgotten (delete user data)
- [ ] Data portability (export user data)

### SOC 2 Readiness

- [ ] Access controls (IAM)
- [ ] Encryption (at rest and in transit)
- [ ] Audit logging (enabled)
- [ ] Incident response plan (documented)
- [ ] Change management (git commits)
- [ ] Backup and recovery (tested)

### Security Patches

```bash
# Check for outdated packages
npm audit           # frontend/
safety check        # backend/

# Update regularly
npm update          # frontend/
pip install --upgrade -r requirements.txt  # backend/
```

---

## Security Tools

### Development

```bash
# Code scanning
npm install --save-dev eslint-plugin-security
pip install bandit

# Dependency checking
pip install safety
npm install -g npm-audit
```

### Deployment

```bash
# Container scanning (automatically enabled)
gcloud container images scan IMAGE_URL

# Secret scanning (GitHub)
# Settings → Security & analysis → Enable secret scanning
```

### Runtime

- **Google Cloud Security Command Center** - Unified security dashboard
- **Cloud Armor** - DDoS and WAF protection (if needed)
- **VPC Service Controls** - Perimeter defense

---

## Reference

### Security Best Practices

1. **Defense in Depth** - Multiple layers of security
2. **Least Privilege** - Minimal necessary permissions
3. **Encryption Everywhere** - Data at rest and in transit
4. **Assume Breach** - Build with zero trust mindset
5. **Continuous Monitoring** - Detect anomalies early

### Standards Followed

- OWASP Top 10
- CWE/SANS Top 25
- Google Cloud Security Best Practices
- NIST Cybersecurity Framework

---

## Next Steps

After deployment:

1. [ ] Enable Cloud Audit Logging
2. [ ] Set up Cloud Monitoring alerts
3. [ ] Configure automated backup verification
4. [ ] Schedule secret rotation (quarterly)
5. [ ] Conduct initial security audit
6. [ ] Document incident response procedures
7. [ ] Train team on security policies

---

## Additional Resources

- [Google Cloud Security Best Practices](https://cloud.google.com/docs/authentication/best-practices-applications)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CWE/SANS Top 25](https://cwe.mitre.org/top25/)
- [production_env_template.md](./PRODUCTION_ENV_TEMPLATE.md)
- [operations_runbook.md](./OPERATIONS_RUNBOOK.md)
