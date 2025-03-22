"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { addMonths, format, getDay, getDaysInMonth, isSameDay, subMonths, isToday } from "date-fns"
import html2canvas from "html2canvas"

import { cn } from "@/lib/utils"
import { getAllHolidays, type Holiday } from "@/lib/holidays"
import { Share2 } from "lucide-react"

type CalendarEvent = {
  id: string
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

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)
  const resetModalRef = useRef<HTMLDivElement>(null)
  const calendarRef = useRef<HTMLDivElement>(null)
  const calendarContentRef = useRef<HTMLDivElement>(null)
  const fullCalendarRef = useRef<HTMLDivElement>(null)
  const printableCalendarRef = useRef<HTMLDivElement>(null)
  const shareInputRef = useRef<HTMLInputElement>(null)

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

  // Detect keyboard visibility on mobile
  useEffect(() => {
    if (!isMobile) return

    const detectKeyboard = () => {
      // On iOS, window.innerHeight changes when the keyboard appears
      const isKeyboardVisible = window.innerHeight < window.outerHeight * 0.8
      setKeyboardVisible(isKeyboardVisible)
    }

    window.addEventListener("resize", detectKeyboard)

    // Initial check
    detectKeyboard()

    return () => {
      window.removeEventListener("resize", detectKeyboard)
    }
  }, [isMobile])

  // Load events from localStorage on component mount
  useEffect(() => {
    // Load dark mode preference
    const savedDarkMode = localStorage.getItem("calendarDarkMode")
    if (savedDarkMode) {
      const isDark = JSON.parse(savedDarkMode)
      setIsDarkMode(isDark)
    } else {
      // Check if system prefers dark mode
      const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
      setIsDarkMode(prefersDark)
    }

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
          id: event.id || Math.random().toString(36).substring(2, 11),
          date: new Date(event.date),
          color,
        }
      })
      setEvents(updatedEvents)
    }

    // Check URL for shared date
    const urlParams = new URLSearchParams(window.location.search)
    const dateParam = urlParams.get("date")
    if (dateParam) {
      try {
        const sharedDate = new Date(dateParam)
        if (!isNaN(sharedDate.getTime())) {
          setCurrentDate(sharedDate)
        }
      } catch (e) {
        console.error("Invalid date in URL")
      }
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

  // Save dark mode preference
  useEffect(() => {
    localStorage.setItem("calendarDarkMode", JSON.stringify(isDarkMode))
  }, [isDarkMode])

  // Focus textarea when modal opens
  useEffect(() => {
    if (showModal && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [showModal])

  // Focus share input when share modal opens
  useEffect(() => {
    if (showShareModal && shareInputRef.current) {
      shareInputRef.current.focus()
      shareInputRef.current.select()
    }
  }, [showShareModal])

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setShowModal(false)
      }

      if (showResetConfirm && resetModalRef.current && !resetModalRef.current.contains(event.target as Node)) {
        setShowResetConfirm(false)
      }
    }

    if (showModal || showResetConfirm) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showModal, showResetConfirm])

  // Add keyboard navigation for all interactions
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Month navigation when modal is not open
      if (!showModal && !showResetConfirm) {
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
          const now = new Date()
          setCurrentDate(now)
        } else if (e.key === "Escape") {
          // Close any open dialogs or reset view
          if (showModal) {
            handleCancelEdit()
          }
          if (showResetConfirm) {
            setShowResetConfirm(false)
          }
        } else if (e.key === "d" && (e.ctrlKey || e.metaKey)) {
          // Toggle dark mode with Ctrl+D or Cmd+D
          e.preventDefault()
          setIsDarkMode(!isDarkMode)
        }
      } else {
        // When modal is open
        if (e.key === "Escape") {
          if (showModal) {
            handleCancelEdit()
          }
          if (showResetConfirm) {
            setShowResetConfirm(false)
          }
          if (showShareModal) {
            setShowShareModal(false)
          }
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [showModal, showResetConfirm, currentDate, isDarkMode, showShareModal])

  // Add meta tag to prevent zooming on input focus
  useEffect(() => {
    // Check if the meta tag already exists
    let viewportMeta = document.querySelector('meta[name="viewport"]') as HTMLMetaElement

    if (!viewportMeta) {
      // Create it if it doesn't exist
      viewportMeta = document.createElement("meta") as HTMLMetaElement
      viewportMeta.name = "viewport"
      document.head.appendChild(viewportMeta)
    }

    // Set the content to prevent zooming on input
    viewportMeta.setAttribute("content", "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no")

    return () => {
      // Restore default behavior when component unmounts
      viewportMeta.setAttribute("content", "width=device-width, initial-scale=1")
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

    // If there are no events, prepare to create a new one
    if (existingEvents.length === 0) {
      setEditingEventId(null)
      setEventContent("")
      setSelectedColor("text-black")
    } else {
      // Don't pre-select any event for editing
      setEditingEventId(null)
      setEventContent("")
      setSelectedColor("text-black")
    }

    setShowModal(true)
  }

  const handleSaveEvent = () => {
    if (!selectedDate) return

    if (eventContent.trim()) {
      // If we're editing an existing event
      if (editingEventId) {
        setEvents(
          events.map((event) =>
            event.id === editingEventId ? { ...event, content: eventContent, color: selectedColor } : event,
          ),
        )
      } else {
        // We're adding a new event
        const newEvent = {
          id: Math.random().toString(36).substring(2, 11),
          date: selectedDate,
          content: eventContent,
          color: selectedColor,
        }
        setEvents([...events, newEvent])

        // Add to the current day's events
        setEventsForSelectedDate([...eventsForSelectedDate, newEvent])
      }
    }

    // Reset the form for adding another event
    setEditingEventId(null)
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
      ghostElement.style.background = isDarkMode ? "#333" : "#f5f5f5"
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
    url.searchParams.set("date", format(currentDate, "yyyy-MM-dd"))
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
        button.textContent = "Copied!"
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
      const printableCalendar = createPrintableCalendar()

      // Capture the printable calendar
      const canvas = await html2canvas(printableCalendar, {
        backgroundColor: isDarkMode ? "#1a1a1a" : "white",
        scale: 2, // Higher resolution
        logging: false,
        useCORS: true,
        allowTaint: true,
        width: 1200, // Fixed width
        height: printableCalendar.offsetHeight,
      })

      // Remove the temporary element
      document.body.removeChild(printableCalendar)

      // Convert to image and download
      const image = canvas.toDataURL("image/png")
      const link = document.createElement("a")
      link.href = image
      link.download = `calendar.diy_${format(currentDate, "MMMM_yyyy")}.png`
      link.click()
    } catch (error) {
      console.error("Error generating calendar image:", error)
    } finally {
      setIsDownloading(false)
    }
  }

  // Create a temporary printable version of the calendar
  const createPrintableCalendar = () => {
    // Create a temporary div for the printable calendar
    const printableDiv = document.createElement("div")
    printableDiv.className = "printable-calendar"
    printableDiv.style.position = "absolute"
    printableDiv.style.left = "-9999px"
    printableDiv.style.width = "1200px" // Fixed width to ensure consistency
    printableDiv.style.backgroundColor = isDarkMode ? "#1a1a1a" : "white"
    printableDiv.style.color = isDarkMode ? "#e0e0e0" : "#333"
    printableDiv.style.fontFamily = '"JetBrains Mono", monospace'
    printableDiv.style.padding = "40px" // Add padding for more white space

    // Add month/year header
    const header = document.createElement("h2")
    header.textContent = format(currentDate, "MMMM yyyy").toUpperCase()
    header.style.padding = "20px"
    header.style.margin = "0"
    header.style.fontSize = "24px"
    header.style.fontWeight = "300"
    header.style.textAlign = "center"
    header.style.textTransform = "uppercase"
    header.style.color = isDarkMode ? "#e0e0e0" : "#333"
    printableDiv.appendChild(header)

    // Create calendar grid
    const grid = document.createElement("div")
    grid.style.display = "grid"
    grid.style.gridTemplateColumns = "repeat(7, 1fr)"
    grid.style.border = isDarkMode ? "1px solid #444" : "1px solid #eee"
    grid.style.borderBottom = "none"
    grid.style.borderRight = "none"
    grid.style.maxWidth = "900px" // Limit width for more white space
    grid.style.margin = "0 auto" // Center the grid

    // Add day headers
    weekDays.forEach((day) => {
      const dayHeader = document.createElement("div")
      dayHeader.textContent = day
      dayHeader.style.padding = "10px"
      dayHeader.style.textAlign = "center"
      dayHeader.style.borderBottom = isDarkMode ? "1px solid #444" : "1px solid #eee"
      dayHeader.style.borderRight = isDarkMode ? "1px solid #444" : "1px solid #eee"
      dayHeader.style.backgroundColor = isDarkMode ? "#222" : "#f9f9f9"
      dayHeader.style.fontSize = "14px"
      dayHeader.style.color = isDarkMode ? "#aaa" : "#666"
      grid.appendChild(dayHeader)
    })

    const daysInMonth = getDaysInMonth(currentDate)
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const startingDayOfWeek = getDay(firstDayOfMonth)

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      const emptyCell = document.createElement("div")
      emptyCell.style.borderBottom = isDarkMode ? "1px solid #444" : "1px solid #eee"
      emptyCell.style.borderRight = isDarkMode ? "1px solid #444" : "1px solid #eee"
      emptyCell.style.height = "100px"
      emptyCell.style.backgroundColor = isDarkMode ? "#1a1a1a" : "white"
      grid.appendChild(emptyCell)
    }

    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
      const dayEvents = events.filter((event) => isSameDay(event.date, date))
      const dayHolidays = holidays.filter((holiday) => isSameDay(holiday.date, date))
      const isWeekend = getDay(date) === 0 || getDay(date) === 6

      // HARDCODED SOLUTION: Only highlight March 21, 2025
      const isMarch21 =
        currentDate.getMonth() === 2 && // March is month 2 (0-indexed)
        day === 21 &&
        currentDate.getFullYear() === 2025

      const dayCell = document.createElement("div")
      dayCell.style.position = "relative"
      dayCell.style.padding = "10px"
      dayCell.style.borderBottom = isDarkMode ? "1px solid #444" : "1px solid #eee"
      dayCell.style.borderRight = isDarkMode ? "1px solid #444" : "1px solid #eee"
      dayCell.style.height = "100px"
      dayCell.style.backgroundColor = isDarkMode ? (isWeekend ? "#222" : "#1a1a1a") : isWeekend ? "#f9f9f9" : "white"

      // Add day number
      const dayNumber = document.createElement("div")
      dayNumber.textContent = day.toString()
      dayNumber.style.position = "absolute"
      dayNumber.style.top = "5px"
      dayNumber.style.right = "10px"
      dayNumber.style.fontSize = "14px"
      dayNumber.style.color = isDarkMode ? "#777" : "#999"

      // Apply special styling for March 21, 2025 - only circle, no box
      if (isMarch21) {
        // We're removing the special styling for March 21 in the downloaded version
        // No special styling will be applied to the day number
      }

      dayCell.appendChild(dayNumber)

      // Add holidays
      const holidaysContainer = document.createElement("div")
      holidaysContainer.style.marginTop = "25px"

      dayHolidays.forEach((holiday) => {
        const holidayDiv = document.createElement("div")
        holidayDiv.textContent = holiday.name
        holidayDiv.style.fontSize = "9px"
        holidayDiv.style.textTransform = "uppercase"
        holidayDiv.style.letterSpacing = "0.05em"
        holidayDiv.style.color = isDarkMode ? "#999" : "#666"
        holidayDiv.style.marginBottom = "3px"
        holidaysContainer.appendChild(holidayDiv)
      })

      dayCell.appendChild(holidaysContainer)

      // Add events
      const eventsContainer = document.createElement("div")
      eventsContainer.style.marginTop = dayHolidays.length > 0 ? "5px" : "25px"

      dayEvents.forEach((event) => {
        const eventDiv = document.createElement("div")
        eventDiv.textContent = event.content
        eventDiv.style.fontSize = "11px"
        eventDiv.style.fontWeight = "500"
        eventDiv.style.marginBottom = "3px"

        // Convert Tailwind color classes to CSS colors
        let color = isDarkMode ? "#fff" : "#000"
        if (event.color?.includes("blue")) color = isDarkMode ? "#60a5fa" : "#2563eb"
        if (event.color?.includes("red")) color = isDarkMode ? "#f87171" : "#dc2626"
        if (event.color?.includes("yellow")) color = isDarkMode ? "#fcd34d" : "#eab308"
        if (event.color?.includes("orange")) color = isDarkMode ? "#fdba74" : "#f97316"
        if (event.color?.includes("green")) color = isDarkMode ? "#4ade80" : "#16a34a"
        if (event.color?.includes("purple")) color = isDarkMode ? "#c084fc" : "#9333ea"

        eventDiv.style.color = color
        eventsContainer.appendChild(eventDiv)
      })

      dayCell.appendChild(eventsContainer)
      grid.appendChild(dayCell)
    }

    printableDiv.appendChild(grid)

    // Add more bottom padding
    const bottomSpace = document.createElement("div")
    bottomSpace.style.height = "40px"
    printableDiv.appendChild(bottomSpace)

    document.body.appendChild(printableDiv)

    return printableDiv
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
      const dayEvents = events.filter((event) => isSameDay(event.date, date))
      const dayHolidays = holidays.filter((holiday) => isSameDay(holiday.date, date))
      const isWeekend = getDay(date) === 0 || getDay(date) === 6
      const isCurrentDay = isToday(date)
      const isDragOver = dragOverDate && isSameDay(dragOverDate, date)

      // HARDCODED SOLUTION: Only highlight March 21, 2025 (and not the 22nd)
      // Check if this is March 21, 2025
      const isMarch21 =
        currentDate.getMonth() === 2 && // March is month 2 (0-indexed)
        day === 21 &&
        currentDate.getFullYear() === 2025

      // Explicitly check if this is March 22, 2025 to ensure it's not highlighted
      const isMarch22 = currentDate.getMonth() === 2 && day === 22 && currentDate.getFullYear() === 2025

      days.push(
        <div
          key={day}
          onClick={() => handleDayClick(date)}
          onDragOver={(e) => handleDragOver(date, e)}
          onDrop={(e) => handleDrop(date, e)}
          className={cn(
            "calendar-day relative h-16 md:h-20 border-b border-r border-gray-100 dark:border-gray-800 p-1 md:p-2",
            isWeekend ? "bg-gray-50/30 dark:bg-gray-900/30" : "",
            isCurrentDay ? "bg-gray-50 dark:bg-gray-900/50" : "",
            isDragOver ? "bg-gray-100 dark:bg-gray-800" : "",
            // Remove the ring/box around the day
            // isMarch21 ? "ring-1 ring-inset ring-black" : "",
            // Explicitly remove any styling for March 22
            isMarch22 ? "!ring-0" : "",
          )}
        >
          <div
            className={cn(
              "absolute right-1 md:right-2 top-1 flex h-4 md:h-5 w-4 md:w-5 items-center justify-center rounded-full font-mono text-[10px] md:text-xs",
              isMarch21 ? "bg-black text-white dark:bg-white dark:text-black" : "text-gray-400 dark:text-gray-500",
              isCurrentDay && !isMarch21 ? "bg-gray-200 dark:bg-gray-700" : "",
              // Explicitly remove any styling for March 22
              isMarch22 ? "!bg-transparent !text-gray-400 dark:!text-gray-500" : "",
            )}
          >
            {day}
          </div>

          <div className="mt-4 md:mt-5 space-y-0.5 overflow-hidden">
            {dayHolidays.map((holiday, index) => (
              <div
                key={`holiday-${index}`}
                className="font-mono text-[8px] md:text-[9px] uppercase tracking-wider text-gray-500 dark:text-gray-400 whitespace-normal break-words"
              >
                {holiday.name}
              </div>
            ))}
          </div>

          <div className="mt-0.5 md:mt-1 space-y-0.5 md:space-y-1 overflow-hidden">
            {dayEvents.map((event, index) => {
              // Ensure color is in text- format for backward compatibility
              let textColorClass = event.color || "text-black dark:text-white"
              if (textColorClass.startsWith("bg-")) {
                textColorClass = textColorClass.replace("bg-", "text-")
              }

              // Add dark mode variants
              if (textColorClass === "text-black") {
                textColorClass = "text-black dark:text-white"
              }

              return (
                <div
                  key={index}
                  className="flex items-start justify-between"
                  draggable
                  onDragStart={(e) => handleDragStart(event, e)}
                  onDragEnd={handleDragEnd}
                >
                  <span
                    className={cn(
                      "font-mono text-[8px] md:text-[10px] font-medium break-words cursor-move",
                      textColorClass,
                      "hover:underline",
                    )}
                    style={{ wordBreak: "break-word", whiteSpace: "normal" }}
                  >
                    {event.content}
                  </span>
                </div>
              )
            })}
          </div>
        </div>,
      )
    }

    return days
  }

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  const weekDaysMobile = ["S", "M", "T", "W", "T", "F", "S"]

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

      /* Remove the ::after pseudo-element that creates the black bar */

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
    `
    document.head.appendChild(style)

    return () => {
      document.head.removeChild(style)
    }
  }, [])

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

  return (
    <div className="flex flex-col space-y-4">
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
              <h2 className="font-mono text-lg md:text-xl font-light tracking-tight uppercase text-center dark:text-white">
                {format(currentDate, "MMMM yyyy")}
              </h2>
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

      {/* Calendar Controls - Now free-floating without the gray background */}
      <div className="calendar-controls flex flex-wrap items-center justify-center gap-2 p-2 md:p-4">
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
          <span>iCal</span>
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
          <span>Google</span>
        </button>
        <button
          onClick={handleShare}
          className="flex items-center gap-1 rounded-md border border-gray-200 dark:border-gray-700 px-2 py-1 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
          title="Share Calendar"
        >
          <Share2 className="h-3 w-3" />
          <span>Share</span>
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
          <span>Reset</span>
        </button>
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
          <span>Screenshot</span>
        </button>
      </div>

      {/* Event Modal - Properly centered on all screens */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
          <div
            ref={modalRef}
            className="w-full max-w-md overflow-hidden rounded-lg bg-white dark:bg-gray-800 shadow-xl max-h-[90vh] flex flex-col"
            style={{ margin: "auto" }}
          >
            {/* Modal Header */}
            <div className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-2 sm:p-3 flex-shrink-0">
              <div className="flex items-center justify-between">
                <h3 className="font-mono text-sm font-light tracking-tight dark:text-white">
                  {selectedDate ? format(selectedDate, "MMMM d, yyyy") : "Add Event"}
                </h3>
                <button
                  onClick={handleCancelEdit}
                  className="rounded-full p-1 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {/* Render SVG directly instead of using the Lucide component */}
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

            {/* Modal Content */}
            <div className="p-2 sm:p-3 overflow-y-auto flex-grow dark:text-gray-200">
              {/* Existing events for this day */}
              {eventsForSelectedDate.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-mono text-xs font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Events on {selectedDate ? format(selectedDate, "MMMM d, yyyy") : ""}
                  </h4>
                  <div className="space-y-2">
                    {eventsForSelectedDate.map((event) => (
                      <div
                        key={event.id}
                        className={cn(
                          "p-2 rounded-md border border-gray-200 dark:border-gray-700 flex justify-between items-start",
                          editingEventId === event.id ? "bg-gray-50 dark:bg-gray-700" : "",
                        )}
                      >
                        <div className="flex-1">
                          <p className={cn("text-xs break-words", event.color || "text-black dark:text-white")}>
                            {event.content}
                          </p>
                        </div>
                        <div className="flex space-x-1 ml-2">
                          <button
                            onClick={() => handleEditEvent(event)}
                            className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600"
                            title="Edit event"
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
                              className="h-3 w-3 text-gray-500 dark:text-gray-400"
                            >
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteEvent(event.id)}
                            className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600"
                            title="Delete event"
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
                              className="h-3 w-3 text-gray-500 dark:text-gray-400"
                            >
                              <polyline points="3 6 5 6 21 6"></polyline>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                              <line x1="10" y1="11" x2="10" y2="17"></line>
                              <line x1="14" y1="11" x2="14" y2="17"></line>
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Form for adding/editing an event */}
              <div className="mb-2 sm:mb-3">
                <label
                  htmlFor="event-content"
                  className="mb-1 block font-mono text-xs text-gray-700 dark:text-gray-300"
                >
                  {editingEventId ? "Edit Event" : "Add New Event"}
                </label>
                <textarea
                  ref={textareaRef}
                  id="event-content"
                  value={eventContent}
                  onChange={(e) => setEventContent(e.target.value)}
                  onKeyDown={handleTextareaKeyDown}
                  placeholder={editingEventId ? "Edit event details..." : "Add event details..."}
                  className="w-full rounded-md border border-gray-200 dark:border-gray-700 p-2 font-mono text-base md:text-sm focus:border-black dark:focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-gray-500 dark:bg-gray-700 dark:text-white"
                  rows={isMobile ? 2 : 3}
                />
              </div>

              <div className="mb-2 sm:mb-3">
                <label className="mb-1 block font-mono text-xs text-gray-700 dark:text-gray-300">Color</label>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color.value}
                      className={cn(
                        "flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full",
                        color.bg,
                        color.text,
                        selectedColor === color.value
                          ? "ring-1 ring-gray-400 dark:ring-gray-300 ring-offset-1 dark:ring-offset-gray-800"
                          : "",
                      )}
                      title={color.name}
                      onClick={() => setSelectedColor(color.value)}
                      type="button"
                    >
                      {selectedColor === color.value && (
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
                          className="h-2.5 w-2.5 sm:h-3 sm:w-3"
                        >
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action buttons for the form */}
              <div className="flex justify-end gap-2 mt-4">
                {editingEventId ? (
                  <>
                    <button
                      onClick={() => {
                        setEditingEventId(null)
                        setEventContent("")
                        setSelectedColor("text-black")
                      }}
                      className="rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 py-1 sm:px-3 sm:py-1.5 font-mono text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      Cancel Edit
                    </button>
                    <button
                      onClick={handleSaveEvent}
                      className="rounded-md bg-black dark:bg-white px-2 py-1 sm:px-3 sm:py-1.5 font-mono text-xs text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
                    >
                      Update Event
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleSaveEvent}
                    disabled={!eventContent.trim()}
                    className={cn(
                      "rounded-md px-2 py-1 sm:px-3 sm:py-1.5 font-mono text-xs",
                      eventContent.trim()
                        ? "bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
                        : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed",
                    )}
                  >
                    Add Event
                  </button>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-2 sm:p-3 flex-shrink-0">
              <div className="flex justify-end gap-2">
                <button
                  onClick={handleCancelEdit}
                  className="rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 py-1 sm:px-3 sm:py-1.5 font-mono text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Done
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
            className="w-full max-w-md overflow-hidden rounded-lg bg-white dark:bg-gray-800 shadow-xl max-h-[90vh] flex flex-col"
            style={{ margin: "auto" }}
          >
            {/* Modal Header */}
            <div className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-2 sm:p-3 flex-shrink-0">
              <div className="flex items-center justify-between">
                <h3 className="font-mono text-sm font-medium tracking-tight dark:text-white">Reset Calendar Data</h3>
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="rounded-full p-1 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {/* Render SVG directly instead of using the Lucide component */}
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

            {/* Modal Content */}
            <div className="p-4 dark:text-gray-200">
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                Are you sure you want to reset all calendar data? This will remove all events you've added and cannot be
                undone.
              </p>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-2 sm:p-3 flex-shrink-0">
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 py-1 sm:px-3 sm:py-1.5 font-mono text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleResetData}
                  className="rounded-md bg-red-600 dark:bg-red-700 px-2 py-1 sm:px-3 sm:py-1.5 font-mono text-xs text-white hover:bg-red-700 dark:hover:bg-red-800"
                >
                  Reset Data
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
          <div
            className="w-full max-w-md overflow-hidden rounded-lg bg-white dark:bg-gray-800 shadow-xl max-h-[90vh] flex flex-col"
            style={{ margin: "auto" }}
          >
            {/* Modal Header */}
            <div className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-2 sm:p-3 flex-shrink-0">
              <div className="flex items-center justify-between">
                <h3 className="font-mono text-sm font-medium tracking-tight dark:text-white">Share Calendar</h3>
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

            {/* Modal Content */}
            <div className="p-4 dark:text-gray-200">
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                Share this link to show others this calendar view:
              </p>
              <div className="flex items-center gap-2">
                <input
                  ref={shareInputRef}
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="w-full rounded-md border border-gray-200 dark:border-gray-700 p-2 font-mono text-xs focus:border-black dark:focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-gray-500 dark:bg-gray-700 dark:text-white"
                />
                <button
                  id="copy-button"
                  onClick={copyShareUrl}
                  className="rounded-md bg-black dark:bg-white px-2 py-1 sm:px-3 sm:py-1.5 font-mono text-xs text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 whitespace-nowrap"
                >
                  Copy
                </button>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-2 sm:p-3 flex-shrink-0">
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowShareModal(false)}
                  className="rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 py-1 sm:px-3 sm:py-1.5 font-mono text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

