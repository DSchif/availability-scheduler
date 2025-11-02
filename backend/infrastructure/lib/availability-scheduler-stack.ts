import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
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

    // Lambda environment variables
    const lambdaEnvironment = {
      TABLE_NAME: table.tableName,
      NODE_OPTIONS: '--enable-source-maps'
    };

    // Common Lambda configuration
    const lambdaDefaults = {
      runtime: lambda.Runtime.NODEJS_18_X,
      memorySize: 512,
      timeout: cdk.Duration.seconds(30),
      environment: lambdaEnvironment,
      bundling: {
        minify: true,
        sourceMap: true,
        externalModules: ['@aws-sdk/*']
      }
    };

    // Create Event Lambda
    const createEventFn = new NodejsFunction(this, 'CreateEventFunction', {
      ...lambdaDefaults,
      functionName: 'AvailabilityScheduler-CreateEvent',
      description: 'Creates a new availability event',
      entry: path.join(__dirname, '../../src/handlers/createEvent.ts'),
      handler: 'handler'
    });

    // Get Event Lambda
    const getEventFn = new NodejsFunction(this, 'GetEventFunction', {
      ...lambdaDefaults,
      functionName: 'AvailabilityScheduler-GetEvent',
      description: 'Gets an event by ID or share code',
      entry: path.join(__dirname, '../../src/handlers/getEvent.ts'),
      handler: 'handler'
    });

    // Submit Responses Lambda
    const submitResponsesFn = new NodejsFunction(this, 'SubmitResponsesFunction', {
      ...lambdaDefaults,
      functionName: 'AvailabilityScheduler-SubmitResponses',
      description: 'Submits or updates availability responses',
      entry: path.join(__dirname, '../../src/handlers/submitResponses.ts'),
      handler: 'handler'
    });

    // Get Summary Lambda
    const getSummaryFn = new NodejsFunction(this, 'GetSummaryFunction', {
      ...lambdaDefaults,
      functionName: 'AvailabilityScheduler-GetSummary',
      description: 'Gets aggregated summary for an event',
      entry: path.join(__dirname, '../../src/handlers/getSummary.ts'),
      handler: 'handler'
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
        metricsEnabled: true
        // Logging requires CloudWatch Logs role to be configured in API Gateway settings
        // loggingLevel: apigateway.MethodLoggingLevel.INFO,
        // dataTraceEnabled: true
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
