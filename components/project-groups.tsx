"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Plus, Trash2 } from "lucide-react"

export type ProjectGroup = {
  id: string
  name: string
  color: string
  active: boolean
}

interface ProjectGroupsProps {
  groups: ProjectGroup[]
  onToggleGroup: (groupId: string) => void
  onAddGroup: (name: string, color: string) => void
  onRemoveGroup: (groupId: string) => void
  onEditGroup: (groupId: string, name: string, color: string) => void
  className?: string
}

// Color options for color picker
const colorOptions = [
  { name: "Black", value: "text-black", bg: "bg-black", text: "text-white" },
  { name: "Blue", value: "text-blue-600", bg: "bg-blue-600", text: "text-white" },
  { name: "Red", value: "text-red-600", bg: "bg-red-600", text: "text-white" },
  { name: "Yellow", value: "text-yellow-500", bg: "bg-yellow-500", text: "text-black" },
  { name: "Orange", value: "text-orange-500", bg: "bg-orange-500", text: "text-black" },
  { name: "Green", value: "text-green-600", bg: "bg-green-600", text: "text-white" },
  { name: "Purple", value: "text-purple-600", bg: "bg-purple-600", text: "text-white" },
]

export default function ProjectGroups({
  groups,
  onToggleGroup,
  onAddGroup,
  onRemoveGroup,
  onEditGroup,
  className,
}: ProjectGroupsProps) {
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [newProjectName, setNewProjectName] = useState("")
  const [newProjectColor, setNewProjectColor] = useState("text-black")
  const [editingGroup, setEditingGroup] = useState<ProjectGroup | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)

  const handleAddProject = () => {
    if (newProjectName.trim()) {
      onAddGroup(newProjectName, newProjectColor)
      setNewProjectName("")
      setNewProjectColor("text-black")
      setShowAddDialog(false)
    }
  }

  const handleEditProject = () => {
    if (editingGroup && editingGroup.name.trim()) {
      onEditGroup(editingGroup.id, editingGroup.name, editingGroup.color)
      setEditingGroup(null)
      setShowEditDialog(false)
    }
  }

  const handleProjectClick = (group: ProjectGroup) => {
    setEditingGroup({ ...group })
    setShowEditDialog(true)
  }

  const handleDeleteProject = (groupId: string) => {
    onRemoveGroup(groupId)
    setShowDeleteConfirm(null)
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
    <div className={cn("project-groups", className)}>
      <div className="flex flex-wrap gap-2">
        {groups.map((group) => (
          <button
            key={group.id}
            onClick={() => handleProjectClick(group)}
            className={cn(
              "flex items-center gap-1 rounded-md border border-gray-200 dark:border-gray-700 px-2 py-1 text-xs",
              group.active ? getBgFromTextColor(group.color) : "bg-white dark:bg-gray-900",
              group.active ? getTextForBg(group.color) : group.color,
            )}
          >
            {group.active ? <Plus className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
            <span>{group.id === "default" ? "PROJECT 01" : group.name}</span>
          </button>
        ))}
        <button
          onClick={() => setShowAddDialog(true)}
          className="flex items-center gap-1 rounded-md border border-dashed border-gray-200 dark:border-gray-700 px-2 py-1 text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          <Plus className="h-3 w-3" />
          <span>NEW PROJECT</span>
        </button>
      </div>

      {/* Add Project Dialog */}
      {showAddDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md overflow-hidden rounded-lg bg-white dark:bg-gray-800 shadow-xl">
            <div className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-2 sm:p-3">
              <div className="flex items-center justify-between">
                <h3 className="font-mono text-sm font-light tracking-tight dark:text-white">NEW PROJECT</h3>
                <button
                  onClick={() => setShowAddDialog(false)}
                  className="rounded-full p-1 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-300"
                >
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
                    className="h-4 w-4"
                  >
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-4 sm:p-6">
              <div className="mb-4">
                <label htmlFor="project-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  PROJECT NAME
                </label>
                <input
                  type="text"
                  id="project-name"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                  placeholder="Enter project name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">COLOR</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => setNewProjectColor(color.value)}
                      className={cn(
                        "h-6 w-6 rounded-full",
                        color.bg,
                        newProjectColor === color.value ? "ring-2 ring-black ring-offset-2" : "",
                      )}
                    ></button>
                  ))}
                </div>
              </div>
            </div>
            <div className="border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-2 sm:p-3 flex justify-end">
              <button
                type="button"
                className="rounded-md border border-gray-300 bg-white dark:bg-gray-800 py-2 px-4 text-sm font-medium text-gray-700 dark:text-gray-300 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                onClick={() => setShowAddDialog(false)}
              >
                CANCEL
              </button>
              <button
                type="button"
                className="ml-3 inline-flex justify-center rounded-md border border-transparent bg-black py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
                onClick={handleAddProject}
              >
                ADD
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Project Dialog */}
      {showEditDialog && editingGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md overflow-hidden rounded-lg bg-white dark:bg-gray-800 shadow-xl">
            <div className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-2 sm:p-3">
              <div className="flex items-center justify-between">
                <h3 className="font-mono text-sm font-light tracking-tight dark:text-white">EDIT PROJECT</h3>
                <button
                  onClick={() => setShowEditDialog(false)}
                  className="rounded-full p-1 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-300"
                >
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
                    className="h-4 w-4"
                  >
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-4 sm:p-6">
              <div className="mb-4">
                <label
                  htmlFor="edit-project-name"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  PROJECT NAME
                </label>
                <input
                  type="text"
                  id="edit-project-name"
                  value={editingGroup.name}
                  onChange={(e) => setEditingGroup({ ...editingGroup, name: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                  placeholder="Enter project name"
                  disabled={editingGroup.id === "default"}
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">COLOR</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => setEditingGroup({ ...editingGroup, color: color.value })}
                      className={cn(
                        "h-6 w-6 rounded-full",
                        color.bg,
                        editingGroup.color === color.value ? "ring-2 ring-black ring-offset-2" : "",
                      )}
                    ></button>
                  ))}
                </div>
              </div>
              {editingGroup.id !== "default" && (
                <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(editingGroup.id)}
                    className="flex items-center text-red-600 hover:text-red-800 text-sm"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    DELETE PROJECT
                  </button>
                </div>
              )}
            </div>
            <div className="border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-2 sm:p-3 flex justify-end">
              <button
                type="button"
                className="rounded-md border border-gray-300 bg-white dark:bg-gray-800 py-2 px-4 text-sm font-medium text-gray-700 dark:text-gray-300 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                onClick={() => setShowEditDialog(false)}
              >
                CANCEL
              </button>
              <button
                type="button"
                className="ml-3 inline-flex justify-center rounded-md border border-transparent bg-black py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
                onClick={handleEditProject}
              >
                SAVE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md overflow-hidden rounded-lg bg-white dark:bg-gray-800 shadow-xl">
            <div className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-2 sm:p-3">
              <div className="flex items-center justify-between">
                <h3 className="font-mono text-sm font-light tracking-tight dark:text-white">CONFIRM DELETE</h3>
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="rounded-full p-1 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-300"
                >
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
                    className="h-4 w-4"
                  >
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-4 sm:p-6">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                ARE YOU SURE YOU WANT TO DELETE THIS PROJECT? ALL EVENTS ASSOCIATED WITH THIS PROJECT WILL BE MOVED TO
                PROJECT 01.
              </p>
            </div>
            <div className="border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-2 sm:p-3 flex justify-end">
              <button
                type="button"
                className="rounded-md border border-gray-300 bg-white dark:bg-gray-800 py-2 px-4 text-sm font-medium text-gray-700 dark:text-gray-300 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                onClick={() => setShowDeleteConfirm(null)}
              >
                CANCEL
              </button>
              <button
                type="button"
                className="ml-3 inline-flex justify-center rounded-md border border-transparent bg-red-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                onClick={() => handleDeleteProject(showDeleteConfirm)}
              >
                DELETE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

