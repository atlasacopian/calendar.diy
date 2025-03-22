import type React from "react"
import "./globals.css"
import type { Metadata, Viewport } from "next"

export const metadata: Metadata = {
  title: "🗓️ calendar.diy",
  description: "A minimalist project calendar",
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    apple: "/apple-icon.png",
  },
  // Add Open Graph metadata for social sharing
  openGraph: {
    title: "🗓️ calendar.diy",
    description: "A minimalist project calendar",
    url: "https://calendar.diy",
    siteName: "calendar.diy",
    images: [
      {
        url: "/og-image.png",
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
    title: "🗓️ calendar.diy",
    description: "A minimalist project calendar",
    images: ["/favicon.svg"],
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
      <head>
        {/* Force favicon refresh with a timestamp query parameter */}
        <link rel="icon" href={`/favicon.svg?v=${Date.now()}`} type="image/svg+xml" />
        <link rel="apple-touch-icon" href={`/apple-icon.png?v=${Date.now()}`} />

        {/* Add direct meta tags for social sharing with calendar emoji */}
        <meta property="og:image" content="/favicon.svg" />
        <meta name="twitter:image" content="/favicon.svg" />
        <meta property="og:title" content="🗓️ calendar.diy" />
        <meta name="twitter:title" content="🗓️ calendar.diy" />
      </head>
      <body>{children}</body>
    </html>
  )
}

