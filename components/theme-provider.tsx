"use client"

import type * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

type ThemeProviderProps = {
  children: React.ReactNode
  attribute?: string
  defaultTheme?: string
}

export function ThemeProvider({ children, attribute = "class", defaultTheme = "system" }: ThemeProviderProps) {
  return (
    <NextThemesProvider attribute={attribute} defaultTheme={defaultTheme}>
      {children}
    </NextThemesProvider>
  )
}

