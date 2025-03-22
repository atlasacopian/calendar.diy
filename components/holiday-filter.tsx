"use client"
import { Check } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type HolidayFilterProps = {
  selectedTypes: string[]
  onToggleType: (type: string) => void
}

export function HolidayFilter({ selectedTypes, onToggleType }: HolidayFilterProps) {
  const holidayTypes = [
    { id: "federal", label: "Federal Holidays" },
    { id: "religious", label: "Religious Holidays" },
    { id: "international", label: "International Holidays" },
    { id: "observance", label: "Observances" },
  ]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 rounded-none border-black font-mono text-xs tracking-wider hover:bg-gray-50"
        >
          HOLIDAYS
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 rounded-none border-black">
        <DropdownMenuLabel className="font-mono text-xs font-normal tracking-wider">DISPLAY HOLIDAYS</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {holidayTypes.map((type) => (
            <DropdownMenuItem
              key={type.id}
              className="flex cursor-pointer items-center justify-between font-mono text-xs"
              onClick={() => onToggleType(type.id)}
            >
              {type.label}
              {selectedTypes.includes(type.id) && <Check className="h-4 w-4" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

