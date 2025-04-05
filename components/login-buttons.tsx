"use client"

import { Button } from "@/components/ui/button"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"

export function LoginButtons() {
  const router = useRouter()

  const handleAppleSignIn = async () => {
    await signIn("apple", { callbackUrl: "/" })
  }

  return (
    <div className="flex justify-between w-full overflow-x-auto no-scrollbar">
      <div className="flex space-x-1">
        <Button
          variant="outline"
          size="sm"
          className="whitespace-nowrap text-xs px-2 sm:text-sm sm:px-3"
          onClick={handleAppleSignIn}
        >
          SIGN IN
        </Button>
        <Button variant="outline" size="sm" className="whitespace-nowrap text-xs px-2 sm:text-sm sm:px-3">
          RESET
        </Button>
      </div>
      <div className="flex space-x-1">
        <Button variant="outline" size="sm" className="whitespace-nowrap text-xs px-2 sm:text-sm sm:px-3">
          SCREENSHOT
        </Button>
        <Button variant="outline" size="sm" className="whitespace-nowrap text-xs px-2 sm:text-sm sm:px-3">
          ICAL
        </Button>
        <Button variant="outline" size="sm" className="whitespace-nowrap text-xs px-2 sm:text-sm sm:px-3">
          GOOGLE
        </Button>
        <Button variant="outline" size="sm" className="whitespace-nowrap text-xs px-2 sm:text-sm sm:px-3">
          SHARE
        </Button>
      </div>
    </div>
  )
}

