import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import * as path from 'path';

export class AvailabilitySchedulerStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // DynamoDB Table
    const table = new dynamodb.Table(this, 'AvailabilitySchedulerTable', {
      tableName: 'AvailabilityScheduler',
      partitionKey: {
        name: 'PK',
        type: dynamodb.AttributeType.STRING
      },
      sortKey: {
        name: 'SK',
        type: dynamodb.AttributeType.STRING
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      pointInTimeRecovery: true,
      timeToLiveAttribute: 'ttl'
    });

    // Global Secondary Index for share code lookup
    table.addGlobalSecondaryIndex({
      indexName: 'GSI1',
      partitionKey: {
        name: 'PK',
        type: dynamodb.AttributeType.STRING
      },
      sortKey: {
        name: 'SK',
        type: dynamodb.AttributeType.STRING
      },
      projectionType: dynamodb.ProjectionType.ALL
    });

    // Lambda execution role environment variables
    const lambdaEnvironment = {
      TABLE_NAME: table.tableName,
      NODE_OPTIONS: '--enable-source-maps'
    };

    // Lambda function configurations
    const lambdaConfig = {
      runtime: lambda.Runtime.NODEJS_18_X,
      memorySize: 512,
      timeout: cdk.Duration.seconds(30),
      environment: lambdaEnvironment,
      logRetention: logs.RetentionDays.ONE_WEEK,
      bundling: {
        minify: true,
        sourceMap: true,
        target: 'es2020',
        externalModules: ['aws-sdk']
      }
    };

    // Create Event Lambda
    const createEventFn = new lambda.Function(this, 'CreateEventFunction', {
      ...lambdaConfig,
      functionName: 'AvailabilityScheduler-CreateEvent',
      description: 'Creates a new availability event',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../'), {
        bundling: {
          image: lambda.Runtime.NODEJS_18_X.bundlingImage,
          command: [
            'bash', '-c',
            'npm install && npx esbuild src/handlers/createEvent.ts --bundle --outfile=/asset-output/index.js --platform=node --target=es2020 --external:aws-sdk --sourcemap'
          ]
        }
      }),
      handler: 'index.handler'
    });

    // Get Event Lambda
    const getEventFn = new lambda.Function(this, 'GetEventFunction', {
      ...lambdaConfig,
      functionName: 'AvailabilityScheduler-GetEvent',
      description: 'Gets an event by ID or share code',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../'), {
        bundling: {
          image: lambda.Runtime.NODEJS_18_X.bundlingImage,
          command: [
            'bash', '-c',
            'npm install && npx esbuild src/handlers/getEvent.ts --bundle --outfile=/asset-output/index.js --platform=node --target=es2020 --external:aws-sdk --sourcemap'
          ]
        }
      }),
      handler: 'index.handler'
    });

    // Submit Responses Lambda
    const submitResponsesFn = new lambda.Function(this, 'SubmitResponsesFunction', {
      ...lambdaConfig,
      functionName: 'AvailabilityScheduler-SubmitResponses',
      description: 'Submits or updates availability responses',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../'), {
        bundling: {
          image: lambda.Runtime.NODEJS_18_X.bundlingImage,
          command: [
            'bash', '-c',
            'npm install && npx esbuild src/handlers/submitResponses.ts --bundle --outfile=/asset-output/index.js --platform=node --target=es2020 --external:aws-sdk --sourcemap'
          ]
        }
      }),
      handler: 'index.handler'
    });

    // Get Summary Lambda
    const getSummaryFn = new lambda.Function(this, 'GetSummaryFunction', {
      ...lambdaConfig,
      functionName: 'AvailabilityScheduler-GetSummary',
      description: 'Gets aggregated summary for an event',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../'), {
        bundling: {
          image: lambda.Runtime.NODEJS_18_X.bundlingImage,
          command: [
            'bash', '-c',
            'npm install && npx esbuild src/handlers/getSummary.ts --bundle --outfile=/asset-output/index.js --platform=node --target=es2020 --external:aws-sdk --sourcemap'
          ]
        }
      }),
      handler: 'index.handler'
    });

    // Grant DynamoDB permissions to all Lambda functions
    table.grantReadWriteData(createEventFn);
    table.grantReadData(getEventFn);
    table.grantReadWriteData(submitResponsesFn);
    table.grantReadData(getSummaryFn);

    // API Gateway
    const api = new apigateway.RestApi(this, 'AvailabilitySchedulerApi', {
      restApiName: 'Availability Scheduler API',
      description: 'API for availability scheduling application',
      deployOptions: {
        stageName: 'prod',
        throttlingRateLimit: 100,
        throttlingBurstLimit: 200,
        metricsEnabled: true,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
          'X-Amz-Security-Token'
        ]
      }
    });

    // API Routes
    const events = api.root.addResource('events');

    // POST /events - Create event
    events.addMethod('POST', new apigateway.LambdaIntegration(createEventFn));

    // GET /events/{eventId} - Get event by ID
    const eventById = events.addResource('{eventId}');
    eventById.addMethod('GET', new apigateway.LambdaIntegration(getEventFn));

    // GET /events/code/{shareCode} - Get event by share code
    const eventsByCode = events.addResource('code');
    const eventByShareCode = eventsByCode.addResource('{shareCode}');
    eventByShareCode.addMethod('GET', new apigateway.LambdaIntegration(getEventFn));

    // POST /events/{eventId}/responses - Submit responses
    const responses = eventById.addResource('responses');
    responses.addMethod('POST', new apigateway.LambdaIntegration(submitResponsesFn));

    // PUT /events/{eventId}/responses/{respondentId} - Update responses
    const respondentResponses = responses.addResource('{respondentId}');
    respondentResponses.addMethod('PUT', new apigateway.LambdaIntegration(submitResponsesFn));

    // GET /events/{eventId}/summary - Get event summary
    const summary = eventById.addResource('summary');
    summary.addMethod('GET', new apigateway.LambdaIntegration(getSummaryFn));

    // Outputs
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'API Gateway URL',
      exportName: 'AvailabilitySchedulerApiUrl'
    });

    new cdk.CfnOutput(this, 'TableName', {
      value: table.tableName,
      description: 'DynamoDB Table Name',
      exportName: 'AvailabilitySchedulerTableName'
    });
  }
}
