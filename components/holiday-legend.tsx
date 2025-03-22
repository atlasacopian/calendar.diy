import { cn } from "@/lib/utils"

export function HolidayLegend({ selectedTypes }: { selectedTypes: string[] }) {
  const legendItems = [
    { type: "federal", label: "Federal", color: "bg-gray-500" },
    { type: "religious", label: "Religious", color: "bg-indigo-500" },
    { type: "international", label: "International", color: "bg-cyan-600" },
    { type: "observance", label: "Observances", color: "bg-amber-500" },
  ]

  return (
    <div className="mt-6 flex flex-wrap items-center gap-4 font-mono text-xs text-gray-500">
      <span>LEGEND:</span>
      {legendItems
        .filter((item) => selectedTypes.includes(item.type))
        .map((item) => (
          <div key={item.type} className="flex items-center gap-1.5">
            <div className={cn("h-2 w-2", item.color)} />
            <span>{item.label}</span>
          </div>
        ))}
    </div>
  )
}

