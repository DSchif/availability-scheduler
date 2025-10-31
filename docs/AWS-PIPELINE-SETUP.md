# AWS CodePipeline CI/CD Setup Guide

This guide shows you how to set up automatic deployments using **AWS CodePipeline** and **CodeBuild**. When you push code to GitHub, AWS automatically deploys your backend and frontend.

## Overview

The AWS-native CI/CD pipeline includes:

1. **AWS CodePipeline** - Orchestrates the deployment workflow
2. **AWS CodeBuild** - Builds and deploys backend and frontend
3. **S3 + CloudFront** - Hosts the frontend
4. **GitHub Integration** - Triggers on git push

## Architecture

```
GitHub Push → CodePipeline → CodeBuild Backend → Deploy CDK Stack
                           → CodeBuild Frontend → Build → S3 → CloudFront
```

## Prerequisites

- ✅ AWS account with credentials configured
- ✅ GitHub repository for your code
- ✅ GitHub Personal Access Token

## Step 1: Create GitHub Personal Access Token

1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Name it: `aws-codepipeline-token`
4. Select scopes:
   - ✅ `repo` (Full control of private repositories)
   - ✅ `admin:repo_hook` (Full control of repository hooks)
5. Click "Generate token"
6. **Copy the token immediately** (you won't see it again!)

## Step 2: Store GitHub Token in AWS Secrets Manager

```bash
# Store your GitHub token
aws secretsmanager create-secret \
  --name github-token \
  --description "GitHub Personal Access Token for CodePipeline" \
  --secret-string "YOUR_GITHUB_TOKEN_HERE" \
  --region us-east-1

# Verify it was created
aws secretsmanager describe-secret --secret-id github-token --region us-east-1
```

## Step 3: Push Code to GitHub

```bash
cd availability-scheduler

# Initialize git if not already done
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Availability Scheduler with CI/CD"

# Create GitHub repository (via GitHub website or gh CLI)
# Then connect and push:
git remote add origin https://github.com/YOUR_USERNAME/availability-scheduler.git
git branch -M main
git push -u origin main
```

## Step 4: Configure Pipeline in CDK

Edit `backend/infrastructure/bin/app.ts`:

```typescript
// Uncomment and configure the PipelineStack section:
new PipelineStack(app, 'AvailabilitySchedulerPipelineStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1'
  },
  githubOwner: 'YOUR_GITHUB_USERNAME',       // ← Your GitHub username
  githubRepo: 'availability-scheduler',       // ← Your repo name
  githubBranch: 'main',
  description: 'CI/CD Pipeline for Availability Scheduler'
});
```

## Step 5: Deploy the Pipeline

```bash
cd backend

# Install dependencies (if not done already)
npm install

# Deploy the main application stack first
cd infrastructure
npx cdk deploy AvailabilitySchedulerStack

# Then deploy the pipeline stack
npx cdk deploy AvailabilitySchedulerPipelineStack
```

This creates:
- ✅ CodePipeline with GitHub integration
- ✅ CodeBuild projects for backend and frontend
- ✅ S3 bucket for frontend hosting
- ✅ CloudFront distribution
- ✅ S3 bucket for pipeline artifacts
- ✅ Webhook on GitHub for automatic triggers

## Step 6: Verify Pipeline

1. Go to AWS Console → CodePipeline
2. You should see: `AvailabilityScheduler-Pipeline`
3. The pipeline will automatically run for the first time
4. Watch it progress through stages:
   - **Source** - Pulls code from GitHub
   - **Build_Backend** - Deploys CDK stack
   - **Build_Deploy_Frontend** - Builds and deploys to S3/CloudFront

## Step 7: Get Your URLs

After successful deployment:

```bash
# Get CloudFront URL for frontend
aws cloudformation describe-stacks \
  --stack-name AvailabilitySchedulerPipelineStack \
  --query 'Stacks[0].Outputs[?OutputKey==`FrontendUrl`].OutputValue' \
  --output text

# Get API URL from backend stack
aws cloudformation describe-stacks \
  --stack-name AvailabilitySchedulerStack \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiUrl`].OutputValue' \
  --output text
