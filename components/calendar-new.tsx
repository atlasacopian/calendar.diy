"use client"

import type React from "react"

import { useEffect, useRef, useState, useCallback } from "react"
import { addMonths, format, getDay, getDaysInMonth, isSameDay, subMonths, isToday } from "date-fns"
import html2canvas from "html2canvas"
import { cn } from "@/lib/utils"
import { getAllHolidays, type Holiday } from "@/lib/holidays"
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
  { name: "Black", value: "text-black", bg: "bg-[#000000]", text: "text-white", hex: "#000000" },
  { name: "Blue", value: "text-blue-600", bg: "bg-[#0012ff]", text: "text-white", hex: "#0012ff" },
  { name: "Red", value: "text-red-600", bg: "bg-[#ff0000]", text: "text-white", hex: "#ff0000" },
  { name: "Yellow", value: "text-yellow-500", bg: "bg-[#e3e600]", text: "text-white", hex: "#e3e600" },
  { name: "Green", value: "text-green-600", bg: "bg-[#1ae100]", text: "text-white", hex: "#1ae100" },
  { name: "Purple", value: "text-purple-600", bg: "bg-[#a800ff]", text: "text-white", hex: "#a800ff" },
  { name: "Orange", value: "text-orange-500", bg: "bg-[#ff7200]", text: "text-white", hex: "#ff7200" },
]

// Get the background color class from a text color class
const getBgFromTextColor = (textColor: string) => {
  const color = colorOptions.find((c) => c.value === textColor)
  return color ? color.bg : "bg-gray-200"
}

