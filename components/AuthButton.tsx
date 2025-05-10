"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import type { User } from "@supabase/supabase-js"
import { Loader2, LogOut, UserCircle2 } from "lucide-react"

const SITE_URL = "https://calendar.diy";

export default function AuthButton() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [authUiVisible, setAuthUiVisible] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isSignUp, setIsSignUp] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [formLoading, setFormLoading] = useState(false)

  useEffect(() => {
    let mounted = true

    async function getUserSession() {
      const { data: { session } } = await supabase.auth.getSession()
      if (mounted && session) {
        setUser(session.user)
      }
      setLoading(false)
    }
    getUserSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setUser(session?.user ?? null)
        if (session?.user) setAuthUiVisible(false) // Close UI on successful login/signup
      }
    })

    return () => {
      mounted = false
      subscription?.unsubscribe()
    }
  }, [])

  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage("")
    setError("")
    setFormLoading(true)

    if (isSignUp) {
      alert("EMAIL REDIRECT TO: " + SITE_URL);
      console.log("EMAIL REDIRECT TO:", SITE_URL);
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: SITE_URL,
        },
      })
      if (signUpError) setError(signUpError.message)
      else if (data.user && data.user.identities?.length === 0) {
        setMessage("Please check your email to confirm your account.")
        setEmail("")
        setPassword("")
      } else if (data.user) {
        setMessage("Sign up successful! Check your email to confirm your account.")
        setEmail("")
        setPassword("")
      } else {
        setMessage("Sign up request sent. Check your email to confirm your account.")
        setEmail("")
        setPassword("")
      }
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) setError(signInError.message)
      // User state will be updated by onAuthStateChange, which closes the UI
    }
    setFormLoading(false)
  }

  const handleSignOut = async () => {
    setFormLoading(true)
    await supabase.auth.signOut()
    setUser(null)
    setAuthUiVisible(false)
    setFormLoading(false)
  }

  if (loading) {
    return (
      <button className="text-[10px] sm:text-xs text-gray-500 font-mono hover:bg-gray-100 flex items-center gap-1 px-2 py-1 border border-gray-200 rounded-sm transition-colors cursor-default">
        <Loader2 size={14} className="animate-spin" />
      </button>
    )
  }

  if (user) {
    return (
      <div className="relative">
        <button
          onClick={handleSignOut}
          disabled={formLoading}
          className="text-[10px] sm:text-xs text-gray-500 font-mono hover:bg-gray-100 flex items-center gap-1.5 pl-2 pr-2.5 py-1 border border-gray-200 rounded-sm transition-colors disabled:opacity-50"
          title={user.email}
        >
          {formLoading ? <Loader2 size={14} className="animate-spin" /> : <LogOut size={12} />} 
          Sign&nbsp;Out
        </button>
      </div>
    )
  }

  // Not loading, no user - show Sign In button or form
  return (
    <div className="relative">
      <button
        onClick={() => setAuthUiVisible(!authUiVisible)}
        className="text-[10px] sm:text-xs text-gray-500 font-mono hover:bg-gray-100 flex items-center gap-1.5 pl-2 pr-2.5 py-1 border border-gray-200 rounded-sm transition-colors"
      >
        <UserCircle2 size={12} /> Sign&nbsp;In
      </button>

      {authUiVisible && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-white border border-gray-300 rounded-sm shadow-lg p-4 z-20">
          <button onClick={() => setAuthUiVisible(false)} className="absolute top-2 right-2 text-gray-400 hover:text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
          <form onSubmit={handleAuthAction} className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-800 text-center mb-3">{isSignUp ? "Create Account" : "Sign In"}</h3>
            <div>
              <input
                id="email-auth"
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-2.5 py-1.5 border border-gray-300 rounded-sm focus:ring-1 focus:ring-black focus:border-black text-xs placeholder-gray-400"
              />
            </div>
            <div>
              <input
                id="password-auth"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-2.5 py-1.5 border border-gray-300 rounded-sm focus:ring-1 focus:ring-black focus:border-black text-xs placeholder-gray-400"
              />
            </div>
            <button
              type="submit"
              disabled={formLoading}
              className="w-full bg-black text-white px-3 py-1.5 rounded-sm hover:bg-gray-800 transition-colors text-xs font-mono disabled:opacity-50 flex items-center justify-center"
            >
              {formLoading ? <Loader2 size={14} className="animate-spin" /> : (isSignUp ? "Sign Up" : "Sign In")}
            </button>
            {error && <p className="text-red-500 text-xs text-center pt-1">{error}</p>}
            {message && <p className="text-green-600 text-xs text-center pt-1">{message}</p>}
          </form>
          <button
            onClick={() => {
              setIsSignUp(!isSignUp)
              setError("")
              setMessage("")
            }}
            className="mt-3 text-xs text-gray-500 hover:text-black hover:underline text-center w-full"
          >
            {isSignUp ? "Already have an account? Sign In" : "Need an account? Sign Up"}
          </button>
        </div>
      )}
    </div>
  )
} 