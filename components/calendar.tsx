"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { ChevronLeft, ChevronRight, X, Check, CalendarIcon, Download } from "lucide-react"
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
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)
  const calendarRef = useRef<HTMLDivElement>(null)

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

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setShowModal(false)
      }
    }

    if (showModal) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showModal])

  // Add keyboard navigation for all interactions
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Month navigation when modal is not open
      if (!showModal) {
        if (e.key === "ArrowLeft") {
          handlePreviousMonth()
        } else if (e.key === "ArrowRight") {
          handleNextMonth()
        } else if (e.key === "ArrowUp") {
          // Go to previous year
          setCurrentDate(new Date(currentDate.getFullYear() - 1, currentDate.getMonth(), 1))
        } else if (e.key === "ArrowDown") {
          // Go to next year
          setCurrentDate(new Date(currentDate.getFullYear() + 1, currentDate.getMonth(), 1))
        } else if (e.key === "Home") {
          // Go to current month
          setCurrentDate(new Date())
        } else if (e.key === "Escape") {
          // Close any open dialogs or reset view
          if (showModal) {
            handleCancelEdit()
          }
        }
      } else {
        // When modal is open
        if (e.key === "Escape") {
          handleCancelEdit()
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [showModal, currentDate])

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

  // Handle Enter key in textarea
  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Save on Enter without shift key (shift+enter allows for line breaks)
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSaveEvent()
    }
  }

  // Export calendar to iCal format
  const exportToIcal = () => {
    let icalContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Calendar.diy//Calendar//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
    ]

    // Add events
    events.forEach((event) => {
      const dateString = format(event.date, "yyyyMMdd")
      icalContent = [
        ...icalContent,
        "BEGIN:VEVENT",
        `UID:${dateString}-${Math.random().toString(36).substring(2, 11)}@calendar.diy`,
        `DTSTAMP:${format(new Date(), "yyyyMMddTHHmmss")}Z`,
        `DTSTART;VALUE=DATE:${dateString}`,
        `DTEND;VALUE=DATE:${dateString}`,
        `SUMMARY:${event.content}`,
        "END:VEVENT",
      ]
    })

    // Add holidays
    holidays.forEach((holiday) => {
      const dateString = format(holiday.date, "yyyyMMdd")
      icalContent = [
        ...icalContent,
        "BEGIN:VEVENT",
        `UID:holiday-${dateString}-${Math.random().toString(36).substring(2, 11)}@calendar.diy`,
        `DTSTAMP:${format(new Date(), "yyyyMMddTHHmmss")}Z`,
        `DTSTART;VALUE=DATE:${dateString}`,
        `DTEND;VALUE=DATE:${dateString}`,
        `SUMMARY:${holiday.name}`,
        "CATEGORIES:HOLIDAY",
        "END:VEVENT",
      ]
    })

    icalContent.push("END:VCALENDAR")

    // Create and download the file
    const blob = new Blob([icalContent.join("\r\n")], { type: "text/calendar" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "calendar-diy.ics"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Export to Google Calendar
  const exportToGoogleCalendar = () => {
    // Google Calendar can only handle one event at a time via URL
    // So we'll just open a new event creation page
    if (events.length === 0) {
      alert("No events to export")
      return
    }

    // Just use the first event as an example
    const event = events[0]
    const dateString = format(event.date, "yyyyMMdd")
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.content)}&dates=${dateString}/${dateString}`
    window.open(url, "_blank")
  }

  // Generate calendar grid
  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate)
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const startingDayOfWeek = getDay(firstDayOfMonth)

    const days = []

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="h-20 border-b border-r border-gray-100"></div>)
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
          className={cn(
            "group relative h-20 border-b border-r border-gray-100 p-2 transition-all duration-300",
            isWeekend ? "bg-gray-50/30" : "",
            isTodayDate ? "ring-1 ring-inset ring-black" : "",
            "hover:bg-gray-50", // Use CSS hover instead of React state
          )}
        >
          <div
            className={cn(
              "absolute right-2 top-1 flex h-5 w-5 items-center justify-center rounded-full font-mono text-xs",
              isTodayDate ? "bg-black text-white" : "text-gray-400",
            )}
          >
            {day}
          </div>

          <div className="mt-5 space-y-0.5">
            {dayHolidays.map((holiday, index) => (
              <div key={`holiday-${index}`} className="font-mono text-[9px] uppercase tracking-wider text-gray-500">
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

          <div className="absolute bottom-0 left-0 h-0.5 w-full bg-black opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>,
      )
    }

    return days
  }

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  return (
    <>
      <div
        ref={calendarRef}
        className="calendar-container overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm"
      >
        <div className="border-b border-gray-100 bg-gray-50 p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-mono text-xl font-light tracking-tight">{format(currentDate, "MMMM yyyy")}</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={exportToIcal}
                className="flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-600 transition-colors hover:bg-gray-100"
                title="Export to iCal"
              >
                <Download className="h-3 w-3" />
                <span>iCal</span>
              </button>
              <button
                onClick={exportToGoogleCalendar}
                className="flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-600 transition-colors hover:bg-gray-100"
                title="Export to Google Calendar"
              >
                <CalendarIcon className="h-3 w-3" />
                <span>Google</span>
              </button>
              <button
                onClick={handlePreviousMonth}
                className="flex h-7 w-7 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-200"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={handleNextMonth}
                className="flex h-7 w-7 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-200"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-7">
          {weekDays.map((day) => (
            <div
              key={day}
              className="border-b border-r border-gray-100 bg-gray-50 p-2 text-center font-mono text-xs font-light tracking-wider text-gray-500"
            >
              {day}
            </div>
          ))}
          {renderCalendar()}
        </div>
      </div>

      {/* Event Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div ref={modalRef} className="w-full max-w-md overflow-hidden rounded-lg bg-white shadow-xl">
            <div className="border-b border-gray-100 bg-gray-50 p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-mono text-lg font-light tracking-tight">
                  {selectedDate ? format(selectedDate, "MMMM d, yyyy") : "Add Event"}
                </h3>
                <button
                  onClick={handleCancelEdit}
                  className="rounded-full p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-4">
              <div className="mb-4">
                <label htmlFor="event-content" className="mb-2 block font-mono text-sm text-gray-700">
                  Event
                </label>
                <textarea
                  ref={textareaRef}
                  id="event-content"
                  value={eventContent}
                  onChange={(e) => setEventContent(e.target.value)}
                  onKeyDown={handleTextareaKeyDown}
                  placeholder="Add event details..."
                  className="w-full rounded-md border border-gray-200 p-2 font-mono text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
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
            </div>

            <div className="border-t border-gray-100 bg-gray-50 p-4">
              <div className="flex justify-end gap-2">
                <button
                  onClick={handleCancelEdit}
                  className="rounded-md border border-gray-200 bg-white px-4 py-2 font-mono text-sm text-gray-700 transition-colors hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEvent}
                  className="rounded-md bg-black px-4 py-2 font-mono text-sm text-white transition-colors hover:bg-gray-800"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

