import type React from "react"
import "./globals.css"
import type { Metadata, Viewport } from "next"

export const metadata: Metadata = {
  title: "calendar.diy",
  description: "A minimalist project calendar",
  icons: {
    icon: "/favicon.svg",
    apple: "/apple-icon.png",
  },
}

// Update the viewport settings in layout.tsx to prevent zooming
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  minimumScale: 1,
  userScalable: false,
  viewportFit: "cover",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

