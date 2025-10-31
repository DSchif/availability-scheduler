'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TimeframeType, CreateEventRequest } from '@shared/types';
import { api } from '@/services/api';

export default function CreateEventPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    creatorName: '',
    creatorEmail: '',
    startDate: '',
    endDate: '',
    timeframeType: TimeframeType.WEEKEND as TimeframeType
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Validate dates
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);

      if (end <= start) {
        setError('End date must be after start date');
        setLoading(false);
        return;
      }

      const request: CreateEventRequest = {
        title: formData.title,
        description: formData.description || undefined,
        creatorName: formData.creatorName,
        creatorEmail: formData.creatorEmail || undefined,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        timeframeType: formData.timeframeType
      };

      const response = await api.createEvent(request);

      // Navigate to the event page with share code
      router.push(`/event/${response.shareCode}/created`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create event');
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Create New Event</h1>
        <p className="text-gray-600">
          Set up your availability poll and get a shareable link
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="card space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-2">
            Event Title *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            className="input-field"
            placeholder="Weekend camping trip"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">
            Description (Optional)
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            className="input-field"
            placeholder="Let's find the best weekend for our camping trip!"
          />
        </div>

        <div>
          <label htmlFor="creatorName" className="block text-sm font-semibold text-gray-700 mb-2">
            Your Name *
          </label>
          <input
            type="text"
            id="creatorName"
            name="creatorName"
            value={formData.creatorName}
            onChange={handleChange}
            required
            className="input-field"
            placeholder="John Doe"
          />
        </div>

        <div>
          <label htmlFor="creatorEmail" className="block text-sm font-semibold text-gray-700 mb-2">
            Your Email (Optional)
          </label>
          <input
            type="email"
            id="creatorEmail"
            name="creatorEmail"
            value={formData.creatorEmail}
            onChange={handleChange}
            className="input-field"
            placeholder="john@example.com"
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="startDate" className="block text-sm font-semibold text-gray-700 mb-2">
              Start Date *
            </label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              required
              className="input-field"
            />
          </div>

          <div>
            <label htmlFor="endDate" className="block text-sm font-semibold text-gray-700 mb-2">
              End Date *
            </label>
            <input
              type="date"
              id="endDate"
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
              required
              className="input-field"
            />
          </div>
        </div>

        <div>
          <label htmlFor="timeframeType" className="block text-sm font-semibold text-gray-700 mb-2">
            Timeframe Type *
          </label>
          <select
            id="timeframeType"
            name="timeframeType"
            value={formData.timeframeType}
            onChange={handleChange}
            required
            className="input-field"
          >
            <option value={TimeframeType.WEEKEND}>Weekends (Saturday-Sunday)</option>
            <option value={TimeframeType.WEEKDAY}>Weekdays (Monday-Friday)</option>
            <option value={TimeframeType.ALL_DAYS}>All Days</option>
            <option value={TimeframeType.SPECIFIC_DATES}>Specific Date Range</option>
          </select>
          <p className="mt-2 text-sm text-gray-500">
            {formData.timeframeType === TimeframeType.WEEKEND && 'Creates availability slots for each weekend in the date range'}
            {formData.timeframeType === TimeframeType.WEEKDAY && 'Creates availability slots for each week (Mon-Fri) in the date range'}
            {formData.timeframeType === TimeframeType.ALL_DAYS && 'Creates availability slots for each individual day'}
            {formData.timeframeType === TimeframeType.SPECIFIC_DATES && 'Creates a single availability slot for the entire date range'}
          </p>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full text-lg py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : 'Create Event'}
          </button>
        </div>
      </form>
    </div>
  );
}