```

## How It Works

### On Every Git Push to Main Branch:

1. **GitHub Webhook** notifies CodePipeline
2. **CodePipeline** pulls latest code
3. **Backend Build**:
   - Runs `backend/buildspec.yml`
   - Installs dependencies
   - Runs CDK deploy
   - Updates Lambda functions, API Gateway, DynamoDB
4. **Frontend Build**:
   - Runs `frontend/buildspec.yml`
   - Gets API URL from backend stack
   - Builds Next.js app with API URL
   - Uploads to S3
   - Invalidates CloudFront cache
5. **Done!** Your app is live

## Pipeline Stages

### Stage 1: Source
- Pulls code from GitHub repository
- Triggered by git push or manual execution

### Stage 2: Build_Backend
**Buildspec**: `backend/buildspec.yml`

```yaml
- Install Node.js 18 and dependencies
- Bootstrap CDK (if first time)
- Run cdk synth
- Run cdk deploy
- Export API URL
```

### Stage 3: Build_Deploy_Frontend
**Buildspec**: `frontend/buildspec.yml`

```yaml
- Install Node.js 18 and dependencies
- Fetch API URL from backend CloudFormation stack
- Build Next.js with NEXT_PUBLIC_API_URL
- Upload build to S3
- Invalidate CloudFront cache
```

## Monitoring

### View Pipeline Execution
```bash
# List pipeline executions
aws codepipeline list-pipeline-executions \
  --pipeline-name AvailabilityScheduler-Pipeline

# Get execution details
aws codepipeline get-pipeline-execution \
  --pipeline-name AvailabilityScheduler-Pipeline \
  --pipeline-execution-id EXECUTION_ID
```

### View Build Logs
1. Go to AWS Console → CodeBuild
2. Click on project name
3. Click "Build history"
4. Click on a build to see logs

Or via CLI:
```bash
# List builds
aws codebuild list-builds-for-project \
  --project-name AvailabilityScheduler-Backend

# Get build logs
aws codebuild batch-get-builds --ids BUILD_ID
```

## Manual Triggers

You can manually trigger the pipeline:

### Via Console:
1. Go to CodePipeline console
2. Select your pipeline
3. Click "Release change"

### Via CLI:
```bash
aws codepipeline start-pipeline-execution \
  --name AvailabilityScheduler-Pipeline
```

## Customization

### Deploy to Different Branches

Edit `backend/infrastructure/lib/pipeline-stack.ts`:

```typescript
// Add staging pipeline
new PipelineStack(app, 'StagingPipelineStack', {
  githubOwner: 'YOUR_USERNAME',
  githubRepo: 'availability-scheduler',
  githubBranch: 'develop',  // ← Watch develop branch
});
```

### Add Tests to Pipeline

Edit `backend/buildspec.yml`:

```yaml
pre_build:
  commands:
    - echo "Running tests..."
    - npm test
    - npm run lint
```

### Add Approval Stage

Edit `backend/infrastructure/lib/pipeline-stack.ts`:

```typescript
// Add manual approval before frontend deployment
pipeline.addStage({
  stageName: 'Approval',
  actions: [
    new codepipeline_actions.ManualApprovalAction({
      actionName: 'Approve_Deployment'
    })
  ]
});
```

## Costs

### CodePipeline:
- $1 per active pipeline per month
- Free tier: 1 pipeline free

### CodeBuild:
- **Build.general1.small**: $0.005 per minute
- **Average build**: 5-8 minutes
- **Estimate**: ~$0.03-0.05 per build
- Free tier: 100 build minutes/month

### S3 + CloudFront:
- **S3**: ~$0.023/GB storage + $0.09/GB transfer
- **CloudFront**: ~$0.085/GB for first 10TB
- **Estimate**: $1-5/month for low-medium traffic

### Total CI/CD Cost:
- **With free tier**: ~$1-3/month
- **After free tier**: ~$3-10/month

## Troubleshooting

### Pipeline Fails at Source Stage

**Issue**: "Could not access GitHub repository"

**Fix**:
```bash
# Verify GitHub token is valid
aws secretsmanager get-secret-value --secret-id github-token

