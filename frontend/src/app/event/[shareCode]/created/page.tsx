'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';

export default function EventCreatedPage() {
  const params = useParams();
  const router = useRouter();
  const shareCode = params.shareCode as string;
  const [copied, setCopied] = useState(false);

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/event/${shareCode}`
    : '';

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const copyShareCode = async () => {
    try {
      await navigator.clipboard.writeText(shareCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card text-center">
        <div className="text-6xl mb-6">🎉</div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Event Created Successfully!
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Share this code or link with your group members
        </p>

        <div className="bg-gradient-to-r from-primary-50 to-indigo-50 rounded-lg p-6 mb-6">
          <p className="text-sm font-semibold text-gray-700 mb-2">Share Code</p>
          <div className="flex items-center justify-center gap-4">
            <div className="text-4xl font-bold text-primary-600 tracking-wider">
              {shareCode}
            </div>
            <button
              onClick={copyShareCode}
              className="btn-secondary"
            >
              {copied ? '✓ Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-8">
          <p className="text-sm font-semibold text-gray-700 mb-2">Share URL</p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={shareUrl}
              readOnly
              className="input-field text-sm"
            />
            <button
              onClick={copyToClipboard}
              className="btn-secondary whitespace-nowrap"
            >
              {copied ? '✓ Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => router.push(`/event/${shareCode}`)}
            className="btn-primary w-full"
          >
            View Event & Results
          </button>
          <button
            onClick={() => router.push('/')}
            className="btn-secondary w-full"
          >
            Create Another Event
          </button>
        </div>
      </div>

      <div className="mt-8 card bg-blue-50">
        <h3 className="font-semibold text-gray-900 mb-3">Next Steps:</h3>
        <ol className="list-decimal list-inside space-y-2 text-gray-700">
          <li>Share the code or link with your group members</li>
          <li>Have them submit their availability preferences</li>
          <li>View the aggregated results to find the best time</li>
        </ol>
      </div>
    </div>
  );
}
