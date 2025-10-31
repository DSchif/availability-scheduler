'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { EventSummary, Availability, TimeframeSummary } from '@shared/types';
import { api } from '@/services/api';

export default function EventResultsPage() {
  const params = useParams();
  const router = useRouter();
  const shareCode = params.shareCode as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<EventSummary | null>(null);
  const [showDetailedView, setShowDetailedView] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadSummary();
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadSummary, 30000);
    return () => clearInterval(interval);
  }, [shareCode]);

  const loadSummary = async () => {
    try {
      setLoading(true);
      const eventData = await api.getEventByShareCode(shareCode);
      const summaryData = await api.getEventSummary(eventData.event.eventId);
      setSummary(summaryData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load event');
    } finally {
      setLoading(false);
    }
  };

  const copyShareLink = async () => {
    const shareUrl = typeof window !== 'undefined'
      ? `${window.location.origin}/event/${shareCode}`
      : '';

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (loading && !summary) {
    return (
      <div className="max-w-6xl mx-auto text-center">
        <div className="card">
          <p className="text-gray-600">Loading event...</p>
        </div>
      </div>
    );
  }

  if (error && !summary) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="card bg-red-50 border-red-200">
          <p className="text-red-700">{error}</p>
          <button onClick={() => router.push('/')} className="btn-primary mt-4">
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (!summary) return null;

  const { event, totalRespondents, timeframeSummaries } = summary;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">{event.title}</h1>
            {event.description && (
              <p className="text-gray-600">{event.description}</p>
            )}
            <p className="text-sm text-gray-500 mt-2">Created by {event.creatorName}</p>
          </div>
          <div className="text-right">
            <div className="bg-primary-100 rounded-lg px-4 py-2 inline-block">
              <p className="text-sm font-semibold text-primary-800">Share Code</p>
              <p className="text-2xl font-bold text-primary-600">{shareCode}</p>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => router.push(`/event/${shareCode}/respond`)}
            className="btn-primary"
          >
            Submit Your Availability
          </button>
          <button
            onClick={copyShareLink}
            className="btn-secondary"
          >
            {copied ? '✓ Copied!' : 'Copy Share Link'}
          </button>
          <button
            onClick={loadSummary}
            className="btn-secondary"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      <div className="card mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Results
              {totalRespondents > 0 && (
                <span className="text-lg text-gray-600 ml-3">
                  {totalRespondents} {totalRespondents === 1 ? 'response' : 'responses'}
                </span>
              )}
            </h2>
          </div>
          {totalRespondents > 0 && (
            <button
              onClick={() => setShowDetailedView(!showDetailedView)}
              className="btn-secondary text-sm"
            >
              {showDetailedView ? 'Summary View' : 'Detailed View'}
            </button>
          )}
        </div>
      </div>

      {totalRespondents === 0 ? (
        <div className="card bg-blue-50 text-center py-12">
          <p className="text-xl text-gray-700 mb-4">
            No responses yet. Be the first to submit your availability!
          </p>
          <button
            onClick={() => router.push(`/event/${shareCode}/respond`)}
            className="btn-primary"
          >
            Submit Your Availability
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {timeframeSummaries.map((timeframeSummary) => (
            <TimeframeResultCard
              key={timeframeSummary.timeframeId}
              timeframeSummary={timeframeSummary}
              totalRespondents={totalRespondents}
              showDetailed={showDetailedView}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface TimeframeResultCardProps {
  timeframeSummary: TimeframeSummary;
  totalRespondents: number;
  showDetailed: boolean;
}

function TimeframeResultCard({ timeframeSummary, totalRespondents, showDetailed }: TimeframeResultCardProps) {
  const { label, preferredCount, couldMakeCount, notAvailableCount, score, respondents } = timeframeSummary;

  const preferredPercent = totalRespondents > 0 ? (preferredCount / totalRespondents) * 100 : 0;
  const couldMakePercent = totalRespondents > 0 ? (couldMakeCount / totalRespondents) * 100 : 0;
  const notAvailablePercent = totalRespondents > 0 ? (notAvailableCount / totalRespondents) * 100 : 0;

  return (
    <div className="card">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900">{label}</h3>
          <p className="text-sm text-gray-500">Score: {score}</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-primary-600">{preferredCount}</div>
          <div className="text-sm text-gray-500">preferred</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex h-8 rounded-lg overflow-hidden bg-gray-200">
          {preferredCount > 0 && (
            <div
              className="bg-green-500 flex items-center justify-center text-white text-sm font-semibold"
              style={{ width: `${preferredPercent}%` }}
            >
              {preferredPercent > 15 && `${preferredCount}`}
            </div>
          )}
          {couldMakeCount > 0 && (
            <div
              className="bg-yellow-500 flex items-center justify-center text-white text-sm font-semibold"
              style={{ width: `${couldMakePercent}%` }}
            >
              {couldMakePercent > 15 && `${couldMakeCount}`}
            </div>
          )}
          {notAvailableCount > 0 && (
            <div
              className="bg-red-500 flex items-center justify-center text-white text-sm font-semibold"
              style={{ width: `${notAvailablePercent}%` }}
            >
              {notAvailablePercent > 15 && `${notAvailableCount}`}
            </div>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <div className="text-lg font-bold text-green-600">{preferredCount}</div>
          <div className="text-xs text-gray-500">✅ Preferred</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-yellow-600">{couldMakeCount}</div>
          <div className="text-xs text-gray-500">🤷 Could Make</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-red-600">{notAvailableCount}</div>
          <div className="text-xs text-gray-500">❌ Not Available</div>
        </div>
      </div>

      {/* Detailed View */}
      {showDetailed && respondents.length > 0 && (
        <div className="border-t border-gray-200 pt-4 mt-4">
          <h4 className="font-semibold text-gray-700 mb-2">Individual Responses:</h4>
          <div className="space-y-2">
            {respondents.map((respondent, idx) => (
              <div key={idx} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded">
                <span className="text-gray-700">{respondent.respondentName}</span>
                <span className={`
                  px-3 py-1 rounded-full text-sm font-medium
                  ${respondent.availability === Availability.PREFERRED ? 'bg-green-100 text-green-800' : ''}
                  ${respondent.availability === Availability.COULD_MAKE ? 'bg-yellow-100 text-yellow-800' : ''}
                  ${respondent.availability === Availability.NOT_AVAILABLE ? 'bg-red-100 text-red-800' : ''}
                `}>
                  {respondent.availability === Availability.PREFERRED && '✅ Preferred'}
                  {respondent.availability === Availability.COULD_MAKE && '🤷 Could Make'}
                  {respondent.availability === Availability.NOT_AVAILABLE && '❌ Not Available'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
