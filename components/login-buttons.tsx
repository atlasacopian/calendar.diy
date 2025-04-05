"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { createClient } from "@supabase/supabase-js"

export default function LoginButtons() {
  const { user, signOut } = useAuth()
  const [showOptions, setShowOptions] = useState(false)

  // Create a Supabase client using the standard createClient method
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
  )

  const handleSignIn = (provider: "google" | "apple") => {
    supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  if (user) {
    return (
      <button
        onClick={signOut}
        className="flex items-center gap-1 rounded-md border border-gray-200 dark:border-gray-700 px-2 py-1 text-[10px] sm:text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
      >
        SIGN OUT
      </button>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowOptions(!showOptions)}
        className="flex items-center gap-1 rounded-md border border-gray-200 dark:border-gray-700 px-2 py-1 text-[10px] sm:text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
        title="Sign in to prevent losing your data when clearing browser history or using a different device"
      >
        SIGN IN
      </button>

      {showOptions && (
        <div className="absolute z-10 mt-1 w-48 origin-top-right rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="p-2 text-xs text-amber-600 dark:text-amber-400 border-b border-gray-100 dark:border-gray-700">
            Sign in to prevent losing data when clearing browser history
          </div>
          <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
            <button
              onClick={() => handleSignIn("google")}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              role="menuitem"
            >
              SIGN IN WITH GOOGLE
            </button>
            <button
              onClick={() => handleSignIn("apple")}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              role="menuitem"
            >
              SIGN IN WITH APPLE
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
