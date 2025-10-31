# CI/CD Pipeline Setup Guide

This guide will help you set up automatic deployments using GitHub Actions. When you push code to GitHub, it will automatically deploy your backend to AWS and frontend to Vercel (or AWS Amplify).

## Overview

The CI/CD pipeline consists of two workflows:

1. **Backend Deployment** - Deploys AWS Lambda, API Gateway, and DynamoDB using CDK
2. **Frontend Deployment** - Deploys Next.js app to Vercel or AWS Amplify

## Prerequisites

- GitHub account
- AWS account with credentials
- Vercel account (for frontend) OR AWS Amplify setup

## Step 1: Create GitHub Repository

```bash
cd availability-scheduler

# Initialize git
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Availability Scheduler app"

# Create GitHub repo (via GitHub website or gh cli)
# Then connect and push:
git remote add origin https://github.com/YOUR_USERNAME/availability-scheduler.git
git branch -M main
git push -u origin main
```

## Step 2: Configure GitHub Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions

### Required Secrets for Backend:

1. **AWS_ACCESS_KEY_ID**
   - Your AWS access key
   - Get from AWS IAM → Users → Security credentials

2. **AWS_SECRET_ACCESS_KEY**
   - Your AWS secret key
   - Get from AWS IAM → Users → Security credentials

3. **AWS_ACCOUNT_ID**
   - Your 12-digit AWS account ID
   - Find in AWS Console top-right, or run: `aws sts get-caller-identity`

### How to Create AWS Access Keys:

```bash
# Option 1: Use existing credentials
aws configure get aws_access_key_id
aws configure get aws_secret_access_key

# Option 2: Create new IAM user for GitHub Actions
# 1. Go to AWS IAM Console
# 2. Create new user: "github-actions-deploy"
# 3. Attach policies:
#    - AmazonDynamoDBFullAccess
#    - AWSLambda_FullAccess
#    - AmazonAPIGatewayAdministrator
#    - IAMFullAccess
#    - CloudFormationFullAccess
# 4. Create access key → Download credentials
```

## Step 3: Configure Frontend Deployment

### Option A: Deploy to Vercel (Recommended - Easiest)

1. **Create Vercel Account**
   - Go to https://vercel.com
   - Sign up with GitHub

2. **Get Vercel Token**
   ```bash
   # Install Vercel CLI
   npm install -g vercel

   # Login
   vercel login

   # Get token
   # Go to: https://vercel.com/account/tokens
   # Create new token: "GitHub Actions"
   # Copy the token
   ```

3. **Add GitHub Secret**
   - Name: `VERCEL_TOKEN`
   - Value: Your Vercel token

4. **Link Vercel Project**
   ```bash
   cd frontend
   vercel link
   # Follow prompts to link to your project
   ```

5. **Set Environment Variable in Vercel**
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add: `NEXT_PUBLIC_API_URL` = (your API URL from backend deployment)
   - Or it will be automatically set from CloudFormation output

### Option B: Deploy to AWS Amplify (All-in-AWS)

1. **Connect Repository to Amplify**
   ```bash
   # Go to AWS Amplify Console
   # Click "New app" → "Host web app"
   # Connect GitHub repository
   # Select "frontend" as root directory
   # Amplify will auto-detect Next.js
   ```

2. **Configure Build Settings**
   ```yaml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - npm ci
       build:
         commands:
           - npm run build
     artifacts:
       baseDirectory: .next
       files:
         - '**/*'
     cache:
       paths:
         - node_modules/**/*
   ```

3. **Add Environment Variables**
   - In Amplify Console → Environment variables
   - Add: `NEXT_PUBLIC_API_URL`
   - Value will come from backend deployment

4. **Use Alternative Workflow**
   ```bash
   # Rename the example file
   mv .github/workflows/deploy-frontend-amplify.yml.example \
      .github/workflows/deploy-frontend-amplify.yml

   # Remove or disable the Vercel workflow
   ```

## Step 4: First Deployment

### Automatic (Recommended):

```bash
# Simply push to main branch
git add .
git commit -m "Setup CI/CD pipeline"
git push origin main

# GitHub Actions will automatically:
# 1. Deploy backend to AWS
# 2. Deploy frontend to Vercel/Amplify
```

### Monitor Deployment:

1. Go to GitHub repository → Actions tab
2. Watch the workflows run in real-time
3. Check for any errors

### Get Deployment URLs:

After successful deployment:

1. **Backend API URL:**
   - Check GitHub Actions summary
   - Or run: `aws cloudformation describe-stacks --stack-name AvailabilitySchedulerStack --query 'Stacks[0].Outputs'`

2. **Frontend URL:**
   - **Vercel**: Will be in GitHub Actions output or Vercel Dashboard
   - **Amplify**: Check AWS Amplify Console

