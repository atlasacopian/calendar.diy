"use client"

import type React from "react"

import { useEffect, useRef, useState, useCallback } from "react"
import { addMonths, format, getDay, getDaysInMonth, isSameDay, subMonths, isToday } from "date-fns"
import html2canvas from "html2canvas"
import { cn } from "@/lib/utils"
import { getAllHolidays, type Holiday } from "@/lib/holidays"
import { Share2, X } from "lucide-react"
import ProjectGroups, { type ProjectGroup } from "@/components/project-groups"

type CalendarEvent = {
  id: string
  date: Date
  content: string
  color?: string
  projectId?: string
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

// Get the background color class from a text color class
const getBgFromTextColor = (textColor: string) => {
  const color = colorOptions.find((c) => c.value === textColor)
  return color ? color.bg : "bg-gray-200"
}

// Get the text color for the background
const getTextForBg = (textColor: string) => {
  const color = colorOptions.find((c) => c.value === textColor)
  return color ? color.text : "text-black"
}

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [eventContent, setEventContent] = useState("")
  const [selectedColor, setSelectedColor] = useState("text-black")
  const [holidays, setHolidays] = useState<Holiday[]>([])
  const [isDownloading, setIsDownloading] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [keyboardVisible, setKeyboardVisible] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [draggedEvent, setDraggedEvent] = useState<CalendarEvent | null>(null)
  const [dragOverDate, setDragOverDate] = useState<Date | null>(null)
  const [showShareModal, setShowShareModal] = useState(false)
  const [shareUrl, setShareUrl] = useState("")
  const [eventsForSelectedDate, setEventsForSelectedDate] = useState<CalendarEvent[]>([])
  const [editingEventId, setEditingEventId] = useState<string | null>(null)
  const [projectGroups, setProjectGroups] = useState<ProjectGroup[]>([
    { id: "default", name: "PROJECT 01", color: "text-black", active: true },
  ])
  const [showDateSelector, setShowDateSelector] = useState(false)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [newProjectName, setNewProjectName] = useState("")
  const [newProjectColor, setNewProjectColor] = useState("text-black")

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)
  const resetModalRef = useRef<HTMLDivElement>(null)
  const calendarRef = useRef<HTMLDivElement>(null)
  const calendarContentRef = useRef<HTMLDivElement>(null)
  const fullCalendarRef = useRef<HTMLDivElement>(null)
  const printableCalendarRef = useRef<HTMLDivElement>(null)
  const shareInputRef = useRef<HTMLInputElement>(null)
  const dateSelectorRef = useRef<HTMLDivElement>(null)
  const eventModalRef = useRef<HTMLDivElement>(null)
  const shareModalRef = useRef<HTMLDivElement>(null)

  const handleToggleProjectGroup = useCallback((groupId: string) => {
    setProjectGroups((prevGroups) =>
      prevGroups.map((group) => (group.id === groupId ? { ...group, active: !group.active } : group)),
    )
  }, [])

  const handleAddProjectGroup = useCallback((name: string, color: string) => {
    const newGroup = {
      id: Math.random().toString(36).substring(2, 11),
      name,
      color,
      active: true,
    }
    setProjectGroups((prev) => [...prev, newGroup])
  }, [])

  const handleRemoveProjectGroup = useCallback((groupId: string) => {
    setProjectGroups((prev) => prev.filter((group) => group.id !== groupId))

    // Update any events using this project group to use the default color
    setEvents((prev) =>
      prev.map((event) =>
        event.projectId === groupId ? { ...event, color: "text-black", projectId: "default" } : event,
      ),
    )
  }, [])

  const handleEditProjectGroup = useCallback((groupId: string, name: string, color: string) => {
    // Update the project group
    setProjectGroups((prev) => prev.map((group) => (group.id === groupId ? { ...group, name, color } : group)))

    // Update any events using this project group to use the new color
    setEvents((prev) => prev.map((event) => (event.projectId === groupId ? { ...event, color } : event)))
  }, [])

  // Initialize component
  useEffect(() => {
    try {
      // Force light mode
      setIsDarkMode(false)

      // Apply light mode to document
      if (typeof document !== "undefined") {
        document.documentElement.classList.remove("dark")
      }

      // Initialize events from localStorage
      if (typeof window !== "undefined" && window.localStorage) {
        const savedEvents = localStorage.getItem("calendarEvents")
        if (savedEvents) {
          try {
            // Convert any bg- color classes to text- color classes for backward compatibility
            const parsedEvents = JSON.parse(savedEvents)
            if (Array.isArray(parsedEvents)) {
              const updatedEvents = parsedEvents.map((event) => {
                let color = event.color || "text-black"
                if (color.startsWith("bg-")) {
                  color = color.replace("bg-", "text-")
                }
                return {
                  ...event,
                  id: event.id || Math.random().toString(36).substring(2, 11),
                  date: new Date(event.date),
                  color,
                }
              })
              setEvents(updatedEvents)
            } else {
              console.error("Saved events is not an array:", parsedEvents)
              setEvents([])
            }
          } catch (e) {
            console.error("Error parsing saved events:", e)
            setEvents([])
          }
        }

        // Check URL for shared date
        try {
          const urlParams = new URLSearchParams(window.location.search)
          const dateParam = urlParams.get("date")
          if (dateParam) {
            const sharedDate = new Date(dateParam)
            if (!isNaN(sharedDate.getTime())) {
              setCurrentDate(sharedDate)
            }
          }
        } catch (e) {
          console.error("Error parsing date from URL:", e)
        }
      }
    } catch (error) {
      console.error("Error in initialization:", error)
    }
  }, [])

  // Check if device is mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    // Initial check
    checkIfMobile()

    // Add event listener for window resize
    window.addEventListener("resize", checkIfMobile)

    // Cleanup
    return () => {
      window.removeEventListener("resize", checkIfMobile)
    }
  }, [])

  // Load holidays for the years needed
  useEffect(() => {
    // Get the current view year
    const viewYear = currentDate.getFullYear()

    // Get current system year
    const systemYear = new Date().getFullYear()

    // Create a set of years we need to load
    const yearsToLoad = new Set([viewYear, viewYear - 1, viewYear + 1, systemYear, systemYear + 1])

    // Load holidays for all needed years
    const allHolidays: Holiday[] = []
    yearsToLoad.forEach((year) => {
      allHolidays.push(...getAllHolidays(year))
    })

    setHolidays(allHolidays)
  }, [currentDate]) // Re-run when currentDate changes

  // Save events to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("calendarEvents", JSON.stringify(events))
  }, [events])

  // Add CSS for proper hover effects
  useEffect(() => {
    const style = document.createElement("style")
    style.textContent = `
      .calendar-day {
        position: relative;
      }
      .calendar-day:hover {
        background-color: rgba(249, 250, 251, 1) !important;
      }
      
      .dark .calendar-day:hover {
        background-color: rgba(30, 30, 30, 1) !important;
      }

      /* Explicitly remove any styling for day 22 */
      .calendar-day:nth-child(29) .rounded-full {
        background-color: transparent !important;
        color: rgba(156, 163, 175, var(--tw-text-opacity)) !important;
      }
      
      /* Print styles */
      @media print {
        body {
          background: white !important;
          color: black !important;
        }
        
        .calendar-container {
          border: 1px solid #eee !important;
          box-shadow: none !important;
        }
        
        .calendar-day {
          border: 1px solid #eee !important;
        }
        
        .calendar-controls, .dark-mode-toggle {
          display: none !important;
        }
      }
      
    /* Ensure text doesn't overflow and is properly truncated */
    .calendar-day .truncate {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 100%;
    }
    
    .calendar-day .line-clamp-2 {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 100%;
      white-space: normal;
    }

    .line-clamp-4 {
      display: -webkit-box;
      -webkit-line-clamp: 4;
      -webkit-box-orient: vertical;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: normal;
    }

    /* Ensure calendar day cells have proper height for multi-line content */
    .calendar-day {
      min-height: 5rem;
    }
    
      /* Make most text uppercase except user input */
      .calendar-day, .font-mono, button, h1, h2, h3, h4, h5, h6, p, span:not(.preserve-case), div:not(.preserve-case), a, label {
        text-transform: uppercase !important;
      }

      /* Add body class to prevent scrolling when modal is open */
      body.modal-open {
        overflow: hidden;
      }

      /* Make sure text is preserved as lowercase in inputs */
      input, textarea {
        text-transform: none !important;
      }

      /* Ensure event text is not cut off */
      .preserve-case {
        text-transform: none !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        word-break: break-word !important;
      }
    `
    document.head.appendChild(style)

    return () => {
      document.head.removeChild(style)
    }
  }, [])

  const handlePreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1))
  }

  const handleDayClick = (day: Date) => {
    setSelectedDate(day)
    const existingEvents = events.filter((event) => isSameDay(event.date, day))
    setEventsForSelectedDate(existingEvents)

    // If there are events, select the first one for editing
    if (existingEvents.length > 0) {
      setEditingEventId(existingEvents[0].id)
      setEventContent(existingEvents[0].content)
      setSelectedColor(existingEvents[0].color || "text-black")
    } else {
      // If there are no events, prepare to create a new one
      setEditingEventId(null)
      setEventContent("")
      setSelectedColor("text-black")
    }

    setShowModal(true)
  }

  const handleSaveEvent = () => {
    if (!selectedDate) return

    if (eventContent.trim()) {
      // Find the selected project by color - make sure we get the exact match
      const selectedProject =
        projectGroups.find((p) => p.color === selectedColor && p.id !== "default") ||
        projectGroups.find((p) => p.id === "default")
      const projectId = selectedProject?.id || "default"

      // If we're editing an existing event
      if (editingEventId) {
        setEvents(
          events.map((event) =>
            event.id === editingEventId ? { ...event, content: eventContent, color: selectedColor, projectId } : event,
          ),
        )

        // Update the events for selected date
        setEventsForSelectedDate(
          eventsForSelectedDate.map((event) =>
            event.id === editingEventId ? { ...event, content: eventContent, color: selectedColor, projectId } : event,
          ),
        )
      } else {
        // Check if we already have 2 events for this day
        const dayEvents = events.filter((event) => isSameDay(event.date, selectedDate))
        if (dayEvents.length >= 2) {
          // If we already have 2 events, don't add more
          alert("Maximum of 2 events per day. Please edit or delete an existing event.")
          return
        } else {
          // We're adding a new event and we have less than 2 events
          const newEvent = {
            id: Math.random().toString(36).substring(2, 11),
            date: selectedDate,
            content: eventContent,
            color: selectedColor,
            projectId,
          }

          // Add the new event to the events array
          const updatedEvents = [...events, newEvent]
          setEvents(updatedEvents)

          // Force save to localStorage immediately
          localStorage.setItem("calendarEvents", JSON.stringify(updatedEvents))

          // Add to the current day's events
          setEventsForSelectedDate([...eventsForSelectedDate, newEvent])
        }
      }
    }

    // Reset the form for adding another event
    setEditingEventId(null)
    setEventContent("")
    setSelectedColor("text-black")
  }

  const handleSaveAndClose = () => {
    // First save any pending event
    if (eventContent.trim()) {
      handleSaveEvent()
    }

    // Then close the modal
    setShowModal(false)
    setSelectedDate(null)
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
      // Close the modal after saving
      setShowModal(false)
      setSelectedDate(null)
    }
  }

  // Show reset confirmation modal
  const handleShowResetConfirm = () => {
    setShowResetConfirm(true)
  }

  // Reset all user data
  const handleResetData = () => {
    // Clear events
    setEvents([])

    // Clear localStorage
    localStorage.removeItem("calendarEvents")

    // Close the confirmation modal
    setShowResetConfirm(false)
  }

  // Handle drag start for events
  const handleDragStart = (event: CalendarEvent, e: React.DragEvent) => {
    setDraggedEvent(event)
    // Set a ghost drag image
    if (e.dataTransfer) {
      const ghostElement = document.createElement("div")
      ghostElement.classList.add("event-ghost")
      ghostElement.textContent = event.content
      ghostElement.style.padding = "4px 8px"
      ghostElement.style.background = "#f5f5f5"
      ghostElement.style.border = "1px solid #ddd"
      ghostElement.style.borderRadius = "4px"
      ghostElement.style.width = "100px"
      ghostElement.style.overflow = "hidden"
      ghostElement.style.whiteSpace = "nowrap"
      ghostElement.style.textOverflow = "ellipsis"
      ghostElement.style.position = "absolute"
      ghostElement.style.top = "-1000px"
      document.body.appendChild(ghostElement)

      e.dataTransfer.setDragImage(ghostElement, 50, 10)

      // Remove the ghost element after a short delay
      setTimeout(() => {
        document.body.removeChild(ghostElement)
      }, 100)
    }
  }

  // Handle drag over for calendar days
  const handleDragOver = (day: Date, e: React.DragEvent) => {
    e.preventDefault()
    setDragOverDate(day)
  }

  // Handle drop for calendar days
  const handleDrop = (day: Date, e: React.DragEvent) => {
    e.preventDefault()
    if (draggedEvent) {
      // Check if the target day already has 2 events
      const dayEvents = events.filter((event) => isSameDay(event.date, day) && event.id !== draggedEvent.id)

      if (dayEvents.length >= 2) {
        // If the day already has 2 events, don't allow the drop
        setDraggedEvent(null)
        setDragOverDate(null)
        return
      }

      // Remove the event from its original date
      const filteredEvents = events.filter((event) => event.id !== draggedEvent.id)

      // Add it to the new date
      setEvents([
        ...filteredEvents,
        {
          ...draggedEvent,
          date: day,
        },
      ])
    }
    setDraggedEvent(null)
    setDragOverDate(null)
  }

  // Handle drag end
  const handleDragEnd = () => {
    setDraggedEvent(null)
    setDragOverDate(null)
  }

  // Share current month view
  const handleShare = () => {
    const url = new URL(window.location.href)
    // Format the date to include year and month for proper sharing
    const dateString = format(currentDate, "yyyy-MM")
    url.searchParams.set("date", dateString)
    setShareUrl(url.toString())
    setShowShareModal(true)
  }

  // Copy share URL to clipboard
  const copyShareUrl = () => {
    if (shareInputRef.current) {
      shareInputRef.current.select()
      document.execCommand("copy")

      // Show feedback
      const button = document.getElementById("copy-button")
      if (button) {
        const originalText = button.textContent
        button.textContent = "COPIED!"
        setTimeout(() => {
          if (button) button.textContent = originalText
        }, 2000)
      }
    }
  }

  // Download calendar as image
  const downloadCalendarAsImage = async () => {
    try {
      setIsDownloading(true)

      // Create a printable version of the calendar
      const printableCalendar = document.createElement("div")
      printableCalendar.className = "printable-calendar"
      printableCalendar.style.position = "absolute"
      printableCalendar.style.left = "-9999px"
      printableCalendar.style.width = "1200px"
      printableCalendar.style.backgroundColor = "white"
      printableCalendar.style.padding = "40px"

      // Add a simple header
      const header = document.createElement("h2")
      header.textContent = format(currentDate, "MMMM yyyy").toUpperCase()
      header.style.textAlign = "center"
      printableCalendar.appendChild(header)

      document.body.appendChild(printableCalendar)

      // Capture the printable calendar
      const canvas = await html2canvas(printableCalendar, {
        backgroundColor: "white",
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true,
      })

      // Remove the temporary element
      document.body.removeChild(printableCalendar)

      // Convert to image and download
      const image = canvas.toDataURL("image/png")
      const link = document.createElement("a")
      link.href = image
      link.download = `calendar_${format(currentDate, "MMMM_yyyy")}.png`
      link.click()
    } catch (error) {
      console.error("Error generating calendar image:", error)
    } finally {
      setIsDownloading(false)
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

    // Add only user events (no holidays)
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

    icalContent.push("END:VCALENDAR")

    // Create and download the file
    const blob = new Blob([icalContent.join("\r\n")], { type: "text/calendar" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "calendar.diy.ics"
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
    // Ensure events is defined and is an array
    if (!Array.isArray(events)) {
      console.error("Events is not an array:", events)
      return []
    }

    const daysInMonth = getDaysInMonth(currentDate)
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const startingDayOfWeek = getDay(firstDayOfMonth)

    const days = []

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(
        <div
          key={`empty-${i}`}
          className="h-16 md:h-20 border-b border-r border-gray-100 dark:border-gray-800"
          onDragOver={(e) => e.preventDefault()}
        ></div>,
      )
    }

    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
      const dayEvents = events.filter(
        (event) =>
          isSameDay(event.date, date) &&
          projectGroups.find(
            (g) =>
              g.active &&
              ((event.projectId && g.id === event.projectId) || (!event.projectId && g.color === event.color)),
          ),
      )
      // Limit to 2 events per day
      const limitedEvents = dayEvents.slice(0, 2)
      const dayHolidays = holidays.filter((holiday) => isSameDay(holiday.date, date))
      const isWeekend = getDay(date) === 0 || getDay(date) === 6
      const isCurrentDay = isToday(date)
      const isDragOver = dragOverDate && isSameDay(dragOverDate, date)

      days.push(
        <div
          key={day}
          onClick={() => handleDayClick(date)}
          onDragOver={(e) => handleDragOver(date, e)}
          onDrop={(e) => handleDrop(date, e)}
          className={cn(
            "calendar-day relative h-16 md:h-20 border-b border-r border-gray-100 dark:border-gray-800 p-1 md:p-2 pt-0.5 md:pt-1",
            isWeekend ? "bg-gray-50/30 dark:bg-gray-900/30" : "",
            isCurrentDay ? "bg-gray-50 dark:bg-gray-900/50" : "",
            isDragOver ? "bg-gray-100 dark:bg-gray-800" : "",
          )}
        >
          <div
            className={cn(
              "absolute right-1 md:right-2 top-0.5 flex h-4 md:h-5 w-4 md:w-5 items-center justify-center rounded-full font-mono text-[10px] md:text-xs",
              isCurrentDay ? "bg-gray-200 dark:bg-gray-700" : "text-gray-400 dark:text-gray-500",
            )}
          >
            {day}
          </div>

          <div className="mt-3 md:mt-3.5 space-y-0.5 overflow-hidden">
            {dayHolidays.map((holiday, index) => (
              <div
                key={`holiday-${index}`}
                className="font-mono text-[8px] md:text-[9px] uppercase tracking-wider text-gray-500 dark:text-gray-400 whitespace-normal break-words"
              >
                {holiday.name.toUpperCase()}
              </div>
            ))}
          </div>

          <div className="mt-0 pt-0 overflow-visible flex flex-col h-[calc(100%-12px)] justify-center">
            {limitedEvents.length === 1 ? (
              // If there's only one event, center it vertically
              <div
                className="flex-1 flex items-center"
                draggable
                onDragStart={(e) => handleDragStart(limitedEvents[0], e)}
                onDragEnd={handleDragEnd}
              >
                <span
                  className={cn(
                    "font-mono text-[10px] md:text-[10px] font-medium cursor-move preserve-case",
                    limitedEvents[0] && limitedEvents[0].color ? limitedEvents[0].color : "text-black dark:text-white",
                    "hover:underline",
                    "max-w-full", // Ensure text doesn't overflow
                    "block", // Make sure it's displayed as a block
                    "line-clamp-4", // Allow up to 4 lines before truncation
                    "break-words", // Break words to prevent overflow
                  )}
                >
                  {limitedEvents[0] ? limitedEvents[0].content : ""}
                </span>
              </div>
            ) : (
              // If there are two events, space them with the divider centered
              <div className="flex flex-col h-full">
                <div
                  className="flex-1 flex items-start"
                  draggable
                  onDragStart={(e) => handleDragStart(limitedEvents[0], e)}
                  onDragEnd={handleDragEnd}
                >
                  <span
                    className={cn(
                      "font-mono text-[10px] md:text-[10px] font-medium cursor-move preserve-case",
                      limitedEvents[0] && limitedEvents[0].color
                        ? limitedEvents[0].color
                        : "text-black dark:text-white",
                      "hover:underline",
                      "max-w-full",
                      "block",
                      "line-clamp-2", // Allow up to 2 lines before truncation
                      "break-words",
                    )}
                  >
                    {limitedEvents[0] ? limitedEvents[0].content : ""}
                  </span>
                </div>

                {/* Only show divider when there are two entries */}
                {limitedEvents.length === 2 && (
                  <div className="border-t border-gray-200 dark:border-gray-700 w-full my-auto"></div>
                )}

                <div
                  className="flex-1 flex items-end"
                  draggable
                  onDragStart={(e) => handleDragStart(limitedEvents[1], e)}
                  onDragEnd={handleDragEnd}
                >
                  <span
                    className={cn(
                      "font-mono text-[10px] md:text-[10px] font-medium cursor-move preserve-case",
                      limitedEvents[1] && limitedEvents[1].color
                        ? limitedEvents[1].color
                        : "text-black dark:text-white",
                      "hover:underline",
                      "max-w-full",
                      "block",
                      "line-clamp-2", // Allow up to 2 lines before truncation
                      "break-words",
                    )}
                  >
                    {limitedEvents[1] ? limitedEvents[1].content : ""}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>,
      )
    }

    return days
  }

  const weekDays = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"]
  const weekDaysMobile = ["S", "M", "T", "W", "T", "F", "S"]

  // Add a function to edit an existing event
  const handleEditEvent = (event: CalendarEvent) => {
    setEditingEventId(event.id)
    setEventContent(event.content)
    setSelectedColor(event.color || "text-black")
  }

  // Add a function to delete an event
  const handleDeleteEvent = (eventId: string) => {
    // Remove from global events
    const updatedEvents = events.filter((event) => event.id !== eventId)
    setEvents(updatedEvents)

    // Remove from current day's events
    const updatedDayEvents = eventsForSelectedDate.filter((event) => event.id !== eventId)
    setEventsForSelectedDate(updatedDayEvents)

    // Reset form if we were editing this event
    if (editingEventId === eventId) {
      setEditingEventId(null)
      setEventContent("")
      setSelectedColor("text-black")
    }
  }

  const handleReorderEvents = (dragIndex: number, hoverIndex: number) => {
    // Create a new array with reordered events
    const updatedDayEvents = [...eventsForSelectedDate]

    // Get the dragged event
    const draggedEvent = updatedDayEvents[dragIndex]

    // Remove the dragged event from the array
    updatedDayEvents.splice(dragIndex, 1)

    // Insert it at the new position
    updatedDayEvents.splice(hoverIndex, 0, draggedEvent)

    // Update the state
    setEventsForSelectedDate(updatedDayEvents)

    // Update the global events array by removing all events for this day and adding the reordered ones
    const otherEvents = events.filter((event) => !isSameDay(event.date, selectedDate as Date))
    const newEvents = [...otherEvents, ...updatedDayEvents]
    setEvents(newEvents)

    // Save to localStorage immediately
    localStorage.setItem("calendarEvents", JSON.stringify(newEvents))
  }

  const formatDate = (date: Date | null) => {
    if (!date) return ""
    return format(date, "MMMM d, yyyy").toUpperCase()
  }

  const [eventText, setEventText] = useState("")
  const [selectedProject, setSelectedProject] = useState("General")
  const projects = ["General", "Work", "Personal", "Errands"]
  const colors = ["#FF0000", "#00FF00", "#0000FF", "#FFFF00"]

  const closeModal = () => {
    setShowModal(false)
  }

  const saveEvent = () => {
    if (!selectedDate) return

    const newEvent = {
      id: Math.random().toString(36).substring(2, 11),
      date: selectedDate,
      content: eventText,
      color: selectedColor,
      projectId: "default",
    }

    setEvents([...events, newEvent])
    localStorage.setItem("calendarEvents", JSON.stringify([...events, newEvent]))
    closeModal()
  }

  // Add keyboard event handlers for left and right arrow keys
  // Add this effect to handle keyboard navigation:
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle keyboard events when no modal is open
      if (showModal || showResetConfirm || showShareModal || showDateSelector) {
        return
      }

      // Left arrow key - previous month
      if (e.key === "ArrowLeft") {
        setCurrentDate(subMonths(currentDate, 1))
      }

      // Right arrow key - next month
      if (e.key === "ArrowRight") {
        setCurrentDate(addMonths(currentDate, 1))
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [showModal, showResetConfirm, showShareModal, showDateSelector, currentDate])

  // Update the event modal to close when clicking outside
  // Add this effect to handle clicks outside the event modal:
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showModal && eventModalRef.current && !eventModalRef.current.contains(event.target as Node)) {
        setShowModal(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showModal])

  // Update the reset confirmation modal to close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showResetConfirm && resetModalRef.current && !resetModalRef.current.contains(event.target as Node)) {
        setShowResetConfirm(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showResetConfirm])

  // Update the share modal to close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showShareModal && shareModalRef.current && !shareModalRef.current.contains(event.target as Node)) {
        setShowShareModal(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showShareModal])

  return (
    <div className="flex flex-col space-y-1">
      {/* Calendar Controls - Now at the top */}
      <div className="calendar-controls flex items-center justify-end gap-2 p-0 mb-1">
        <button
          onClick={downloadCalendarAsImage}
          className="flex items-center gap-1 rounded-md border border-gray-200 dark:border-gray-700 px-2 py-1 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
          title="Download as Image"
          disabled={isDownloading}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-3 w-3"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          <span>SCREENSHOT</span>
        </button>
        <button
          onClick={exportToIcal}
          className="flex items-center gap-1 rounded-md border border-gray-200 dark:border-gray-700 px-2 py-1 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
          title="Export to iCal"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-3 w-3"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          <span>ICAL</span>
        </button>
        <button
          onClick={exportToGoogleCalendar}
          className="flex items-center gap-1 rounded-md border border-gray-200 dark:border-gray-700 px-2 py-1 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
          title="Export to Google Calendar"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-3 w-3"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          <span>GOOGLE</span>
        </button>
        <button
          onClick={handleShare}
          className="flex items-center gap-1 rounded-md border border-gray-200 dark:border-gray-700 px-2 py-1 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
          title="Share Calendar"
        >
          <Share2 className="h-3 w-3" />
          <span>SHARE</span>
        </button>
        <button
          onClick={handleShowResetConfirm}
          className="flex items-center gap-1 rounded-md border border-gray-200 dark:border-gray-700 px-2 py-1 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
          title="Reset Calendar Data"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-3 w-3"
          >
            <path d="M3 2v6h6"></path>
            <path d="M21 12A9 9 0 0 0 6 5.3L3 8"></path>
            <path d="M21 22v-6h-6"></path>
            <path d="M3 12a9  9 0 0 0 15 6.7l3-2.7"></path>
          </svg>
          <span>RESET</span>
        </button>
      </div>

      <div
        ref={fullCalendarRef}
        className="calendar-full-container overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm"
      >
        <div ref={calendarRef} className="calendar-container">
          <div className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 p-2 md:p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={handlePreviousMonth}
                className="flex h-6 w-6 md:h-7 md:w-7 items-center justify-center rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-3 w-3 md:h-4 md:w-4"
                >
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative date-selector-container">
                <button
                  onClick={() => setShowDateSelector(!showDateSelector)}
                  className="font-mono text-lg md:text-xl font-light tracking-tight uppercase text-center dark:text-white hover:underline focus:outline-none"
                >
                  {format(currentDate, "MMMM yyyy").toUpperCase()}
                </button>

                {showDateSelector && (
                  <div
                    ref={dateSelectorRef}
                    className="absolute z-10 mt-1 w-56 origin-top-right rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="menu-button"
                  >
                    <div className="py-1" role="none">
                      <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                        <div className="grid grid-cols-1 gap-1">
                          <select
                            value={currentDate.getFullYear()}
                            onChange={(e) => {
                              setCurrentDate(new Date(Number.parseInt(e.target.value), currentDate.getMonth(), 1))
                            }}
                            className="p-1 text-xs text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded"
                          >
                            {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i).map((year) => (
                              <option key={year} value={year}>
                                {year}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-1 p-2">
                        {Array.from({ length: 12 }, (_, i) => i).map((month) => (
                          <button
                            key={month}
                            onClick={() => {
                              setCurrentDate(new Date(currentDate.getFullYear(), month, 1))
                              setShowDateSelector(false)
                            }}
                            className={`p-1 text-xs rounded ${
                              currentDate.getMonth() === month
                                ? "bg-gray-200 dark:bg-gray-700 font-bold"
                                : "hover:bg-gray-100 dark:hover:bg-gray-700"
                            }`}
                          >
                            {format(new Date(2000, month, 1), "MMM")}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center">
              <button
                onClick={handleNextMonth}
                className="flex h-6 w-6 md:h-7 md:w-7 items-center justify-center rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-3 w-3 md:h-4 md:w-4"
                >
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>
            </div>
          </div>

          <div className="flex">
            <div className="flex-1">
              <div className="w-full">
                <div ref={calendarContentRef} className="grid grid-cols-7">
                  {(isMobile ? weekDaysMobile : weekDays).map((day) => (
                    <div
                      key={day}
                      className="border-b border-r border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 p-1 md:p-2 text-center font-mono text-[10px] md:text-xs font-light tracking-wider text-gray-500 dark:text-gray-400"
                    >
                      {day}
                    </div>
                  ))}
                  {renderCalendar()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Project groups */}
      <ProjectGroups
        groups={projectGroups}
        onToggleGroup={handleToggleProjectGroup}
        onAddGroup={handleAddProjectGroup}
        onRemoveGroup={handleRemoveProjectGroup}
        onEditGroup={handleEditProjectGroup}
        className="mt-1"
      />

      {/* Event Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div ref={eventModalRef} className="bg-white rounded-lg shadow-lg w-full max-w-md mx-auto overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold tracking-tight">{formatDate(selectedDate)}</h2>
                <button onClick={closeModal} className="text-gray-500 hover:text-gray-700 transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mb-6">
                <label htmlFor="event-name" className="block text-sm font-medium mb-2">
                  EVENT
                </label>
                <textarea
                  id="event-name"
                  value={eventText}
                  onChange={(e) => setEventText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      saveEvent()
                      closeModal() // Close the modal after saving
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 ring-black"
                  rows={3}
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">PROJECT</label>
                <div className="flex flex-wrap gap-2">
                  {projects.map((project) => (
                    <button
                      key={project}
                      onClick={() => setSelectedProject(project)}
                      className={`px-4 py-2 rounded-md border transition-colors ${
                        selectedProject === project
                          ? "bg-black text-white border-black"
                          : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                      }`}
                    >
                      {project}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mt-4">
                {colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`w-6 h-6 rounded-full ${
                      selectedColor === color ? "ring-2 ring-black ring-offset-2" : ""
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>

              <div className="flex justify-end gap-3 mt-8">
                <button
                  onClick={saveEvent}
                  className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
                >
                  SAVE
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
          <div
            ref={resetModalRef}
            className="w-full max-w-md overflow-hidden rounded-lg bg-white dark:bg-gray-800 shadow-xl"
            style={{ margin: "auto" }}
          >
            <div className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-2 sm:p-3">
              <div className="flex items-center justify-between">
                <h3 className="font-mono text-sm font-light tracking-tight dark:text-white">CONFIRM RESET</h3>
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="rounded-full p-1 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                  >
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-4 sm:p-6 overflow-y-auto dark:text-gray-200">
              <p className="font-mono text-xs">
                ARE YOU SURE YOU WANT TO RESET ALL DATA? THIS ACTION CANNOT BE UNDONE.
              </p>
            </div>
            <div className="border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-2 sm:p-3 flex justify-end">
              <button
                type="button"
                className="inline-flex justify-center rounded-md border border-transparent bg-red-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                onClick={handleResetData}
              >
                RESET
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
          <div
            ref={shareModalRef}
            className="relative w-full max-w-md overflow-hidden rounded-lg bg-white dark:bg-gray-800 shadow-xl"
          >
            <div className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-2 sm:p-3">
              <div className="flex items-center justify-between">
                <h3 className="font-mono text-sm font-light tracking-tight dark:text-white">SHARE CALENDAR</h3>
                <button
                  onClick={() => setShowShareModal(false)}
                  className="rounded-full p-1 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                  >
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-4 sm:p-6">
              <label
                htmlFor="share-url"
                className="block font-mono text-xs font-medium text-gray-700 dark:text-gray-300"
              >
                SHARE LINK
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <input
                  type="text"
                  id="share-url"
                  className="block w-full rounded-md border-gray-300 pr-12 focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm font-mono"
                  value={shareUrl}
                  readOnly
                  ref={shareInputRef}
                />
                <div className="absolute inset-y-0 right-0 flex items-center">
                  <button
                    id="copy-button"
                    onClick={copyShareUrl}
                    className="rounded-r-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
                  >
                    COPY
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

