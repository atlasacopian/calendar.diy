"use client"

import { useEffect, useRef, useState } from "react"
import { ChevronLeft, ChevronRight, CalendarIcon, Share2, Check, X } from 'lucide-react'
import { 
  addMonths, 
  format, 
  getDay, 
  getDaysInMonth, 
  isSameDay, 
  isToday, 
  subMonths 
} from "date-fns"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { 
  getAllHolidays, 
  type Holiday 
} from "@/lib/holidays"
import { SyncModal } from "./sync-modal"
import { HolidayFilter } from "./holiday-filter"
import { HolidayLegend } from "./holiday-legend"

type CalendarEvent = {
  date: Date
  content: string
  color?: string
}

// Color options for inline color picker
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
  const [editingDay, setEditingDay] = useState<Date | null>(null)
  const [editingContent, setEditingContent] = useState("")
  const [editingColor, setEditingColor] = useState("text-black")
  const [holidays, setHolidays] = useState<Holiday[]>([])
  const [isHovering, setIsHovering] = useState<number | null>(null)
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [selectedHolidayTypes, setSelectedHolidayTypes] = useState<string[]>(["federal", "international"])
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Load events from localStorage on component mount
  useEffect(() => {
    const savedEvents = localStorage.getItem("calendarEvents")
    if (savedEvents) {
      // Convert any bg- color classes to text- color classes for backward compatibility
      const updatedEvents = JSON.parse(savedEvents).map((event: any) => {
        let color = event.color || "text-black";
        if (color.startsWith("bg-")) {
          color = color.replace("bg-", "text-");
        }
        return {
          ...event,
          date: new Date(event.date),
          color
        };
      });
      setEvents(updatedEvents);
    }
    
    // Load selected holiday types from localStorage
    const savedHolidayTypes = localStorage.getItem("selectedHolidayTypes")
    if (savedHolidayTypes) {
      setSelectedHolidayTypes(JSON.parse(savedHolidayTypes))
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
  
  // Save selected holiday types to localStorage
  useEffect(() => {
    localStorage.setItem("selectedHolidayTypes", JSON.stringify(selectedHolidayTypes))
  }, [selectedHolidayTypes])
  
  // Focus textarea when editing starts
  useEffect(() => {
    if (editingDay && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [editingDay])

  const handlePreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1))
  }

  const handleTodayClick = () => {
    setCurrentDate(new Date())
  }

  const handleDayClick = (day: Date) => {
    setEditingDay(day)
    const existingEvent = events.find((event) => isSameDay(event.date, day))
    setEditingContent(existingEvent?.content || "")
    
    // Ensure color is in text- format
    let color = existingEvent?.color || "text-black";
    if (color.startsWith("bg-")) {
      color = color.replace("bg-", "text-");
    }
    setEditingColor(color);
  }

  const handleSaveEvent = () => {
    if (!editingDay) return

    // Remove existing event for this day if it exists
    const filteredEvents = events.filter((event) => !isSameDay(event.date, editingDay))

    // Add new event if content is not empty
    if (editingContent.trim()) {
      setEvents([...filteredEvents, { 
        date: editingDay, 
        content: editingContent,
        color: editingColor
      }])
    } else {
      setEvents(filteredEvents)
    }

    setEditingDay(null)
  }

  const handleCancelEdit = () => {
    setEditingDay(null)
  }

  const handleSyncClick = (event?: CalendarEvent) => {
    if (event) {
      setSelectedEvent(event)
    } else {
      setSelectedEvent(null)
    }
    setIsSyncModalOpen(true)
  }
  
  const toggleHolidayType = (type: string) => {
    if (selectedHolidayTypes.includes(type)) {
      setSelectedHolidayTypes(selectedHolidayTypes.filter(t => t !== type))
    } else {
      setSelectedHolidayTypes([...selectedHolidayTypes, type])
    }
  }

  // Generate calendar grid
  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate)
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const startingDayOfWeek = getDay(firstDayOfMonth)
    
    const days = []
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="h-36 border border-gray-100"></div>)
    }
    
    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
      const dayEvents = events.filter((event) => isSameDay(event.date, date))
      const dayHolidays = holidays
        .filter((holiday) => isSameDay(holiday.date, date) && selectedHolidayTypes.includes(holiday.type))
      const isWeekend = getDay(date) === 0 || getDay(date) === 6
      const isTodayDate = isToday(date)
      const isEditing = editingDay ? isSameDay(editingDay, date) : false
      
      days.push(
        <div
          key={day}
          onClick={() => !isEditing && handleDayClick(date)}
          onMouseEnter={() => setIsHovering(day)}
          onMouseLeave={() => setIsHovering(null)}
          className={cn(
            "group relative h-36 border border-gray-100 p-3 transition-all duration-300",
            isWeekend ? "bg-gray-50/30" : "",
            isTodayDate ? "ring-1 ring-black" : "",
            isHovering === day && !isEditing ? "bg-gray-50" : "",
            isEditing ? "bg-gray-50 ring-1 ring-black" : ""
          )}
        >
          <div className={cn(
            "absolute right-3 top-3 flex h-6 w-6 items-center justify-center font-mono text-xs",
            isTodayDate ? "bg-black text-white" : "text-gray-400"
          )}>
            {day}
          </div>
          
          {isEditing ? (
            <div className="mt-6 flex h-[calc(100%-2rem)] flex-col">
              <textarea
                ref={textareaRef}
                value={editingContent}
                onChange={(e) => setEditingContent(e.target.value)}
                placeholder="Add event..."
                className={cn(
                  "h-[calc(100%-24px)] w-full resize-none border-0 bg-transparent p-0 font-mono text-xs focus:outline-none focus:ring-0",
                  editingColor
                )}
                autoFocus
              />
              
              <div className="mt-2 flex items-center justify-between">
                <div className="flex flex-wrap gap-1.5">
                  {colorOptions.map((color) => (
                    <button
                      key={color.value}
                      className={cn(
                        "flex h-5 w-5 items-center justify-center rounded-full transition-all duration-200",
                        color.bg,
                        color.text,
                        editingColor === color.value ? "ring-1 ring-black ring-offset-1" : ""
                      )}
                      title={color.name}
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingColor(color.value);
                      }}
                      type="button"
                    >
                      {editingColor === color.value && <Check className="h-3 w-3" />}
                    </button>
                  ))}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCancelEdit();
                    }}
                    className="rounded-full p-1 hover:bg-gray-200"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSaveEvent();
                    }}
                    className="rounded-full p-1 hover:bg-gray-200"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="mt-6 space-y-0.5">
                {dayHolidays.map((holiday, index) => (
                  <div 
                    key={`holiday-${index}`} 
                    className={cn(
                      "font-mono text-[10px] uppercase tracking-wider",
                      holiday.type === "federal" ? "text-gray-500" : "",
                      holiday.type === "religious" ? "text-indigo-500" : "",
                      holiday.type === "international" ? "text-cyan-600" : "",
                      holiday.type === "observance" ? "text-amber-500" : ""
                    )}
                  >
                    {holiday.name}
                  </div>
                ))}
              </div>
              
              <div className="mt-1 space-y-1">
                {dayEvents.map((event, index) => {
                  // Ensure color is in text- format for backward compatibility
                  let textColorClass = event.color || "text-black";
                  if (textColorClass.startsWith("bg-")) {
                    textColorClass = textColorClass.replace("bg-", "text-");
                  }
                  
                  return (
                    <div 
                      key={index} 
                      className="flex items-start justify-between"
                    >
                      <span className={cn("font-mono text-xs font-medium", textColorClass)}>
                        {event.content}
                      </span>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSyncClick(event);
                        }}
                        className="mt-0.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                      >
                        <Share2 className="h-3 w-3 text-gray-400 hover:text-black" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </>
          )}
          
          {!isEditing && (
            <div className={cn(
              "absolute bottom-0 left-0 h-0.5 w-full bg-black opacity-0 transition-opacity duration-300",
              isHovering === day ? "opacity-100" : ""
            )} />
          )}
        </div>
      );
    }
    
    return days;
  };

  const weekDays = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

  return (
    <div className="calendar-container">
      <div className="mb-8 flex items-center justify-between">
        <h2 className="font-mono text-2xl font-light uppercase tracking-tight">
          {format(currentDate, "MMMM yyyy")}
        </h2>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleTodayClick}
            className="h-8 rounded-none font-mono text-xs tracking-wider hover:bg-gray-50"
          >
            <CalendarIcon className="mr-2 h-3.5 w-3.5" />
            TODAY
          </Button>
          <HolidayFilter 
            selectedTypes={selectedHolidayTypes}
            onToggleType={toggleHolidayType}
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleSyncClick()}
            className="h-8 rounded-none font-mono text-xs tracking-wider hover:bg-gray-50"
          >
            <Share2 className="mr-2 h-3.5 w-3.5" />
            SYNC
          </Button>
          <div className="flex">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePreviousMonth}
              className="h-8 w-8 rounded-none border-black transition-all duration-200 hover:bg-black hover:text-white"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleNextMonth}
              className="h-8 w-8 rounded-none border-black transition-all duration-200 hover:bg-black hover:text-white"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-0">
        {weekDays.map((day) => (
          <div 
            key={day} 
            className="pb-3 text-center font-mono text-xs font-light tracking-wider text-gray-500"
          >
            {day}
          </div>
        ))}
        {renderCalendar()}
      </div>
      
      <HolidayLegend selectedTypes={selectedHolidayTypes} />

      <SyncModal 
        isOpen={isSyncModalOpen}
        onOpenChange={setIsSyncModalOpen}
        events={events}
        selectedEvent={selectedEvent}
      />
    </div>
  );
}
