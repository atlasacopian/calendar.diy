"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"

// Dynamically import the Calendar component with no SSR
const Calendar = dynamic(() => import("@/components/calendar-new"), {
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

export default function ClientComponent() {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return null
  }

  return <Calendar />
}

