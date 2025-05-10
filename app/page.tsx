import type { Metadata } from "next"
// Remove the old dynamic import
// import dynamic from "next/dynamic"
import ClientCalendarWrapper from "@/components/ClientCalendarWrapper"; // Import the new wrapper
import { useEffect, useState } from "react";

// Remove the old dynamic import definition
// const Calendar = dynamic(() => import("@/components/calendar-new"), {
//   ssr: false,
//   loading: () => (
//     <div className="h-screen w-full flex items-center justify-center">
//       <div className="text-center">
//         <div className="text-2xl mb-2">Loading calendar...</div>
//         <div className="text-sm text-gray-500">Please wait while we set up your calendar</div>
//       </div>
//     </div>
//   ),
// })

function ConfirmationBanner() {
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash;
      if (hash.includes("access_token") && hash.includes("type=signup")) {
        setMessage("Your email has been confirmed! You can now sign in.");
      } else if (hash.includes("error")) {
        setMessage("There was a problem confirming your email. Please try again or contact support.");
      }
    }
  }, []);

  if (!message) return null;
  return (
    <div className="bg-green-100 text-green-800 p-3 rounded mb-4 text-center">
      {message}
    </div>
  );
}

export const metadata: Metadata = {
  title: "Free Calendar Template",
  description:
    "A clean, free, editable calendar you can use instantly. No account. No clutter. Just a simple calendar for your projects, schedules, or planning.",
}

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center p-2 sm:p-4 md:p-8 lg:p-12 xl:p-16 transition-colors duration-200">
      <div className="w-full max-w-full sm:max-w-2xl">
        <ConfirmationBanner />
        {/* Client-side rendered calendar */}
        <div className="calendar-wrapper">
          {/* Use the new wrapper component */}
          <ClientCalendarWrapper />
        </div>

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
