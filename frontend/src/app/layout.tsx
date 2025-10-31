import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Availability Scheduler',
  description: 'Coordinate group availability and find the best time for your events',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
          <nav className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex justify-between items-center">
                <a href="/" className="text-2xl font-bold text-primary-600">
                  Availability Scheduler
                </a>
                <div className="flex gap-4">
                  <a href="/create" className="text-gray-600 hover:text-primary-600 transition-colors">
                    Create Event
                  </a>
                  <a href="/join" className="text-gray-600 hover:text-primary-600 transition-colors">
                    Join Event
                  </a>
                </div>
              </div>
            </div>
          </nav>
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
