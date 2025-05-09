"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

type AppContextType = {
  user: any | null
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any | null>(null)

  useEffect(() => {
    // Get current user on mount
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const value: AppContextType = {
    user,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

