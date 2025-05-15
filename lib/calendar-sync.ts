// Function to generate ICS file content for calendar events
export function generateICSFile(events: { date: Date; content: string }[]): string {
  // ICS file header
  let icsContent =
    [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//PROJECT CALENDAR//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "X-WR-CALNAME:Project Calendar",
    ].join(
      "\r\n",
    ) + "\r\n"

  // Add each event to the ICS file
  events.forEach((event) => {
    const eventDate = event.date
    const dateString = formatDateForICS(eventDate)
    const endDateString = formatDateForICS(new Date(eventDate.getTime() + 24 * 60 * 60 * 1000)) // End date is next day

    const eventBlock =
      [
        "BEGIN:VEVENT",
        `UID:${generateUID(event)}`,
        `DTSTAMP:${formatDateTimeForICS(new Date())}`,
        `DTSTART;VALUE=DATE:${dateString}`,
        `DTEND;VALUE=DATE:${endDateString}`,
        `SUMMARY:${event.content.replace(/\n/g, "\\n")}`,
        "END:VEVENT",
      ].join("\r\n") + "\r\n"

    icsContent += eventBlock
  })

  // ICS file footer
  icsContent += "END:VCALENDAR\r\n"

  return icsContent
}

// Format date for ICS file (YYYYMMDD)
function formatDateForICS(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").split("T")[0]
}

// Format date and time for ICS file (YYYYMMDDTHHmmssZ)
function formatDateTimeForICS(date: Date): string {
  return date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/g, "")
}

// Generate a unique ID for each event
function generateUID(event: { date: Date; content: string }): string {
  const dateStr = event.date.toISOString()
  const contentHash = hashString(event.content)
  return `event-${dateStr}-${contentHash}@projectcalendar`
}

// Simple hash function for strings
function hashString(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16)
}

// Function to download ICS file
export function downloadICSFile(events: { date: Date; content: string }[]): void {
  const icsContent = generateICSFile(events)
  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" })
  const url = URL.createObjectURL(blob)

  const link = document.createElement("a")
  link.href = url
  link.setAttribute("download", "project-calendar.ics")
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// Google Calendar integration
export async function addToGoogleCalendar(event: { date: Date; content: string }): Promise<string> {
  // Format the date as YYYY-MM-DD
  const dateString = event.date.toISOString().split("T")[0]

  // Create Google Calendar URL with event parameters
  const googleCalendarUrl = new URL("https://calendar.google.com/calendar/render")
  googleCalendarUrl.searchParams.append("action", "TEMPLATE")
  googleCalendarUrl.searchParams.append("text", event.content)
  googleCalendarUrl.searchParams.append("dates", `${dateString}/${dateString}`)
  googleCalendarUrl.searchParams.append("details", event.content)

  // Open Google Calendar in a new tab
  window.open(googleCalendarUrl.toString(), "_blank")

  return googleCalendarUrl.toString()
}

// Function to add to Apple Calendar (opens in a new tab with webcal protocol)
export function addToAppleCalendar(events: { date: Date; content: string }[]): void {
  const icsContent = generateICSFile(events)
  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" })
  const url = URL.createObjectURL(blob)

  // For Apple Calendar, we can either:
  // 1. Download the file and let the user import it
  // 2. Use the webcal:// protocol (which works on macOS)

  // We'll use the download approach as it's more universal
  const link = document.createElement("a")
  link.href = url
  link.setAttribute("download", "project-calendar.ics")
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// Function to add to Outlook Calendar
export function addToOutlookCalendar(events: { date: Date; content: string }[]): void {
  // For Outlook, we can use the same ICS approach
  downloadICSFile(events)
}

