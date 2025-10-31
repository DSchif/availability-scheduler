#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AvailabilitySchedulerStack } from '../lib/availability-scheduler-stack';
import { PipelineStack } from '../lib/pipeline-stack';

const app = new cdk.App();

// Main application stack
new AvailabilitySchedulerStack(app, 'AvailabilitySchedulerStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1'
  },
  description: 'Availability Scheduler - Group scheduling and availability tracking application'
});

// CI/CD Pipeline stack
new PipelineStack(app, 'AvailabilitySchedulerPipelineStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1'
  },
  githubOwner: 'DSchif',
  githubRepo: 'availability-scheduler',
  githubBranch: 'main',
  description: 'CI/CD Pipeline for Availability Scheduler'
});

app.synth();
