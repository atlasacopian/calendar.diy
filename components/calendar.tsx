"use client"

import { useEffect, useRef, useState } from "react"
import { ChevronLeft, ChevronRight, X, Check } from "lucide-react"
import { addMonths, format, getDay, getDaysInMonth, isSameDay, isToday, subMonths } from "date-fns"

import { cn } from "@/lib/utils"
import { getAllHolidays, type Holiday } from "@/lib/holidays"

type CalendarEvent = {
  date: Date
  content: string
  color?: string
}

// Color options for color picker
const colorOptions = [
  { name: "Black", value: "text-black", bg: "bg-black", text: "text-white" },
  { name: "Blue", value: "text-blue-600", bg: "bg-blue-600", text: "text-white" },
  { name: "Red", value: "text-red-600", bg: "bg-red-600", text: "text-white" },
  { name: "Yellow", value: "text-yellow-500", bg: "bg-yellow-500", text: "text-black" },
  { name: "Orange", value: "text-orange-500", bg: "bg-orange-500", text: "text-black" },
  { name: "Green", value: "text-green-600", bg: "bg-green-600", text: "text-white" },
  { name: "Purple", value: "text-purple-600", bg: "bg-purple-600", text: "text-white" },
]

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [eventContent, setEventContent] = useState("")
  const [selectedColor, setSelectedColor] = useState("text-black")
  const [holidays, setHolidays] = useState<Holiday[]>([])
  const [isHovering, setIsHovering] = useState<number | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Load events from localStorage on component mount
  useEffect(() => {
    const savedEvents = localStorage.getItem("calendarEvents")
    if (savedEvents) {
      // Convert any bg- color classes to text- color classes for backward compatibility
      const updatedEvents = JSON.parse(savedEvents).map((event: any) => {
        let color = event.color || "text-black"
        if (color.startsWith("bg-")) {
          color = color.replace("bg-", "text-")
        }
        return {
          ...event,
          date: new Date(event.date),
          color,
        }
      })
      setEvents(updatedEvents)
    }
  }, [])

  // Load holidays for current and next year
  useEffect(() => {
    const currentYear = new Date().getFullYear()
    const holidaysCurrentYear = getAllHolidays(currentYear)
    const holidaysNextYear = getAllHolidays(currentYear + 1)
    setHolidays([...holidaysCurrentYear, ...holidaysNextYear])
  }, [])

  // Save events to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("calendarEvents", JSON.stringify(events))
  }, [events])

  // Focus textarea when modal opens
  useEffect(() => {
    if (showModal && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [showModal])

  const handlePreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1))
  }

  const handleDayClick = (day: Date) => {
    setSelectedDate(day)
    const existingEvent = events.find((event) => isSameDay(event.date, day))
    setEventContent(existingEvent?.content || "")
    setSelectedColor(existingEvent?.color || "text-black")
    setShowModal(true)
  }

  const handleSaveEvent = () => {
    if (!selectedDate) return

    // Remove existing event for this day if it exists
    const filteredEvents = events.filter((event) => !isSameDay(event.date, selectedDate))

    // Add new event if content is not empty
    if (eventContent.trim()) {
      setEvents([
        ...filteredEvents,
        {
          date: selectedDate,
          content: eventContent,
          color: selectedColor,
        },
      ])
    } else {
      setEvents(filteredEvents)
    }

    setShowModal(false)
    setSelectedDate(null)
    setEventContent("")
    setSelectedColor("text-black")
  }

  const handleCancelEdit = () => {
    setShowModal(false)
    setSelectedDate(null)
    setEventContent("")
    setSelectedColor("text-black")
  }

  // Generate calendar grid
  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate)
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const startingDayOfWeek = getDay(firstDayOfMonth)

    const days = []

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 border border-gray-100"></div>)
    }

    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
      const dayEvents = events.filter((event) => isSameDay(event.date, date))
      const dayHolidays = holidays.filter((holiday) => isSameDay(holiday.date, date))
      const isWeekend = getDay(date) === 0 || getDay(date) === 6
      const isTodayDate = isToday(date)

      days.push(
        <div
          key={day}
          onClick={() => handleDayClick(date)}
          onMouseEnter={() => setIsHovering(day)}
          onMouseLeave={() => setIsHovering(null)}
          className={cn(
            "group relative h-24 border border-gray-100 p-2 transition-all duration-300",
            isWeekend ? "bg-gray-50/30" : "",
            isTodayDate ? "ring-1 ring-blue-500" : "",
            isHovering === day ? "bg-gray-50" : "",
            day === 22 ? "bg-blue-50 ring-1 ring-blue-500" : "", // Highlight current day for demo
          )}
        >
          <div
            className={cn(
              "absolute right-2 top-1 flex h-5 w-5 items-center justify-center rounded-full font-mono text-xs",
              isTodayDate ? "bg-blue-500 text-white" : "text-gray-400",
              day === 22 ? "bg-blue-500 text-white" : "", // Highlight current day for demo
            )}
          >
            {day}
          </div>

          <div className="mt-5 space-y-0.5">
            {dayHolidays.map((holiday, index) => (
              <div key={`holiday-${index}`} className="font-mono text-[9px] uppercase tracking-wider text-cyan-600">
                {holiday.name}
              </div>
            ))}
          </div>

          <div className="mt-1 space-y-1">
            {dayEvents.map((event, index) => {
              // Ensure color is in text- format for backward compatibility
              let textColorClass = event.color || "text-black"
              if (textColorClass.startsWith("bg-")) {
                textColorClass = textColorClass.replace("bg-", "text-")
              }

              return (
                <div key={index} className="flex items-start justify-between">
                  <span className={cn("font-mono text-[10px] font-medium", textColorClass)}>{event.content}</span>
                </div>
              )
            })}
          </div>

          <div
            className={cn(
              "absolute bottom-0 left-0 h-0.5 w-full bg-black opacity-0 transition-opacity duration-300",
              isHovering === day ? "opacity-100" : "",
            )}
          />
        </div>,
      )
    }

    return days
  }

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  return (
    <>
      <div className="calendar-container rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-mono text-xl font-light tracking-tight">{format(currentDate, "MMMM yyyy")}</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePreviousMonth}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={handleNextMonth}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {weekDays.map((day) => (
            <div key={day} className="pb-2 text-center font-mono text-xs font-light tracking-wider text-gray-500">
              {day}
            </div>
          ))}
          {renderCalendar()}
        </div>
      </div>

      {/* Event Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-mono text-lg font-medium">
                {selectedDate ? format(selectedDate, "MMMM d, yyyy") : "Add Event"}
              </h3>
              <button
                onClick={handleCancelEdit}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-4">
              <label htmlFor="event-content" className="mb-2 block font-mono text-sm text-gray-700">
                Event
              </label>
              <textarea
                ref={textareaRef}
                id="event-content"
                value={eventContent}
                onChange={(e) => setEventContent(e.target.value)}
                placeholder="Add event details..."
                className="w-full rounded-md border border-gray-300 p-2 font-mono text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                rows={3}
              />
            </div>

            <div className="mb-6">
              <label className="mb-2 block font-mono text-sm text-gray-700">Color</label>
              <div className="flex flex-wrap gap-2">
                {colorOptions.map((color) => (
                  <button
                    key={color.value}
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200",
                      color.bg,
                      color.text,
                      selectedColor === color.value ? "ring-2 ring-gray-400 ring-offset-2" : "",
                    )}
                    title={color.name}
                    onClick={() => setSelectedColor(color.value)}
                    type="button"
                  >
                    {selectedColor === color.value && <Check className="h-4 w-4" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={handleCancelEdit}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 font-mono text-sm text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEvent}
                className="rounded-md bg-blue-500 px-4 py-2 font-mono text-sm text-white hover:bg-blue-600"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

