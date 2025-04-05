"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date(2025, 3, 1)) // April 2025

  const monthNames = [
    "JANUARY",
    "FEBRUARY",
    "MARCH",
    "APRIL",
    "MAY",
    "JUNE",
    "JULY",
    "AUGUST",
    "SEPTEMBER",
    "OCTOBER",
    "NOVEMBER",
    "DECEMBER",
  ]

  const daysOfWeek = ["S", "M", "T", "W", "T", "F", "S"]

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay()
  }

  const renderCalendarDays = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    const daysInMonth = getDaysInMonth(year, month)
    const firstDayOfMonth = getFirstDayOfMonth(year, month)

    const days = []

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 border border-gray-100"></div>)
    }

    // Cells for days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const isToday = day === 5 && month === 3 // Highlight April 5th
      days.push(
        <div key={day} className={cn("h-24 border border-gray-100 p-2", isToday ? "bg-gray-50" : "")}>
          <div className="text-right">{day}</div>
        </div>,
      )
    }

    return days
  }

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  return (
    <div className="min-h-screen flex flex-col items-center p-4">
      <div className="w-full max-w-4xl">
        {/* Top buttons */}
        <div className="flex justify-between overflow-x-auto no-scrollbar mb-6">
          <div className="space-x-2">
            <Button variant="outline" size="sm" className="whitespace-nowrap">
              SIGN IN
            </Button>
            <Button variant="outline" size="sm" className="whitespace-nowrap">
              RESET
            </Button>
          </div>
          <div className="space-x-2">
            <Button variant="outline" size="sm" className="whitespace-nowrap">
              SCREENSHOT
            </Button>
            <Button variant="outline" size="sm" className="whitespace-nowrap">
              ICAL
            </Button>
            <Button variant="outline" size="sm" className="whitespace-nowrap">
              GOOGLE
            </Button>
            <Button variant="outline" size="sm" className="whitespace-nowrap">
              SHARE
            </Button>
          </div>
        </div>

        {/* Calendar header */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={prevMonth} className="p-2">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h2 className="text-xl font-medium">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <button onClick={nextMonth} className="p-2">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Days of week header */}
        <div className="grid grid-cols-7 text-center py-2">
          {daysOfWeek.map((day) => (
            <div key={day} className="text-sm font-medium text-gray-500">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7">{renderCalendarDays()}</div>

        {/* Tag button */}
        <div className="flex justify-center mt-6">
          <Button variant="default" className="bg-black text-white hover:bg-black/90 rounded-sm">
            <span className="mr-1">TAG</span>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

