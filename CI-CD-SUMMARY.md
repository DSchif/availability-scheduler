# CI/CD Pipeline Summary

## What Was Created

You now have **TWO CI/CD options** available:

### Option 1: AWS CodePipeline (Recommended - All-in-AWS) ⭐

**Files Created:**
- `backend/infrastructure/lib/pipeline-stack.ts` - CDK stack for CI/CD
- `backend/buildspec.yml` - Backend build instructions
- `frontend/buildspec.yml` - Frontend build instructions
- `setup-pipeline.sh` - Automated setup script
- `docs/AWS-PIPELINE-SETUP.md` - Complete guide

**What It Does:**
```
Git Push → GitHub Webhook → AWS CodePipeline
  ↓
  Stage 1: Pull code from GitHub
  ↓
  Stage 2: Build & Deploy Backend (CDK)
  ↓
  Stage 3: Build & Deploy Frontend (S3 + CloudFront)
  ↓
  ✅ Live!
```

**Components:**
- ✅ AWS CodePipeline - Orchestration
- ✅ AWS CodeBuild - Build service
- ✅ S3 + CloudFront - Frontend hosting
- ✅ Automatic on every git push
- ✅ No manual steps needed

### Option 2: GitHub Actions (Alternative)

**Files Created:**
- `.github/workflows/deploy-backend.yml` - Backend deployment
- `.github/workflows/deploy-frontend.yml` - Frontend deployment (Vercel)
- `.github/workflows/deploy-frontend-amplify.yml.example` - Alternative (Amplify)
- `docs/CI-CD-SETUP.md` - GitHub Actions guide

**What It Does:**
- Runs on GitHub's infrastructure
- Deploys backend to AWS
- Deploys frontend to Vercel or Amplify
- Simpler setup, fewer AWS resources

## Which Should You Use?

### Use AWS CodePipeline If:
- ✅ You want everything in AWS
- ✅ You prefer infrastructure as code (CDK)
- ✅ You need AWS-native monitoring
- ✅ You want S3 + CloudFront hosting
- ✅ You like the AWS Console experience

### Use GitHub Actions If:
- ✅ You want simpler YAML configuration
- ✅ You prefer Vercel for frontend hosting
- ✅ You want free tier (2000 min/month)
- ✅ You're familiar with GitHub Actions
- ✅ You want faster setup

## Quick Start: AWS CodePipeline

### Prerequisites:
- GitHub repository (create at github.com/new)
- GitHub Personal Access Token (Settings → Developer → Tokens)
- AWS CLI configured

### One-Time Setup:

```bash
cd availability-scheduler

# 1. Run setup script
./setup-pipeline.sh
# (Follow prompts - enter GitHub username, repo name, token)

# 2. Push code to GitHub
git remote add origin https://github.com/YOUR_USERNAME/availability-scheduler.git
git push -u origin main

# 3. Deploy the pipeline
cd backend/infrastructure
npx cdk bootstrap
npx cdk deploy AvailabilitySchedulerStack
npx cdk deploy AvailabilitySchedulerPipelineStack

# 4. Done! Your pipeline is live
```

### From Now On:
```bash
git add .
git commit -m "New feature"
git push

# AWS automatically:
# - Builds backend
# - Deploys Lambda, API Gateway, DynamoDB
# - Builds frontend with API URL
# - Uploads to S3
# - Invalidates CloudFront
# ✅ Live in ~5-8 minutes!
```

## Quick Start: GitHub Actions

### Prerequisites:
- GitHub repository
- AWS access keys

### Setup:

```bash
cd availability-scheduler

# 1. Push to GitHub
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/availability-scheduler.git
git push -u origin main

# 2. Add GitHub Secrets
# Go to: repo → Settings → Secrets → Actions
# Add:
#   - AWS_ACCESS_KEY_ID
#   - AWS_SECRET_ACCESS_KEY
#   - AWS_ACCOUNT_ID
#   - VERCEL_TOKEN (if using Vercel)

# 3. Done! Push triggers deployment
git add .
git commit -m "Trigger first deployment"
git push
```

## Monitoring Your Deployments

### AWS CodePipeline:
```bash
# Open AWS Console
open https://console.aws.amazon.com/codesuite/codepipeline/pipelines

# Or via CLI
aws codepipeline list-pipeline-executions \
  --pipeline-name AvailabilityScheduler-Pipeline
```

