"use client"

import { useAuth } from "@/lib/auth-context"
import { createClient } from "@supabase/supabase-js"

export default function LoginButtons() {
  const { user, signOut } = useAuth()

  // Create a Supabase client using the standard createClient method
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
  )

  const handleAppleSignIn = () => {
    supabase.auth.signInWithOAuth({
      provider: "apple",
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
    <button
      onClick={handleAppleSignIn}
      className="flex items-center gap-1 rounded-md border border-gray-200 dark:border-gray-700 px-2 py-1 text-[10px] sm:text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
    >
      SIGN IN
    </button>
  )
}

