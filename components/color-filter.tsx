"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

// Color options matching the ones in the calendar
const colorOptions = [
  { name: "Black", value: "text-black", bg: "bg-black", text: "text-white" },
  { name: "Blue", value: "text-blue-600", bg: "bg-blue-600", text: "text-white" },
  { name: "Red", value: "text-red-600", bg: "bg-red-600", text: "text-white" },
  { name: "Yellow", value: "text-yellow-500", bg: "bg-yellow-500", text: "text-black" },
  { name: "Orange", value: "text-orange-500", bg: "bg-orange-500", text: "text-black" },
  { name: "Green", value: "text-green-600", bg: "bg-green-600", text: "text-white" },
  { name: "Purple", value: "text-purple-600", bg: "bg-purple-600", text: "text-white" },
]

interface ColorFilterProps {
  onFilterChange: (activeColors: string[]) => void
}

export default function ColorFilter({ onFilterChange }: ColorFilterProps) {
  const [activeColors, setActiveColors] = useState<string[]>(colorOptions.map((color) => color.value))

  // Toggle a color filter
  const toggleColor = (colorValue: string) => {
    setActiveColors((prev) => {
      if (prev.includes(colorValue)) {
        return prev.filter((c) => c !== colorValue)
      } else {
        return [...prev, colorValue]
      }
    })
  }

  // Notify parent component when filters change
  useEffect(() => {
    onFilterChange(activeColors)
  }, [activeColors, onFilterChange])

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 mt-4 mb-2">
      <span className="text-xs text-gray-500 dark:text-gray-400 mr-1">FILTER:</span>
      {colorOptions.map((color) => (
        <button
          key={color.value}
          onClick={() => toggleColor(color.value)}
          className={cn(
            "w-6 h-6 rounded-full transition-opacity",
            color.bg,
            !activeColors.includes(color.value) && "opacity-30",
          )}
          title={`${activeColors.includes(color.value) ? "Hide" : "Show"} ${color.name} events`}
          aria-pressed={activeColors.includes(color.value)}
        >
          <span className="sr-only">{color.name}</span>
        </button>
      ))}
    </div>
  )
}