# Token may have expired - create new one and update:
aws secretsmanager update-secret \
  --secret-id github-token \
  --secret-string "NEW_GITHUB_TOKEN"
```

### Backend Build Fails

**Issue**: "Error: Need to perform AWS calls for account..."

**Fix**: CDK needs bootstrap
```bash
# Bootstrap manually
aws cloudformation describe-stacks --stack-name CDKToolkit

# If not exists, the buildspec will bootstrap automatically
```

**Issue**: "CREATE_FAILED: Resource already exists"

**Fix**: Stack from previous deployment failed
```bash
# Delete the stack
aws cloudformation delete-stack --stack-name AvailabilitySchedulerStack

# Wait for deletion, then push again to retry
```

### Frontend Build Fails

**Issue**: "Unable to locate credentials"

**Fix**: CodeBuild role needs CloudFormation permissions
- Check pipeline-stack.ts has correct IAM permissions
- Redeploy pipeline stack

**Issue**: "API URL not found"

**Fix**: Backend didn't deploy successfully
- Check backend build logs
- Ensure AvailabilitySchedulerStack deployed successfully

### CloudFront Not Updating

**Issue**: Old version still showing

**Fix**:
```bash
# Manual invalidation
DISTRIBUTION_ID=$(aws cloudformation describe-stacks \
  --stack-name AvailabilitySchedulerPipelineStack \
  --query 'Stacks[0].Outputs[?OutputKey==`DistributionId`].OutputValue' \
  --output text)

aws cloudfront create-invalidation \
  --distribution-id $DISTRIBUTION_ID \
  --paths "/*"
```

## Security Best Practices

1. ✅ **GitHub Token**: Store in Secrets Manager (done)
2. ✅ **IAM Roles**: Use least-privilege policies
3. ✅ **S3 Bucket**: Private access only (via CloudFront)
4. ✅ **CloudFront**: HTTPS only
5. ⚠️ **Secrets Rotation**: Rotate GitHub token periodically

## Advanced: Multi-Environment Setup

```typescript
// Production pipeline
new PipelineStack(app, 'ProdPipeline', {
  githubOwner: 'YOUR_USERNAME',
  githubRepo: 'availability-scheduler',
  githubBranch: 'main'
});

// Staging pipeline
new PipelineStack(app, 'StagingPipeline', {
  githubOwner: 'YOUR_USERNAME',
  githubRepo: 'availability-scheduler',
  githubBranch: 'develop'
});
```

## Comparison: GitHub Actions vs AWS CodePipeline

| Feature | GitHub Actions | AWS CodePipeline |
|---------|----------------|------------------|
| **Setup** | Simple YAML files | CDK/CloudFormation |
| **Cost** | 2000 min/month free | $1/pipeline + build time |
| **Integration** | Native to GitHub | AWS-native |
| **Frontend Deploy** | Vercel/Amplify | S3 + CloudFront |
| **Best For** | Quick setup, multi-platform | All-in-AWS, enterprise |

## Next Steps

1. ✅ Pipeline is set up
2. ✅ Git push triggers automatic deployment
3. 🔄 Add automated tests
4. 🔄 Set up staging environment
5. 🔄 Add Slack/email notifications
6. 🔄 Implement blue/green deployments

## Summary

You now have a fully automated CI/CD pipeline! 🎉

**Workflow:**
```
git add .
git commit -m "New feature"
git push origin main
→ AWS automatically deploys everything
→ Check CodePipeline console to watch progress
→ Visit CloudFront URL to see changes live
```

**URLs to bookmark:**
- CodePipeline: https://console.aws.amazon.com/codesuite/codepipeline/pipelines
- CloudFront: Your frontend URL from stack outputs
- API Gateway: Your backend API URL from stack outputs

Happy deploying! 🚀
