"use client"

import type React from "react"

import { useEffect, useRef, useState, useCallback } from "react"
import { addMonths, format, getDay, getDaysInMonth, isSameDay, subMonths, isToday } from "date-fns"
import { cn } from "@/lib/utils"
import { getAllHolidays, type Holiday } from "@/lib/holidays"
import ProjectGroups, { type ProjectGroup } from "@/components/project-groups"

// import html2canvas from 'html2canvas'; // We'll dynamically import this

// In the CalendarEvent type, add a new property to store formatted content
type CalendarEvent = {
  id: string
  date: Date
  content: string
  formattedContent?: string // To store HTML with formatting
  color?: string
  projectId?: string
}

// Color options for color picker
const colorOptions = [
  { name: "Black", value: "text-black", bg: "bg-[#000000]", text: "text-white", hex: "#000000" },
  { name: "Red", value: "text-red-600", bg: "bg-[#ff0000]", text: "text-white", hex: "#ff0000" },
  { name: "Orange", value: "text-orange-500", bg: "bg-[#ff7200]", text: "text-white", hex: "#ff7200" },
  { name: "Yellow", value: "text-yellow-500", bg: "bg-[#e3e600]", text: "text-white", hex: "#e3e600" },
  { name: "Green", value: "text-green-600", bg: "bg-[#1ae100]", text: "text-white", hex: "#1ae100" },
  { name: "Blue", value: "text-blue-600", bg: "bg-[#0012ff]", text: "text-white", hex: "#0012ff" },
  { name: "Purple", value: "text-purple-600", bg: "bg-[#a800ff]", text: "text-white", hex: "#a800ff" },
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
  const [projectGroups, setProjectGroups] = useState<ProjectGroup[]>([
    { id: "default", name: "TAG 01", color: "text-black", active: true },
  ])
  const [showDateSelector, setShowDateSelector] = useState(false)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [newProjectName, setNewProjectName] = useState("")
  const [newProjectColor, setNewProjectColor] = useState("text-black")
  // Track which event is currently being edited (0 or 1)
  const [activeEventIndex, setActiveEventIndex] = useState<number>(0)
  // Add a new state for text selection
  const [selectedText, setSelectedText] = useState<{ start: number; end: number } | null>(null)

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
  const eventInputRef = useRef<HTMLTextAreaElement>(null)
  const firstEventInputRef = useRef<HTMLTextAreaElement>(null)

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

  /* Highlight active event */
  .event-input-active {
    background-color: rgba(249, 250, 251, 0.8);
    border-color: rgba(209, 213, 219, 1);
  }
  
  /* Make event items draggable with visual cue */
  .event-draggable {
    cursor: grab;
  }
  
  .event-draggable:active {
    cursor: grabbing;
  }
  
  /* Bold text styling */
  .calendar-day .bold-text {
    font-weight: bold;
  }

/* Improve drag and drop visual feedback */
.cursor-grab {
  cursor: grab;
}
.cursor-grab:active {
  cursor: grabbing;
}
.cursor-grab:hover {
  background-color: rgba(0, 0, 0, 0.05);
  border-radius: 4px;
}

/* Fix mobile layout */
@media (max-width: 640px) {
  .calendar-controls {
    flex-wrap: wrap;
    gap: 4px;
  }
  
  .calendar-controls button {
    font-size: 10px;
    padding: 4px 6px;
  }
  
  .calendar-controls button svg {
    width: 10px;
    height: 10px;
  }
}

/* Ensure the grid is properly aligned */
.grid-cols-7 {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
}

/* Fix empty cells in last row */
.calendar-day:last-child,
.calendar-day:nth-last-child(-n+7) {
  border-bottom: 1px solid rgba(229, 231, 235, 1);
}

.dark .calendar-day:last-child,
.dark .calendar-day:nth-last-child(-n+7) {
  border-bottom: 1px solid rgba(75, 85, 99, 1);
}

/* Prevent vertical scrolling */
body {
  overflow-y: hidden;
  height: 100vh;
  position: fixed;
  width: 100%;
}

/* Make calendar fit in viewport */
.calendar-full-container {
  max-height: calc(100vh - 150px);
}

/* Adjust cell heights to fit in viewport */
@media (max-height: 700px) {
  .calendar-day {
    height: 14vw !important;
    min-height: 3.5rem !important;
  }
}

/* Ensure month title stays on one line */
.date-selector-container button {
  white-space: nowrap;
  display: inline-block;
}

/* Fix navigation arrow highlight issue */
.nav-arrow {
  -webkit-tap-highlight-color: transparent !important;
  -webkit-user-select: none !important;
  user-select: none !important;
  -webkit-touch-callout: none !important;
  outline: none !important;
  touch-action: manipulation;
}

button.nav-arrow:active,
button.nav-arrow:focus {
  background-color: transparent !important;
  outline: none !important;
  box-shadow: none !important;
}

/* Add more space at the top on mobile */
@media (max-width: 768px) {
  .calendar-wrapper {
    padding-top: 24px !important;
  }
}

/* Fix grid alignment issues - ensure all cells have the same height */
.grid-cols-7 {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  width: 100%;
}

.grid-cols-7 > div {
  min-height: 5rem;
  height: 5rem;
  border-right: 1px solid rgba(229, 231, 235, 1);
  border-bottom: 1px solid rgba(229, 231, 235, 1);
}

.dark .grid-cols-7 > div {
  border-right: 1px solid rgba(75, 85, 99, 1);
  border-bottom: 1px solid rgba(75, 85, 99, 1);
}

/* Make the day header row more compact */
.day-header {
  height: 2rem !important;
  min-height: 2rem !important;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Fix empty cells in last row */
.grid-cols-7 > div:empty {
  border-right: 1px solid rgba(229, 231, 235, 1);
  border-bottom: 1px solid rgba(229, 231, 235, 1);
  min-height: 5rem;
}

.dark .grid-cols-7 > div:empty {
  border-right: 1px solid rgba(75, 85, 99, 1);
  border-bottom: 1px solid rgba(75, 85, 99, 1);
}

/* Fix the last row cells */
.calendar-grid-row {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  width: 100%;
}

.calendar-grid-row > div {
  min-height: 5rem;
  border-right: 1px solid rgba(229, 231, 235, 1);
  border-bottom: 1px solid rgba(229, 231, 235, 1);
}

.dark .calendar-grid-row > div {
  border-right: 1px solid rgba(75, 85, 99, 1);
  border-bottom: 1px solid rgba(75, 85, 99, 1);
}

/* Completely disable tap highlight on mobile */
* {
  -webkit-tap-highlight-color: rgba(0,0,0,0) !important;
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
    setActiveEventIndex(0) // Reset to first event

    setShowModal(true)

    // If there are no events for this day, automatically create one
    if (existingEvents.length === 0) {
      const newEvent = {
        id: Math.random().toString(36).substring(2, 11),
        date: day,
        content: "",
        color: "text-black",
        projectId: "default",
      }
      setEventsForSelectedDate([newEvent])

      // Focus the input field after a short delay to ensure the DOM is ready
      setTimeout(() => {
        if (firstEventInputRef.current) {
          firstEventInputRef.current.focus()
        }
      }, 50)
    }
  }

  const handleCancelEdit = () => {
    setShowModal(false)
    setSelectedDate(null)
    setActiveEventIndex(0)
  }

  const handleSaveAndClose = () => {
    // Save any changes to the events
    if (eventsForSelectedDate.length > 0) {
      // Filter out empty events
      const nonEmptyEvents = eventsForSelectedDate.filter((event) => event.content.trim() !== "")

      // First, remove all events for this day from the main events array
      const otherEvents = events.filter((event) => !isSameDay(event.date, selectedDate as Date))

      // Then add back the updated events for this day
      const newEvents = [...otherEvents, ...nonEmptyEvents]
      setEvents(newEvents)

      // Save to localStorage immediately
      localStorage.setItem("calendarEvents", JSON.stringify(newEvents))
    }

    // Close the modal
    setShowModal(false)
    setSelectedDate(null)
    setActiveEventIndex(0)
  }

  // Update the handleUpdateEventContent function to handle formatted content
  const handleUpdateEventContent = (index: number, content: string, formattedContent?: string) => {
    if (index >= eventsForSelectedDate.length) return

    const updatedEvents = [...eventsForSelectedDate]
    if (formattedContent) {
      updatedEvents[index] = { ...updatedEvents[index], content, formattedContent }
    } else {
      updatedEvents[index] = { ...updatedEvents[index], content }
    }
    setEventsForSelectedDate(updatedEvents)
  }

  // Add a function to handle bold formatting
  const handleBoldText = () => {
    if (activeEventIndex >= eventsForSelectedDate.length || !selectedText) return

    const event = eventsForSelectedDate[activeEventIndex]
    const content = event.content

    // Get the selected text
    const selectedContent = content.substring(selectedText.start, selectedText.end)

    // Create the formatted content by wrapping selected text in <strong> tags
    const formattedContent =
      content.substring(0, selectedText.start) +
      `<strong>${selectedContent}</strong>` +
      content.substring(selectedText.end)

    // Update the event with both plain content and formatted content
    handleUpdateEventContent(activeEventIndex, content, formattedContent)

    // Reset selection
    setSelectedText(null)
  }

  // Update the handleTextareaKeyDown function to allow Shift+Enter for new lines
  // and handle Cmd+B or Ctrl+B for bold text
  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Handle Cmd+B or Ctrl+B for bold text
    if ((e.metaKey || e.ctrlKey) && e.key === "b") {
      e.preventDefault()

      // Get the current selection from the textarea
      const textarea = e.currentTarget
      const start = textarea.selectionStart
      const end = textarea.selectionEnd

      if (start !== end) {
        setSelectedText({ start, end })
        handleBoldText()
      }
      return
    }

    // Only save and close on Enter without shift key (shift+enter allows for line breaks)
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSaveAndClose() // This will save and close the modal
    }
  }

  // Add a function to track text selection
  const handleTextSelect = (e: React.MouseEvent<HTMLTextAreaElement> | React.TouchEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget
    setSelectedText({
      start: textarea.selectionStart,
      end: textarea.selectionEnd,
    })
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

  // Improved drag and drop functionality
  // Handle drag start for events
  const handleDragStart = (event: CalendarEvent, e: React.DragEvent) => {
    e.stopPropagation()
    setDraggedEvent(event)

    // Set data for drag operation
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = "move"
      e.dataTransfer.setData("text/plain", event.id)

      // Set a ghost drag image
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
    e.dataTransfer.dropEffect = "move"
    setDragOverDate(day)
  }

  // Handle drop for calendar days
  const handleDrop = (day: Date, e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

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
      const updatedEvent = {
        ...draggedEvent,
        date: day,
      }

      setEvents([...filteredEvents, updatedEvent])

      // If the modal is open and showing the target day, update the events for that day
      if (showModal && selectedDate && isSameDay(selectedDate, day)) {
        const updatedDayEvents = [...eventsForSelectedDate.filter((e) => e.id !== draggedEvent.id), updatedEvent]
        setEventsForSelectedDate(updatedDayEvents)
      }
    }

    setDraggedEvent(null)
    setDragOverDate(null)
  }

  // Handle drag end
  const handleDragEnd = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
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

  // Completely new approach for downloading calendar as image
  const downloadCalendarAsImage = async () => {
    try {
      setIsDownloading(true)

      // Use html2canvas for rendering
      const html2canvas = await import("html2canvas")

      // Create a fresh calendar for screenshot purposes
      const screenshotDiv = document.createElement("div")
      screenshotDiv.style.position = "fixed"
      screenshotDiv.style.left = "-9999px"
      screenshotDiv.style.top = "0"
      screenshotDiv.style.width = "1200px" // Wider for better quality
      screenshotDiv.style.backgroundColor = "white"
      screenshotDiv.style.fontFamily = '"JetBrains Mono", monospace'
      document.body.appendChild(screenshotDiv)

      // Create header with gray background
      const headerContainer = document.createElement("div")
      headerContainer.style.backgroundColor = "#f9fafb" // Light gray background matching website
      headerContainer.style.borderBottom = "1px solid #e5e7eb" // Border at bottom
      headerContainer.style.padding = "16px"

      // Month/year title
      const header = document.createElement("div")
      header.style.textAlign = "center"
      header.style.fontSize = "24px"
      header.style.fontWeight = "500"
      header.style.textTransform = "uppercase"
      header.textContent = format(currentDate, "MMMM yyyy")
      headerContainer.appendChild(header)

      screenshotDiv.appendChild(headerContainer)

      // Create calendar grid
      const grid = document.createElement("div")
      grid.style.display = "grid"
      grid.style.gridTemplateColumns = "repeat(7, 1fr)"
      grid.style.border = "1px solid #eee"
      grid.style.borderBottom = "none"
      grid.style.borderRight = "none"
      screenshotDiv.appendChild(grid)

      // Add day headers - use single letters to match website
      const singleLetterDays = ["S", "M", "T", "W", "T", "F", "S"]
      singleLetterDays.forEach((day) => {
        const dayHeader = document.createElement("div")
        dayHeader.style.padding = "10px"
        dayHeader.style.textAlign = "center"
        dayHeader.style.borderBottom = "1px solid #eee"
        dayHeader.style.borderRight = "1px solid #eee"
        dayHeader.style.backgroundColor = "#f9f9f9"
        dayHeader.style.fontSize = "14px"
        dayHeader.style.color = "#666"
        dayHeader.style.textTransform = "uppercase"
        dayHeader.textContent = day
        grid.appendChild(dayHeader)
      })

      // Calculate calendar days
      const daysInMonth = getDaysInMonth(currentDate)
      const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
      const startingDayOfWeek = getDay(firstDayOfMonth)

      // Add empty cells for days before the first day of the month
      for (let i = 0; i < startingDayOfWeek; i++) {
        const emptyCell = document.createElement("div")
        emptyCell.style.borderBottom = "1px solid #eee"
        emptyCell.style.borderRight = "1px solid #eee"
        emptyCell.style.height = "120px"
        emptyCell.style.backgroundColor = "white"
        grid.appendChild(emptyCell)
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
        const limitedEvents = dayEvents.slice(0, 2)
        const dayHolidays = holidays.filter((holiday) => isSameDay(holiday.date, date))
        const isWeekend = getDay(date) === 0 || getDay(date) === 6

        const dayCell = document.createElement("div")
        dayCell.style.position = "relative"
        dayCell.style.padding = "10px"
        dayCell.style.borderBottom = "1px solid #eee"
        dayCell.style.borderRight = "1px solid #eee"
        dayCell.style.height = "120px"
        dayCell.style.backgroundColor = isWeekend ? "#f9f9f9" : "white"

        // Add day number
        const dayNumber = document.createElement("div")
        dayNumber.style.position = "absolute"
        dayNumber.style.top = "5px"
        dayNumber.style.right = "10px"
        dayNumber.style.fontSize = "14px"
        dayNumber.style.color = "#999"
        dayNumber.textContent = day.toString()
        dayCell.appendChild(dayNumber)

        // Add holidays
        const holidaysContainer = document.createElement("div")
        holidaysContainer.style.marginTop = "25px"
        holidaysContainer.style.overflow = "visible"

        dayHolidays.forEach((holiday) => {
          const holidayDiv = document.createElement("div")
          holidayDiv.style.fontSize = "10px"
          holidayDiv.style.textTransform = "uppercase"
          holidayDiv.style.letterSpacing = "0.05em"
          holidayDiv.style.color = "#666"
          holidayDiv.style.marginBottom = "3px"
          holidayDiv.style.whiteSpace = "normal"
          holidayDiv.style.wordBreak = "break-word"
          holidayDiv.textContent = holiday.name.toUpperCase()
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
        if (limitedEvents.length === 1) {
          eventsContainer.style.justifyContent = "center"
        } else {
          eventsContainer.style.justifyContent = "space-between"
        }

        if (limitedEvents.length === 1) {
          // Single event - centered vertically
          const event = limitedEvents[0]
          const eventDiv = document.createElement("div")
          eventDiv.textContent = event.content
          eventDiv.style.fontSize = "11px"
          eventDiv.style.fontWeight = "500"
          eventDiv.style.wordBreak = "break-word"
          eventDiv.style.overflow = "visible"
          eventDiv.style.maxWidth = "100%"
          eventDiv.style.whiteSpace = "normal"

          // Convert Tailwind color classes to CSS colors
          let color = "#000"
          if (event?.color?.includes("blue")) color = "#0012ff"
          if (event?.color?.includes("red")) color = "#ff0000"
          if (event?.color?.includes("yellow")) color = "#e3e600"
          if (event?.color?.includes("orange")) color = "#ff7200"
          if (event?.color?.includes("green")) color = "#1ae100"
          if (event?.color?.includes("purple")) color = "#a800ff"

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
          eventDiv1.style.overflow = "visible"
          eventDiv1.style.maxWidth = "100%"
          eventDiv1.style.whiteSpace = "normal"

          // Convert Tailwind color classes to CSS colors
          let color1 = "#000"
          if (event1?.color?.includes("blue")) color1 = "#0012ff"
          if (event1?.color?.includes("red")) color1 = "#ff0000"
          if (event1?.color?.includes("yellow")) color1 = "#e3e600"
          if (event1?.color?.includes("orange")) color1 = "#ff7200"
          if (event1?.color?.includes("green")) color1 = "#1ae100"
          if (event1?.color?.includes("purple")) color1 = "#a800ff"

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
          eventDiv2.style.overflow = "visible"
          eventDiv2.style.maxWidth = "100%"
          eventDiv2.style.whiteSpace = "normal"

          // Convert Tailwind color classes to CSS colors
          let color2 = "#000"
          if (event2?.color?.includes("blue")) color2 = "#0012ff"
          if (event2?.color?.includes("red")) color2 = "#ff0000"
          if (event2?.color?.includes("yellow")) color2 = "#e3e600"
          if (event2?.color?.includes("orange")) color2 = "#ff7200"
          if (event2?.color?.includes("green")) color2 = "#1ae100"
          if (event2?.color?.includes("purple")) color2 = "#a800ff"

          eventDiv2.style.color = color2
          bottomEventContainer.appendChild(eventDiv2)
          eventsContainer.appendChild(bottomEventContainer)
        }

        dayCell.appendChild(eventsContainer)
        grid.appendChild(dayCell)
      }

      // Calculate how many cells we've added so far
      const cellsAdded = startingDayOfWeek + daysInMonth

      // Calculate how many more cells we need to add to reach 42 cells (6 rows x 7 columns)
      const cellsNeeded = 42 - cellsAdded

      // Add empty cells to fill out the grid to exactly 6 rows
      for (let i = 0; i < cellsNeeded; i++) {
        const emptyCell = document.createElement("div")
        emptyCell.style.borderBottom = "1px solid #eee"
        emptyCell.style.borderRight = "1px solid #eee"
        emptyCell.style.height = "120px"
        emptyCell.style.backgroundColor = "white"
        grid.appendChild(emptyCell)
      }

      // Wait for the DOM to update
      await new Promise((resolve) => setTimeout(resolve, 100))

      // Render with html2canvas with higher quality settings
      const canvas = await html2canvas.default(screenshotDiv, {
        scale: 3, // Higher resolution
        useCORS: true,
        allowTaint: true,
        backgroundColor: "white",
        logging: false,
        imageTimeout: 0, // No timeout for images
      })

      // Convert to image and download
      const image = canvas.toDataURL("image/png", 1.0)
      const link = document.createElement("a")
      link.href = image
      link.download = `calendar_${format(currentDate, "MMMM_yyyy")}.png`
      link.click()

      // Clean up
      document.body.removeChild(screenshotDiv)
    } catch (error) {
      console.error("Error generating calendar image:", error)
      alert("Failed to generate image. Please try again.")
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

    // Calculate how many cells we've added so far
    const cellsAdded = startingDayOfWeek + daysInMonth

    // Calculate how many more cells we need to add to reach 42 cells (6 rows x 7 columns)
    const cellsNeeded = 42 - cellsAdded

    // Add empty cells to fill out the grid to exactly 6 rows
    for (let i = 0; i < cellsNeeded; i++) {
      const emptyCell = document.createElement("div")
      emptyCell.style.borderBottom = "1px solid #eee"
      emptyCell.style.borderRight = "1px solid #eee"
      emptyCell.style.height = "120px"
      emptyCell.style.backgroundColor = "white"
      grid.appendChild(emptyCell)
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
      const uid = `${dateString}-${Math.random().toString(36).substring(2, 11)}@calendar.diy`
      icalContent = [
        ...icalContent,
        "BEGIN:VEVENT",
        `UID:${uid}`,
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
                className="flex-1 flex items-center event-draggable"
                draggable
                onDragStart={(e) => handleDragStart(limitedEvents[0], e)}
                onDragEnd={handleDragEnd}
              >
                <span
                  className="font-mono text-[10px] md:text-[10px] font-medium cursor-move preserve-case hover:underline max-w-full block line-clamp-4 break-words"
                  style={{
                    color: getExactColorHex(limitedEvents[0].color),
                  }}
                  dangerouslySetInnerHTML={{
                    __html: limitedEvents[0] ? limitedEvents[0].formattedContent || limitedEvents[0].content : "",
                  }}
                ></span>
              </div>
            ) : (
              // If there are two events, space them with the divider centered
              <div className="flex flex-col h-full">
                <div
                  className="flex-1 flex items-start event-draggable"
                  draggable
                  onDragStart={(e) => handleDragStart(limitedEvents[0], e)}
                  onDragEnd={handleDragEnd}
                >
                  <span
                    className="font-mono text-[10px] md:text-[10px] font-medium cursor-move preserve-case hover:underline max-w-full block line-clamp-2 break-words"
                    style={{
                      color: getExactColorHex(limitedEvents[0]?.color),
                    }}
                    dangerouslySetInnerHTML={{
                      __html: limitedEvents[0] ? limitedEvents[0].formattedContent || limitedEvents[0].content : "",
                    }}
                  ></span>
                </div>

                {/* Only show divider when there are two entries */}
                {limitedEvents.length === 2 && (
                  <div className="border-t border-gray-200 dark:border-gray-700 w-full my-auto"></div>
                )}

                <div
                  className="flex-1 flex items-end event-draggable"
                  draggable
                  onDragStart={(e) => handleDragStart(limitedEvents[1], e)}
                  onDragEnd={handleDragEnd}
                >
                  <span
                    className="font-mono text-[10px] md:text-[10px] font-medium cursor-move preserve-case hover:underline max-w-full block line-clamp-2 break-words"
                    style={{
                      color: getExactColorHex(limitedEvents[1]?.color),
                    }}
                    dangerouslySetInnerHTML={{
                      __html: limitedEvents[1] ? limitedEvents[1].formattedContent || limitedEvents[1].content : "",
                    }}
                  ></span>
                </div>
              </div>
            )}
          </div>
        </div>,
      )
    }

    // Calculate how many cells we've added so far
    const totalCellsAdded = startingDayOfWeek + daysInMonth

    // Calculate how many more cells we need to add to reach 42 cells (6 rows x 7 columns)
    const cellsNeeded = 42 - totalCellsAdded

    // Always add empty cells to complete the grid to exactly 6 rows
    for (let i = 0; i < cellsNeeded; i++) {
      days.push(
        <div
          key={`empty-end-${i}`}
          className="h-16 md:h-20 border-b border-r border-gray-100 dark:border-gray-800"
          onDragOver={(e) => e.preventDefault()}
        ></div>,
      )
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

  // Add a function to delete an event
  const handleDeleteEvent = (eventId: string) => {
    // Remove from current day's events
    const updatedDayEvents = eventsForSelectedDate.filter((event) => event.id !== eventId)
    setEventsForSelectedDate(updatedDayEvents)

    // Remove from global events
    const updatedEvents = events.filter((event) => event.id !== eventId)
    setEvents(updatedEvents)

    // Save to localStorage immediately
    localStorage.setItem("calendarEvents", JSON.stringify(updatedEvents))
  }

  // Add a new function to swap the order of events for a day
  const handleSwapEvents = () => {
    if (eventsForSelectedDate.length !== 2) return

    // Create a new array with swapped events
    const swappedEvents = [eventsForSelectedDate[1], eventsForSelectedDate[0]]

    // Update the events for selected date
    setEventsForSelectedDate(swappedEvents)

    // Update the global events array by removing all events for this day and adding the swapped ones
    const otherEvents = events.filter((event) => !isSameDay(event.date, selectedDate as Date))
    const newEvents = [...otherEvents, ...swappedEvents]
    setEvents(newEvents)

    // Save to localStorage immediately
    localStorage.setItem("calendarEvents", JSON.stringify(newEvents))
  }

  // Update event color
  const handleUpdateEventColor = (index: number, color: string, projectId: string) => {
    if (index >= eventsForSelectedDate.length) return

    const updatedEvents = [...eventsForSelectedDate]
    updatedEvents[index] = { ...updatedEvents[index], color, projectId }
    setEventsForSelectedDate(updatedEvents)
  }

  const formatDate = (date: Date | null) => {
    if (!date) return ""
    return format(date, "MMMM d, yyyy").toUpperCase()
  }

  // Add a new event
  const handleAddNewEvent = () => {
    if (!selectedDate || eventsForSelectedDate.length >= 2) return

    // Create a new empty event
    const newEvent = {
      id: Math.random().toString(36).substring(2, 11),
      date: selectedDate,
      content: "",
      color: "text-black",
      projectId: "default",
    }

    // Add to the events for this day
    const updatedEvents = [...eventsForSelectedDate, newEvent]
    setEventsForSelectedDate(updatedEvents)

    // Set the active index to the new event
    const newIndex = updatedEvents.length - 1
    setActiveEventIndex(newIndex)

    // Focus the new event input after a short delay
    setTimeout(() => {
      if (newIndex === 0 && firstEventInputRef.current) {
        firstEventInputRef.current.focus()
      } else {
        const textareas = document.querySelectorAll("textarea")
        if (textareas.length > newIndex) {
          textareas[newIndex].focus()
        }
      }
    }, 100)
  }

  // Add keyboard event handlers for left and right arrow keys
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
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showModal && eventModalRef.current && !eventModalRef.current.contains(event.target as Node)) {
        handleSaveAndClose() // Save changes before closing
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showModal, eventsForSelectedDate])

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

  // Focus the appropriate event input when modal opens
  useEffect(() => {
    if (showModal && eventsForSelectedDate.length > 0) {
      setTimeout(() => {
        if (activeEventIndex === 0 && firstEventInputRef.current) {
          firstEventInputRef.current.focus()
        } else {
          const textareas = document.querySelectorAll("textarea")
          if (textareas.length > activeEventIndex) {
            textareas[activeEventIndex].focus()
          }
        }
      }, 100)
    }
  }, [showModal, eventsForSelectedDate, activeEventIndex])

  return (
    <div
      className="flex flex-col space-y-4 min-h-screen max-h-screen overflow-hidden calendar-wrapper"
      style={{ paddingTop: isMobile ? "24px" : "0" }}
    >
      {/* Calendar Controls - Now with reset button on left and others on right */}
      <div className="calendar-controls flex flex-wrap items-center justify-between gap-1 p-0 mb-1 pt-4 sm:pt-0">
        {/* Reset button on the left */}
        <div>
          <button
            onClick={handleShowResetConfirm}
            className="flex items-center gap-1 rounded-md border border-gray-200 dark:border-gray-700 px-2 py-1 text-[10px] sm:text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            title="Reset Calendar Data"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-2.5 w-2.5 sm:h-3 sm:w-3"
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
        <div className="flex flex-wrap items-center gap-1">
          <button
            onClick={downloadCalendarAsImage}
            className="flex items-center gap-1 rounded-md border border-gray-200 dark:border-gray-700 px-2 py-1 text-[10px] sm:text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            title="Download as Image"
            disabled={isDownloading}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-2.5 w-2.5 sm:h-3 sm:w-3"
            >
              <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
              <circle cx="12" cy="13" r="3" />
            </svg>
            <span>SCREENSHOT</span>
          </button>
          <button
            onClick={exportToIcal}
            className="flex items-center gap-1 rounded-md border border-gray-200 dark:border-gray-700 px-2 py-1 text-[10px] sm:text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            title="Export to iCal"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-2.5 w-2.5 sm:h-3 sm:w-3"
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
            className="flex items-center gap-1 rounded-md border border-gray-200 dark:border-gray-700 px-2 py-1 text-[10px] sm:text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            title="Export to Google Calendar"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-2.5 w-2.5 sm:h-3 sm:w-3"
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
            className="flex items-center gap-1 rounded-md border border-gray-200 dark:border-gray-700 px-2 py-1 text-[10px] sm:text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            title="Share Calendar"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-2.5 w-2.5 sm:h-3 sm:w-3"
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
      >
        <div className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 p-2 md:p-4">
          <div className="grid grid-cols-3 items-center">
            <div className="flex justify-start">
              <button
                onClick={handlePreviousMonth}
                tabIndex={-1}
                className="nav-arrow flex h-6 w-6 md:h-7 md:w-7 items-center justify-center rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none active:outline-none"
                style={{ WebkitTapHighlightColor: "transparent" }}
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
                  className="font-mono text-lg md:text-xl tracking-tight uppercase text-center dark:text-white focus:outline-none px-2 py-1 hover:underline whitespace-nowrap"
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
                tabIndex={-1}
                className="nav-arrow flex h-6 w-6 md:h-7 md:w-7 items-center justify-center rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none active:outline-none"
                style={{ WebkitTapHighlightColor: "transparent" }}
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
                {(isMobile ? weekDaysMobile : weekDaysMobile).map((day) => (
                  <div
                    key={day}
                    className="day-header border-b border-r border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 p-1 text-center font-mono text-[10px] md:text-xs font-light tracking-wider text-gray-500 dark:text-gray-400"
                  >
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7">{renderCalendar()}</div>
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
                <div className="w-4"></div> {/* Spacer for centering */}
                <h3 className="font-mono text-sm font-light tracking-tight dark:text-white text-center">
                  {formatDate(selectedDate)}
                </h3>
                <button
                  onClick={handleSaveAndClose}
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
              {/* Event Inputs - Stacked directly one under the other */}
              <div className="mb-4">
                <label
                  htmlFor="event-content-1"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  EVENT
                </label>

                {/* First Event */}
                {eventsForSelectedDate.length > 0 && (
                  <div className="mb-4">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-start">
                        <textarea
                          id="event-content-1"
                          value={eventsForSelectedDate[0]?.content || ""}
                          onChange={(e) => {
                            handleUpdateEventContent(0, e.target.value)
                            setActiveEventIndex(0)
                          }}
                          onFocus={() => setActiveEventIndex(0)}
                          onKeyDown={(e) => {
                            setActiveEventIndex(0)
                            handleTextareaKeyDown(e)
                          }}
                          onMouseUp={(e) => {
                            setActiveEventIndex(0)
                            handleTextSelect(e)
                          }}
                          onTouchEnd={(e) => {
                            setActiveEventIndex(0)
                            handleTextSelect(e)
                          }}
                          onClick={(e) => {
                            e.stopPropagation()
                            setActiveEventIndex(0)
                          }}
                          ref={firstEventInputRef}
                          className={`flex-1 w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm py-2 px-3 preserve-case ${activeEventIndex === 0 ? "border-black dark:border-white" : ""}`}
                          placeholder="ENTER EVENT NAME"
                          rows={2}
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteEvent(eventsForSelectedDate[0].id)
                          }}
                          className="text-gray-300 hover:text-gray-500 self-start mt-2 ml-2"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-4 w-4"
                          >
                            <path d="M18 6L6 18"></path>
                            <path d="M6 6l12 12"></path>
                          </svg>
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {projectGroups.map((group) => {
                          const bgColor = getBgFromTextColor(group.color)
                          const isSelected = eventsForSelectedDate[0]?.color === group.color

                          return (
                            <button
                              key={`event0-${group.id}`}
                              onClick={() => handleUpdateEventColor(0, group.color, group.id)}
                              className={cn(
                                "flex items-center rounded-none border px-2 py-1 text-xs",
                                isSelected
                                  ? `${bgColor} text-white border-gray-700`
                                  : "bg-white border-gray-200 text-gray-400",
                              )}
                            >
                              {group.name}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Second Event */}
                {eventsForSelectedDate.length > 1 && (
                  <div className="mb-4">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-start">
                        <textarea
                          id="event-content-2"
                          value={eventsForSelectedDate[1]?.content || ""}
                          onChange={(e) => {
                            handleUpdateEventContent(1, e.target.value)
                            setActiveEventIndex(1)
                          }}
                          onFocus={() => setActiveEventIndex(1)}
                          onKeyDown={(e) => {
                            setActiveEventIndex(1)
                            handleTextareaKeyDown(e)
                          }}
                          onMouseUp={(e) => {
                            setActiveEventIndex(1)
                            handleTextSelect(e)
                          }}
                          onTouchEnd={(e) => {
                            setActiveEventIndex(1)
                            handleTextSelect(e)
                          }}
                          onClick={(e) => {
                            e.stopPropagation()
                            setActiveEventIndex(1)
                          }}
                          className={`flex-1 w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm py-2 px-3 preserve-case ${activeEventIndex === 1 ? "border-black dark:border-white" : ""}`}
                          placeholder="ENTER EVENT NAME"
                          rows={2}
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteEvent(eventsForSelectedDate[1].id)
                          }}
                          className="text-gray-300 hover:text-gray-500 self-start mt-2 ml-2"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-4 w-4"
                          >
                            <path d="M18 6L6 18"></path>
                            <path d="M6 6l12 12"></path>
                          </svg>
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {projectGroups.map((group) => {
                          const bgColor = getBgFromTextColor(group.color)
                          const isSelected = eventsForSelectedDate[1]?.color === group.color

                          return (
                            <button
                              key={`event1-${group.id}`}
                              onClick={() => handleUpdateEventColor(1, group.color, group.id)}
                              className={cn(
                                "flex items-center rounded-none border px-2 py-1 text-xs",
                                isSelected
                                  ? `${bgColor} text-white border-gray-700`
                                  : "bg-white border-gray-200 text-gray-400",
                              )}
                            >
                              {group.name}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Add a swap button between the events and the Add New Event button */}
              {eventsForSelectedDate.length === 2 && (
                <button
                  onClick={handleSwapEvents}
                  className="w-full flex items-center justify-center py-2 px-4 text-sm font-medium text-gray-500 focus:outline-none border border-gray-200 bg-gray-50 hover:bg-gray-100 mb-4"
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
                    className="h-4 w-4 mr-2"
                  >
                    <path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
                  </svg>
                  SWAP EVENTS
                </button>
              )}

              {/* Add New Event button - Show when there are fewer than 2 events */}
              {eventsForSelectedDate.length < 2 && (
                <button
                  onClick={handleAddNewEvent}
                  className="w-full flex items-center justify-center py-2 px-4 text-sm font-medium text-gray-500 focus:outline-none border border-gray-200 bg-gray-50 hover:bg-gray-100 mb-4"
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
                    className="h-4 w-4 mr-2"
                  >
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  ADD NEW EVENT
                </button>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-2">
                <button
                  onClick={handleCancelEdit}
                  className="rounded-md border border-gray-300 bg-white dark:bg-gray-800 py-2 px-4 text-sm font-medium text-gray-700 dark:text-gray-300 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none"
                >
                  CANCEL
                </button>
                <button
                  onClick={handleSaveAndClose}
                  className="rounded-md border border-transparent bg-black dark:bg-white py-2 px-4 text-sm font-medium text-white dark:text-black shadow-sm hover:bg-gray-800 dark:hover:bg-gray-200 focus:outline-none"
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
          >
            <div className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-2 sm:p-3">
              <div className="flex items-center justify-between">
                <div className="w-4"></div> {/* Spacer for centering */}
                <h3 className="font-mono text-sm font-light tracking-tight dark:text-white text-center">
                  RESET CALENDAR DATA
                </h3>
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
            <div className="p-4 sm:p-6">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                ARE YOU SURE YOU WANT TO RESET ALL CALENDAR DATA? THIS ACTION CANNOT BE UNDONE.
              </p>
              <div className="mt-5 flex justify-end gap-2">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="rounded-md border border-gray-300 bg-white dark:bg-gray-800 py-2 px-4 text-sm font-medium text-gray-700 dark:text-gray-300 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none"
                >
                  CANCEL
                </button>
                <button
                  onClick={handleResetData}
                  className="rounded-md border border-transparent bg-red-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none"
                >
                  RESET DATA
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
            ref={shareModalRef}
            className="w-full max-w-md overflow-hidden rounded-lg bg-white dark:bg-gray-800 shadow-xl"
          >
            <div className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-2 sm:p-3">
              <div className="flex items-center justify-between">
                <div className="w-4"></div> {/* Spacer for centering */}
                <h3 className="font-mono text-sm font-light tracking-tight dark:text-white text-center">
                  SHARE CALENDAR
                </h3>
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
              <label htmlFor="share-url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                SHAREABLE URL
              </label>
              <div className="flex rounded-md shadow-sm">
                <div className="relative flex items-stretch flex-grow focus-within:z-10">
                  <input
                    type="text"
                    id="share-url"
                    className="block w-full rounded-none rounded-l-md border-gray-300 shadow-sm focus:border-black focus:ring-black dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                    value={shareUrl}
                    readOnly
                    ref={shareInputRef}
                    onClick={(e) => {
                      ;(e.target as HTMLInputElement).select()
                    }}
                  />
                </div>
                <button
                  type="button"
                  id="copy-button"
                  onClick={copyShareUrl}
                  className="relative -ml-px inline-flex items-center space-x-2 rounded-r-md border border-gray-300 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-100 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                >
                  <span>COPY</span>
                </button>
              </div>
              <div className="mt-5 flex justify-end">
                <button
                  onClick={() => setShowShareModal(false)}
                  className="rounded-md border border-gray-300 bg-white dark:bg-gray-800 py-2 px-4 text-sm font-medium text-gray-700 dark:text-gray-300 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none"
                >
                  CLOSE
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

