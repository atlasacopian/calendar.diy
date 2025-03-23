import type { Metadata } from "next"
import dynamic from "next/dynamic"

// Dynamically import the Calendar component with no SSR
const Calendar = dynamic(() => import("@/components/calendar-fixed"), {
  ssr: false,
  loading: () => (
    <div className="h-screen w-full flex items-center justify-center">
      <div className="text-center">
        <div className="text-2xl mb-2">Loading calendar...</div>
        <div className="text-sm text-gray-500">Please wait while we set up your calendar</div>
      </div>
    </div>
  ),
})

export const metadata: Metadata = {
  title: "Editable Calendar Template",
  description:
    "A clean, free, editable calendar you can use instantly. No account. No clutter. Just a simple calendar for your projects, schedules, or planning.",
}

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center p-2 sm:p-4 md:p-8 lg:p-12 xl:p-16 transition-colors duration-200">
      <div className="w-full max-w-full sm:max-w-2xl">
        {/* Client-side rendered calendar */}
        <Calendar />

        {/* Visually hidden content for SEO */}
        <div className="sr-only">
          <h1>Editable Calendar – No Signup</h1>
          <p>A simple, editable calendar you can use instantly. Free forever, no account required.</p>
          <p>
            Plan your time without the clutter. A simple, free calendar you can type into, save, or print. No account
            needed.
          </p>
          <p>Features include:</p>
          <ul>
            <li>Add and edit events with custom colors</li>
            <li>Drag and drop events between days</li>
            <li>Export to iCal or Google Calendar</li>
            <li>Download calendar as image</li>
            <li>Share calendar view with others</li>
            <li>Works on mobile and desktop</li>
            <li>No account required</li>
            <li>Data saved locally in your browser</li>
          </ul>
        </div>
      </div>
    </main>
  )
}

