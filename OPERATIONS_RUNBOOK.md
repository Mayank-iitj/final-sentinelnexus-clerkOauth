# Production Operations Runbook

Operational procedures for running and maintaining SentinelNexus in production.

## Table of Contents

1. [Daily Operations](#daily-operations)
2. [Monitoring and Alerting](#monitoring-and-alerting)
3. [Backup and Recovery](#backup-and-recovery)
4. [Scaling and Performance](#scaling-and-performance)
5. [Troubleshooting](#troubleshooting)
6. [Incident Response](#incident-response)
7. [Maintenance Windows](#maintenance-windows)

---

## Daily Operations

### Health Check

Run daily to verify system is healthy:

```bash
python validate_deployment.py \
  --backend-url https://sentinelnexus-api-xyz.a.run.app \
  --frontend-url https://sentinelnexus.ai
```

**Expected output**: All checks pass ✓

### View Recent Logs

```bash
# Backend logs (last 100 lines, most recent first)
gcloud run logs read sentinelnexus-api --limit 100 --format=json | jq -r '.message' | tac

# Frontend logs (in Vercel Dashboard)
# Project → Deployments → click Active → Logs
```

### Monitor Error Rates

```bash
# Check Cloud Monitoring dashboard
gcloud monitoring dashboards list

# Or in Google Cloud Console:
# Go to Monitoring → Dashboards → SentinelNexus
```

---

## Monitoring and Alerting

### Set Up Cloud Monitoring

```bash
# Create alert policy for high error rate
gcloud alpha monitoring policies create \
  --display-name="SentinelNexus - High Error Rate" \
  --condition-display-name="Error rate > 5%" \
  --condition-threshold-value=0.05 \
  --notification-channels=CHANNEL_ID
```

### Key Metrics to Monitor

1. **Backend Response Time**
   - Target: < 500ms (p99)
   - Alert threshold: > 2000ms

2. **Error Rate**
   - Target: < 0.1%
   - Alert threshold: > 5%

3. **Database Connections**
   - Target: < 80% of max
   - Alert threshold: > 90%

4. **API Rate Limit Hits**
   - Monitor for abuse patterns

### Create Alerts

**In Google Cloud Console:**

1. Go to **Monitoring** → **Alerting** → **Create Policy**
2. Set up alerts for:
   - Cloud Run: p95 latency > 1s
   - Cloud SQL: CPU > 80%
   - Cloud SQL: Disk > 80%
   - Service: Error rate > 5%

---

## Backup and Recovery

### Database Backups

```bash
# View automatic backups (Daily, kept for 30 days)
gcloud sql backups list --instance=sentinel-nexus-db

# Create manual backup (before major changes)
gcloud sql backups create \
  --instance=sentinel-nexus-db \
  --description="Before feature X deployment"

# List backups
gcloud sql backups list --instance=sentinel-nexus-db --limit=10
```

### Backup Verification (Monthly)

```bash
# Create a test instance from backup
gcloud sql backups restore BACKUP_ID \
  --backup-instance=sentinel-nexus-db \
  --target-instance=sentinel-nexus-db-test

# Verify data integrity
gcloud sql connect sentinel-nexus-db-test --user=sentinel
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM projects;

# Delete test instance
gcloud sql instances delete sentinel-nexus-db-test
```

### Restore from Backup

In case of data loss:

```bash
# Create new instance from backup
gcloud sql backups restore BACKUP_ID \
  --backup-instance=sentinel-nexus-db

# Verify restore successful
gcloud sql connect sentinel-nexus-db --user=sentinel
SELECT * FROM users LIMIT 5;

# If successful, swap with production
# (Coordinate with platform team)
```

---

## Scaling and Performance

### Auto-Scaling Configuration

Current settings:

```
Min instances: 0  (saves costs)
Max instances: 10 (handles load spikes)
Memory: 512MB per instance
CPU: 1 CPU per instance
```

### Monitor Scaling Events

```bash
# View scaling metrics
gcloud monitoring time-series list \
  --filter='metric.type="run.googleapis.com/request_count"'

# View in Cloud Console
# Monitoring → Dashboards → Cloud Run → Request Volume
```

### Increase Capacity if Needed

```bash
# Update Cloud Run service
gcloud run deploy sentinelnexus-api \
  --max-instances=20 \
  --region=us-central1

# Update database resources
gcloud sql instances patch sentinel-nexus-db \
  --tier=db-g1-medium
```

### Database Performance Tuning

```bash
# Check slow query logs
gcloud sql operations list --instance=sentinel-nexus-db

# Enable slow query logging
gcloud sql instances patch sentinel-nexus-db \
  --database-flags=log_min_duration_statement=1000

# View slow queries
gcloud sql connect sentinel-nexus-db --user=sentinel
SELECT query, mean_time FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;
```

---

## Troubleshooting

### Backend Service Down

```bash
# Check service status
gcloud run services describe sentinelnexus-api --platform managed --region us-central1

# View recent logs for errors
gcloud run logs read sentinelnexus-api --limit 50

# Common issues:
# 1. Out of memory → Increase memory allocation
# 2. Database error → Check DATABASE_URL and connectivity
# 3. Cold start slow → Consider min-instances=1
```

### High Latency

```bash
# Check database performance
gcloud sql instances describe sentinel-nexus-db

# Check if instance is over-provisioned
gcloud monitoring time-series list \
  --filter='metric.type="cloudsql.googleapis.com/database/cpu/utilization"'

# Solutions:
# 1. Increase instance tier (db-g1-small → db-g1-medium)
# 2. Add database indexes
# 3. Increase Cloud Run memory
```

### Database Connection Errors

```bash
# Check connection count
gcloud sql connect sentinel-nexus-db --user=sentinel
SELECT datname, count(*) FROM pg_stat_activity GROUP BY datname;

# If max connections exceeded:
# 1. Check for connection leaks in code
# 2. Increase max connections (default: 100)
gcloud sql instances patch sentinel-nexus-db \
  --database-flags=max_connections=200
```

### OAuth Flow Broken

```bash
# Check OAuth provider configuration
curl -s https://sentinelnexus-api-xyz.a.run.app/api/v1/auth/providers

# Verify Google OAuth credentials
gcloud secrets versions access latest --secret="google-client-id"
gcloud secrets versions access latest --secret="google-client-secret"

# Check authorized redirect URIs in Google Cloud Console
# APIs & Services → Credentials → your OAuth client
```

---

## Incident Response

### Severity Levels

- **Critical (P1)**: Service completely down, data loss risk
- **High (P2)**: Service degraded, impacting users
- **Medium (P3)**: Minor issues, workaround available
- **Low (P4)**: Documentation updates, non-critical bugs

### Critical Incident (P1) - Service Down

**Timeline: 0-5 minutes**

1. Page on-call engineer
2. Confirm issue is widespread (not just you)
3. Execute immediate diagnosis:

```bash
# Check service status
gcloud run services describe sentinelnexus-api

# View recent errors
gcloud run logs read sentinelnexus-api --limit 100

# Check database availability
gcloud sql instances describe sentinel-nexus-db
```

**Timeline: 5-15 minutes**

4. If database is down:
   - Contact Google Cloud support
   - Prepare to restore from backup

5. If service is crashing:
   - Check for recent deployments
   - Consider rolling back to previous version:
   ```bash
   gcloud run deploy sentinelnexus-api \
     --image gcr.io/$PROJECT_ID/sentinelnexus-api:PREVIOUS_VERSION
   ```

6. If rate limiting is the issue:
   - Temporarily disable rate limiting (if possible)
   - Investigate traffic spike source

**Timeline: 15+ minutes**

7. Post-incident:
   - Document timeline
   - Identify root cause
   - Create issue for prevention

### High Priority Issue (P2) - Service Degraded

1. Assess impact (% of users affected)
2. Implement temporary fix or workaround
3. Schedule permanent fix for next maintenance window
4. Communicate status to users

### Recovery Procedure

```bash
# Standard recovery steps
1. Identify issue from logs
2. Fix code or configuration
3. Redeploy:
   gcloud run deploy sentinelnexus-api \
     --image gcr.io/$PROJECT_ID/sentinelnexus-api:latest \
     --region=us-central1

4. Verify recovery:
   curl -s https://sentinelnexus-api-xyz.a.run.app/health | jq .

5. Monitor for regression
```

---

## Maintenance Windows

### Planned Maintenance Schedule

**Weekly** (Tuesday 2 AM UTC):
- Database maintenance
- Log cleanup
- Security patches

**Monthly** (First Friday):
- Major updates
- Infrastructure upgrades
- Database optimization

### Pre-Maintenance Checklist

- [ ] Create database backup
- [ ] Notify stakeholders
- [ ] Document expected downtime
- [ ] Test rollback procedure
- [ ] Have on-call engineer ready

### Maintenance Steps

```bash
# 1. Create backup
gcloud sql backups create --instance=sentinel-nexus-db

# 2. Mark service as maintenance mode (optional)
# Deploy a maintenance page or status update

# 3. Perform maintenance
# - Database migrations
# - Schema updates
# - Dependency updates

# 4. Deploy and test
npm run build
gcloud run deploy sentinelnexus-api --image gcr.io/$PROJECT_ID/sentinelnexus-api:latest

# 5. Verify
python validate_deployment.py --backend-url=... --frontend-url=...

# 6. Monitor closely for 1 hour
gcloud run logs read sentinelnexus-api --limit 100
```

---

## Emergency Procedures

### Complete Service Outage

```bash
# 1. Check all services
gcloud run services list
gcloud sql instances list

# 2. If database is down
gcloud sql instances patch sentinel-nexus-db --no-backup
gcloud sql instances restart sentinel-nexus-db

# 3. If backend is down
gcloud run services delete sentinelnexus-api
gcloud run deploy sentinelnexus-api --image gcr.io/$PROJECT_ID/sentinelnexus-api:latest

# 4. If frontend is down (contact Vercel support)
# Or manually redeploy from GitHub
```

### Data Loss Scenario

```bash
# 1. Stop write operations (shut down backend if needed)
gcloud run services update-traffic sentinelnexus-api --to-revisions PREVIOUS_REVISION=100

# 2. Identify latest valid backup
gcloud sql backups list --instance=sentinel-nexus-db

# 3. Create test restore
gcloud sql instances create sentinel-nexus-db-restore --from-backup BACKUP_ID

# 4. Verify data integrity
gcloud sql connect sentinel-nexus-db-restore --user=sentinel
SELECT COUNT(*) FROM users;

# 5. Restore to production (coordinate with team)
# Document: what was lost, when recovery completed
```

---

## Reference Commands

### Frequently Used

```bash
# View service status
gcloud run services describe sentinelnexus-api --platform managed --region us-central1

# View logs (live)
gcloud run logs read sentinelnexus-api --platform managed --region us-central1 --follow

# Restart service
gcloud run services update-traffic sentinelnexus-api --to-revisions LATEST=100

# Check database
gcloud sql connect sentinel-nexus-db --user=sentinel

# View metrics
gcloud monitoring dashboards list
```

### Configuration Changes

```bash
# Update environment variable
gcloud run services update sentinelnexus-api \
  --set-env-vars KEY=value \
  --region us-central1

# Update resource limits
gcloud run services update sentinelnexus-api \
  --memory 512Mi \
  --cpu 1

# Rollback to previous revision
gcloud run rollouts undo sentinelnexus-api --region us-central1
```

---

## On-Call Responsibilities

### Daily

- [ ] Run health check
- [ ] Review error logs
- [ ] Check monitoring dashboard

### Weekly

- [ ] Review performance metrics
- [ ] Verify backup completion
- [ ] Update status page

### Monthly

- [ ] Review incident reports
- [ ] Plan capacity upgrades
- [ ] Update runbook

---

## Contact Information

- **Google Cloud Support**: [support.google.com](https://support.google.com)
- **Vercel Support**: support@vercel.com
- **On-Call Engineer**: [Internal contact list]
- **Security Contact**: [security@sentinelnexus.ai]

---

## Related Documentation

- [DEPLOYMENT_SCRIPT.md](./DEPLOYMENT_SCRIPT.md)
- [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)
- [PRODUCTION_ENV_TEMPLATE.md](./PRODUCTION_ENV_TEMPLATE.md)
