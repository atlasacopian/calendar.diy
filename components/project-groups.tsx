"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import { Tag, Minus, X as IconX, Plus, Pencil } from "lucide-react"
import { subMonths, addMonths } from "date-fns"
import { createPortal } from "react-dom"

export type ProjectGroup = {
  id: string
  name: string
  color: string
  active: boolean
}

interface ProjectGroupsProps {
  groups: ProjectGroup[]
  onToggleGroup: (groupId: string) => void
  className?: string

  showDialog: boolean
  editingGroupId: string | null
  dialogName: string
  dialogColor: string
  setDialogName: (name: string) => void
  setDialogColor: (color: string) => void
  onCloseDialog: () => void
  onSaveDialog: () => void
  onRequestDelete: (groupId: string) => void

  onShowAddRequest: () => void
  onShowEditRequest: (group: ProjectGroup) => void
  dialogError: string | null
  colorOptions: { name: string; value: string; bg: string; }[]
  getBgFromTextColor: (textColor: string) => string
  getTextForBg: (bgColor: string) => string
}

export default function ProjectGroups({
  groups,
  onToggleGroup,
  className,
  showDialog,
  editingGroupId,
  dialogName,
  dialogColor,
  setDialogName,
  setDialogColor,
  onCloseDialog,
  onSaveDialog,
  onRequestDelete,
  onShowAddRequest,
  onShowEditRequest,
  dialogError,
  colorOptions,
  getBgFromTextColor,
  getTextForBg,
}: ProjectGroupsProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleToggleClick = (groupId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    onToggleGroup(groupId)
  }

  const handleProjectNameClick = (group: ProjectGroup, e: React.MouseEvent) => {
    e.stopPropagation()
    onShowEditRequest(group)
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showDialog && dialogRef.current && !dialogRef.current.contains(event.target as Node)) {
        onCloseDialog()
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showDialog, onCloseDialog])

  useEffect(() => {
    if (showDialog) {
      const timer = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus()
          const length = inputRef.current.value.length
          inputRef.current.setSelectionRange(length, length)
        }
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [showDialog])

  const handleDialogKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      onSaveDialog()
    }
  }

  const handleSaveDialog = () => {
    onSaveDialog()
  }

  return (
    <div className={cn(
      "max-w-xl w-full",
      className
    )}>
      <div className="w-full mt-4 flex justify-center">
        <div className="flex flex-wrap gap-1.5 items-center">
          {groups.map((group) => {
            const isActive = group.active;
            const bgColorClass = getBgFromTextColor(group.color);
            const textColorClass = getTextForBg(group.color); 
            const displayColor = isActive ? bgColorClass : 'bg-gray-200';
            const displayTextColor = isActive ? textColorClass : 'text-gray-500';

            return (
              <div key={group.id} className="flex items-center gap-1">
                <button
                  onClick={(e) => handleToggleClick(group.id, e)}
                  className={cn(
                    `px-1.5 py-1 text-[10px] sm:text-xs rounded-sm font-mono flex items-center gap-1 transition-all duration-150 ease-in-out border`,
                    isActive
                      ? `${displayColor} ${displayTextColor} border-transparent`
                      : `bg-white text-gray-400 border-gray-200 hover:bg-gray-50 hover:text-gray-600 hover:border-gray-300`,
                  )}
                >
                  <Tag size={12} className="hover:underline" />
                  <span 
                    onClick={(e) => handleProjectNameClick(group, e)} 
                    className="cursor-pointer hover:underline"
                  >
                    {group.name}
                  </span>
                </button>
              </div>
            );
          })}
          <button
            onClick={onShowAddRequest}
            className="flex items-center justify-center w-6 h-6 border border-dotted border-gray-300 text-gray-500 hover:bg-gray-100 transition-all duration-150 ease-in-out rounded-sm"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      {showDialog && typeof window !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div ref={dialogRef} className="bg-white p-4 sm:p-6 rounded-sm max-w-xs w-full shadow-xl">
            <h4 className="text-sm sm:text-md font-mono mb-3 text-center uppercase tracking-wider">
              {editingGroupId ? 'Edit Tag' : 'Add Tag'}
            </h4>

            {dialogError && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded-sm text-xs mb-4">
                {dialogError}
              </div>
            )}

            <div className="mb-4">
              <input
                ref={inputRef}
                id="tagName"
                type="text"
                value={dialogName}
                onChange={(e) => setDialogName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    onSaveDialog();
                  }
                }}
                maxLength={15}
                placeholder="Tag name"
                className={cn(
                  "w-full p-2 border rounded-sm font-mono text-sm border-gray-200",
                  "focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
                )}
              />
            </div>

            <div className="mb-6">
              <div className="flex flex-wrap gap-2">
                {colorOptions.map((option) => {
                  const isSelected = dialogColor === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setDialogColor(option.value)}
                      className={cn(
                        "w-6 h-6 rounded-full border-2",
                        option.bg,
                        isSelected
                          ? 'border-black'
                          : 'border-transparent hover:border-gray-400'
                      )}
                      title={option.name}
                    />
                  );
                })}
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div>
                {editingGroupId && editingGroupId !== 'default' && (
                  <button
                    onClick={() => onRequestDelete(editingGroupId)}
                    className="text-xs text-red-600 hover:underline"
                  >
                    DELETE
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={onCloseDialog}
                  className={cn(
                    "px-4 py-2 text-xs font-mono rounded-sm border border-gray-300 hover:bg-gray-100"
                  )}
                >
                  CANCEL
                </button>
                <button
                  onClick={handleSaveDialog}
                  disabled={dialogName.trim() === ''}
                  className={cn(
                    "px-6 py-2 text-xs font-mono rounded-sm bg-black text-white hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                >
                  SAVE
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}


