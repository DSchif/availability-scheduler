'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function HomePage() {
  const router = useRouter();
  const [shareCode, setShareCode] = useState('');

  const handleJoinEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (shareCode.trim()) {
      router.push(`/event/${shareCode.toUpperCase()}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          Find the Perfect Time for Your Group
        </h1>
        <p className="text-xl text-gray-600">
          Easily coordinate schedules and collect availability preferences from your team
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-16">
        <div className="card hover:shadow-lg transition-shadow">
          <div className="text-center">
            <div className="text-4xl mb-4">📅</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Create an Event</h2>
            <p className="text-gray-600 mb-6">
              Set up a new scheduling poll and share it with your group
            </p>
            <button
              onClick={() => router.push('/create')}
              className="btn-primary w-full"
            >
              Get Started
            </button>
          </div>
        </div>

        <div className="card hover:shadow-lg transition-shadow">
          <div className="text-center">
            <div className="text-4xl mb-4">🔗</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Join an Event</h2>
            <p className="text-gray-600 mb-6">
              Enter a share code to view and respond to an event
            </p>
            <form onSubmit={handleJoinEvent}>
              <input
                type="text"
                value={shareCode}
                onChange={(e) => setShareCode(e.target.value.toUpperCase())}
                placeholder="Enter share code"
                className="input-field mb-4 text-center text-lg tracking-wider"
                maxLength={6}
              />
              <button type="submit" className="btn-primary w-full">
                Join Event
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="card bg-gradient-to-r from-primary-50 to-indigo-50">
        <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          How It Works
        </h3>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl mb-3">1️⃣</div>
            <h4 className="font-semibold text-lg mb-2">Create Event</h4>
            <p className="text-gray-600 text-sm">
              Select your date range and choose timeframe type (weekends, weekdays, etc.)
            </p>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-3">2️⃣</div>
            <h4 className="font-semibold text-lg mb-2">Share Code</h4>
            <p className="text-gray-600 text-sm">
              Share the unique code with your group members
            </p>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-3">3️⃣</div>
            <h4 className="font-semibold text-lg mb-2">See Results</h4>
            <p className="text-gray-600 text-sm">
              View aggregated availability and pick the best time
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
