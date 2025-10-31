import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { EventSummary } from '../../../shared/types';
import { getEventById } from '../services/eventService';
import { calculateTimeframeSummaries, getEventRespondents } from '../services/responseService';

/**
 * Lambda handler for getting event summary with aggregated responses
 */
export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  console.log('Get Summary - Request:', JSON.stringify(event, null, 2));

  try {
    const eventId = event.pathParameters?.eventId;

    if (!eventId) {
      return {
        statusCode: 400,
        headers: getCorsHeaders(),
        body: JSON.stringify({
          error: 'Event ID is required'
        })
      };
    }

    // Get event and timeframes
    const eventData = await getEventById(eventId);

    if (!eventData.event) {
      return {
        statusCode: 404,
        headers: getCorsHeaders(),
        body: JSON.stringify({
          error: 'Event not found'
        })
      };
    }

    // Get total respondents
    const respondents = await getEventRespondents(eventId);

    // Calculate timeframe summaries
    const timeframeIds = eventData.timeframes.map(tf => tf.timeframeId);
    const timeframeSummaries = await calculateTimeframeSummaries(eventId, timeframeIds);

    const response: EventSummary = {
      event: eventData.event,
      timeframes: eventData.timeframes,
      totalRespondents: respondents.length,
      timeframeSummaries
    };

    return {
      statusCode: 200,
      headers: getCorsHeaders(),
      body: JSON.stringify(response)
    };
  } catch (error) {
    console.error('Error getting summary:', error);

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
