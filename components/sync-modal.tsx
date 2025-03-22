"use client"

import { useState } from "react"
import { CalendarIcon, Download, X, Mail, CheckCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { downloadICSFile, addToGoogleCalendar, addToAppleCalendar, addToOutlookCalendar } from "@/lib/calendar-sync"

type SyncModalProps = {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  events: { date: Date; content: string }[]
  selectedEvent?: { date: Date; content: string } | null
}

export function SyncModal({ isOpen, onOpenChange, events, selectedEvent }: SyncModalProps) {
  const [syncStatus, setSyncStatus] = useState<string | null>(null)
  const [syncComplete, setSyncComplete] = useState(false)

  const handleSync = async (type: string) => {
    setSyncStatus(`Syncing with ${type}...`)
    setSyncComplete(false)

    try {
      if (type === "Google Calendar") {
        if (selectedEvent) {
          await addToGoogleCalendar(selectedEvent)
        } else {
          // For multiple events, we need to add them one by one
          for (const event of events) {
            await addToGoogleCalendar(event)
          }
        }
      } else if (type === "Apple Calendar") {
        if (selectedEvent) {
          addToAppleCalendar([selectedEvent])
        } else {
          addToAppleCalendar(events)
        }
      } else if (type === "Outlook") {
        if (selectedEvent) {
          addToOutlookCalendar([selectedEvent])
        } else {
          addToOutlookCalendar(events)
        }
      } else if (type === "ICS File") {
        if (selectedEvent) {
          downloadICSFile([selectedEvent])
        } else {
          downloadICSFile(events)
        }
      }

      setSyncStatus(`Successfully synced with ${type}`)
      setSyncComplete(true)
    } catch (error) {
      setSyncStatus(`Error syncing with ${type}: ${error}`)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="border-0 p-0 shadow-lg sm:max-w-md">
        <DialogHeader className="border-b p-6">
          <div className="flex items-center justify-between">
            <DialogTitle className="font-mono text-lg font-light tracking-tight">Sync Calendar</DialogTitle>
            <DialogClose className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </DialogClose>
          </div>
        </DialogHeader>

        <div className="flex flex-col gap-4 p-6">
          <p className="font-mono text-sm text-gray-500">
            {selectedEvent
              ? "Sync this event with your personal calendar"
              : "Sync all events with your personal calendar"}
          </p>

          {syncStatus && (
            <div
              className={`mb-4 flex items-center gap-2 rounded-sm border p-3 font-mono text-xs ${syncComplete ? "border-green-100 bg-green-50 text-green-800" : "border-gray-100 bg-gray-50 text-gray-800"}`}
            >
              {syncComplete ? <CheckCircle className="h-4 w-4 text-green-500" /> : <CalendarIcon className="h-4 w-4" />}
              {syncStatus}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="flex h-auto flex-col items-center gap-2 rounded-none border-gray-200 p-4 font-mono text-xs hover:bg-gray-50"
              onClick={() => handleSync("Google Calendar")}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                <CalendarIcon className="h-5 w-5" />
              </div>
              <span>Google Calendar</span>
            </Button>

            <Button
              variant="outline"
              className="flex h-auto flex-col items-center gap-2 rounded-none border-gray-200 p-4 font-mono text-xs hover:bg-gray-50"
              onClick={() => handleSync("Apple Calendar")}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                <CalendarIcon className="h-5 w-5" />
              </div>
              <span>Apple Calendar</span>
            </Button>

            <Button
              variant="outline"
              className="flex h-auto flex-col items-center gap-2 rounded-none border-gray-200 p-4 font-mono text-xs hover:bg-gray-50"
              onClick={() => handleSync("Outlook")}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                <Mail className="h-5 w-5" />
              </div>
              <span>Outlook</span>
            </Button>

            <Button
              variant="outline"
              className="flex h-auto flex-col items-center gap-2 rounded-none border-gray-200 p-4 font-mono text-xs hover:bg-gray-50"
              onClick={() => handleSync("ICS File")}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                <Download className="h-5 w-5" />
              </div>
              <span>Download ICS</span>
            </Button>
          </div>

          <p className="mt-2 font-mono text-xs text-gray-400">
            Note: For Google Calendar, you'll be redirected to add the event(s). For Apple Calendar and Outlook, an ICS
            file will be downloaded that you can import.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}

