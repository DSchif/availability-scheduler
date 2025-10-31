# Deployment Guide

This guide walks you through deploying the Availability Scheduler application to AWS.

## Prerequisites

- AWS account with appropriate permissions
- AWS CLI configured with credentials
- Node.js 18+ installed
- AWS CDK CLI installed (`npm install -g aws-cdk`)

## Step 1: Install Dependencies

### Backend
```bash
cd backend
npm install
```

### Frontend
```bash
cd frontend
npm install
```

## Step 2: Bootstrap AWS CDK

If this is your first time using CDK in this AWS account/region:

```bash
cd backend
npm run bootstrap
```

This creates the necessary S3 bucket and other resources for CDK deployments.

## Step 3: Deploy Backend

```bash
cd backend
npm run deploy
```

This will:
1. Build and bundle your Lambda functions
2. Create the DynamoDB table
3. Set up API Gateway
4. Deploy all infrastructure

**Important**: Save the API URL from the output! You'll need it for the frontend.

Example output:
```
Outputs:
AvailabilitySchedulerStack.ApiUrl = https://abc123xyz.execute-api.us-east-1.amazonaws.com/prod/
```

## Step 4: Configure Frontend

1. Create `.env.local` file in the frontend directory:

```bash
cd frontend
cp .env.example .env.local
```

2. Edit `.env.local` and add your API URL:

```
NEXT_PUBLIC_API_URL=https://abc123xyz.execute-api.us-east-1.amazonaws.com/prod
```

## Step 5: Test Locally

```bash
cd frontend
npm run dev
```

Visit `http://localhost:3000` and test the application.

## Step 6: Deploy Frontend

You have several options for deploying the frontend:

### Option A: AWS Amplify (Recommended)

1. Push your code to GitHub
2. Go to AWS Amplify Console
3. Click "New app" → "Host web app"
4. Connect your GitHub repository
5. Add environment variable:
   - Key: `NEXT_PUBLIC_API_URL`
   - Value: Your API Gateway URL
6. Deploy

### Option B: Vercel

1. Push your code to GitHub
2. Go to vercel.com and sign in
3. Import your repository
4. Set root directory to `frontend`
5. Add environment variable:
   - `NEXT_PUBLIC_API_URL`: Your API Gateway URL
6. Deploy

### Option C: S3 + CloudFront (Manual)

1. Build the frontend:
```bash
cd frontend
npm run build
```

2. Export static files (if using static export):
```bash
next export
```

3. Create S3 bucket for static hosting
4. Upload files to S3
5. Create CloudFront distribution pointing to S3
6. Configure custom domain (optional)

## Step 7: Post-Deployment

1. Test the live application
2. Create a test event
3. Share with a few people to test responses
4. Monitor CloudWatch logs for any errors

## Environment-Specific Deployments

### Development
```bash
cd backend/infrastructure
cdk deploy --context environment=dev
```

### Production
```bash
cd backend/infrastructure
cdk deploy --context environment=prod
```

## Monitoring

### CloudWatch Logs
- Lambda logs: `/aws/lambda/AvailabilityScheduler-*`
- API Gateway logs: Check API Gateway console

### CloudWatch Metrics
- Lambda invocations
- API Gateway requests
- DynamoDB read/write capacity

## Costs

Expected monthly costs (low-medium usage):
- DynamoDB: $5-20
- Lambda: $5-15
- API Gateway: $3-10
- S3 + CloudFront: $1-5
- **Total: ~$15-50/month**

## Troubleshooting

### CORS Errors
- Check API Gateway CORS configuration
- Verify frontend is using correct API URL

### Lambda Timeout
- Increase timeout in CDK stack
- Check CloudWatch logs for errors

### DynamoDB Throttling
- Switch to provisioned capacity if needed
- Check CloudWatch metrics

### Frontend Build Errors
- Verify all environment variables are set
- Check Node.js version compatibility

## Cleanup

To delete all AWS resources:

```bash
cd backend
npm run cdk destroy
```

**Warning**: This will delete the DynamoDB table and all data!

## Security Best Practices

1. Enable WAF on API Gateway for production
2. Set up CloudWatch alarms for errors and usage
3. Use AWS Secrets Manager for sensitive config
4. Enable DynamoDB point-in-time recovery
5. Set up automated backups
6. Implement rate limiting on API Gateway

## Next Steps

1. Set up custom domain name
2. Configure email notifications (AWS SES)
3. Add user authentication (optional)
4. Set up CI/CD pipeline
5. Implement monitoring dashboard
