'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Availability, GetEventResponse, Timeframe } from '@shared/types';
import { api } from '@/services/api';

export default function RespondToEventPage() {
  const params = useParams();
  const router = useRouter();
  const shareCode = params.shareCode as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [eventData, setEventData] = useState<GetEventResponse | null>(null);

  const [respondentName, setRespondentName] = useState('');
  const [respondentEmail, setRespondentEmail] = useState('');
  const [responses, setResponses] = useState<Map<string, Availability>>(new Map());

  useEffect(() => {
    loadEvent();
  }, [shareCode]);

  const loadEvent = async () => {
    try {
      setLoading(true);
      const data = await api.getEventByShareCode(shareCode);
      setEventData(data);

      // Initialize all responses to NOT_AVAILABLE by default
      const initialResponses = new Map<string, Availability>();
      data.timeframes.forEach(tf => {
        initialResponses.set(tf.timeframeId, Availability.NOT_AVAILABLE);
      });
      setResponses(initialResponses);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load event');
    } finally {
      setLoading(false);
    }
  };

  const handleAvailabilityChange = (timeframeId: string, availability: Availability) => {
    setResponses(prev => {
      const newMap = new Map(prev);
      newMap.set(timeframeId, availability);
      return newMap;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventData) return;

    setError(null);
    setSubmitting(true);

    try {
      const responsesArray = Array.from(responses.entries()).map(([timeframeId, availability]) => ({
        timeframeId,
        availability
      }));

      await api.submitResponses(eventData.event.eventId, {
        respondentName,
        respondentEmail: respondentEmail || undefined,
        responses: responsesArray
      });

      // Navigate to results page
      router.push(`/event/${shareCode}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit responses');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto text-center">
        <div className="card">
          <p className="text-gray-600">Loading event...</p>
        </div>
      </div>
    );
  }

  if (error && !eventData) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card bg-red-50 border-red-200">
          <p className="text-red-700">{error}</p>
          <button onClick={() => router.push('/')} className="btn-primary mt-4">
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (!eventData) return null;

  const { event, timeframes } = eventData;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">{event.title}</h1>
        {event.description && (
          <p className="text-gray-600">{event.description}</p>
        )}
        <p className="text-sm text-gray-500 mt-2">Created by {event.creatorName}</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Information</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="respondentName" className="block text-sm font-semibold text-gray-700 mb-2">
                Your Name *
              </label>
              <input
                type="text"
                id="respondentName"
                value={respondentName}
                onChange={(e) => setRespondentName(e.target.value)}
                required
                className="input-field"
                placeholder="Jane Smith"
              />
            </div>
            <div>
              <label htmlFor="respondentEmail" className="block text-sm font-semibold text-gray-700 mb-2">
                Your Email (Optional)
              </label>
              <input
                type="email"
                id="respondentEmail"
                value={respondentEmail}
                onChange={(e) => setRespondentEmail(e.target.value)}
                className="input-field"
                placeholder="jane@example.com"
              />
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Availability</h2>
          <p className="text-gray-600 mb-6">
            For each timeframe, select your availability level
          </p>

          <div className="space-y-4">
            {timeframes.map((timeframe) => (
              <TimeframeSelector
                key={timeframe.timeframeId}
                timeframe={timeframe}
                selectedAvailability={responses.get(timeframe.timeframeId) || Availability.NOT_AVAILABLE}
                onChange={(availability) => handleAvailabilityChange(timeframe.timeframeId, availability)}
              />
            ))}
          </div>
        </div>

        <div className="card bg-gradient-to-r from-primary-50 to-indigo-50">
          <button
            type="submit"
            disabled={submitting || !respondentName}
            className="btn-primary w-full text-lg py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Submitting...' : 'Submit My Availability'}
          </button>
        </div>
      </form>
    </div>
  );
}

interface TimeframeSelectorProps {
  timeframe: Timeframe;
  selectedAvailability: Availability;
  onChange: (availability: Availability) => void;
}

function TimeframeSelector({ timeframe, selectedAvailability, onChange }: TimeframeSelectorProps) {
  const availabilityOptions = [
    {
      value: Availability.PREFERRED,
      label: 'Preferred',
      icon: '✅',
      color: 'bg-green-100 border-green-300 text-green-800',
      selectedColor: 'bg-green-500 border-green-600 text-white'
    },
    {
      value: Availability.COULD_MAKE,
      label: 'Could Make',
      icon: '🤷',
      color: 'bg-yellow-100 border-yellow-300 text-yellow-800',
      selectedColor: 'bg-yellow-500 border-yellow-600 text-white'
    },
    {
      value: Availability.NOT_AVAILABLE,
      label: 'Not Available',
      icon: '❌',
      color: 'bg-red-100 border-red-300 text-red-800',
      selectedColor: 'bg-red-500 border-red-600 text-white'
    }
  ];

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
      <h3 className="font-semibold text-gray-900 mb-3">{timeframe.label}</h3>
      <div className="grid grid-cols-3 gap-2">
        {availabilityOptions.map((option) => {
          const isSelected = selectedAvailability === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={`
                py-3 px-4 rounded-lg border-2 transition-all font-medium text-sm
                ${isSelected ? option.selectedColor : option.color}
                hover:scale-105
              `}
            >
              <div className="text-xl mb-1">{option.icon}</div>
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
