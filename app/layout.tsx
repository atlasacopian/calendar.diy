import type React from "react"
import "./globals.css"
import type { Metadata, Viewport } from "next"
import { ThemeProvider } from "@/components/theme-provider"

export const metadata: Metadata = {
  title: "Free Editable Calendar Template – No Signup | calendar.diy",
  description:
    "A clean, free, editable calendar you can use instantly. No account. No clutter. Just a simple calendar for your projects, schedules, or planning.",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-icon.png",
  },
  // Add Open Graph metadata for social sharing
  openGraph: {
    title: "calendar.diy — Your Free Editable Calendar",
    description:
      "Plan your time without the clutter. A simple, free calendar you can type into, save, or print. No account needed.",
    url: "https://calendar.diy",
    siteName: "calendar.diy",
    images: [
      {
        url: "https://calendar.diy/calendar_og.jpg",
        width: 1200,
        height: 630,
        alt: "calendar.diy - A minimalist project calendar",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  // Add Twitter card metadata
  twitter: {
    card: "summary",
    title: "calendar.diy — Your Free Editable Calendar",
    description:
      "Plan your time without the clutter. A simple, free calendar you can type into, save, or print. No account needed.",
    images: ["https://calendar.diy/calendar_og.jpg"],
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
    <html lang="en" suppressHydrationWarning className="light">
      <head>
        {/* Use calendar emoji as favicon - with Apple-style emoji */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-icon.png" />

        {/* Add direct meta tags for social sharing with calendar emoji */}
        <meta property="og:title" content="calendar.diy — Your Free Editable Calendar" />
        <meta
          property="og:description"
          content="Plan your time without the clutter. A simple, free calendar you can type into, save, or print. No account needed."
        />
        <meta property="og:image" content="https://calendar.diy/calendar_og.jpg" />
        <meta property="og:url" content="https://calendar.diy" />
        <meta property="og:type" content="website" />
      </head>
      <body className="bg-white transition-colors duration-200">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}

