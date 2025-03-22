"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"

export default function Calendar() {
  const [date, setDate] = useState<Date | undefined>(new Date())

  return (
    <div className="border rounded-md p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">{date ? format(date, "MMMM yyyy") : "Select a Date"}</h2>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant={"outline"}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              <span>Pick a date</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add Event</DialogTitle>
              <DialogDescription>Make changes to your profile here. Click save when you're done.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="name" className="text-right">
                  Name
                </label>
                <input type="text" id="name" placeholder="Here" className="col-span-3 rounded-md border px-2 py-1" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="username" className="text-right">
                  Username
                </label>
                <input
                  type="text"
                  id="username"
                  placeholder="shadcn"
                  className="col-span-3 rounded-md border px-2 py-1"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Save changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div>
        {/* Calendar Component Here */}
        {/* Implement Calendar Logic and UI */}
        {/* Example: */}
        <div>
          <p>Selected Date: {date ? format(date, "PPP") : "No date selected."}</p>
        </div>
      </div>
    </div>
  )
}

