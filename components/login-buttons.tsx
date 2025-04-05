"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useSession, signOut } from "next-auth/react"
import Link from "next/link"
import { Icons } from "./icons"

export function LoginButtons() {
  const { data: session } = useSession()

  if (!session) {
    return (
      <div className="flex justify-between w-full overflow-x-auto no-scrollbar">
        <Button asChild className="whitespace-nowrap text-xs px-2 sm:text-sm sm:px-3">
          <Link href="/login">Sign In</Link>
        </Button>
        <Button asChild variant="secondary" className="whitespace-nowrap text-xs px-2 sm:text-sm sm:px-3">
          <Link href="/register">Register</Link>
        </Button>
      </div>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary">{session?.user?.name || session?.user?.email}</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-48" align="end" forceMount>
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile">Profile</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/dashboard">Dashboard</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => {
            signOut()
          }}
          className="cursor-pointer"
        >
          Sign out
          <Icons.logout className="ml-auto h-4 w-4" />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

