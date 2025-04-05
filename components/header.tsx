"use client"

import { Button } from "@/components/ui/button"
import { Camera, Calendar, Share2 } from "lucide-react"
import { signIn } from "next-auth/react"

export default function Header() {
  const handleAppleSignIn = async () => {
    await signIn("apple", { callbackUrl: "/" })
  }

  return (
    <div className="flex flex-row items-center justify-between w-full overflow-x-auto py-2 no-scrollbar">
      <div className="flex space-x-1">
        <Button variant="outline" size="sm" className="whitespace-nowrap text-xs px-2" onClick={handleAppleSignIn}>
          SIGN IN
        </Button>
        <Button variant="outline" size="sm" className="whitespace-nowrap text-xs px-2">
          RESET
        </Button>
      </div>
      <div className="flex space-x-1">
        <Button variant="outline" size="sm" className="whitespace-nowrap text-xs px-2">
          <Camera className="h-3 w-3 mr-1" />
          <span className="hidden xs:inline">SCREENSHOT</span>
        </Button>
        <Button variant="outline" size="sm" className="whitespace-nowrap text-xs px-2">
          <Calendar className="h-3 w-3 mr-1" />
          <span className="hidden xs:inline">ICAL</span>
        </Button>
        <Button variant="outline" size="sm" className="whitespace-nowrap text-xs px-2">
          <Calendar className="h-3 w-3 mr-1" />
          <span className="hidden xs:inline">GOOGLE</span>
        </Button>
        <Button variant="outline" size="sm" className="whitespace-nowrap text-xs px-2">
          <Share2 className="h-3 w-3 mr-1" />
          <span className="hidden xs:inline">SHARE</span>
        </Button>
      </div>
    </div>
  )
}

