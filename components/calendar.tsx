"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { addMonths, format, getDay, getDaysInMonth, isSameDay, subMonths } from "date-fns"
import html2canvas from "html2canvas"

import { cn } from "@/lib/utils"
import { getAllHolidays, type Holiday } from "@/lib/holidays"

type CalendarCategory = {
  id: string
  name: string
  color: string
  visible: boolean
}

type CalendarEvent = {
  date: Date
  content: string
  categoryId: string
}

// Calendar categories with colors
const defaultCategories: CalendarCategory[] = [
  { id: "personal", name: "Personal", color: "bg-blue-600 text-white", visible: true },
  { id: "work", name: "Work", color: "bg-green-600 text-white", visible: true },
  { id: "family", name: "Family", color: "bg-purple-600 text-white", visible: true },
  { id: "health", name: "Health", color: "bg-red-600 text-white", visible: true },
  { id: "other", name: "Other", color: "bg-yellow-500 text-black", visible: true },
]

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [categories, setCategories] = useState<CalendarCategory[]>(defaultCategories)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [eventContent, setEventContent] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("personal")
  const [holidays, setHolidays] = useState<Holiday[]>([])
  const [isDownloading, setIsDownloading] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [keyboardVisible, setKeyboardVisible] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [showSidebar, setShowSidebar] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)
  const resetModalRef = useRef<HTMLDivElement>(null)
  const calendarRef = useRef<HTMLDivElement>(null)
  const calendarContentRef = useRef<HTMLDivElement>(null)
  const fullCalendarRef = useRef<HTMLDivElement>(null)
  const printableCalendarRef = useRef<HTMLDivElement>(null)

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

  // Load events and categories from localStorage on component mount
  useEffect(() => {
    const savedEvents = localStorage.getItem("calendarEvents")
    const savedCategories = localStorage.getItem("calendarCategories")

    if (savedEvents) {
      try {
        // Convert old format events to new format if needed
        const parsedEvents = JSON.parse(savedEvents)
        const updatedEvents = parsedEvents.map((event: any) => {
          // If the event already has a categoryId, use it
          if (event.categoryId) {
            return {
              ...event,
              date: new Date(event.date),
            }
          }

          // Otherwise, convert from the old color-based format
          let categoryId = "other"
          if (event.color) {
            if (event.color.includes("blue")) categoryId = "personal"
            else if (event.color.includes("green")) categoryId = "work"
            else if (event.color.includes("purple")) categoryId = "family"
            else if (event.color.includes("red")) categoryId = "health"
            else if (event.color.includes("yellow")) categoryId = "other"
          }

          return {
            date: new Date(event.date),
            content: event.content,
            categoryId,
          }
        })

        setEvents(updatedEvents)
      } catch (error) {
        console.error("Error parsing saved events:", error)
      }
    }

    if (savedCategories) {
      try {
        setCategories(JSON.parse(savedCategories))
      } catch (error) {
        console.error("Error parsing saved categories:", error)
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

  // Save events and categories to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("calendarEvents", JSON.stringify(events))
    localStorage.setItem("calendarCategories", JSON.stringify(categories))
  }, [events, categories])

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
          setCurrentDate(new Date())
        } else if (e.key === "Escape") {
          // Close any open dialogs or reset view
          if (showModal) {
            handleCancelEdit()
          }
          if (showResetConfirm) {
            setShowResetConfirm(false)
          }
          if (showSidebar && isMobile) {
            setShowSidebar(false)
          }
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
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [showModal, showResetConfirm, currentDate, showSidebar, isMobile])

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
    const existingEvent = events.find(
      (event) => isSameDay(event.date, day) && categories.find((c) => c.id === event.categoryId)?.visible,
    )
    setEventContent(existingEvent?.content || "")
    setSelectedCategory(existingEvent?.categoryId || "personal")
    setShowModal(true)
  }

  const handleSaveEvent = () => {
    if (!selectedDate) return

    // Remove existing event for this day and category if it exists
    const filteredEvents = events.filter(
      (event) => !(isSameDay(event.date, selectedDate) && event.categoryId === selectedCategory),
    )

    // Add new event if content is not empty
    if (eventContent.trim()) {
      setEvents([
        ...filteredEvents,
        {
          date: selectedDate,
          content: eventContent,
          categoryId: selectedCategory,
        },
      ])
    } else {
      setEvents(filteredEvents)
    }

    setShowModal(false)
    setSelectedDate(null)
    setEventContent("")
    setSelectedCategory("personal")
  }

  const handleCancelEdit = () => {
    setShowModal(false)
    setSelectedDate(null)
    setEventContent("")
    setSelectedCategory("personal")
  }

  // Handle Enter key in textarea
  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Save on Enter without shift key (shift+enter allows for line breaks)
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSaveEvent()
    }
  }

  // Toggle category visibility
  const toggleCategoryVisibility = (categoryId: string) => {
    setCategories(
      categories.map((category) =>
        category.id === categoryId ? { ...category, visible: !category.visible } : category,
      ),
    )
  }

  // Show reset confirmation modal
  const handleShowResetConfirm = () => {
    setShowResetConfirm(true)
  }

  // Reset all user data
  const handleResetData = () => {
    // Clear events
    setEvents([])

    // Reset categories to default
    setCategories(defaultCategories)

    // Clear localStorage
    localStorage.removeItem("calendarEvents")
    localStorage.removeItem("calendarCategories")

    // Close the confirmation modal
    setShowResetConfirm(false)
  }

  // Toggle sidebar on mobile
  const toggleSidebar = () => {
    setShowSidebar(!showSidebar)
  }

  // Download calendar as image
  const downloadCalendarAsImage = async () => {
    try {
      setIsDownloading(true)

      // Create a printable version of the calendar
      const printableCalendar = createPrintableCalendar()

      // Capture the printable calendar
      const canvas = await html2canvas(printableCalendar, {
        backgroundColor: "white",
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
    printableDiv.style.backgroundColor = "white"
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
    printableDiv.appendChild(header)

    // Create calendar grid
    const grid = document.createElement("div")
    grid.style.display = "grid"
    grid.style.gridTemplateColumns = "repeat(7, 1fr)"
    grid.style.border = "1px solid #eee"
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
      dayHeader.style.borderBottom = "1px solid #eee"
      dayHeader.style.borderRight = "1px solid #eee"
      dayHeader.style.backgroundColor = "#f9f9f9"
      dayHeader.style.fontSize = "14px"
      dayHeader.style.color = "#666"
      grid.appendChild(dayHeader)
    })

    const daysInMonth = getDaysInMonth(currentDate)
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const startingDayOfWeek = getDay(firstDayOfMonth)

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      const emptyCell = document.createElement("div")
      emptyCell.style.borderBottom = "1px solid #eee"
      emptyCell.style.borderRight = "1px solid #eee"
      emptyCell.style.height = "100px"
      grid.appendChild(emptyCell)
    }

    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
      const visibleEvents = events.filter(
        (event) => isSameDay(event.date, date) && categories.find((c) => c.id === event.categoryId)?.visible,
      )
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
      dayCell.style.borderBottom = "1px solid #eee"
      dayCell.style.borderRight = "1px solid #eee"
      dayCell.style.height = "100px"

      if (isWeekend) {
        dayCell.style.backgroundColor = "#f9f9f9"
      }

      // Add day number
      const dayNumber = document.createElement("div")
      dayNumber.textContent = day.toString()
      dayNumber.style.position = "absolute"
      dayNumber.style.top = "5px"
      dayNumber.style.right = "10px"
      dayNumber.style.fontSize = "14px"
      dayNumber.style.color = "#999"

      // Apply special styling for March 21, 2025 - only circle, no box
      if (isMarch21) {
        // Remove the box styling, only keep the circle for the number
        dayNumber.style.backgroundColor = "black"
        dayNumber.style.color = "white"
        dayNumber.style.borderRadius = "50%"
        dayNumber.style.width = "20px"
        dayNumber.style.height = "20px"
        dayNumber.style.display = "flex"
        dayNumber.style.alignItems = "center"
        dayNumber.style.justifyContent = "center"
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
        holidayDiv.style.color = "#666"
        holidayDiv.style.marginBottom = "3px"
        holidaysContainer.appendChild(holidayDiv)
      })

      dayCell.appendChild(holidaysContainer)

      // Add events
      const eventsContainer = document.createElement("div")
      eventsContainer.style.marginTop = dayHolidays.length > 0 ? "5px" : "25px"

      visibleEvents.forEach((event) => {
        const eventDiv = document.createElement("div")
        eventDiv.textContent = event.content
        eventDiv.style.fontSize = "11px"
        eventDiv.style.fontWeight = "500"
        eventDiv.style.marginBottom = "3px"

        // Get the category color
        const category = categories.find((c) => c.id === event.categoryId)
        let color = "#000"

        if (category) {
          if (category.color.includes("blue")) color = "#2563eb"
          if (category.color.includes("green")) color = "#16a34a"
          if (category.color.includes("purple")) color = "#9333ea"
          if (category.color.includes("red")) color = "#dc2626"
          if (category.color.includes("yellow")) color = "#eab308"
        }

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
      days.push(<div key={`empty-${i}`} className="h-16 md:h-20 border-b border-r border-gray-100"></div>)
    }

    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
      const visibleEvents = events.filter(
        (event) => isSameDay(event.date, date) && categories.find((c) => c.id === event.categoryId)?.visible,
      )
      const dayHolidays = holidays.filter((holiday) => isSameDay(holiday.date, date))
      const isWeekend = getDay(date) === 0 || getDay(date) === 6

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
          className={cn(
            "calendar-day relative h-16 md:h-20 border-b border-r border-gray-100 p-1 md:p-2 transition-colors",
            isWeekend ? "bg-gray-50/30" : "",
            // Explicitly remove any styling for March 22
            isMarch22 ? "!ring-0" : "",
          )}
        >
          <div
            className={cn(
              "absolute right-1 md:right-2 top-1 flex h-4 md:h-5 w-4 md:w-5 items-center justify-center rounded-full font-mono text-[10px] md:text-xs",
              isMarch21 ? "bg-black text-white" : "text-gray-400",
              // Explicitly remove any styling for March 22
              isMarch22 ? "!bg-transparent !text-gray-400" : "",
            )}
          >
            {day}
          </div>

          <div className="mt-4 md:mt-5 space-y-0.5 overflow-hidden">
            {dayHolidays.map((holiday, index) => (
              <div
                key={`holiday-${index}`}
                className="font-mono text-[8px] md:text-[9px] uppercase tracking-wider text-gray-500 whitespace-normal break-words"
              >
                {holiday.name}
              </div>
            ))}
          </div>

          <div className="mt-0.5 md:mt-1 space-y-0.5 md:space-y-1 overflow-hidden">
            {visibleEvents.map((event, index) => {
              const category = categories.find((c) => c.id === event.categoryId)
              const colorClass = category ? category.color.split(" ")[0].replace("bg-", "text-") : "text-black"

              return (
                <div key={index} className="flex items-start justify-between">
                  <span className={cn("font-mono text-[8px] md:text-[10px] font-medium truncate", colorClass)}>
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
  
  /* Explicitly remove any styling for day 22 */
  .calendar-day:nth-child(29) .rounded-full {
    background-color: transparent !important;
    color: rgba(156, 163, 175, var(--tw-text-opacity)) !important;
  }
`
    document.head.appendChild(style)

    return () => {
      document.head.removeChild(style)
    }
  }, [])

  return (
    <div className="flex flex-col md:flex-row gap-4">
      {/* Sidebar for calendar categories - hidden on mobile by default */}
      <div
        className={cn(
          "md:w-64 bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden transition-all duration-300",
          isMobile ? (showSidebar ? "fixed inset-0 z-50 w-full h-full" : "hidden") : "flex flex-col",
        )}
      >
        {isMobile && showSidebar && (
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <h3 className="font-mono text-lg font-light">Calendars</h3>
            <button
              onClick={toggleSidebar}
              className="rounded-full p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        )}

        <div className="p-4">
          <h3 className="font-mono text-sm font-medium mb-3">My Calendars</h3>

          <div className="space-y-2">
            {categories.map((category) => (
              <div key={category.id} className="flex items-center">
                <input
                  type="checkbox"
                  id={`category-${category.id}`}
                  checked={category.visible}
                  onChange={() => toggleCategoryVisibility(category.id)}
                  className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black"
                />
                <label htmlFor={`category-${category.id}`} className="ml-2 flex items-center text-sm font-mono">
                  <span className={`inline-block w-3 h-3 rounded-full mr-2 ${category.color.split(" ")[0]}`}></span>
                  {category.name}
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col space-y-4">
        <div
          ref={fullCalendarRef}
          className="calendar-full-container overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm"
        >
          <div ref={calendarRef} className="calendar-container">
            <div className="border-b border-gray-100 bg-gray-50 p-2 md:p-4 flex items-center justify-between">
              {isMobile && (
                <button
                  onClick={toggleSidebar}
                  className="flex h-6 w-6 md:h-7 md:w-7 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-200 mr-2"
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
                    <line x1="3" y1="12" x2="21" y2="12"></line>
                    <line x1="3" y1="6" x2="21" y2="6"></line>
                    <line x1="3" y1="18" x2="21" y2="18"></line>
                  </svg>
                </button>
              )}

              <button
                onClick={handlePreviousMonth}
                className="flex h-6 w-6 md:h-7 md:w-7 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-200"
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

              <h2 className="font-mono text-lg md:text-xl font-light tracking-tight uppercase text-center">
                {format(currentDate, "MMMM yyyy")}
              </h2>

              <button
                onClick={handleNextMonth}
                className="flex h-6 w-6 md:h-7 md:w-7 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-200"
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

            <div ref={calendarContentRef} className="grid grid-cols-7">
              {(isMobile ? weekDaysMobile : weekDays).map((day) => (
                <div
                  key={day}
                  className="border-b border-r border-gray-100 bg-gray-50 p-1 md:p-2 text-center font-mono text-[10px] md:text-xs font-light tracking-wider text-gray-500"
                >
                  {day}
                </div>
              ))}
              {renderCalendar()}
            </div>
          </div>
        </div>

        {/* Calendar Controls - Now free-floating without the gray background */}
        <div className="flex flex-wrap items-center justify-center gap-2 p-2 md:p-4">
          <button
            onClick={exportToIcal}
            className="flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-600 transition-colors hover:bg-gray-100"
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
            className="flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-600 transition-colors hover:bg-gray-100"
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
            onClick={handleShowResetConfirm}
            className="flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-600 transition-colors hover:bg-gray-100"
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
              <path d="M3 12a9 9 0 0 0 15 6.7l3-2.7"></path>
            </svg>
            <span>Reset</span>
          </button>
          <button
            onClick={downloadCalendarAsImage}
            className="flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-600 transition-colors hover:bg-gray-100"
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
      </div>

      {/* Event Modal - Properly centered on all screens */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
          <div
            ref={modalRef}
            className="w-full max-w-md overflow-hidden rounded-lg bg-white shadow-xl max-h-[90vh] flex flex-col"
            style={{ margin: "auto" }}
          >
            {/* Modal Header */}
            <div className="border-b border-gray-100 bg-gray-50 p-2 sm:p-3 flex-shrink-0">
              <div className="flex items-center justify-between">
                <h3 className="font-mono text-sm font-light tracking-tight">
                  {selectedDate ? format(selectedDate, "MMMM d, yyyy") : "Add Event"}
                </h3>
                <button
                  onClick={handleCancelEdit}
                  className="rounded-full p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
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
            <div className="p-2 sm:p-3 overflow-y-auto flex-grow">
              <div className="mb-2 sm:mb-3">
                <label htmlFor="event-content" className="mb-1 block font-mono text-xs text-gray-700">
                  Event
                </label>
                <textarea
                  ref={textareaRef}
                  id="event-content"
                  value={eventContent}
                  onChange={(e) => setEventContent(e.target.value)}
                  onKeyDown={handleTextareaKeyDown}
                  placeholder="Add event details..."
                  className="w-full rounded-md border border-gray-200 p-2 font-mono text-base md:text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                  rows={isMobile ? 2 : 3}
                />
              </div>

              <div className="mb-2 sm:mb-3">
                <label className="mb-1 block font-mono text-xs text-gray-700">Calendar</label>
                <div className="grid grid-cols-1 gap-2">
                  {categories.map((category) => (
                    <div key={category.id} className="flex items-center">
                      <input
                        type="radio"
                        id={`modal-category-${category.id}`}
                        name="event-category"
                        value={category.id}
                        checked={selectedCategory === category.id}
                        onChange={() => setSelectedCategory(category.id)}
                        className="h-4 w-4 border-gray-300 text-black focus:ring-black"
                      />
                      <label
                        htmlFor={`modal-category-${category.id}`}
                        className="ml-2 flex items-center text-sm font-mono"
                      >
                        <span
                          className={`inline-block w-3 h-3 rounded-full mr-2 ${category.color.split(" ")[0]}`}
                        ></span>
                        {category.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-100 bg-gray-50 p-2 sm:p-3 flex-shrink-0">
              <div className="flex justify-end gap-2">
                <button
                  onClick={handleCancelEdit}
                  className="rounded-md border border-gray-200 bg-white px-2 py-1 sm:px-3 sm:py-1.5 font-mono text-xs text-gray-700 transition-colors hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEvent}
                  className="rounded-md bg-black px-2 py-1 sm:px-3 sm:py-1.5 font-mono text-xs text-white transition-colors hover:bg-gray-800"
                >
                  Save
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
            className="w-full max-w-md overflow-hidden rounded-lg bg-white shadow-xl max-h-[90vh] flex flex-col"
            style={{ margin: "auto" }}
          >
            {/* Modal Header */}
            <div className="border-b border-gray-100 bg-gray-50 p-2 sm:p-3 flex-shrink-0">
              <div className="flex items-center justify-between">
                <h3 className="font-mono text-sm font-medium tracking-tight">Reset Calendar Data</h3>
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="rounded-full p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
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
            <div className="p-4">
              <p className="text-sm text-gray-600 mb-4">
                Are you sure you want to reset all calendar data? This will remove all events you've added and cannot be
                undone.
              </p>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-100 bg-gray-50 p-2 sm:p-3 flex-shrink-0">
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="rounded-md border border-gray-200 bg-white px-2 py-1 sm:px-3 sm:py-1.5 font-mono text-xs text-gray-700 transition-colors hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleResetData}
                  className="rounded-md bg-red-600 px-2 py-1 sm:px-3 sm:py-1.5 font-mono text-xs text-white transition-colors hover:bg-red-700"
                >
                  Reset Data
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

