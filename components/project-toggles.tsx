"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { PlusCircle } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

// Types
type Project = {
  id: string
  name: string
  color: string
  active: boolean
}

interface ProjectTogglesProps {
  projects: Project[]
  onToggleProject: (id: string) => void
  onAddProject: (name: string, color: string) => void
}

export default function ProjectToggles({ projects, onToggleProject, onAddProject }: ProjectTogglesProps) {
  const [newProjectName, setNewProjectName] = useState("")
  const [selectedColor, setSelectedColor] = useState("#000000")
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Available colors for projects
  const colorOptions = [
    { name: "Black", value: "#000000" },
    { name: "Blue", value: "#2563eb" },
    { name: "Red", value: "#dc2626" },
    { name: "Green", value: "#16a34a" },
    { name: "Purple", value: "#9333ea" },
    { name: "Orange", value: "#f97316" },
    { name: "Yellow", value: "#eab308" },
  ]

  const handleAddProject = () => {
    if (newProjectName.trim()) {
      onAddProject(newProjectName, selectedColor)
      setNewProjectName("")
      setSelectedColor("#000000")
      setIsDialogOpen(false)
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 mt-4 mb-2">
      {projects.map((project) => (
        <button
          key={project.id}
          onClick={() => onToggleProject(project.id)}
          className={cn(
            "px-2 py-1 rounded-full text-xs border transition-colors",
            project.active
              ? "bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
              : "bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 text-gray-400 dark:text-gray-600",
          )}
          style={{
            borderLeft: `3px solid ${project.color}`,
          }}
        >
          {project.name}
        </button>
      ))}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <button className="flex items-center gap-1 px-2 py-1 rounded-full text-xs border border-dashed border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800">
            <PlusCircle className="h-3 w-3" />
            <span>NEW</span>
          </button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-mono text-sm font-light">NEW COLLECTION</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="name" className="text-xs">
                NAME
              </label>
              <Input
                id="name"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="WORK, PERSONAL, ETC."
                className="text-xs"
              />
            </div>

            <div className="grid gap-2">
              <label className="text-xs">COLOR</label>
              <div className="flex flex-wrap gap-2">
                {colorOptions.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setSelectedColor(color.value)}
                    className={cn(
                      "w-6 h-6 rounded-full",
                      selectedColor === color.value ? "ring-2 ring-offset-2 ring-gray-400" : "",
                    )}
                    style={{ backgroundColor: color.value }}
                    aria-label={color.name}
                  />
                ))}
              </div>
            </div>

            <Button onClick={handleAddProject} disabled={!newProjectName.trim()} className="text-xs mt-2">
              CREATE COLLECTION
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

