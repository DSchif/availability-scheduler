import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { SubmitResponsesRequest, SubmitResponsesResponse } from '../../../shared/types';
import { submitResponses, updateResponses } from '../services/responseService';

/**
 * Lambda handler for submitting or updating responses
 */
export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  console.log('Submit Responses - Request:', JSON.stringify(event, null, 2));

  try {
    const eventId = event.pathParameters?.eventId;
    const respondentId = event.pathParameters?.respondentId;

    if (!eventId) {
      return {
        statusCode: 400,
        headers: getCorsHeaders(),
        body: JSON.stringify({
          error: 'Event ID is required'
        })
      };
    }

    if (!event.body) {
      return {
        statusCode: 400,
        headers: getCorsHeaders(),
        body: JSON.stringify({
          error: 'Missing request body'
        })
      };
    }

    const request: SubmitResponsesRequest = JSON.parse(event.body);

    // Validate request
    const validationError = validateSubmitResponsesRequest(request);
    if (validationError) {
      return {
        statusCode: 400,
        headers: getCorsHeaders(),
        body: JSON.stringify({
          error: validationError
        })
      };
    }

    let result;
    let isUpdate = false;

    // If respondentId is provided, update existing responses
    if (respondentId) {
      await updateResponses(eventId, respondentId, request);
      result = { respondentId };
      isUpdate = true;
    } else {
      // Otherwise, create new responses
      result = await submitResponses(eventId, request);
    }

    const response: SubmitResponsesResponse = {
      respondentId: result.respondentId,
      success: true,
      message: isUpdate ? 'Responses updated successfully' : 'Responses submitted successfully'
    };

    return {
      statusCode: isUpdate ? 200 : 201,
      headers: getCorsHeaders(),
      body: JSON.stringify(response)
    };
  } catch (error) {
    console.error('Error submitting responses:', error);

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
 * Validates the submit responses request
 */
function validateSubmitResponsesRequest(request: SubmitResponsesRequest): string | null {
  if (!request.respondentName || request.respondentName.trim().length === 0) {
    return 'Respondent name is required';
  }

  if (!request.responses || request.responses.length === 0) {
    return 'At least one response is required';
  }

  for (const response of request.responses) {
    if (!response.timeframeId) {
      return 'Timeframe ID is required for all responses';
    }

    if (!response.availability) {
      return 'Availability is required for all responses';
    }

    const validAvailabilities = ['not_available', 'could_make', 'preferred'];
    if (!validAvailabilities.includes(response.availability)) {
      return `Invalid availability value: ${response.availability}`;
    }
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
