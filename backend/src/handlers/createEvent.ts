import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { CreateEventRequest, CreateEventResponse } from '../../../shared/types';
import { createEvent } from '../services/eventService';

/**
 * Lambda handler for creating a new event
 */
export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  console.log('Create Event - Request:', JSON.stringify(event, null, 2));

  try {
    // Parse request body
    if (!event.body) {
      return {
        statusCode: 400,
        headers: getCorsHeaders(),
        body: JSON.stringify({
          error: 'Missing request body'
        })
      };
    }

    const request: CreateEventRequest = JSON.parse(event.body);

    // Validate required fields
    const validationError = validateCreateEventRequest(request);
    if (validationError) {
      return {
        statusCode: 400,
        headers: getCorsHeaders(),
        body: JSON.stringify({
          error: validationError
        })
      };
    }

    // Create the event
    const result = await createEvent(request);

    const response: CreateEventResponse = {
      eventId: result.event.eventId,
      shareCode: result.event.shareCode,
      timeframes: result.timeframes,
      event: result.event
    };

    return {
      statusCode: 201,
      headers: getCorsHeaders(),
      body: JSON.stringify(response)
    };
  } catch (error) {
    console.error('Error creating event:', error);

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
 * Validates the create event request
 */
function validateCreateEventRequest(request: CreateEventRequest): string | null {
  if (!request.title || request.title.trim().length === 0) {
    return 'Title is required';
  }

  if (!request.startDate) {
    return 'Start date is required';
  }

  if (!request.endDate) {
    return 'End date is required';
  }

  if (!request.timeframeType) {
    return 'Timeframe type is required';
  }

  if (!request.creatorName || request.creatorName.trim().length === 0) {
    return 'Creator name is required';
  }

  // Validate dates
  const startDate = new Date(request.startDate);
  const endDate = new Date(request.endDate);

  if (isNaN(startDate.getTime())) {
    return 'Invalid start date';
  }

  if (isNaN(endDate.getTime())) {
    return 'Invalid end date';
  }

  if (endDate <= startDate) {
    return 'End date must be after start date';
  }

  return null;
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
