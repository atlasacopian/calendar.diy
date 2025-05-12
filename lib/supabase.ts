"use client";

// Use the SSR helper so that the browser client automatically stores
// the access & refresh tokens in **cookies** instead of localStorage.
// This lets our Server Components / Route Handlers (which call
// `createServerClient` in `app/api/**`) authenticate the user and
// persist data to Supabase.

import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// The returned client behaves exactly like the standard `createClient`
// one, but with cookies pre-configured for SSR compatibility.
export const supabase = createBrowserClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      detectSessionInUrl: true, // Automatically exchanges the auth code in the URL for a session
      // flowType: 'pkce', // Usually default for createBrowserClient with ssr package
    },
  }
); 