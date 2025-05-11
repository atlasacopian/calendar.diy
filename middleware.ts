import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// This middleware ensures we don't have unwanted redirects
export async function middleware(request: NextRequest) {
  console.log('[MW_DIAGNOSTIC] Middleware triggered for path:', request.nextUrl.pathname);
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Log incoming cookies
  const incomingCookies: { [key: string]: string } = {};
  request.cookies.getAll().forEach(cookie => { incomingCookies[cookie.name] = cookie.value; });
  console.log('[MW_DIAGNOSTIC] Initial request cookies:', JSON.stringify(incomingCookies));

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          const cookie = request.cookies.get(name)?.value;
          // console.log(`[MW_COOKIE_GET] Name: ${name}, Value: ${cookie ? "<found>" : "<not_found>"}`);
          return cookie;
        },
        set(name: string, value: string, options: CookieOptions) {
          // console.log(`[MW_COOKIE_SET] Name: ${name}, Value: ${value ? "<value_set>" : "<value_empty>"}, Options:`, options);
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          // console.log(`[MW_COOKIE_REMOVE] Name: ${name}, Options:`, options);
          request.cookies.set({ name, value: '', ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  console.log('[MW_DIAGNOSTIC] Attempting to get session...');
  const { data: { session } } = await supabase.auth.getSession();

  if (session) {
    console.log('[MW_DIAGNOSTIC] Supabase session FOUND in middleware for user:', session.user.id);
  } else {
    console.log('[MW_DIAGNOSTIC] Supabase session NOT FOUND in middleware.');
  }
  
  // Log outgoing cookies before returning response
  const outgoingCookies: { [key: string]: string } = {};
  response.cookies.getAll().forEach(cookie => { outgoingCookies[cookie.name] = cookie.value; });
  console.log('[MW_DIAGNOSTIC] Response cookies BEFORE returning:', JSON.stringify(outgoingCookies));

  return response;
}

// Configure middleware to run on specific paths
export const config = {
  matcher: '/:path*', // DIAGNOSTIC: Match EVERYTHING
}

