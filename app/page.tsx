"use client"
import dynamic from "next/dynamic"

// Dynamically import the Calendar component with no SSR
const Calendar = dynamic(() => import("@/components/calendar"), {
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

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center p-2 sm:p-4 md:p-8 lg:p-12 xl:p-16 transition-colors duration-200">
      <div className="w-full max-w-full sm:max-w-2xl">
        <Calendar />
      </div>
    </main>
  )
}

