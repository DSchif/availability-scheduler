// Enums
export enum TimeframeType {
  WEEKEND = 'weekend',
  WEEKDAY = 'weekday',
  SPECIFIC_DATES = 'specific_dates',
  ALL_DAYS = 'all_days'
}

export enum EventStatus {
  ACTIVE = 'active',
  CLOSED = 'closed',
  EXPIRED = 'expired'
}

export enum Availability {
  NOT_AVAILABLE = 'not_available',
  COULD_MAKE = 'could_make',
  PREFERRED = 'preferred'
}

// Core Models
export interface Event {
  eventId: string;
  creatorName: string;
  creatorEmail?: string;
  title: string;
  description?: string;
  startDate: string; // ISO string
  endDate: string; // ISO string
  timeframeType: TimeframeType;
  shareCode: string;
  createdAt: string;
  expiresAt?: string;
  status: EventStatus;
}

export interface Timeframe {
  timeframeId: string;
  eventId: string;
  startDate: string; // ISO string
  endDate: string; // ISO string
  label: string; // e.g., "Jan 13-14, 2024"
  responseCount: number;
}

export interface Response {
  eventId: string;
  respondentId: string;
  respondentName: string;
  timeframeId: string;
  availability: Availability;
  respondedAt: string;
}

export interface Respondent {
  respondentId: string;
  eventId: string;
  name: string;
  email?: string;
  firstRespondedAt: string;
}

// API Request/Response Types
export interface CreateEventRequest {
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  timeframeType: TimeframeType;
  creatorName: string;
  creatorEmail?: string;
}

export interface CreateEventResponse {
  eventId: string;
  shareCode: string;
  timeframes: Timeframe[];
  event: Event;
}

export interface SubmitResponsesRequest {
  respondentName: string;
  respondentEmail?: string;
  responses: {
    timeframeId: string;
    availability: Availability;
  }[];
}

export interface SubmitResponsesResponse {
  respondentId: string;
  success: boolean;
  message: string;
}

export interface EventSummary {
  event: Event;
  timeframes: Timeframe[];
  totalRespondents: number;
  timeframeSummaries: TimeframeSummary[];
}

export interface TimeframeSummary {
  timeframeId: string;
  label: string;
  startDate: string;
  endDate: string;
  preferredCount: number;
  couldMakeCount: number;
  notAvailableCount: number;
  score: number; // Weighted score for ranking
  respondents: RespondentAvailability[];
}

export interface RespondentAvailability {
  respondentId: string;
  respondentName: string;
  availability: Availability;
}

export interface GetEventResponse {
  event: Event;
  timeframes: Timeframe[];
}
