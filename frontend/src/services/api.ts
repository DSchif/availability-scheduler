import {
  CreateEventRequest,
  CreateEventResponse,
  GetEventResponse,
  SubmitResponsesRequest,
  SubmitResponsesResponse,
  EventSummary
} from '@shared/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /**
   * Creates a new event
   */
  async createEvent(request: CreateEventRequest): Promise<CreateEventResponse> {
    const response = await fetch(`${this.baseUrl}/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create event');
    }

    return response.json();
  }

  /**
   * Gets an event by ID
   */
  async getEventById(eventId: string): Promise<GetEventResponse> {
    const response = await fetch(`${this.baseUrl}/events/${eventId}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get event');
    }

    return response.json();
  }

  /**
   * Gets an event by share code
   */
  async getEventByShareCode(shareCode: string): Promise<GetEventResponse> {
    const response = await fetch(`${this.baseUrl}/events/code/${shareCode.toUpperCase()}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Event not found');
    }

    return response.json();
  }

  /**
   * Submits responses for an event
   */
  async submitResponses(
    eventId: string,
    request: SubmitResponsesRequest
  ): Promise<SubmitResponsesResponse> {
    const response = await fetch(`${this.baseUrl}/events/${eventId}/responses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to submit responses');
    }

    return response.json();
  }

  /**
   * Updates responses for a respondent
   */
  async updateResponses(
    eventId: string,
    respondentId: string,
    request: SubmitResponsesRequest
  ): Promise<SubmitResponsesResponse> {
    const response = await fetch(
      `${this.baseUrl}/events/${eventId}/responses/${respondentId}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update responses');
    }

    return response.json();
  }

  /**
   * Gets event summary with aggregated responses
   */
  async getEventSummary(eventId: string): Promise<EventSummary> {
    const response = await fetch(`${this.baseUrl}/events/${eventId}/summary`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get summary');
    }

    return response.json();
  }
}

export const api = new ApiClient(API_URL);
