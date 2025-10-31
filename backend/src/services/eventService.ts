import { v4 as uuidv4 } from 'uuid';
import {
  Event,
  Timeframe,
  CreateEventRequest,
  EventStatus,
  TimeframeType
} from '../../../shared/types';
import { generateShareCode } from '../utils/shareCode';
import { generateTimeframes } from '../utils/timeframes';
import { keys, putItem, getItem, queryItems, queryGSI, batchWriteItems } from '../utils/dynamodb';

/**
 * Creates a new event with timeframes
 */
export async function createEvent(request: CreateEventRequest): Promise<{
  event: Event;
  timeframes: Timeframe[];
}> {
  const eventId = uuidv4();
  const shareCode = await generateUniqueShareCode();

  // Create event object
  const event: Event = {
    eventId,
    creatorName: request.creatorName,
    creatorEmail: request.creatorEmail,
    title: request.title,
    description: request.description,
    startDate: request.startDate,
    endDate: request.endDate,
    timeframeType: request.timeframeType,
    shareCode,
    createdAt: new Date().toISOString(),
    status: EventStatus.ACTIVE
  };

  // Generate timeframes based on type
  const timeframes = generateTimeframes(
    eventId,
    request.startDate,
    request.endDate,
    request.timeframeType
  );

  // Prepare items for batch write
  const itemsToWrite: any[] = [];

  // Add event item
  itemsToWrite.push({
    ...keys.event(eventId),
    ...event,
    Type: 'EVENT'
  });

  // Add shareCode GSI item
  itemsToWrite.push({
    ...keys.shareCode(shareCode),
    eventId,
    Type: 'SHARECODE'
  });

  // Add timeframe items
  for (const timeframe of timeframes) {
    itemsToWrite.push({
      ...keys.timeframe(eventId, timeframe.timeframeId),
      ...timeframe,
      Type: 'TIMEFRAME'
    });
  }

  // Write all items to DynamoDB
  await batchWriteItems(itemsToWrite);

  return { event, timeframes };
}

/**
 * Generates a unique share code
 */
async function generateUniqueShareCode(): Promise<string> {
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    const code = generateShareCode();

    // Check if code already exists
    const existing = await getItem(keys.shareCode(code));

    if (!existing) {
      return code;
    }

    attempts++;
  }

  throw new Error('Failed to generate unique share code after multiple attempts');
}

/**
 * Gets an event by ID
 */
export async function getEventById(eventId: string): Promise<{
  event: Event | null;
  timeframes: Timeframe[];
}> {
  // Get event metadata
  const eventItem = await getItem(keys.event(eventId));

  if (!eventItem) {
    return { event: null, timeframes: [] };
  }

  // Get all timeframes for this event
  const timeframeItems = await queryItems(
    'PK = :pk AND begins_with(SK, :sk)',
    {
      ':pk': `EVENT#${eventId}`,
      ':sk': 'TIMEFRAME#'
    }
  );

  const event = eventItem as Event;
  const timeframes = timeframeItems.map(item => item as Timeframe);

  return { event, timeframes };
}

/**
 * Gets an event by share code
 */
export async function getEventByShareCode(shareCode: string): Promise<{
  event: Event | null;
  timeframes: Timeframe[];
}> {
  // Query GSI for share code
  const items = await queryGSI(
    'GSI1',
    'PK = :pk AND SK = :sk',
    {
      ':pk': `SHARECODE#${shareCode}`,
      ':sk': 'METADATA'
    }
  );

  if (items.length === 0) {
    return { event: null, timeframes: [] };
  }

  const eventId = items[0].eventId;
  return getEventById(eventId);
}
