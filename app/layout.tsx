import type React from "react"
import "./globals.css"
import type { Metadata, Viewport } from "next"
import { ThemeProvider } from "@/components/theme-provider"

export const metadata: Metadata = {
  title: "calendar.diy",
  description: "A minimalist project calendar",
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    apple: "/apple-icon.png",
  },
  // Add Open Graph metadata for social sharing
  openGraph: {
    title: "calendar.diy",
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
    title: "calendar.diy",
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
    <html lang="en" suppressHydrationWarning className="light">
      <head>
        {/* Use calendar emoji as favicon */}
        <link
          rel="icon"
          href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 fontSize=%2290%22>🗓️</text></svg>"
          type="image/svg+xml"
        />

        {/* Add direct meta tags for social sharing with calendar emoji */}
        <meta
          property="og:image"
          content="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 fontSize=%2290%22>🗓️</text></svg>"
        />
        <meta
          name="twitter:image"
          content="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 fontSize=%2290%22>🗓️</text></svg>"
        />
        <meta property="og:title" content="calendar.diy" />
        <meta name="twitter:title" content="calendar.diy" />
      </head>
      <body className="bg-white transition-colors duration-200">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}

