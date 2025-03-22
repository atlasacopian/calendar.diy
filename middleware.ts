import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// This middleware ensures we don't have unwanted redirects
export function middleware(request: NextRequest) {
  // Get the pathname of the request
  const { pathname } = request.nextUrl

  // If we're at the root path, ensure we don't redirect
  if (pathname === "/") {
    return NextResponse.next()
  }

  // For all other paths, proceed normally
  return NextResponse.next()
}

// Configure middleware to run on specific paths
export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images (public images folder)
     * - public files (robots.txt, sitemap.xml, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|images|robots.txt|sitemap.xml).*)",
  ],
}

