"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {}

const Tabs = React.forwardRef<HTMLDivElement, TabsProps>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("w-full", className)} {...props} />
))
Tabs.displayName = "Tabs"

interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> {}

const TabsList = React.forwardRef<HTMLDivElement, TabsListProps>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
      className,
    )}
    {...props}
  />
))
TabsList.displayName = "TabsList"

interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string
}

const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(({ className, value, ...props }, ref) => {
  const [selected, setSelected] = React.useState(false)

  React.useEffect(() => {
    // Find parent Tabs component and check if this trigger is selected
    const parent = ref.current?.closest("[data-tabs]")
    if (parent) {
      const activeValue = parent.getAttribute("data-active-tab")
      setSelected(activeValue === value)
    }
  }, [value, ref])

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Set active tab on parent
    const parent = ref.current?.closest("[data-tabs]")
    if (parent) {
      parent.setAttribute("data-active-tab", value)

      // Update all siblings
      const triggers = parent.querySelectorAll("[data-tab-trigger]")
      triggers.forEach((trigger) => {
        if (trigger === ref.current) {
          setSelected(true)
        } else {
          // Force re-render of other triggers
          trigger.dispatchEvent(new Event("tab-change", { bubbles: true }))
        }
      })
    }

    if (props.onClick) {
      props.onClick(e)
    }
  }

  return (
    <button
      ref={ref}
      data-tab-trigger
      data-state={selected ? "active" : "inactive"}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        selected
          ? "bg-background text-foreground shadow-sm"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
        className,
      )}
      onClick={handleClick}
      {...props}
    />
  )
})
TabsTrigger.displayName = "TabsTrigger"

interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string
}

const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(({ className, value, ...props }, ref) => {
  const [selected, setSelected] = React.useState(false)

  React.useEffect(() => {
    // Find parent Tabs component and check if this content should be shown
    const parent = ref.current?.closest("[data-tabs]")
    if (parent) {
      const activeValue = parent.getAttribute("data-active-tab")
      setSelected(activeValue === value)

      // Listen for changes
      const handleTabChange = () => {
        const currentValue = parent.getAttribute("data-active-tab")
        setSelected(currentValue === value)
      }

      parent.addEventListener("tab-change", handleTabChange)
      return () => {
        parent.removeEventListener("tab-change", handleTabChange)
      }
    }
  }, [value, ref])

  if (!selected) return null

  return (
    <div
      ref={ref}
      data-state={selected ? "active" : "inactive"}
      className={cn(
        "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className,
      )}
      {...props}
    />
  )
})
TabsContent.displayName = "TabsContent"

export { Tabs, TabsList, TabsTrigger, TabsContent }

