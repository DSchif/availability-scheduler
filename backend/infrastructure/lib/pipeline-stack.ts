import * as cdk from 'aws-cdk-lib';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export interface PipelineStackProps extends cdk.StackProps {
  githubOwner: string;
  githubRepo: string;
  githubBranch?: string;
}

export class PipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: PipelineStackProps) {
    super(scope, id, props);

    const githubBranch = props.githubBranch || 'main';

    // S3 bucket for frontend hosting
    const frontendBucket = new s3.Bucket(this, 'FrontendBucket', {
      bucketName: `availability-scheduler-frontend-${this.account}`,
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'index.html',
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      autoDeleteObjects: false,
      versioned: true
    });

    // CloudFront Origin Access Identity
    const originAccessIdentity = new cloudfront.OriginAccessIdentity(this, 'OAI');
    frontendBucket.grantRead(originAccessIdentity);

    // CloudFront Distribution
    const distribution = new cloudfront.Distribution(this, 'FrontendDistribution', {
      defaultBehavior: {
        origin: new origins.S3Origin(frontendBucket, {
          originAccessIdentity
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        originRequestPolicy: cloudfront.OriginRequestPolicy.CORS_S3_ORIGIN
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.minutes(5)
        },
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.minutes(5)
        }
      ],
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100
    });

    // Artifact buckets
    const artifactBucket = new s3.Bucket(this, 'ArtifactBucket', {
      bucketName: `availability-scheduler-artifacts-${this.account}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      encryption: s3.BucketEncryption.S3_MANAGED
    });

    // Source artifact
    const sourceOutput = new codepipeline.Artifact('SourceOutput');

    // Backend build artifacts
    const backendBuildOutput = new codepipeline.Artifact('BackendBuildOutput');

    // Frontend build artifacts
    const frontendBuildOutput = new codepipeline.Artifact('FrontendBuildOutput');

    // CodeBuild project for backend
    const backendBuildProject = new codebuild.PipelineProject(this, 'BackendBuild', {
      projectName: 'AvailabilityScheduler-Backend',
      buildSpec: codebuild.BuildSpec.fromSourceFilename('backend/buildspec.yml'),
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        computeType: codebuild.ComputeType.SMALL,
        privileged: false
      },
      environmentVariables: {
        AWS_ACCOUNT_ID: {
          value: this.account
        },
        AWS_REGION: {
          value: this.region
        }
      }
    });

    // Grant permissions for CDK deploy
    backendBuildProject.addToRolePolicy(new iam.PolicyStatement({
      actions: [
        'cloudformation:*',
        'lambda:*',
        'apigateway:*',
        'dynamodb:*',
        'iam:*',
        's3:*',
        'logs:*'
      ],
      resources: ['*']
    }));

    // CodeBuild project for frontend
    const frontendBuildProject = new codebuild.PipelineProject(this, 'FrontendBuild', {
      projectName: 'AvailabilityScheduler-Frontend',
      buildSpec: codebuild.BuildSpec.fromSourceFilename('frontend/buildspec.yml'),
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        computeType: codebuild.ComputeType.SMALL
      },
      environmentVariables: {
        FRONTEND_BUCKET: {
          value: frontendBucket.bucketName
        },
        DISTRIBUTION_ID: {
          value: distribution.distributionId
        },
        API_STACK_NAME: {
          value: 'AvailabilitySchedulerStack'
        }
      }
    });

    // Grant permissions for frontend deployment
    frontendBucket.grantReadWrite(frontendBuildProject);
    frontendBuildProject.addToRolePolicy(new iam.PolicyStatement({
      actions: [
        'cloudfront:CreateInvalidation',
        'cloudformation:DescribeStacks'
      ],
      resources: ['*']
    }));

    // GitHub connection (OAuth token from Secrets Manager)
    const githubToken = cdk.SecretValue.secretsManager('github-token');

    // Create the pipeline
    const pipeline = new codepipeline.Pipeline(this, 'Pipeline', {
      pipelineName: 'AvailabilityScheduler-Pipeline',
      artifactBucket: artifactBucket,
      restartExecutionOnUpdate: true
    });

    // Source stage
    pipeline.addStage({
      stageName: 'Source',
      actions: [
        new codepipeline_actions.GitHubSourceAction({
          actionName: 'GitHub_Source',
          owner: props.githubOwner,
          repo: props.githubRepo,
          branch: githubBranch,
          oauthToken: githubToken,
          output: sourceOutput,
          trigger: codepipeline_actions.GitHubTrigger.WEBHOOK
        })
      ]
    });

    // Build backend stage
    pipeline.addStage({
      stageName: 'Build_Backend',
      actions: [
        new codepipeline_actions.CodeBuildAction({
          actionName: 'Build_and_Deploy_Backend',
          project: backendBuildProject,
          input: sourceOutput,
          outputs: [backendBuildOutput]
        })
      ]
    });

    // Build and deploy frontend stage
    pipeline.addStage({
      stageName: 'Build_Deploy_Frontend',
      actions: [
        new codepipeline_actions.CodeBuildAction({
          actionName: 'Build_and_Deploy_Frontend',
          project: frontendBuildProject,
          input: sourceOutput,
          outputs: [frontendBuildOutput]
        })
      ]
    });

    // Outputs
    new cdk.CfnOutput(this, 'PipelineName', {
      value: pipeline.pipelineName,
      description: 'CodePipeline name'
    });

    new cdk.CfnOutput(this, 'FrontendUrl', {
      value: `https://${distribution.distributionDomainName}`,
      description: 'Frontend CloudFront URL'
    });

    new cdk.CfnOutput(this, 'FrontendBucketName', {
      value: frontendBucket.bucketName,
      description: 'Frontend S3 bucket name'
    });

    new cdk.CfnOutput(this, 'DistributionId', {
      value: distribution.distributionId,
      description: 'CloudFront distribution ID'
    });
  }
}
