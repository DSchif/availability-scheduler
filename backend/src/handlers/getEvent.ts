import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { GetEventResponse } from '../../../shared/types';
import { getEventById, getEventByShareCode } from '../services/eventService';

/**
 * Lambda handler for getting an event by ID or share code
 */
export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  console.log('Get Event - Request:', JSON.stringify(event, null, 2));

  try {
    const eventId = event.pathParameters?.eventId;
    const shareCode = event.pathParameters?.shareCode;

    if (!eventId && !shareCode) {
      return {
        statusCode: 400,
        headers: getCorsHeaders(),
        body: JSON.stringify({
          error: 'Event ID or share code is required'
        })
      };
    }

    let result;

    if (shareCode) {
      result = await getEventByShareCode(shareCode.toUpperCase());
    } else if (eventId) {
      result = await getEventById(eventId);
    }

    if (!result || !result.event) {
      return {
        statusCode: 404,
        headers: getCorsHeaders(),
        body: JSON.stringify({
          error: 'Event not found'
        })
      };
    }

    const response: GetEventResponse = {
      event: result.event,
      timeframes: result.timeframes
    };

    return {
      statusCode: 200,
      headers: getCorsHeaders(),
      body: JSON.stringify(response)
    };
  } catch (error) {
    console.error('Error getting event:', error);

    return {
      statusCode: 500,
      headers: getCorsHeaders(),
      body: JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
}

/**
 * Returns CORS headers
 */
function getCorsHeaders() {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
  };
}
