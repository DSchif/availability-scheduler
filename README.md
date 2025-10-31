# Availability Scheduler

A serverless web application that allows groups to coordinate and find the best time for events by collecting availability preferences.

## Features

- Create scheduling events with customizable date ranges
- Multiple timeframe types: weekends, weekdays, all days, or specific dates
- Easy sharing via unique codes
- Three-level availability selection: Preferred, Could Make, Absolutely Not
- Real-time aggregated results with scoring
- Serverless architecture for scalability and low cost
- Mobile-responsive interface

## Architecture

### Backend
- **AWS Lambda**: Serverless compute for API endpoints
- **API Gateway**: REST API management
- **DynamoDB**: NoSQL database for events, responses, and metadata
- **AWS CDK**: Infrastructure as Code

### Frontend
- **Next.js**: React framework with SSR
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling

## Project Structure

```
availability-scheduler/
├── backend/                    # Backend Lambda functions and infrastructure
│   ├── src/
│   │   ├── handlers/          # Lambda function handlers
│   │   ├── services/          # Business logic
│   │   ├── models/            # Data models
│   │   └── utils/             # Utilities
│   ├── infrastructure/        # AWS CDK code
│   │   ├── bin/              # CDK app entry point
│   │   └── lib/              # CDK stacks
│   └── tests/                # Backend tests
├── frontend/                  # Next.js application
├── shared/                    # Shared TypeScript types
└── docs/                      # Documentation

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- AWS CLI configured with credentials
- AWS CDK CLI (`npm install -g aws-cdk`)

### Backend Setup

1. Install dependencies:
```bash
cd backend
npm install
```

2. Bootstrap CDK (first time only):
```bash
npm run bootstrap
```

3. Deploy the backend:
```bash
npm run deploy
```

This will:
- Create DynamoDB table
- Deploy Lambda functions
- Set up API Gateway
- Output the API URL

### Frontend Setup

1. Install dependencies:
```bash
cd frontend
npm install
```

2. Create `.env.local` file:
```bash
NEXT_PUBLIC_API_URL=<your-api-gateway-url>
```

3. Run development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
npm start
```

## API Endpoints

### Create Event
```
POST /events
Body: {
  title: string
  description?: string
  startDate: string (ISO)
  endDate: string (ISO)
  timeframeType: "weekend" | "weekday" | "all_days" | "specific_dates"
  creatorName: string
  creatorEmail?: string
}
```

### Get Event
```
GET /events/{eventId}
GET /events/code/{shareCode}
```

### Submit Responses
```
POST /events/{eventId}/responses
Body: {
  respondentName: string
  respondentEmail?: string
  responses: [{
    timeframeId: string
    availability: "preferred" | "could_make" | "not_available"
  }]
}
```

### Update Responses
```
PUT /events/{eventId}/responses/{respondentId}
Body: Same as POST
```

### Get Summary
```
GET /events/{eventId}/summary
```

## Development

### Running Tests
```bash
# Backend
cd backend
npm test

# Frontend
cd frontend
npm test
```

### TypeScript Compilation
```bash
cd backend
npm run build
```

### CDK Commands
```bash
cd backend

# Synthesize CloudFormation template
npm run synth

# Deploy to AWS
npm run deploy

# Destroy stack
npm run cdk destroy
```

## Deployment

### Backend
The backend is deployed using AWS CDK to AWS Lambda and related services.

### Frontend
The frontend can be deployed to:
- **AWS Amplify** (recommended for Next.js)
- **Vercel** (easy deployment)
- **S3 + CloudFront** (manual setup)

## Cost Estimation

With moderate usage (100-500 events/month):
- DynamoDB: $5-20/month
- Lambda: $5-15/month
- API Gateway: $3-10/month
- S3 + CloudFront: $1-5/month
- **Total: ~$15-50/month**

Free tier covers most development and low-traffic usage.

## License

MIT
