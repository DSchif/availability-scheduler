#!/bin/bash

# Setup script for AWS CodePipeline CI/CD
# This script helps you set up automatic deployments

set -e

echo "========================================="
echo "Availability Scheduler - Pipeline Setup"
echo "========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check AWS CLI is configured
echo -e "${BLUE}[1/6] Checking AWS CLI configuration...${NC}"
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}Error: AWS CLI is not configured. Run 'aws configure' first.${NC}"
    exit 1
fi

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REGION=$(aws configure get region || echo "us-east-1")
echo -e "${GREEN}✓ AWS Account: $ACCOUNT_ID${NC}"
echo -e "${GREEN}✓ Region: $REGION${NC}"
echo ""

# Get GitHub information
echo -e "${BLUE}[2/6] GitHub Repository Configuration${NC}"
read -p "Enter your GitHub username: " GITHUB_USER
read -p "Enter your GitHub repository name [availability-scheduler]: " GITHUB_REPO
GITHUB_REPO=${GITHUB_REPO:-availability-scheduler}
read -p "Enter branch name [main]: " GITHUB_BRANCH
GITHUB_BRANCH=${GITHUB_BRANCH:-main}
echo ""

# Get GitHub token
echo -e "${BLUE}[3/6] GitHub Personal Access Token${NC}"
echo "You need a GitHub Personal Access Token with 'repo' and 'admin:repo_hook' scopes."
echo "Create one at: https://github.com/settings/tokens"
echo ""
read -sp "Enter your GitHub Personal Access Token: " GITHUB_TOKEN
echo ""

if [ -z "$GITHUB_TOKEN" ]; then
    echo -e "${RED}Error: GitHub token is required${NC}"
    exit 1
fi

# Store token in AWS Secrets Manager
echo -e "${BLUE}[4/6] Storing GitHub token in AWS Secrets Manager...${NC}"
if aws secretsmanager describe-secret --secret-id github-token --region $REGION &> /dev/null; then
    echo "Secret already exists, updating..."
    aws secretsmanager update-secret \
        --secret-id github-token \
        --secret-string "$GITHUB_TOKEN" \
        --region $REGION > /dev/null
else
    echo "Creating new secret..."
    aws secretsmanager create-secret \
        --name github-token \
        --description "GitHub Personal Access Token for CodePipeline" \
        --secret-string "$GITHUB_TOKEN" \
        --region $REGION > /dev/null
fi
echo -e "${GREEN}✓ GitHub token stored securely${NC}"
echo ""

# Update CDK configuration
echo -e "${BLUE}[5/6] Configuring CDK Pipeline Stack...${NC}"
CDK_APP_FILE="backend/infrastructure/bin/app.ts"

# Uncomment and configure the pipeline stack
sed -i.bak "s/YOUR_GITHUB_USERNAME/$GITHUB_USER/g" "$CDK_APP_FILE"
sed -i.bak "s/availability-scheduler/$GITHUB_REPO/g" "$CDK_APP_FILE"

# Uncomment the pipeline stack
awk '
/\/\* *$/ {in_comment=1; print "/*"}
in_comment && /\*\/ *$/ {in_comment=0; print "*/"; next}
!in_comment {print}
' "$CDK_APP_FILE" > "$CDK_APP_FILE.tmp"

# Actually uncomment (remove /* and */)
sed '/^\/\*/d; /^\*\/$/d' "$CDK_APP_FILE.tmp" > "$CDK_APP_FILE"
rm "$CDK_APP_FILE.tmp" "$CDK_APP_FILE.bak"

echo -e "${GREEN}✓ CDK configuration updated${NC}"
echo ""

# Initialize git if not already done
echo -e "${BLUE}[6/6] Git Setup${NC}"
if [ ! -d ".git" ]; then
    echo "Initializing git repository..."
    git init
    git add .
    git commit -m "Initial commit: Availability Scheduler with CI/CD"
    echo -e "${GREEN}✓ Git repository initialized${NC}"
else
    echo -e "${GREEN}✓ Git repository already initialized${NC}"
fi

# Check if remote exists
if ! git remote get-url origin &> /dev/null; then
    echo ""
    echo -e "${YELLOW}Next steps:${NC}"
    echo "1. Create a GitHub repository at: https://github.com/new"
    echo "2. Name it: $GITHUB_REPO"
    echo "3. Run these commands:"
    echo ""
    echo -e "${GREEN}   git remote add origin https://github.com/$GITHUB_USER/$GITHUB_REPO.git${NC}"
    echo -e "${GREEN}   git branch -M $GITHUB_BRANCH${NC}"
    echo -e "${GREEN}   git push -u origin $GITHUB_BRANCH${NC}"
else
    echo -e "${GREEN}✓ Git remote already configured${NC}"
fi

echo ""
echo "========================================="
echo -e "${GREEN}Setup Complete!${NC}"
echo "========================================="
echo ""
echo "Next steps:"
echo ""
echo "1. If not done already, create GitHub repo and push code (see above)"
echo ""
echo "2. Deploy the application stack:"
echo -e "   ${GREEN}cd backend/infrastructure${NC}"
echo -e "   ${GREEN}npx cdk deploy AvailabilitySchedulerStack${NC}"
echo ""
echo "3. Deploy the CI/CD pipeline:"
echo -e "   ${GREEN}npx cdk deploy AvailabilitySchedulerPipelineStack${NC}"
echo ""
echo "4. Monitor pipeline at:"
echo "   https://console.aws.amazon.com/codesuite/codepipeline/pipelines"
echo ""
echo "From now on, just:"
echo -e "   ${GREEN}git add .${NC}"
echo -e "   ${GREEN}git commit -m \"Your changes\"${NC}"
echo -e "   ${GREEN}git push${NC}"
echo ""
echo "AWS will automatically deploy everything!"
echo ""