### GitHub Actions:
```bash
# Open GitHub Actions
open https://github.com/YOUR_USERNAME/availability-scheduler/actions

# Or watch in terminal
gh run watch
```

## Getting Your URLs

### After Successful Deployment:

```bash
# Backend API URL
aws cloudformation describe-stacks \
  --stack-name AvailabilitySchedulerStack \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiUrl`].OutputValue' \
  --output text

# Frontend URL (if using CodePipeline)
aws cloudformation describe-stacks \
  --stack-name AvailabilitySchedulerPipelineStack \
  --query 'Stacks[0].Outputs[?OutputKey==`FrontendUrl`].OutputValue' \
  --output text

# Or check CodePipeline console / GitHub Actions logs
```

## Cost Comparison

### AWS CodePipeline:
- **CodePipeline**: $1/month (1 free)
- **CodeBuild**: ~$0.03-0.05 per build (100 min/month free)
- **S3 + CloudFront**: $1-5/month
- **Total**: ~$2-7/month (free tier: ~$0-2/month)

### GitHub Actions:
- **GitHub Actions**: Free for public repos, 2000 min/month for private
- **Vercel**: Free tier for hobby projects
- **Backend (AWS)**: Same Lambda, API Gateway, DynamoDB costs
- **Total**: ~$0-3/month (free tier: $0)

## Features

### Both Options Support:
- ✅ Automatic deployment on git push
- ✅ Backend CDK deployment
- ✅ Frontend build with environment variables
- ✅ CloudWatch logging
- ✅ Manual triggers
- ✅ Multiple environments (main, staging)

### CodePipeline Extras:
- ✅ All-in-AWS
- ✅ CloudFront CDN
- ✅ S3 hosting
- ✅ Built-in artifact storage
- ✅ AWS Console monitoring

### GitHub Actions Extras:
- ✅ Free for public repos
- ✅ Simpler YAML config
- ✅ More deployment targets (Vercel, Netlify, etc.)
- ✅ GitHub-native experience
- ✅ Matrix builds

## Troubleshooting

### "Pipeline Failed - Source Stage"
**Issue**: Can't access GitHub

**Fix**:
```bash
# Check GitHub token
aws secretsmanager get-secret-value --secret-id github-token

# Update if expired
./setup-pipeline.sh
```

### "Build Failed - Backend"
**Issue**: CDK bootstrap needed

**Fix**: The buildspec auto-bootstraps, but you can manually:
```bash
cdk bootstrap aws://ACCOUNT_ID/REGION
```

### "Frontend Shows Old Version"
**Issue**: CloudFront cache

**Fix**:
```bash
# Invalidate cache
aws cloudfront create-invalidation \
  --distribution-id YOUR_DIST_ID \
  --paths "/*"
```

## Documentation

- **AWS Pipeline**: `docs/AWS-PIPELINE-SETUP.md` - Complete CodePipeline guide
- **GitHub Actions**: `docs/CI-CD-SETUP.md` - Complete GitHub Actions guide
- **General Deployment**: `docs/DEPLOYMENT.md` - Manual deployment steps
- **Project Overview**: `docs/PROJECT_SUMMARY.md` - Full project details

## Next Steps

1. ✅ Choose your CI/CD method (AWS or GitHub)
2. ✅ Follow the quick start above
3. ✅ Push code and watch it deploy
4. 🔄 Add automated tests
5. 🔄 Set up staging environment
6. 🔄 Configure custom domain
7. 🔄 Add monitoring alerts

## Support

**AWS CodePipeline Issues:**
- Check: CodePipeline Console → Build logs
- Check: CloudFormation stacks
- Check: CodeBuild logs

**GitHub Actions Issues:**
- Check: GitHub Actions tab
- Check: Workflow run logs
- Check: AWS CloudWatch

## Summary

You're all set with CI/CD! 🎉

**Your workflow is now:**
```
1. Write code
2. git commit
3. git push
4. ☕ Wait 5-8 minutes
5. ✅ App is live!
```

**No more:**
- ❌ Manual deployments
- ❌ Forgetting to update environment variables
- ❌ "It works on my machine"
- ❌ Deployment inconsistencies

**Just:**
- ✅ Push code
- ✅ Automatic builds
- ✅ Automatic deployments
- ✅ Consistent environments

Happy coding! 🚀
