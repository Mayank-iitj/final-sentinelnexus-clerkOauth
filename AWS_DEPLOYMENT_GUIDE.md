# SentinelNexus AWS Deployment Guide

This guide explains how to deploy the SentinelNexus backend to **AWS App Runner**, which is the AWS equivalent of Google Cloud Run. It provides a fully managed, serverless container environment perfect for the FastAPI backend.

There are two primary ways to deploy to App Runner:
1. **Source Code Deployment (Recommended)**: App Runner directly pulls from your GitHub repository, builds the Docker container based on `apprunner.yaml`, and runs it.
2. **Container Registry Deployment (CI/CD)**: You use AWS CodeBuild to build the image via `buildspec.yml`, push it to Amazon ECR, and App Runner runs the container.

---

## Option 1: Direct Source Deployment (Easiest)

Because we have included an `apprunner.yaml` file, AWS App Runner can build and deploy the code directly from your GitHub repository.

### Steps:
1. Go to the **AWS App Runner** console.
2. Click **Create an App Runner service**.
3. **Source and Build**:
   - Repository type: **Source code repository**.
   - Connect your GitHub account and select the `sentinelnexus` repository.
   - Branch: `main` (or your preferred deployment branch).
   - Deployment trigger: **Automatic** (so it deploys on every git push).
4. **Build configuration**:
   - Choose **Configuration file**.
   - App Runner will automatically read the `backend/apprunner.yaml` file to build and run the FastAPI app.
5. **Service configuration**:
   - Name your service (e.g., `sentinelnexus-backend`).
   - Under **Environment variables**, you *must* add the required secrets (since they shouldn't be hardcoded in yaml):
     - `SECRET_KEY`
     - `JWT_SECRET_KEY`
     - `CLERK_SECRET_KEY`
     - `DATABASE_URL`
     - `REDIS_URL`
     - `FRONTEND_BASE_URL` (e.g., `https://sentinelnexus.mayankiitj.in`)
6. Review and click **Create & deploy**.

App Runner will now provision the environment, build the Docker image, and provide a secure `https://` endpoint for your backend!

---

## Option 2: CI/CD Pipeline with Amazon ECR and CodeBuild

If you prefer to build the container yourself (or use a pipeline) and have App Runner just run the pre-built image, you can use the provided `buildspec.yml`.

### Step 1: Create an ECR Repository
1. Go to the **Amazon ECR** console.
2. Click **Create repository**.
3. Visibility: **Private**.
4. Name: `sentinelnexus-api`.
5. Click **Create repository**.

### Step 2: Set up AWS CodeBuild
1. Go to the **AWS CodeBuild** console and click **Create build project**.
2. Name: `sentinelnexus-api-build`.
3. **Source**: Connect your GitHub repo.
4. **Environment**:
   - Operating system: Ubuntu
   - Runtime: Standard
   - Image: `aws/codebuild/standard:7.0` (or latest)
   - Privileged: **Enable this flag** (required to build Docker images).
   - Service Role: Ensure the role has permissions to push to Amazon ECR (attach `AmazonEC2ContainerRegistryPowerUser`).
5. **Buildspec**: Choose **Use a buildspec file**. (CodeBuild will automatically find `backend/buildspec.yml`).
6. **Environment Variables**: Add these plain text variables:
   - `AWS_DEFAULT_REGION` (e.g., `us-east-1`)
   - `AWS_ACCOUNT_ID` (your 12 digit AWS account ID)
   - `IMAGE_REPO_NAME` (`sentinelnexus-api`)
7. Click **Create build project**.

### Step 3: Deploy to App Runner via ECR
1. Go to the **AWS App Runner** console.
2. Click **Create an App Runner service**.
3. **Source and Build**:
   - Repository type: **Container registry**.
   - Provider: **Amazon ECR**.
   - Image URI: Browse and select the `sentinelnexus-api` image you built in CodeBuild.
   - Deployment trigger: Automatic.
   - Access role: Create a new role so App Runner can pull from ECR.
4. **Service configuration**:
   - Port: `8080`.
   - Start command: `gunicorn app.main:app --bind 0.0.0.0:8080 --workers 2 --worker-class uvicorn.workers.UvicornWorker`
   - Add your environment variables/secrets (`DATABASE_URL`, `SECRET_KEY`, etc.).
5. Review and click **Create & deploy**.

---

## Database Considerations

If your current `DATABASE_URL` points to a local SQLite file (`sentinel_nexus.db`), you will need to migrate to a managed PostgreSQL database on AWS (like **Amazon RDS** or **Aurora Serverless**) for production. 
App Runner instances are ephemeral and do not persist local file changes, so SQLite will be wiped out on every deployment.

1. Create an **Amazon RDS for PostgreSQL** database.
2. Update the `DATABASE_URL` environment variable in your App Runner service to point to the RDS instance.
