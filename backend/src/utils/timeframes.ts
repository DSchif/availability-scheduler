import { TimeframeType, Timeframe } from '../../../shared/types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Generates timeframes based on the specified type and date range
 */
export function generateTimeframes(
  eventId: string,
  startDate: string,
  endDate: string,
  timeframeType: TimeframeType
): Timeframe[] {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const timeframes: Timeframe[] = [];

  switch (timeframeType) {
    case TimeframeType.WEEKEND:
      return generateWeekendTimeframes(eventId, start, end);
    case TimeframeType.WEEKDAY:
      return generateWeekdayTimeframes(eventId, start, end);
    case TimeframeType.ALL_DAYS:
      return generateAllDaysTimeframes(eventId, start, end);
    case TimeframeType.SPECIFIC_DATES:
      return generateSpecificDatesTimeframes(eventId, start, end);
    default:
      throw new Error(`Unsupported timeframe type: ${timeframeType}`);
  }
}

/**
 * Generates weekend timeframes (Saturday-Sunday)
 */
function generateWeekendTimeframes(
  eventId: string,
  start: Date,
  end: Date
): Timeframe[] {
  const timeframes: Timeframe[] = [];
  const current = new Date(start);

  // Move to the first Saturday
  while (current.getDay() !== 6 && current <= end) {
    current.setDate(current.getDate() + 1);
  }

  while (current <= end) {
    const saturday = new Date(current);
    const sunday = new Date(current);
    sunday.setDate(sunday.getDate() + 1);

    if (sunday <= end) {
      timeframes.push({
        timeframeId: uuidv4(),
        eventId,
        startDate: saturday.toISOString(),
        endDate: sunday.toISOString(),
        label: formatWeekendLabel(saturday, sunday),
        responseCount: 0
      });
    }

    // Move to next Saturday
    current.setDate(current.getDate() + 7);
  }

  return timeframes;
}

/**
 * Generates weekday timeframes (Monday-Friday)
 */
function generateWeekdayTimeframes(
  eventId: string,
  start: Date,
  end: Date
): Timeframe[] {
  const timeframes: Timeframe[] = [];
  const current = new Date(start);

  // Move to the first Monday
  while (current.getDay() !== 1 && current <= end) {
    current.setDate(current.getDate() + 1);
  }

  while (current <= end) {
    const monday = new Date(current);
    const friday = new Date(current);
    friday.setDate(friday.getDate() + 4);

    if (friday <= end) {
      timeframes.push({
        timeframeId: uuidv4(),
        eventId,
        startDate: monday.toISOString(),
        endDate: friday.toISOString(),
        label: formatWeekdayLabel(monday, friday),
        responseCount: 0
      });
    }

    // Move to next Monday
    current.setDate(current.getDate() + 7);
  }

  return timeframes;
}

/**
 * Generates individual day timeframes for all days in range
 */
function generateAllDaysTimeframes(
  eventId: string,
  start: Date,
  end: Date
): Timeframe[] {
  const timeframes: Timeframe[] = [];
  const current = new Date(start);

  while (current <= end) {
    const day = new Date(current);
    const dayEnd = new Date(current);
    dayEnd.setHours(23, 59, 59, 999);

    timeframes.push({
      timeframeId: uuidv4(),
      eventId,
      startDate: day.toISOString(),
      endDate: dayEnd.toISOString(),
      label: formatDayLabel(day),
      responseCount: 0
    });

    current.setDate(current.getDate() + 1);
  }

  return timeframes;
}

/**
 * Generates single timeframe for specific date range
 */
function generateSpecificDatesTimeframes(
  eventId: string,
  start: Date,
  end: Date
): Timeframe[] {
  return [
    {
      timeframeId: uuidv4(),
      eventId,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      label: formatDateRangeLabel(start, end),
      responseCount: 0
    }
  ];
}

/**
 * Formats weekend label (e.g., "Jan 13-14, 2024")
 */
function formatWeekendLabel(saturday: Date, sunday: Date): string {
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = monthNames[saturday.getMonth()];
  const satDay = saturday.getDate();
  const sunDay = sunday.getDate();
  const year = saturday.getFullYear();

  return `${month} ${satDay}-${sunDay}, ${year}`;
}

/**
 * Formats weekday label (e.g., "Jan 15-19, 2024")
 */
function formatWeekdayLabel(monday: Date, friday: Date): string {
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = monthNames[monday.getMonth()];
  const monDay = monday.getDate();
  const friDay = friday.getDate();
  const year = monday.getFullYear();

  return `${month} ${monDay}-${friDay}, ${year}`;
}

/**
 * Formats single day label (e.g., "Jan 15, 2024")
 */
function formatDayLabel(day: Date): string {
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = monthNames[day.getMonth()];
  const dayNum = day.getDate();
  const year = day.getFullYear();

  return `${month} ${dayNum}, ${year}`;
}

/**
 * Formats date range label (e.g., "Jan 15 - Feb 20, 2024")
 */
function formatDateRangeLabel(start: Date, end: Date): string {
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  if (start.getFullYear() !== end.getFullYear()) {
    return `${monthNames[start.getMonth()]} ${start.getDate()}, ${start.getFullYear()} - ${monthNames[end.getMonth()]} ${end.getDate()}, ${end.getFullYear()}`;
  }

  if (start.getMonth() !== end.getMonth()) {
    return `${monthNames[start.getMonth()]} ${start.getDate()} - ${monthNames[end.getMonth()]} ${end.getDate()}, ${start.getFullYear()}`;
  }

  return `${monthNames[start.getMonth()]} ${start.getDate()}-${end.getDate()}, ${start.getFullYear()}`;
}
