"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import { Plus, Minus } from "lucide-react"

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
  { name: "Black", value: "text-black", bg: "bg-[#000000]", text: "text-white" },
  { name: "Blue", value: "text-blue-600", bg: "bg-[#0012ff]", text: "text-white" },
  { name: "Red", value: "text-red-600", bg: "bg-[#ff0000]", text: "text-white" },
  { name: "Yellow", value: "text-yellow-500", bg: "bg-[#f6ff00]", text: "text-black" },
  { name: "Orange", value: "text-orange-500", bg: "bg-[#ff7200]", text: "text-black" },
  { name: "Green", value: "text-green-600", bg: "bg-[#1ae100]", text: "text-white" },
  { name: "Purple", value: "text-purple-600", bg: "bg-[#a800ff]", text: "text-white" },
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

  const addDialogRef = useRef<HTMLDivElement>(null)
  const editDialogRef = useRef<HTMLDivElement>(null)
  const deleteConfirmRef = useRef<HTMLDivElement>(null)

  const handleAddProjectKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAddProject()
    }
  }

  const handleEditProjectKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleEditProject()
    }
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showAddDialog && addDialogRef.current && !addDialogRef.current.contains(event.target as Node)) {
        setShowAddDialog(false)
      }
      if (showEditDialog && editDialogRef.current && !editDialogRef.current.contains(event.target as Node)) {
        setShowEditDialog(false)
      }
      if (showDeleteConfirm && deleteConfirmRef.current && !deleteConfirmRef.current.contains(event.target as Node)) {
        setShowDeleteConfirm(null)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showAddDialog, showEditDialog, showDeleteConfirm])

  const handleAddProject = () => {
    if (newProjectName.trim()) {
      const newProject = {
        id: Math.random().toString(36).substring(2, 11),
        name: newProjectName,
        color: newProjectColor,
        active: true,
      }
      onAddGroup(newProjectName, newProjectColor)
      setNewProjectName("")
      setNewProjectColor("text-black")
      setShowAddDialog(false)

      // After a short delay, open the edit dialog for the new project
      setTimeout(() => {
        setEditingGroup(newProject)
        setShowEditDialog(true)
      }, 100)
    }
  }

  const handleEditProject = () => {
    if (editingGroup && editingGroup.name.trim()) {
      onEditGroup(editingGroup.id, editingGroup.name, editingGroup.color)
      setEditingGroup(null)
      setShowEditDialog(false)
    }
  }

  const handleProjectNameClick = (group: ProjectGroup, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent the toggle from firing
    setEditingGroup({ ...group })
    setShowEditDialog(true)
  }

  const handleToggleClick = (groupId: string, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent event bubbling
    onToggleGroup(groupId)
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
    <div className={cn("project-groups flex justify-center", className)}>
      <div className="flex flex-wrap gap-2 justify-center">
        {groups.map((group) => (
          <div
            key={group.id}
            className={cn(
              "flex items-center rounded-md border border-gray-200 dark:border-gray-700 px-2 py-1 text-xs",
              group.active ? getBgFromTextColor(group.color) : "bg-gray-50 dark:bg-gray-800/50",
              group.active ? getTextForBg(group.color) : group.color,
            )}
          >
            <button
              onClick={(e) => handleToggleClick(group.id, e)}
              className="mr-1 flex items-center justify-center h-3 w-3"
            >
              {group.active ? <Plus className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
            </button>
            <button onClick={(e) => handleProjectNameClick(group, e)} className="hover:underline focus:underline">
              <span>{group.id === "default" ? "PROJECT 01" : group.name}</span>
            </button>
          </div>
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
          <div
            ref={addDialogRef}
            className="w-full max-w-md overflow-hidden rounded-lg bg-white dark:bg-gray-800 shadow-xl"
          >
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
                  onChange={(e) => setNewProjectName(e.target.value.toUpperCase())}
                  onKeyDown={handleAddProjectKeyDown}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm py-2 uppercase"
                  placeholder="ENTER PROJECT NAME"
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
                className="inline-flex justify-center rounded-md border border-transparent bg-black py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
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
          <div
            ref={editDialogRef}
            className="w-full max-w-md overflow-hidden rounded-lg bg-white dark:bg-gray-800 shadow-xl"
          >
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
                  onChange={(e) => setEditingGroup({ ...editingGroup, name: e.target.value.toUpperCase() })}
                  onKeyDown={handleEditProjectKeyDown}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm py-2 uppercase"
                  placeholder="ENTER PROJECT NAME"
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
                <div className="absolute top-3 right-12">
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(editingGroup.id)}
                    className="text-red-500 hover:text-red-700"
                    title="Delete project"
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
                      className="h-5 w-5"
                    >
                      <path d="M3 6h18"></path>
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                      <line x1="10" y1="11" x2="10" y2="17"></line>
                      <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                  </button>
                </div>
              )}
            </div>
            <div className="border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-2 sm:p-3 flex justify-end">
              <button
                type="button"
                className="inline-flex justify-center rounded-md border border-transparent bg-black py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
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
          <div
            ref={deleteConfirmRef}
            className="w-full max-w-md overflow-hidden rounded-lg bg-white dark:bg-gray-800 shadow-xl"
          >
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

