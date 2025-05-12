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
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [formLoading, setFormLoading] = useState(false)
  const [view, setView] = useState<'sign_in' | 'sign_up' | 'reset_password' | 'update_password'>('sign_in')
  const [resetEmail, setResetEmail] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmNewPassword, setConfirmNewPassword] = useState("")
  const [initialRecoveryProcessed, setInitialRecoveryProcessed] = useState(false)

  useEffect(() => {
    let mounted = true

    async function getUserSession() {
      const { data: { session } } = await supabase.auth.getSession()
      if (mounted) {
        setUser(session?.user ?? null)
      }
      setLoading(false)
    }
    getUserSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (mounted) {
        console.log("[Auth] onAuthStateChange event:", event, "session:", session);
        setUser(session?.user ?? null)

        if (event === "PASSWORD_RECOVERY" && session?.user) {
          console.log("[Auth] PASSWORD_RECOVERY event detected, switching to update_password view.");
          setView('update_password');
          setAuthUiVisible(true); // Explicitly open the auth UI
          if (typeof window !== "undefined") window.location.hash = ''; // Clear hash
        } else if (session?.user && view !== 'update_password' && event !== 'PASSWORD_RECOVERY') { 
          // If logged in normally, and not in update_password view or during recovery itself
          setAuthUiVisible(false); // Close UI on successful login/signup
        }
      }
    })
    
    // Check for password recovery token in URL hash on initial load as a fallback
    // This is mainly if onAuthStateChange doesn't fire immediately for type=recovery
    if (!initialRecoveryProcessed && typeof window !== "undefined" && !user) { // Only run once and if not already logged in
        const hash = window.location.hash;
        if (hash.includes('type=recovery') && hash.includes('access_token')) {
          console.log("[Auth] Detected type=recovery in hash on initial load. Supabase client should pick this up.");
          // The onAuthStateChange listener for PASSWORD_RECOVERY should handle the UI update.
          // We make the auth UI visible here just in case, to show any potential errors if session isn't established.
          setAuthUiVisible(true);
          setInitialRecoveryProcessed(true); // Mark as processed
        }
      }

    return () => {
      mounted = false
      subscription?.unsubscribe()
    }
  }, [view, user, initialRecoveryProcessed])

  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage("")
    setError("")
    setFormLoading(true)

    if (view === 'sign_up') {
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
    } else if (view === 'sign_in') {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) setError(signInError.message)
    }
    setFormLoading(false)
  }

  const handlePasswordResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setFormLoading(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: SITE_URL,
    });
    if (resetError) {
      setError(resetError.message);
    } else {
      setMessage("Password reset email sent! Check your inbox.");
      setResetEmail("");
    }
    setFormLoading(false);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setMessage("");
    setError("");
    setFormLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    if (updateError) {
      setError(updateError.message);
    } else {
      setMessage("Password updated successfully! Please sign in.");
      setNewPassword("");
      setConfirmNewPassword("");
      setView('sign_in');
    }
    setFormLoading(false);
  };

  const handleSignOut = async () => {
    setFormLoading(true)
    await supabase.auth.signOut()
    setUser(null)
    setAuthUiVisible(false)
    setFormLoading(false)
  }

  if (loading) {
    return (
      <button className="text-[10px] sm:text-xs text-gray-500 font-mono hover:bg-gray-100 flex items-center gap-1 px-2.5 py-1 border border-gray-200 rounded-sm transition-colors cursor-default">
        <Loader2 size={12} className="animate-spin" />
      </button>
    )
  }

  if (user) {
    return (
      <div className="relative">
        <button
          onClick={handleSignOut}
          disabled={formLoading}
          className="text-[10px] sm:text-xs text-gray-500 font-mono hover:bg-gray-100 flex items-center gap-1 px-2.5 py-1 border border-gray-200 rounded-sm transition-colors disabled:opacity-50"
          title={user.email}
        >
          {formLoading ? <Loader2 size={12} className="animate-spin" /> : <LogOut size={10} />} 
          Sign&nbsp;Out
        </button>
      </div>
    )
  }

  // Not loading, no user - show Sign In button or form
  return (
    <div className="relative">
      <button
        onClick={() => { 
          setAuthUiVisible(true); 
          setView('sign_in'); // Default to sign_in when opening
          setError("");
          setMessage("");
        }}
        className="text-[10px] sm:text-xs text-gray-500 font-mono hover:bg-gray-100 flex items-center gap-1 px-2.5 py-1 border border-gray-200 rounded-sm transition-colors"
      >
        <UserCircle2 size={10} /> Sign&nbsp;In
      </button>

      {authUiVisible && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-white border border-gray-300 rounded-sm shadow-lg p-4 z-20">
          <button onClick={() => {setAuthUiVisible(false); setView('sign_in'); setEmail(''); setPassword(''); setResetEmail(''); setNewPassword(''); setConfirmNewPassword(''); setError(""); setMessage(""); }} className="absolute top-2 right-2 text-gray-400 hover:text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>

          {view === 'reset_password' ? (
            <form onSubmit={handlePasswordResetRequest} className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-800 text-center mb-3">Reset Password</h3>
              <div>
                <input
                  id="reset-email-auth"
                  type="email"
                  placeholder="Enter your email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded-sm focus:ring-1 focus:ring-black focus:border-black text-xs placeholder-gray-400"
                />
              </div>
              <button
                type="submit"
                disabled={formLoading}
                className="w-full bg-black text-white px-3 py-1.5 rounded-sm hover:bg-gray-800 transition-colors text-xs font-mono disabled:opacity-50 flex items-center justify-center"
              >
                {formLoading ? <Loader2 size={14} className="animate-spin" /> : "Send Reset Link"}
              </button>
              {error && <p className="text-red-500 text-xs text-center pt-1">{error}</p>}
              {message && <p className="text-green-600 text-xs text-center pt-1">{message}</p>}
              <button
                type="button"
                onClick={() => { setView('sign_in'); setError(""); setMessage(""); }}
                className="mt-3 text-xs text-gray-500 hover:text-black hover:underline text-center w-full"
              >
                Back to Sign In
              </button>
            </form>
          ) : view === 'update_password' ? (
            <form onSubmit={handleUpdatePassword} className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-800 text-center mb-3">Update Password</h3>
              <div>
                <input
                  id="new-password"
                  type="password"
                  placeholder="New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded-sm focus:ring-1 focus:ring-black focus:border-black text-xs placeholder-gray-400"
                />
              </div>
              <div>
                <input
                  id="confirm-new-password"
                  type="password"
                  placeholder="Confirm New Password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  required
                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded-sm focus:ring-1 focus:ring-black focus:border-black text-xs placeholder-gray-400"
                />
              </div>
              <button
                type="submit"
                disabled={formLoading}
                className="w-full bg-black text-white px-3 py-1.5 rounded-sm hover:bg-gray-800 transition-colors text-xs font-mono disabled:opacity-50 flex items-center justify-center"
              >
                {formLoading ? <Loader2 size={14} className="animate-spin" /> : "Update Password"}
              </button>
              {error && <p className="text-red-500 text-xs text-center pt-1">{error}</p>}
              {message && <p className="text-green-600 text-xs text-center pt-1">{message}</p>}
              <button
                type="button"
                onClick={() => { setView('sign_in'); setError(""); setMessage(""); setNewPassword(''); setConfirmNewPassword('');}}
                className="mt-3 text-xs text-gray-500 hover:text-black hover:underline text-center w-full"
              >
                Back to Sign In
              </button>
            </form>
          ) : (
            <form onSubmit={handleAuthAction} className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-800 text-center mb-3">{view === 'sign_up' ? "Create Account" : "Sign In"}</h3>
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
                {formLoading ? <Loader2 size={14} className="animate-spin" /> : (view === 'sign_up' ? "Sign Up" : "Sign In")}
              </button>
              {error && <p className="text-red-500 text-xs text-center pt-1">{error}</p>}
              {message && <p className="text-green-600 text-xs text-center pt-1">{message}</p>}
              
              {view === 'sign_in' && (
                <button
                  type="button"
                  onClick={() => { setView('reset_password'); setError(""); setMessage(""); setEmail(''); setPassword(''); }}
                  className="mt-3 text-xs text-gray-500 hover:text-black hover:underline text-center w-full"
                >
                  Forgot Password?
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setView(view === 'sign_in' ? 'sign_up' : 'sign_in');
                  setError("");
                  setMessage("");
                  // Clear form fields based on the NEW view
                  if (view === 'sign_in') { // about to switch to sign_up
                    setEmail(''); setPassword('');
                  } else { // about to switch to sign_in
                    setEmail(''); setPassword('');
                  }
                  // Resetting resetEmail here if it was the active form is implicitly handled by setView not being reset_password
                }}
                className="mt-1 text-xs text-gray-500 hover:text-black hover:underline text-center w-full"
              >
                {view === 'sign_in' ? "Need an account? Sign Up" : "Already have an account? Sign In"}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  )
} 