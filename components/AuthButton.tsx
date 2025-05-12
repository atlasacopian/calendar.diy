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
  const [isProcessingRecovery, setIsProcessingRecovery] = useState(false)

  useEffect(() => {
    let mounted = true

    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) {
        setUser(session?.user ?? null)
        console.log("[Auth InitialGetSession] User:", session?.user?.id || "null")
      }
      setLoading(false)
    })

    // 2. Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return
      
      console.log("[Auth onAuthStateChange] Event:", event, "Session User ID:", session?.user?.id, "Current View:", view)
      setUser(session?.user ?? null)

      if (event === "PASSWORD_RECOVERY") {
        console.log("[Auth] PASSWORD_RECOVERY event received.")
        setIsProcessingRecovery(true)
        if (session?.user) {
          console.log("[Auth] User session IS PRESENT with PASSWORD_RECOVERY. Setting view to update_password.")
          setView('update_password')
          setAuthUiVisible(true)
          if (typeof window !== "undefined") {
            window.history.replaceState({}, document.title, window.location.pathname + window.location.search.replace(/code=[^&]+&?/, '').replace(/type=recovery&?/, '').replace(/&$/, '').replace(/\?$/, ''))
          }
        } else {
          console.warn("[Auth] PASSWORD_RECOVERY event but NO user session initially. Attempting getUser().")
          const { data: { user: userFromGetAfterRecoveryEvent } } = await supabase.auth.getUser()
          if (mounted && userFromGetAfterRecoveryEvent) {
            console.log("[Auth] Got user via getUser() after PASSWORD_RECOVERY event. Setting view to update_password.")
            setUser(userFromGetAfterRecoveryEvent)
            setView('update_password')
            setAuthUiVisible(true)
            if (typeof window !== "undefined") {
              window.history.replaceState({}, document.title, window.location.pathname + window.location.search.replace(/code=[^&]+&?/, '').replace(/type=recovery&?/, '').replace(/&$/, '').replace(/\?$/, ''))
            }
          } else if (mounted) {
            console.error("[Auth] Still no user after PASSWORD_RECOVERY and explicit getUser(). Cannot proceed with password update form.")
            setError("Password recovery session invalid or expired. Please try again.")
            setView('sign_in')
            setAuthUiVisible(true)
            setIsProcessingRecovery(false)
          }
        }
      } else if (event === "SIGNED_IN") {
        console.log("[Auth] SIGNED_IN event. Current view:", view, "isProcessingRecovery:", isProcessingRecovery)
        if (view !== 'update_password' && !isProcessingRecovery) {
          setAuthUiVisible(false)
          console.log("[Auth] SIGNED_IN: Auth UI hidden.")
        }
      } else if (event === "SIGNED_OUT") {
        console.log("[Auth] SIGNED_OUT event detected. Resetting view and recovery flag.")
        setView('sign_in')
        setAuthUiVisible(false)
        setIsProcessingRecovery(false)
      }
    })

    // 3. Check hash on initial load for recovery (Supabase client should handle this by firing PASSWORD_RECOVERY)
    if (typeof window !== "undefined" && !isProcessingRecovery && !user) {
      const currentUrl = new URL(window.location.href);
      const code = currentUrl.searchParams.get('code');
      const type = currentUrl.searchParams.get('type');

      if (code && type === 'recovery') {
        console.log("[Auth InitialUrlCheck] Found 'code' and 'type=recovery' in query. Supabase client will process this. Setting isProcessingRecovery.")
        setIsProcessingRecovery(true)
        // The onAuthStateChange listener for PASSWORD_RECOVERY should handle the UI switch after client processes the code.
      }
    }

    return () => {
      mounted = false
      subscription?.unsubscribe()
    }
  }, [isProcessingRecovery, user, view])

  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage("")
    setError("")
    setFormLoading(true)

    if (!email && (view === 'sign_in' || view === 'sign_up')) { // email check for signin/signup
      setError("Please enter your email address.");
      setFormLoading(false);
      return;
    }
    if (email && !/\S+@\S+\.\S+/.test(email) && (view === 'sign_in' || view === 'sign_up')) {
      setError("Please enter a valid email address.");
      setFormLoading(false);
      return;
    }
    if (!password && (view === 'sign_in' || view === 'sign_up')) {
      setError("Please enter your password.");
      setFormLoading(false);
      return;
    }
    if (view === 'sign_up' && password.length < 6) {
        setError("Password must be at least 6 characters.");
        setFormLoading(false);
        return;
    }

    setFormLoading(true);

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

    if (!resetEmail) {
      setError("Please enter your email address to reset password.");
      setFormLoading(false);
      return;
    }
    if (!/\S+@\S+\.\S+/.test(resetEmail)) {
      setError("Please enter a valid email address.");
      setFormLoading(false);
      return;
    }

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
    setMessage(""); // Clear previous success message too
    if (!newPassword || !confirmNewPassword) {
      setError("Please fill out both password fields.");
      setFormLoading(false); // ensure formLoading is reset
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError("Passwords do not match.");
      setFormLoading(false);
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      setFormLoading(false);
      return;
    }
    setError("");
    setFormLoading(true);
    const { data: updateData, error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    if (updateError) {
      setError(updateError.message);
    } else {
      console.log("[Auth] Password updated successfully via updateUser. Data:", updateData);
      setMessage("Password updated successfully! Please sign in.");
      setNewPassword("");
      setConfirmNewPassword("");
      setView('sign_in');
      setIsProcessingRecovery(false);
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
          setView('sign_in');
          setError("");
          setMessage("");
          // Clear all form fields on open
          setEmail('');
          setPassword('');
          setResetEmail('');
          setNewPassword('');
          setConfirmNewPassword('');
        }}
        className="text-[10px] sm:text-xs text-gray-500 font-mono hover:bg-gray-100 flex items-center gap-1 px-2.5 py-1 border border-gray-200 rounded-sm transition-colors"
      >
        <UserCircle2 size={10} /> Sign&nbsp;In
      </button>

      {authUiVisible && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-white border border-gray-300 rounded-sm shadow-lg p-4 z-20">
          <button 
            onClick={() => {
              setAuthUiVisible(false); 
              setView('sign_in'); 
              setError(""); setMessage("");
              // Clear all form fields on close
              setEmail(''); setPassword(''); setResetEmail(''); setNewPassword(''); setConfirmNewPassword('');
            }} 
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>

          {view === 'reset_password' ? (
            <form onSubmit={handlePasswordResetRequest} className="space-y-3" noValidate>
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
                onClick={() => { setView('sign_in'); setError(""); setMessage(""); setResetEmail(''); }}
                className="mt-3 text-xs text-gray-500 hover:text-black hover:underline text-center w-full"
              >
                Back to Sign In
              </button>
            </form>
          ) : view === 'update_password' ? (
            <form onSubmit={handleUpdatePassword} className="space-y-3" noValidate>
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
            <form onSubmit={handleAuthAction} className="space-y-3" noValidate>
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
                  setError(""); setMessage(""); 
                  // Clear ALL form fields on main toggle for simplicity and to satisfy linter
                  setEmail(''); 
                  setPassword('');
                  setResetEmail(''); 
                  setNewPassword(''); 
                  setConfirmNewPassword('');
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