## Step 5: Update Frontend with API URL

If the frontend deployed before backend, update the environment variable:

### For Vercel:
```bash
# Via CLI
vercel env add NEXT_PUBLIC_API_URL production

# Or in Vercel Dashboard:
# Project → Settings → Environment Variables → Edit
```

### For Amplify:
```bash
# In AWS Amplify Console:
# App → Environment variables → Manage variables
```

Then trigger a redeployment:
```bash
git commit --allow-empty -m "Redeploy frontend with API URL"
git push origin main
```

## Workflow Features

### Backend Workflow (.github/workflows/deploy-backend.yml)

**Triggers:**
- Push to `main` branch (when backend/** or shared/** files change)
- Manual trigger via GitHub Actions UI

**Steps:**
1. ✅ Checkout code
2. ✅ Setup Node.js
3. ✅ Configure AWS credentials
4. ✅ Install dependencies
5. ✅ Run tests (if configured)
6. ✅ Bootstrap CDK (first time)
7. ✅ Synthesize CloudFormation template
8. ✅ Deploy to AWS
9. ✅ Output API URL

### Frontend Workflow (.github/workflows/deploy-frontend.yml)

**Triggers:**
- Push to `main` branch (when frontend/** or shared/** files change)
- Manual trigger via GitHub Actions UI

**Steps:**
1. ✅ Checkout code
2. ✅ Setup Node.js
3. ✅ Install Vercel CLI
4. ✅ Pull Vercel config
5. ✅ Build project
6. ✅ Deploy to production
7. ✅ Output deployment URL

## Manual Triggers

You can manually trigger deployments:

1. Go to GitHub → Actions
2. Select workflow (Deploy Backend or Deploy Frontend)
3. Click "Run workflow"
4. Select branch (usually `main`)
5. Click "Run workflow"

## Branch Strategy

### Current Setup (Simple):
- `main` branch → Auto-deploys to production

### Recommended (Advanced):
```yaml
# Add staging environment
on:
  push:
    branches:
      - main        # Production
      - develop     # Staging
```

## Troubleshooting

### Backend Deployment Fails

**Check:**
1. AWS credentials are valid in GitHub Secrets
2. AWS account has sufficient permissions
3. CloudFormation stack isn't in ROLLBACK_COMPLETE state
4. Check CloudWatch Logs for Lambda errors

**Fix:**
```bash
# Delete failed stack
aws cloudformation delete-stack --stack-name AvailabilitySchedulerStack

# Push again to retry
git commit --allow-empty -m "Retry deployment"
git push
```

### Frontend Deployment Fails

**Vercel:**
- Check VERCEL_TOKEN is valid
- Ensure project is linked: `vercel link`
- Check build logs in Vercel Dashboard

**Amplify:**
- Check Amplify Console build logs
- Verify environment variables are set
- Check IAM permissions

### API URL Not Set

```bash
# Get API URL manually
aws cloudformation describe-stacks \
  --stack-name AvailabilitySchedulerStack \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiUrl`].OutputValue' \
  --output text

# Set in Vercel
vercel env add NEXT_PUBLIC_API_URL production
# Paste the URL

# Redeploy
git commit --allow-empty -m "Update API URL"
git push
```

## Cost Optimization

GitHub Actions free tier:
- 2,000 minutes/month for private repos
- Unlimited for public repos

Estimated usage:
- Backend deploy: ~3-5 minutes
- Frontend deploy: ~2-3 minutes
- **Total per deployment: ~5-8 minutes**

## Security Best Practices

1. ✅ Use GitHub Secrets for all credentials
2. ✅ Never commit AWS keys or tokens
3. ✅ Rotate AWS access keys periodically
4. ✅ Use least-privilege IAM policies
5. ✅ Enable branch protection on `main`
6. ✅ Require pull request reviews

## Next Steps

1. ✅ Set up GitHub Secrets
2. ✅ Push code to trigger first deployment
3. ✅ Verify both backend and frontend are live
4. ✅ Test the application end-to-end
5. 🔄 Set up staging environment (optional)
6. 🔄 Add automated tests to workflow
7. 🔄 Set up monitoring and alerts

## Advanced: Adding Tests to Pipeline

```yaml
# In deploy-backend.yml, before CDK deploy:
- name: Run unit tests
  working-directory: backend
  run: npm test

- name: Run integration tests
  working-directory: backend
  run: npm run test:integration
```

## Support

For issues with:
- **GitHub Actions**: Check Actions tab for error logs
- **AWS Deployment**: Check CloudFormation and CloudWatch Logs
- **Vercel**: Check Vercel Dashboard
- **Amplify**: Check Amplify Console

Happy deploying! 🚀
