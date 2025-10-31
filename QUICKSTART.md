# Quick Start Guide

You have TWO options for deployment:

## Option 1: Automatic CI/CD with AWS CodePipeline (Recommended)

**One-time setup, then just git push to deploy!**

### Quick Setup:
```bash
cd availability-scheduler

# Run the setup script
./setup-pipeline.sh

# Follow prompts to configure GitHub integration
# Then deploy the pipeline:
cd backend/infrastructure
npx cdk bootstrap  # First time only
npx cdk deploy AvailabilitySchedulerStack
npx cdk deploy AvailabilitySchedulerPipelineStack
```

**That's it!** From now on, just:
```bash
git add .
git commit -m "Your changes"
git push
```

AWS automatically deploys everything! See `docs/AWS-PIPELINE-SETUP.md` for details.

---

## Option 2: Manual Deployment

### 1. Install Backend Dependencies
```bash
cd availability-scheduler/backend
npm install
```

### 2. Bootstrap AWS CDK (First Time Only)
```bash
cd infrastructure
npx cdk bootstrap
```

### 3. Deploy Backend to AWS
```bash
npx cdk deploy AvailabilitySchedulerStack
```

**Important**: Save the API URL from the output!
```
Outputs:
AvailabilitySchedulerStack.ApiUrl = https://xxxxx.execute-api.us-east-1.amazonaws.com/prod/
```

### 4. Setup Frontend
```bash
cd ../../frontend
npm install

# Create environment file
cp .env.example .env.local

# Edit .env.local and add your API URL
# NEXT_PUBLIC_API_URL=https://xxxxx.execute-api.us-east-1.amazonaws.com/prod
```

### 5. Test Locally
```bash
npm run dev
```

Visit http://localhost:3000

### 6. Deploy Frontend

**Option A - Vercel (Easiest)**
1. Push to GitHub
2. Import to Vercel
3. Set `NEXT_PUBLIC_API_URL` environment variable
4. Deploy

**Option B - AWS Amplify**
1. Push to GitHub
2. Connect to Amplify
3. Set `NEXT_PUBLIC_API_URL` environment variable
4. Deploy

## Project Structure

```
availability-scheduler/
├── backend/          # AWS Lambda + DynamoDB + CDK
├── frontend/         # Next.js 14 application
├── shared/           # Shared TypeScript types
└── docs/            # Documentation
```

## What's Included

✅ Full serverless backend (AWS Lambda, DynamoDB, API Gateway)
✅ Modern React frontend (Next.js 14, TypeScript, Tailwind)
✅ 4 timeframe types (weekends, weekdays, all days, specific dates)
✅ 3-level availability (Preferred, Could Make, Not Available)
✅ Real-time results with scoring
✅ Share code system
✅ Responsive mobile design
✅ Complete documentation

## Key Files

- `backend/infrastructure/lib/availability-scheduler-stack.ts` - CDK infrastructure
- `backend/src/handlers/` - Lambda functions
- `frontend/src/app/` - Next.js pages
- `shared/types/index.ts` - Shared TypeScript types
- `docs/DEPLOYMENT.md` - Full deployment guide
- `docs/PROJECT_SUMMARY.md` - Complete project overview

## Next Steps

1. Deploy and test the application
2. Share with users to collect feedback
3. Review `docs/PROJECT_SUMMARY.md` for enhancement ideas
4. Monitor CloudWatch for usage and errors

## Support

See detailed documentation in:
- `README.md` - Overview and architecture
- `docs/DEPLOYMENT.md` - Deployment instructions
- `docs/PROJECT_SUMMARY.md` - Complete project details

## Costs

Expected: $15-50/month for moderate usage
AWS Free Tier covers most development/testing

Enjoy your new Availability Scheduler! 🎉
