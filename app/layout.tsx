import type React from "react"
import "./globals.css"
import type { Metadata, Viewport } from "next"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/lib/auth-context"
import { JetBrains_Mono } from "next/font/google"

const jetBrainsMono = JetBrains_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Free Calendar Template",
  description:
    "A clean, free, editable calendar you can use instantly. No account. No clutter. Just a simple calendar for your projects, schedules, or planning.",
  metadataBase: new URL("http://localhost:3000"),
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-icon.png",
  },
  // Add Open Graph metadata for social sharing
  openGraph: {
    title: "Free Calendar Template",
    description:
      "Plan your time without the clutter. A simple, free calendar you can type into, save, or print. No account needed.",
    url: "http://localhost:3000",
    siteName: "calendar.diy",
    images: [
      {
        url: "/calendar_og.jpg",
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
    title: "Free Calendar Template",
    description:
      "Plan your time without the clutter. A simple, free calendar you can type into, save, or print. No account needed.",
    images: ["/calendar_og.jpg"],
  },
  robots: "index, follow",
  // Explicitly disable AMP
  alternates: {
    canonical: "http://localhost:3000",
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
        <link rel="canonical" href="http://localhost:3000" />
        <title>Free Calendar Template</title>

        {/* Add direct meta tags for social sharing with calendar emoji */}
        <meta property="og:title" content="calendar.diy — Your Free Calendar" />
        <meta
          property="og:description"
          content="Plan your time without the clutter. A simple, free calendar you can type into, save, or print. No account needed."
        />
        <meta property="og:image" content="/calendar_og.jpg" />
        <meta property="og:url" content="http://localhost:3000" />
        <meta property="og:type" content="website" />

        {/* Explicitly disable AMP */}
        <meta name="google" content="notranslate" />
        <meta name="apple-signin-client-id" content="[YOUR_CLIENT_ID]" />
        <meta name="apple-signin-scope" content="name email" />
        <meta name="apple-signin-redirect-uri" content="https://your-domain.com/callback" />
        <meta name="apple-signin-state" content="origin:web" />
        <script type="text/javascript" src="https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js"></script>
      </head>
      <body className="bg-white transition-colors duration-200">
        {/* Visually hidden content for SEO */}
        <h1 className="sr-only">Editable Calendar – No Signup</h1>
        <p className="sr-only">A simple, editable calendar you can use instantly. Free forever, no account required.</p>

        <AuthProvider>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
            {children}
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  )
}

