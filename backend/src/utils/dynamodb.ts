import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  QueryCommand,
  UpdateCommand,
  BatchWriteCommand
} from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
export const ddbDocClient = DynamoDBDocumentClient.from(client);

export const TABLE_NAME = process.env.TABLE_NAME || 'AvailabilityScheduler';

/**
 * Helper function to create consistent partition and sort keys
 */
export const keys = {
  event: (eventId: string) => ({
    PK: `EVENT#${eventId}`,
    SK: 'METADATA'
  }),

  timeframe: (eventId: string, timeframeId: string) => ({
    PK: `EVENT#${eventId}`,
    SK: `TIMEFRAME#${timeframeId}`
  }),

  response: (eventId: string, respondentId: string, timeframeId: string) => ({
    PK: `EVENT#${eventId}`,
    SK: `RESPONSE#${respondentId}#${timeframeId}`
  }),

  respondent: (eventId: string, respondentId: string) => ({
    PK: `EVENT#${eventId}`,
    SK: `RESPONDENT#${respondentId}`
  }),

  shareCode: (shareCode: string) => ({
    PK: `SHARECODE#${shareCode}`,
    SK: 'METADATA'
  })
};

/**
 * Put item into DynamoDB
 */
export async function putItem(item: Record<string, any>) {
  const command = new PutCommand({
    TableName: TABLE_NAME,
    Item: item
  });

  return await ddbDocClient.send(command);
}

/**
 * Get item from DynamoDB
 */
export async function getItem(key: Record<string, string>) {
  const command = new GetCommand({
    TableName: TABLE_NAME,
    Key: key
  });

  const result = await ddbDocClient.send(command);
  return result.Item;
}

/**
 * Query items from DynamoDB
 */
export async function queryItems(
  keyConditionExpression: string,
  expressionAttributeValues: Record<string, any>,
  expressionAttributeNames?: Record<string, string>
) {
  const command = new QueryCommand({
    TableName: TABLE_NAME,
    KeyConditionExpression: keyConditionExpression,
    ExpressionAttributeValues: expressionAttributeValues,
    ExpressionAttributeNames: expressionAttributeNames
  });

  const result = await ddbDocClient.send(command);
  return result.Items || [];
}

/**
 * Query using GSI
 */
export async function queryGSI(
  indexName: string,
  keyConditionExpression: string,
  expressionAttributeValues: Record<string, any>
) {
  const command = new QueryCommand({
    TableName: TABLE_NAME,
    IndexName: indexName,
    KeyConditionExpression: keyConditionExpression,
    ExpressionAttributeValues: expressionAttributeValues
  });

  const result = await ddbDocClient.send(command);
  return result.Items || [];
}

/**
 * Update item in DynamoDB
 */
export async function updateItem(
  key: Record<string, string>,
  updateExpression: string,
  expressionAttributeValues: Record<string, any>,
  expressionAttributeNames?: Record<string, string>
) {
  const command = new UpdateCommand({
    TableName: TABLE_NAME,
    Key: key,
    UpdateExpression: updateExpression,
    ExpressionAttributeValues: expressionAttributeValues,
    ExpressionAttributeNames: expressionAttributeNames,
    ReturnValues: 'ALL_NEW'
  });

  const result = await ddbDocClient.send(command);
  return result.Attributes;
}

/**
 * Batch write items to DynamoDB
 */
export async function batchWriteItems(items: Record<string, any>[]) {
  const putRequests = items.map(item => ({
    PutRequest: {
      Item: item
    }
  }));

  // DynamoDB batch write has a limit of 25 items
  const batches = [];
  for (let i = 0; i < putRequests.length; i += 25) {
    batches.push(putRequests.slice(i, i + 25));
  }

  for (const batch of batches) {
    const command = new BatchWriteCommand({
      RequestItems: {
        [TABLE_NAME]: batch
      }
    });

    await ddbDocClient.send(command);
  }
}
