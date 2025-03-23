"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { PlusCircle, X, Check } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

// Define the project group type
export type ProjectGroup = {
  id: string
  name: string
  color: string
  active: boolean
}

// Color options matching the ones in the calendar component
export const colorOptions = [
  { name: "Black", value: "text-black", bg: "bg-black", text: "text-white" },
  { name: "Blue", value: "text-blue-600", bg: "bg-blue-600", text: "text-white" },
  { name: "Red", value: "text-red-600", bg: "bg-red-600", text: "text-white" },
  { name: "Yellow", value: "text-yellow-500", bg: "bg-yellow-500", text: "text-black" },
  { name: "Orange", value: "text-orange-500", bg: "bg-orange-500", text: "text-black" },
  { name: "Green", value: "text-green-600", bg: "bg-green-600", text: "text-white" },
  { name: "Purple", value: "text-purple-600", bg: "bg-purple-600", text: "text-white" },
]

interface ProjectGroupsProps {
  groups: ProjectGroup[]
  onToggleGroup: (groupId: string) => void
  onAddGroup: (name: string, color: string) => void
  onRemoveGroup: (groupId: string) => void
}

export default function ProjectGroups({ groups, onToggleGroup, onAddGroup, onRemoveGroup }: ProjectGroupsProps) {
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [newGroupName, setNewGroupName] = useState("")
  const [selectedColor, setSelectedColor] = useState(colorOptions[0].value)

  const handleAddGroup = () => {
    if (newGroupName.trim()) {
      onAddGroup(newGroupName.trim(), selectedColor)
      setNewGroupName("")
      setSelectedColor(colorOptions[0].value)
      setShowAddDialog(false)
    }
  }

  // Get the background color class from a text color class
  const getBgFromTextColor = (textColor: string) => {
    const color = colorOptions.find((c) => c.value === textColor)
    return color ? color.bg : "bg-gray-200"
  }

  // Get the text color for the background
  const getTextForBg = (textColor: string) => {
    const color = colorOptions.find((c) => c.value === textColor)
    return color ? color.text : "text-black"
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-center gap-2 mt-4 mb-2">
        {groups.length > 0 && (
          <div className="w-full text-center text-xs text-gray-500 dark:text-gray-400 mb-1">PROJECT LEGEND</div>
        )}

        <div className="flex flex-wrap justify-center gap-2 max-w-md">
          {groups.map((group) => (
            <button
              key={group.id}
              onClick={() => onToggleGroup(group.id)}
              className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-md text-xs border transition-opacity",
                getBgFromTextColor(group.color),
                getTextForBg(group.color),
                group.active ? "opacity-100" : "opacity-40",
              )}
              title={group.active ? `Hide ${group.name}` : `Show ${group.name}`}
            >
              <span>{group.name}</span>
              {!group.active && <X className="h-3 w-3" />}
              {group.active && <Check className="h-3 w-3" />}
            </button>
          ))}

          <button
            onClick={() => setShowAddDialog(true)}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-xs border border-dashed border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <PlusCircle className="h-3 w-3" />
            <span>NEW PROJECT</span>
          </button>
        </div>
      </div>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-mono text-sm font-light">ADD PROJECT</DialogTitle>
          </DialogHeader>

          <div className="p-4 space-y-4">
            <div>
              <label className="block text-xs mb-2">PROJECT NAME</label>
              <input
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="Enter project name"
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md text-xs"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs mb-2">PROJECT COLOR</label>
              <div className="flex flex-wrap gap-2">
                {colorOptions.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setSelectedColor(color.value)}
                    className={cn(
                      "w-6 h-6 rounded-full",
                      color.bg,
                      selectedColor === color.value ? "ring-2 ring-offset-2 ring-gray-400" : "",
                    )}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowAddDialog(false)}
                className="px-3 py-1 border border-gray-200 dark:border-gray-700 rounded-md text-xs"
              >
                CANCEL
              </button>
              <button
                onClick={handleAddGroup}
                disabled={!newGroupName.trim()}
                className={cn(
                  "px-3 py-1 rounded-md text-xs",
                  getBgFromTextColor(selectedColor),
                  getTextForBg(selectedColor),
                  !newGroupName.trim() && "opacity-50 cursor-not-allowed",
                )}
              >
                ADD PROJECT
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

