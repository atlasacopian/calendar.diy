"use client"

import type React from "react"
import { createContext, useContext } from "react"

// Define a very simple context type (can be expanded later)
type AppContextType = {
  // Placeholder for future context values if needed
}

// Create the context with a default value
const AppContext = createContext<AppContextType | undefined>(undefined)

// Provider component (doesn't manage auth state anymore)
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  // No user state or Supabase logic needed here for now

  // Provide an empty context value (can add things later)
  const value = {}

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  )
}

// Custom hook to use the context
export const useAuth = () => {
  const context = useContext(AppContext)
  if (context === undefined) {
    // Changed error message slightly as it's not just for Auth anymore
    throw new Error('useAuth must be used within an AuthProvider') 
  }
  return context
}

