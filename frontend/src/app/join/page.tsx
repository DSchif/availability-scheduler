'use client';

import { useRouter } from 'next/navigation';

export default function JoinPage() {
  const router = useRouter();

  // This is just a redirect to home page
  // The home page has the join functionality
  if (typeof window !== 'undefined') {
    router.push('/');
  }

  return (
    <div className="max-w-2xl mx-auto text-center">
      <div className="card">
        <p className="text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
}
