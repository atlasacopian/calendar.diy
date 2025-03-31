"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Apple, LogOut, UserIcon } from "lucide-react"

export default function LoginButtons() {
  const { user, signInWithGoogle, signInWithApple, signOut } = useAuth()
  const [isOpen, setIsOpen] = useState(false)

  const handleGoogleSignIn = async () => {
    await signInWithGoogle()
    setIsOpen(false)
  }

  const handleAppleSignIn = async () => {
    await signInWithApple()
    setIsOpen(false)
  }

  const handleSignOut = async () => {
    await signOut()
  }

  if (user) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500 hidden sm:inline">
          {user.email || user.user_metadata.full_name || "Signed In"}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSignOut}
          className="flex items-center gap-1 rounded-md border border-gray-200 dark:border-gray-700 px-2 py-1 text-[10px] sm:text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <LogOut className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
          <span>SIGN OUT</span>
        </Button>
      </div>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-1 rounded-md border border-gray-200 dark:border-gray-700 px-2 py-1 text-[10px] sm:text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <UserIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
          <span>SIGN IN</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">SIGN IN (OPTIONAL)</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <p className="text-sm text-center text-gray-500">
            Sign in to sync your calendar across devices. All features are available without an account.
          </p>
          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              onClick={handleGoogleSignIn}
              className="flex items-center justify-center gap-2 w-full"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" xmlns="http://www.w3.org/2000/svg">
                <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                  <path
                    fill="#4285F4"
                    d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"
                  />
                  <path
                    fill="#34A853"
                    d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"
                  />
                  <path
                    fill="#EA4335"
                    d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"
                  />
                </g>
              </svg>
              CONTINUE WITH GOOGLE
            </Button>
            <Button
              variant="outline"
              onClick={handleAppleSignIn}
              className="flex items-center justify-center gap-2 w-full"
            >
              <Apple size={16} />
              CONTINUE WITH APPLE
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