const getTextForBg = (textColor: string) => {
  const color = colorOptions.find((c) => c.value === textColor)
  return "text-white"
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
    { id: "default", name: "TAG 01", color: "text-black", active: true },
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
  const eventInputRef = useRef<HTMLInputElement>(null)

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
  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    // Save and close on Enter without shift key (shift+enter allows for line breaks)
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSaveAndClose() // This will save and close the modal
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

    // Reset project groups to original state
    setProjectGroups([{ id: "default", name: "TAG 01", color: "text-black", active: true }])

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

      // Get the calendar container element
      const calendarElement = fullCalendarRef.current
      if (!calendarElement) {
        console.error("Calendar element not found")
        setIsDownloading(false)
        return
      }

      // Create a clone of the calendar to modify for screenshot
      const clonedCalendar = calendarElement.cloneNode(true) as HTMLElement

      // Style the cloned calendar for screenshot
      clonedCalendar.style.position = "absolute"
      clonedCalendar.style.left = "-9999px"
      clonedCalendar.style.width = "1200px" // Wider width for better text rendering
      clonedCalendar.style.backgroundColor = "white"
      clonedCalendar.style.padding = "20px"
      clonedCalendar.style.border = "none"
      clonedCalendar.style.borderRadius = "0"
      clonedCalendar.style.boxShadow = "none"

      // Remove highlighting of current day
      const todayCells = clonedCalendar.querySelectorAll(".bg-gray-50, .bg-gray-200, .dark\\:bg-gray-700")
      todayCells.forEach((cell) => {
        ;(cell as HTMLElement).classList.remove("bg-gray-50", "bg-gray-200", "dark:bg-gray-700")
        if ((cell as HTMLElement).classList.contains("rounded-full")) {
          ;(cell as HTMLElement).style.backgroundColor = "transparent"
          ;(cell as HTMLElement).style.color = "#999"
        }
      })

      // Ensure text doesn't get cut off by increasing cell heights and adjusting text properties
      const dayCells = clonedCalendar.querySelectorAll(".calendar-day")
      dayCells.forEach((cell) => {
        ;(cell as HTMLElement).style.minHeight = "120px"
        ;(cell as HTMLElement).style.height = "auto"
        ;(cell as HTMLElement).style.padding = "10px"

        // Make sure text is fully visible
        const textElements = cell.querySelectorAll("span, div")
        textElements.forEach((el) => {
          ;(el as HTMLElement).style.overflow = "visible"
          ;(cell as HTMLElement).style.whiteSpace = "normal"
          ;(cell as HTMLElement).style.textOverflow = "clip"
          ;(cell as HTMLElement).style.maxWidth = "none"
          ;(cell as HTMLElement).style.width = "auto"
          ;(cell as HTMLElement).classList.remove("line-clamp-2", "line-clamp-4")
        })
      })

      // Add the cloned calendar to the document body
      document.body.appendChild(clonedCalendar)

      // Use html2canvas to capture the entire calendar
      const canvas = await html2canvas(clonedCalendar, {
        backgroundColor: "white",
        scale: 2, // Higher resolution
        logging: false,
        useCORS: true,
        allowTaint: true,
        width: clonedCalendar.offsetWidth,
        height: clonedCalendar.offsetHeight,
        onclone: (document, element) => {
          // Additional modifications to the cloned element
          const textElements = element.querySelectorAll(".preserve-case, .line-clamp-2, .line-clamp-4")
          textElements.forEach((el) => {
            ;(el as HTMLElement).style.overflow = "visible"
            ;(el as HTMLElement).style.whiteSpace = "normal"
            ;(el as HTMLElement).style.textOverflow = "clip"
            ;(el as HTMLElement).style.webkitLineClamp = "none"
            ;(el as HTMLElement).style.maxWidth = "none"
            ;(el as HTMLElement).style.width = "auto"
          })
        },
      })

      // Remove the cloned calendar from the document
      document.body.removeChild(clonedCalendar)

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

  // Create a temporary printable version of the calendar
  const createPrintableCalendar = () => {
    // Create a temporary div for the printable calendar
    const printableDiv = document.createElement("div")
    printableDiv.className = "printable-calendar"
    printableDiv.style.position = "absolute"
    printableDiv.style.left = "-9999px"
    printableDiv.style.width = "1200px" // Fixed width to ensure consistency
    printableDiv.style.backgroundColor = "white"
    printableDiv.style.color = "#333"
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
    header.style.color = "#333"
    printableDiv.appendChild(header)

    // Create calendar grid
    const grid = document.createElement("div")
    grid.style.display = "grid"
    grid.style.gridTemplateColumns = "repeat(7, 1fr)"
    grid.style.border = "1px solid #eee"
    grid.style.borderBottom = "none"
    grid.style.borderRight = "none"
    grid.style.maxWidth = "1100px" // Increased width for more space
    grid.style.margin = "0 auto" // Center the grid

    // Add day headers
    weekDays.forEach((day) => {
      const dayHeader = document.createElement("div")
      dayHeader.textContent = day.toUpperCase()
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
      emptyCell.style.height = "120px" // Increased height for more space
      emptyCell.style.backgroundColor = "white"
      grid.appendChild(emptyCell)
    }

    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
      const dayEvents = events.filter((event) => isSameDay(event.date, date))
      const dayHolidays = holidays.filter((holiday) => isSameDay(holiday.date, date))
      const isWeekend = getDay(date) === 0 || getDay(date) === 6
      const isMarch21 =
        currentDate.getMonth() === 2 && // March is month 2 (0-indexed)
        day === 21 &&
        currentDate.getFullYear() === 2025

      const dayCell = document.createElement("div")
      dayCell.style.position = "relative"
      dayCell.style.padding = "10px"
      dayCell.style.borderBottom = "1px solid #eee"
      dayCell.style.borderRight = "1px solid #eee"
      dayCell.style.height = "120px" // Increased height for more space
      dayCell.style.backgroundColor = isWeekend ? "#f9f9f9" : "white"

      // Add day number
      const dayNumber = document.createElement("div")
      dayNumber.textContent = day.toString()
      dayNumber.style.position = "absolute"
      dayNumber.style.top = "5px"
      dayNumber.style.right = "10px"
      dayNumber.style.fontSize = "14px"
      dayNumber.style.color = "#999"

      dayCell.appendChild(dayNumber)

      // Add holidays
      const holidaysContainer = document.createElement("div")
      holidaysContainer.style.marginTop = "25px"

      dayHolidays.forEach((holiday) => {
        const holidayDiv = document.createElement("div")
        holidayDiv.textContent = holiday.name.toUpperCase()
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
      eventsContainer.style.marginTop = dayHolidays.length > 0 ? "5px" : "15px"
      eventsContainer.style.display = "flex"
      eventsContainer.style.flexDirection = "column"
      eventsContainer.style.height = "calc(100% - 25px)"

      // If there's only one event, center it vertically
      if (dayEvents.length === 1) {
        eventsContainer.style.justifyContent = "center"
      } else {
        eventsContainer.style.justifyContent = "space-between"
      }

      // Limit to 2 events
      const limitedEvents = dayEvents.slice(0, 2)

      if (limitedEvents.length === 1) {
        // Single event - centered vertically
        const event = limitedEvents[0]
        const eventDiv = document.createElement("div")
        eventDiv.textContent = event.content
        eventDiv.style.fontSize = "11px"
        eventDiv.style.fontWeight = "500"
        eventDiv.style.wordBreak = "break-word"
        eventDiv.style.overflow = "hidden"
        eventDiv.style.maxWidth = "100%"
        eventDiv.style.textOverflow = "ellipsis"
        eventDiv.style.whiteSpace = "nowrap"

        // Update the first instance of color mapping in the createPrintableCalendar function for single events
        // Convert Tailwind color classes to CSS colors
        let color = "#000"
        if (event?.color?.includes("blue")) color = "#2563eb"
        if (event?.color?.includes("red")) color = "#dc2626"
        if (event?.color?.includes("yellow")) color = "#e3e600"
        if (event?.color?.includes("orange")) color = "#f97316"
        if (event?.color?.includes("green")) color = "#16a34a"
        if (event?.color?.includes("purple")) color = "#9333ea"

        eventDiv.style.color = color
        eventsContainer.appendChild(eventDiv)
      } else if (limitedEvents.length === 2) {
        // Two events with centered divider
        const topEventContainer = document.createElement("div")
        topEventContainer.style.flex = "1"
        topEventContainer.style.display = "flex"
        topEventContainer.style.alignItems = "flex-start"

        const event1 = limitedEvents[0]
        const eventDiv1 = document.createElement("div")
        eventDiv1.textContent = event1.content
        eventDiv1.style.fontSize = "11px"
        eventDiv1.style.fontWeight = "500"
        eventDiv1.style.wordBreak = "break-word"
        eventDiv1.style.overflow = "hidden"
        eventDiv1.style.maxWidth = "100%"
        eventDiv1.style.textOverflow = "ellipsis"
        eventDiv1.style.whiteSpace = "nowrap"

        // Update the color mapping in the createPrintableCalendar function for yellow
        // Convert Tailwind color classes to CSS colors
        let color1 = "#000"
        if (event1?.color?.includes("blue")) color1 = "#2563eb"
        if (event1?.color?.includes("red")) color1 = "#dc2626"
        if (event1?.color?.includes("yellow")) color1 = "#e3e600"
        if (event1?.color?.includes("orange")) color1 = "#f97316"
        if (event1?.color?.includes("green")) color1 = "#16a34a"
        if (event1?.color?.includes("purple")) color1 = "#9333ea"

        eventDiv1.style.color = color1
        topEventContainer.appendChild(eventDiv1)
        eventsContainer.appendChild(topEventContainer)

        // Add centered divider only when there are 2 events
        const divider = document.createElement("div")
        divider.style.height = "1px"
        divider.style.backgroundColor = "#eee"
        divider.style.width = "100%"
        divider.style.margin = "auto 0"
        eventsContainer.appendChild(divider)

        // Bottom event
        const bottomEventContainer = document.createElement("div")
        bottomEventContainer.style.flex = "1"
        bottomEventContainer.style.display = "flex"
        bottomEventContainer.style.alignItems = "flex-end"

        const event2 = limitedEvents[1]
        const eventDiv2 = document.createElement("div")
        eventDiv2.textContent = event2.content
        eventDiv2.style.fontSize = "11px"
        eventDiv2.style.fontWeight = "500"
        eventDiv2.style.wordBreak = "break-word"
        eventDiv2.style.overflow = "hidden"
        eventDiv2.style.maxWidth = "100%"
        eventDiv2.style.textOverflow = "ellipsis"
        eventDiv2.style.whiteSpace = "nowrap"

        // Convert Tailwind color classes to CSS colors
        let color2 = "#000"
        if (event2?.color?.includes("blue")) color2 = "#2563eb"
        if (event2?.color?.includes("red")) color2 = "#dc2626"
        if (event2?.color?.includes("yellow")) color2 = "#e3e600"
        if (event2?.color?.includes("orange")) color2 = "#f97316"
        if (event2?.color?.includes("green")) color2 = "#16a34a"
        if (event2?.color?.includes("purple")) color2 = "#9333ea"

        eventDiv2.style.color = color2
        bottomEventContainer.appendChild(eventDiv2)
        eventsContainer.appendChild(bottomEventContainer)
      }

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
                  className="font-mono text-[10px] md:text-[10px] font-medium cursor-move preserve-case hover:underline max-w-full block line-clamp-4 break-words"
                  style={{
                    color: getExactColorHex(limitedEvents[0].color),
                  }}
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
                    className="font-mono text-[10px] md:text-[10px] font-medium cursor-move preserve-case hover:underline max-w-full block line-clamp-2 break-words"
                    style={{
                      color: getExactColorHex(limitedEvents[0]?.color),
                    }}
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
                    className="font-mono text-[10px] md:text-[10px] font-medium cursor-move preserve-case hover:underline max-w-full block line-clamp-2 break-words"
                    style={{
                      color: getExactColorHex(limitedEvents[1]?.color),
                    }}
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

    // Fill in the remaining cells to complete the grid with proper borders
    const totalCells = startingDayOfWeek + daysInMonth
    const cellsInRow = 7
    const remainingCells = cellsInRow - (totalCells % cellsInRow)

    // Only add remaining cells if we need to complete the last row
    // Don't add a whole extra row
    if (remainingCells < 7) {
      for (let i = 0; i < remainingCells; i++) {
        days.push(
          <div
            key={`empty-end-${i}`}
            className="h-16 md:h-20 border-b border-r border-gray-100 dark:border-gray-800"
            onDragOver={(e) => e.preventDefault()}
          ></div>,
        )
      }
    }

    return days
  }

  // Add this helper function to get the exact hex color
  const getExactColorHex = (colorClass: string | undefined) => {
    if (!colorClass) return "#000000" // Default to black

    const colorOption = colorOptions.find((c) => c.value === colorClass)
    if (colorOption) {
      return colorOption.hex
    }

    // Fallback mapping for legacy color classes
    if (colorClass.includes("blue")) return "#0012ff"
    if (colorClass.includes("red")) return "#ff0000"
    if (colorClass.includes("yellow")) return "#e3e600"
    if (colorClass.includes("green")) return "#1ae100"
    if (colorClass.includes("purple")) return "#a800ff"
    if (colorClass.includes("orange")) return "#ff7200"

    return "#000000" // Default to black
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

      // If there are no more events for this day, close the modal
      if (updatedDayEvents.length === 0) {
        setShowModal(false)
        setSelectedDate(null)
      }
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

  // Add useEffect to focus the textarea and place cursor at the end when the event modal opens
  // Add this after the existing useEffect hooks

  // Focus textarea and place cursor at end when event modal opens
  useEffect(() => {
    if (showModal) {
      // Focus the textarea after a short delay to ensure the DOM is ready
      const timer = setTimeout(() => {
        const input = document.getElementById("event-content") as HTMLInputElement
        if (input) {
          input.focus()
          // Place cursor at the end of the text
          const length = input.value.length
          input.setSelectionRange(length, length)
        }
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [showModal])

  return (
    <div className="flex flex-col space-y-4 min-h-screen">
      {/* Calendar Controls - Now with reset button on left and others on right */}
      <div className="calendar-controls flex items-center justify-between gap-2 p-0 mb-1">
        {/* Reset button on the left */}
        <div>
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

        {/* Other buttons on the right */}
        <div className="flex items-center gap-2">
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
              <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
              <circle cx="12" cy="13" r="3" />
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
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
            <span>SHARE</span>
          </button>
        </div>
      </div>

      <div
        ref={fullCalendarRef}
        className="calendar-full-container overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm"
        style={{ minHeight: "650px" }}
      >
        <div className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 p-2 md:p-4">
          <div className="grid grid-cols-3 items-center">
            <div className="flex justify-start">
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

            <div className="flex justify-center">
              <div className="relative date-selector-container">
                <button
                  onClick={() => setShowDateSelector(!showDateSelector)}
                  className="font-mono text-lg md:text-xl tracking-tight uppercase text-center dark:text-white hover:underline focus:outline-none px-2 py-1 border-b-2 border-transparent hover:border-gray-200"
                >
                  {format(currentDate, "MMMM yyyy").toUpperCase()}
                </button>

                {showDateSelector && (
                  <div
                    ref={dateSelectorRef}
                    className="absolute z-10 mt-1 w-56 origin-top-center left-1/2 transform -translate-x-1/2 rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="menu-button"
                  >
                    <div className="py-1" role="none">
                      <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                        <div className="grid grid-cols-1 gap-1">
                          <select
                            value={currentDate.getFullYear()}
                            onChange={(e) => {
                              setCurrentDate(new Date(Number.parseInt(e.target.value), currentDate.getMonth(), 1))
                            }}
                            className="p-1 text-xs text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded focus:ring-black focus:border-black"
                          >
                            {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i).map((year) => (
                              <option key={year} value={year}>
                                {year}
                              </option>
                            ))}
                          </select>
                        </div>
                        <button
                          onClick={() => setShowDateSelector(false)}
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
                      <div className="grid grid-cols-3 gap-1 p-2">
                        {Array.from({ length: 12 }, (_, i) => i).map((month) => (
                          <button
                            key={month}
                            onClick={() => {
                              setCurrentDate(new Date(currentDate.getFullYear(), month, 1))
                              // Don't close the dropdown
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

            <div className="flex justify-end">
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

      {/* Project groups */}
      <ProjectGroups
        groups={projectGroups}
        onToggleGroup={handleToggleProjectGroup}
        onAddGroup={handleAddProjectGroup}
        onRemoveGroup={handleRemoveProjectGroup}
        onEditGroup={handleEditProjectGroup}
        className="mt-4 flex justify-center" // Changed from mt-12 to mt-auto and added pt-8
      />

      {/* Event Modal - Updated to match the group dialog style */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
          <div
            ref={eventModalRef}
            className="w-full max-w-md overflow-hidden rounded-lg bg-white dark:bg-gray-800 shadow-xl"
          >
            <div className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-2 sm:p-3">
              <div className="flex items-center justify-between">
                <h3 className="font-mono text-sm font-light tracking-tight dark:text-white">
                  {formatDate(selectedDate)}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
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
              {/* Event Content - Styled like the group name input */}
              <div className="mb-6">
                <label
                  htmlFor="event-content"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  EVENT
                </label>
                <input
                  type="text"
                  id="event-content"
                  value={eventContent}
                  onChange={(e) => setEventContent(e.target.value)}
                  onKeyDown={handleTextareaKeyDown}
                  ref={eventInputRef}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm py-3 px-4 preserve-case"
                  placeholder="ENTER EVENT DETAILS"
                />
              </div>

              {/* Color/Group Selection - Now showing full tags with names */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">TAG</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {projectGroups.map((group) => {
                    const bgColor = getBgFromTextColor(group.color)

                    return (
                      <button
                        key={group.id}
                        onClick={() => {
                          // Set the selected color
                          setSelectedColor(group.color)

                          // If we're editing an existing event, immediately update it with the new color
                          if (editingEventId) {
                            // Update the event in the events array
                            setEvents(
                              events.map((event) =>
                                event.id === editingEventId
                                  ? { ...event, color: group.color, projectId: group.id }
                                  : event,
                              ),
                            )

                            // Update the events for selected date
                            setEventsForSelectedDate(
                              eventsForSelectedDate.map((event) =>
                                event.id === editingEventId
                                  ? { ...event, color: group.color, projectId: group.id }
                                  : event,
                              ),
                            )
                          }
                        }}
                        className={cn(
                          "flex items-center gap-1 px-2 py-1 rounded-md text-xs border",
                          bgColor,
                          "text-white", // Force white text for all tags
                          selectedColor === group.color ? "shadow-md" : "",
                        )}
                      >
                        {group.name}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* List of existing events for this day */}
              {eventsForSelectedDate.length > 0 && editingEventId !== eventsForSelectedDate[0].id && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    OTHER EVENTS
                  </label>
                  <div className="space-y-2">
                    {eventsForSelectedDate.map(
                      (event) =>
                        event.id !== editingEventId && (
                          <div
                            key={event.id}
                            className="flex justify-between items-center p-2 rounded-md border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                          >
                            <p
                              className={cn(
                                "text-sm break-words preserve-case",
                                event.color || "text-black dark:text-white",
                              )}
                            >
                              {event.content}
                            </p>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEditEvent(event)}
                                className="text-gray-400 hover:text-gray-600"
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
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDeleteEvent(event.id)}
                                className="text-gray-400 hover:text-gray-600"
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
                                  <path d="M3 6h18"></path>
                                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                                </svg>
                              </button>
                            </div>
                          </div>
                        ),
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-2 sm:p-3 flex justify-end">
              {/* Only show delete button if we're editing an existing event */}
              {editingEventId && (
                <button
                  type="button"
                  onClick={() => handleDeleteEvent(editingEventId)}
                  className="rounded-md border border-gray-300 bg-white dark:bg-gray-800 py-2 px-4 text-sm font-medium text-gray-700 dark:text-gray-300 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 flex items-center mr-auto"
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
                    className="h-4 w-4 mr-1"
                  >
                    <path d="M3 6h18"></path>
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                  </svg>
                  DELETE
                </button>
              )}
              <button
                type="button"
                className="inline-flex justify-center rounded-md border border-transparent bg-black py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
                onClick={handleSaveAndClose}
              >
                SAVE
              </button>
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
                  className="block w-full rounded-md border-gray-300 pr-12 focus:border-black focus:ring-black dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm font-mono"
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
      {showAddDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md overflow-hidden rounded-lg bg-white dark:bg-gray-800 shadow-xl">
            <div className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-2 sm:p-3">
              <div className="flex items-center justify-between">
                <h3 className="font-mono text-sm font-light tracking-tight dark:text-white">NEW TAG</h3>
                <button
                  onClick={() => setShowAddDialog(false)}
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
              <div className="mb-6">
                <label className="block text-xs mb-2">TAG NAME</label>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm py-3 px-4"
                  placeholder="ENTER PROJECT NAME"
                />
              </div>
              <div className="mb-6">
                <label className="block text-xs mb-2">COLOR</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color.name}
                      onClick={() => setNewProjectColor(color.value)}
                      className={cn(
                        "flex items-center gap-1 px-2 py-1 rounded-md text-xs border",
                        color.bg,
                        color.text,
                        newProjectColor === color.value ? "shadow-md" : "",
                      )}
                    >
                      {color.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-2 sm:p-3 flex justify-end">
              <button
                type="button"
                className="inline-flex justify-center rounded-md border border-transparent bg-black py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
                onClick={() => {
                  handleAddProjectGroup(newProjectName, newProjectColor)
                  setShowAddDialog(false)
                }}
              >
                SAVE
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Edit Project Group Dialog */}
      {/* Edit Project Group Dialog */}
    </div>
  )
}

