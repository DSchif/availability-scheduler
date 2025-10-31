import { v4 as uuidv4 } from 'uuid';
import {
  Response,
  Respondent,
  SubmitResponsesRequest,
  Availability,
  TimeframeSummary,
  RespondentAvailability
} from '../../../shared/types';
import { keys, putItem, getItem, queryItems, batchWriteItems } from '../utils/dynamodb';

/**
 * Submits responses for a respondent
 */
export async function submitResponses(
  eventId: string,
  request: SubmitResponsesRequest
): Promise<{ respondentId: string }> {
  const respondentId = uuidv4();
  const now = new Date().toISOString();

  const itemsToWrite: any[] = [];

  // Create respondent record
  const respondent: Respondent = {
    respondentId,
    eventId,
    name: request.respondentName,
    email: request.respondentEmail,
    firstRespondedAt: now
  };

  itemsToWrite.push({
    ...keys.respondent(eventId, respondentId),
    ...respondent,
    Type: 'RESPONDENT'
  });

  // Create response records for each timeframe
  for (const resp of request.responses) {
    const response: Response = {
      eventId,
      respondentId,
      respondentName: request.respondentName,
      timeframeId: resp.timeframeId,
      availability: resp.availability,
      respondedAt: now
    };

    itemsToWrite.push({
      ...keys.response(eventId, respondentId, resp.timeframeId),
      ...response,
      Type: 'RESPONSE'
    });
  }

  // Write all items
  await batchWriteItems(itemsToWrite);

  return { respondentId };
}

/**
 * Updates responses for an existing respondent
 */
export async function updateResponses(
  eventId: string,
  respondentId: string,
  request: SubmitResponsesRequest
): Promise<void> {
  const itemsToWrite: any[] = [];
  const now = new Date().toISOString();

  // Update response records for each timeframe
  for (const resp of request.responses) {
    const response: Response = {
      eventId,
      respondentId,
      respondentName: request.respondentName,
      timeframeId: resp.timeframeId,
      availability: resp.availability,
      respondedAt: now
    };

    itemsToWrite.push({
      ...keys.response(eventId, respondentId, resp.timeframeId),
      ...response,
      Type: 'RESPONSE'
    });
  }

  // Write updated items
  await batchWriteItems(itemsToWrite);
}

/**
 * Gets all responses for an event
 */
export async function getEventResponses(eventId: string): Promise<Response[]> {
  const items = await queryItems(
    'PK = :pk AND begins_with(SK, :sk)',
    {
      ':pk': `EVENT#${eventId}`,
      ':sk': 'RESPONSE#'
    }
  );

  return items.map(item => item as Response);
}

/**
 * Gets all respondents for an event
 */
export async function getEventRespondents(eventId: string): Promise<Respondent[]> {
  const items = await queryItems(
    'PK = :pk AND begins_with(SK, :sk)',
    {
      ':pk': `EVENT#${eventId}`,
      ':sk': 'RESPONDENT#'
    }
  );

  return items.map(item => item as Respondent);
}

/**
 * Gets responses for a specific respondent
 */
export async function getRespondentResponses(
  eventId: string,
  respondentId: string
): Promise<Response[]> {
  const items = await queryItems(
    'PK = :pk AND begins_with(SK, :sk)',
    {
      ':pk': `EVENT#${eventId}`,
      ':sk': `RESPONSE#${respondentId}#`
    }
  );

  return items.map(item => item as Response);
}

/**
 * Calculates summary statistics for each timeframe
 */
export async function calculateTimeframeSummaries(
  eventId: string,
  timeframeIds: string[]
): Promise<TimeframeSummary[]> {
  // Get all responses for the event
  const responses = await getEventResponses(eventId);
  const respondents = await getEventRespondents(eventId);

  // Get timeframe details
  const timeframes = await Promise.all(
    timeframeIds.map(async (timeframeId) => {
      const item = await getItem(keys.timeframe(eventId, timeframeId));
      return item;
    })
  );

  const summaries: TimeframeSummary[] = [];

  for (const timeframe of timeframes) {
    if (!timeframe) continue;

    const timeframeResponses = responses.filter(
      r => r.timeframeId === timeframe.timeframeId
    );

    const preferredCount = timeframeResponses.filter(
      r => r.availability === Availability.PREFERRED
    ).length;

    const couldMakeCount = timeframeResponses.filter(
      r => r.availability === Availability.COULD_MAKE
    ).length;

    const notAvailableCount = timeframeResponses.filter(
      r => r.availability === Availability.NOT_AVAILABLE
    ).length;

    // Calculate weighted score (preferred = 3, could_make = 1, not_available = -1)
    const score = (preferredCount * 3) + (couldMakeCount * 1) + (notAvailableCount * -1);

    const respondentAvailability: RespondentAvailability[] = timeframeResponses.map(r => ({
      respondentId: r.respondentId,
      respondentName: r.respondentName,
      availability: r.availability
    }));

    summaries.push({
      timeframeId: timeframe.timeframeId,
      label: timeframe.label,
      startDate: timeframe.startDate,
      endDate: timeframe.endDate,
      preferredCount,
      couldMakeCount,
      notAvailableCount,
      score,
      respondents: respondentAvailability
    });
  }

  // Sort by score descending
  summaries.sort((a, b) => b.score - a.score);

  return summaries;
}
