"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onLogin: (email: string, password: string) => Promise<void>
  onSignup: (email: string, password: string) => Promise<void>
  onGoogleLogin: () => Promise<void>
}

export default function AuthModal({ isOpen, onClose, onLogin, onSignup, onGoogleLogin }: AuthModalProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState("login")

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please enter both email and password")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      await onLogin(email, password)
      onClose()
    } catch (err) {
      setError("Invalid email or password")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignup = async () => {
    if (!email || !password) {
      setError("Please enter both email and password")
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      await onSignup(email, password)
      onClose()
    } catch (err) {
      setError("Failed to create account. Email may already be in use.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    setError("")

    try {
      await onGoogleLogin()
      onClose()
    } catch (err) {
      setError("Google login failed")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-mono text-sm font-light">ACCOUNT ACCESS</DialogTitle>
        </DialogHeader>

        <div className="w-full" data-tabs data-active-tab={activeTab}>
          <div className="grid w-full grid-cols-2 mb-4">
            <button
              className={`text-xs py-2 ${activeTab === "login" ? "border-b-2 border-primary" : "border-b border-gray-200 dark:border-gray-700 text-muted-foreground"}`}
              onClick={() => setActiveTab("login")}
            >
              LOGIN
            </button>
            <button
              className={`text-xs py-2 ${activeTab === "signup" ? "border-b-2 border-primary" : "border-b border-gray-200 dark:border-gray-700 text-muted-foreground"}`}
              onClick={() => setActiveTab("signup")}
            >
              SIGNUP
            </button>
          </div>

          {activeTab === "login" && (
            <div className="mt-4">
              <div className="flex flex-col gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email" className="text-xs">
                    EMAIL
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="text-xs"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="password" className="text-xs">
                    PASSWORD
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="text-xs"
                  />
                </div>

                {error && <p className="text-xs text-red-500">{error}</p>}

                <Button onClick={handleLogin} disabled={isLoading} className="text-xs">
                  {isLoading ? "LOGGING IN..." : "LOGIN"}
                </Button>

                <div className="relative my-2">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-200 dark:border-gray-700" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-background px-2 text-muted-foreground">OR</span>
                  </div>
                </div>

                <Button variant="outline" onClick={handleGoogleLogin} disabled={isLoading} className="text-xs">
                  CONTINUE WITH GOOGLE
                </Button>
              </div>
            </div>
          )}

          {activeTab === "signup" && (
            <div className="mt-4">
              <div className="flex flex-col gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="signup-email" className="text-xs">
                    EMAIL
                  </Label>
                  <Input
                    id="signup-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="text-xs"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="signup-password" className="text-xs">
                    PASSWORD
                  </Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="text-xs"
                  />
                </div>

                {error && <p className="text-xs text-red-500">{error}</p>}

                <Button onClick={handleSignup} disabled={isLoading} className="text-xs">
                  {isLoading ? "CREATING ACCOUNT..." : "CREATE ACCOUNT"}
                </Button>

                <div className="relative my-2">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-200 dark:border-gray-700" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-background px-2 text-muted-foreground">OR</span>
                  </div>
                </div>

                <Button variant="outline" onClick={handleGoogleLogin} disabled={isLoading} className="text-xs">
                  SIGN UP WITH GOOGLE
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

