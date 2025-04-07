import { createClient } from "@supabase/supabase-js"
import type { User } from "@supabase/supabase-js"

// Create a Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type CalendarEvent = {
  id: string
  date: Date | string
  content: string
  formattedContent?: string
  color?: string
  projectId?: string
}

const isDate = (date: Date | string): date is Date => {
  return date instanceof Date
}

export type ProjectGroup = {
  id: string
  name: string
  color: string
  active: boolean
}

// Function to save events to localStorage
export const saveEvents = (events: CalendarEvent[]) => {
  if (typeof window === 'undefined') return
  const eventsToSave = events.map(event => ({
    ...event,
    date: formatDate(event.date)
  }))
  localStorage.setItem('calendarEvents', JSON.stringify(eventsToSave))
}

// Function to save project groups to localStorage
export const saveProjectGroups = (groups: ProjectGroup[]) => {
  if (typeof window === 'undefined') return
  localStorage.setItem('projectGroups', JSON.stringify(groups))
}

// Function to load events from localStorage
export const loadEvents = (): CalendarEvent[] => {
  if (typeof window === 'undefined') return []
  const savedEvents = localStorage.getItem('calendarEvents')
  if (!savedEvents) return []
  
  try {
    const events = JSON.parse(savedEvents)
    return events.map((event: any) => ({
      ...event,
      date: new Date(event.date)
    }))
  } catch (error) {
    console.error('Error loading events:', error)
    return []
  }
}

// Function to load project groups from localStorage
export const loadProjectGroups = (): ProjectGroup[] => {
  if (typeof window === 'undefined') return []
  const savedGroups = localStorage.getItem('projectGroups')
  if (!savedGroups) return []
  
  try {
    return JSON.parse(savedGroups)
  } catch (error) {
    console.error('Error loading project groups:', error)
    return []
  }
}

// Function to save events to Supabase
export const saveEventsToSupabase = async (events: CalendarEvent[], user: User) => {
  if (!user) return

  // Convert Date objects to ISO strings for storage
  const eventsToSave = events.map((event) => ({
    ...event,
    date: formatDate(event.date),
    user_id: user.id,
  }))

  // Delete existing events for this user
  await supabase.from("calendar_events").delete().eq("user_id", user.id)

  // Insert new events
  const { error } = await supabase.from("calendar_events").insert(eventsToSave)

  if (error) {
    console.error("Error saving events to Supabase:", error)
  }
}

// Function to save project groups to Supabase
export const saveProjectGroupsToSupabase = async (groups: ProjectGroup[], user: User) => {
  if (!user) return

  const groupsToSave = groups.map((group) => ({
    ...group,
    user_id: user.id,
  }))

  // Delete existing groups for this user
  await supabase.from("project_groups").delete().eq("user_id", user.id)

  // Insert new groups
  const { error } = await supabase.from("project_groups").insert(groupsToSave)

  if (error) {
    console.error("Error saving project groups to Supabase:", error)
  }
}

// Function to load events from Supabase
export const loadEventsFromSupabase = async (user: User): Promise<CalendarEvent[]> => {
  if (!user) return []

  const { data, error } = await supabase.from("calendar_events").select("*").eq("user_id", user.id)

  if (error) {
    console.error("Error loading events from Supabase:", error)
    return []
  }

  // Convert ISO strings back to Date objects
  return data.map((event) => ({
    ...event,
    date: new Date(event.date),
  }))
}

// Function to load project groups from Supabase
export const loadProjectGroupsFromSupabase = async (user: User): Promise<ProjectGroup[]> => {
  if (!user) return []

  const { data, error } = await supabase.from("project_groups").select("*").eq("user_id", user.id)

  if (error) {
    console.error("Error loading project groups from Supabase:", error)
    return []
  }

  return data
}

const formatDate = (date: Date | string) => {
  if (isDate(date)) {
    return date.toISOString()
  }
  return date
}

