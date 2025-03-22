import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Project Calendar',
  description: 'A minimalist project calendar',
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
