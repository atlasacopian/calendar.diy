"use client"

import { cn } from "@/lib/utils"

type ColorPickerProps = {
  selectedColor: string
  onColorChange: (color: string) => void
}

export function ColorPicker({ selectedColor, onColorChange }: ColorPickerProps) {
  // Seven bold, distinct colors as requested
  const colorOptions = [
    { name: "Black", value: "text-black" },
    { name: "Blue", value: "text-blue-600" },
    { name: "Red", value: "text-red-600" },
    { name: "Yellow", value: "text-yellow-500" },
    { name: "Orange", value: "text-orange-500" },
    { name: "Green", value: "text-green-600" },
    { name: "Purple", value: "text-purple-600" },
  ]

  return (
    <div className="mt-4 mb-6">
      <div className="mb-2 font-mono text-xs text-gray-500">EVENT COLOR</div>
      <div className="flex gap-4">
        {colorOptions.map((color) => (
          <button
            key={color.value}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 font-bold transition-all duration-200 hover:scale-110",
              color.value,
              selectedColor === color.value ? "ring-2 ring-offset-2" : "",
            )}
            title={color.name}
            onClick={() => onColorChange(color.value)}
            type="button"
          >
            A
          </button>
        ))}
      </div>
    </div>
  )
}

