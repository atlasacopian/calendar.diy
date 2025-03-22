// This is a server component that renders a static version of the calendar
// for initial page load and SEO purposes

import { format } from "date-fns"

export default function Calendar() {
  // Current date for static rendering
  const currentDate = new Date()
  const currentMonth = currentDate.getMonth()
  const currentYear = currentDate.getFullYear()

  // Generate static calendar grid
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay()

  // Create array of weekday names
  const weekDays = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"]

  // Create empty cells for days before the first day of the month
  const emptyCells = Array(firstDayOfMonth).fill(null)

  // Create cells for each day of the month
  const dayCells = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  return (
    <div className="calendar-full-container overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="calendar-container">
        <div className="border-b border-gray-100 bg-gray-50 p-2 md:p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button className="flex h-6 w-6 md:h-7 md:w-7 items-center justify-center rounded-full text-gray-500 hover:bg-gray-200">
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
            <h2 className="font-mono text-lg md:text-xl font-light tracking-tight uppercase text-center">
              {format(currentDate, "MMMM yyyy").toUpperCase()}
            </h2>
          </div>

          <div className="flex items-center">
            <button className="flex h-6 w-6 md:h-7 md:w-7 items-center justify-center rounded-full text-gray-500 hover:bg-gray-200">
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
              <div className="grid grid-cols-7">
                {/* Weekday headers */}
                {weekDays.map((day) => (
                  <div
                    key={day}
                    className="border-b border-r border-gray-100 bg-gray-50 p-1 md:p-2 text-center font-mono text-[10px] md:text-xs font-light tracking-wider text-gray-500"
                  >
                    {day}
                  </div>
                ))}

                {/* Empty cells before first day of month */}
                {emptyCells.map((_, index) => (
                  <div key={`empty-${index}`} className="h-16 md:h-20 border-b border-r border-gray-100"></div>
                ))}

                {/* Day cells */}
                {dayCells.map((day) => {
                  const isToday = day === currentDate.getDate()

                  return (
                    <div
                      key={day}
                      className={`calendar-day relative h-16 md:h-20 border-b border-r border-gray-100 p-1 md:p-2 pt-0.5 md:pt-1 ${
                        isToday ? "bg-gray-50" : ""
                      }`}
                    >
                      <div
                        className={`absolute right-1 md:right-2 top-0.5 flex h-4 md:h-5 w-4 md:w-5 items-center justify-center rounded-full font-mono text-[10px] md:text-xs ${
                          isToday ? "bg-gray-200" : "text-gray-400"
                        }`}
                      >
                        {day}
                      </div>

                      {/* Static example of a holiday */}
                      {day === 17 && currentMonth === 2 && (
                        <div className="mt-3 md:mt-3.5 space-y-0.5 overflow-hidden">
                          <div className="font-mono text-[8px] md:text-[9px] uppercase tracking-wider text-gray-500 whitespace-normal break-words">
                            ST. PATRICK'S DAY
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Controls */}
      <div className="calendar-controls flex flex-wrap items-center justify-center gap-2 p-2 md:p-4">
        <button className="flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-600 hover:bg-gray-100">
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
        <button className="flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-600 hover:bg-gray-100">
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
        <button className="flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-600 hover:bg-gray-100">
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
      </div>
    </div>
  )
}

