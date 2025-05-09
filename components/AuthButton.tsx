"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Loader2 } from "lucide-react"

export default function AuthButton() {
  const [user, setUser] = useState<null | { email?: string }>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    // Get current user on mount
    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return
      setUser(data.user ?? null)
      setLoading(false)
    })

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const handleSignIn = () => {
    supabase.auth.signInWithOAuth({ provider: "apple" })
  }

  const handleSignOut = () => {
    supabase.auth.signOut()
  }

  if (loading) {
    return (
      <button className="flex items-center gap-1 text-xs text-gray-600 px-3 py-1.5 border border-gray-300 rounded-sm cursor-default">
        <Loader2 size={14} className="animate-spin" />
      </button>
    )
  }

  return user ? (
    <button
      onClick={handleSignOut}
      className="text-[10px] sm:text-xs text-gray-500 font-mono hover:bg-gray-100 flex items-center gap-1 px-2 py-1 border border-gray-200 rounded-sm transition-colors"
    >
      Sign&nbsp;out
    </button>
  ) : (
    <button
      onClick={handleSignIn}
      className="text-[10px] sm:text-xs text-gray-500 font-mono hover:bg-gray-100 flex items-center gap-1 px-2 py-1 border border-gray-200 rounded-sm transition-colors"
    >
      Sign&nbsp;in&nbsp;with&nbsp;Apple
    </button>
  )
} 