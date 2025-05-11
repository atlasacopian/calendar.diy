import { NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { deriveKey, encryptJSON, decryptJSON } from '@/lib/crypto';

export async function POST(request: Request) {
  console.log('[API_POST] Received request to /api/calendar');
  const cookieStore = cookies();
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            // @ts-expect-error - Linter incorrectly infers cookieStore as Promise here
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            try {
              // @ts-expect-error - Linter incorrectly infers cookieStore as Promise here
              cookieStore.set({ name, value, ...options });
            } catch (error) {
              // Errors during set in Route Handlers can often be ignored
              // if middleware is handling session refresh.
            }
          },
          remove(name: string, options: CookieOptions) {
            try {
              // @ts-expect-error - Linter incorrectly infers cookieStore as Promise here
              cookieStore.set({ name, value: '', ...options });
            } catch (error) {
              // Errors during remove in Route Handlers can often be ignored.
            }
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.log('[API_POST] No user found, returning 401 Unauthorized.');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.log('[API_POST] User authenticated:', user.id);

    const body = await request.json();
    const { events, groups } = body;
    console.log('[API_POST] Received data for user:', user.id, 'Events count:', events?.length, 'Groups count:', groups?.length);
    // console.log('[API_POST] Raw body:', JSON.stringify(body, null, 2)); // Optional: for very detailed debugging

    const key = await deriveKey(user.id);
    console.log('[API_POST] Derived key for user:', user.id);
    const payload = await encryptJSON({ events, groups }, key);
    console.log('[API_POST] Encrypted payload for user:', user.id);

    const { error: upsertError } = await supabase
      .from('encrypted_calendars')
      .upsert({ user_id: user.id, payload });

    if (upsertError) {
      console.error('[API_POST] Supabase upsert error for user:', user.id, upsertError);
      return NextResponse.json({ error: 'Failed to save data to Supabase' }, { status: 500 });
    }

    console.log('[API_POST] Successfully upserted data to Supabase for user:', user.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API_POST] General error in /api/calendar POST handler:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const cookieStore = cookies();
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            // @ts-expect-error - Linter incorrectly infers cookieStore as Promise here
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            try {
              // @ts-expect-error - Linter incorrectly infers cookieStore as Promise here
              cookieStore.set({ name, value, ...options });
            } catch (error) {
            }
          },
          remove(name: string, options: CookieOptions) {
            try {
              // @ts-expect-error - Linter incorrectly infers cookieStore as Promise here
              cookieStore.set({ name, value: '', ...options });
            } catch (error) {
            }
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('encrypted_calendars')
      .select('payload')
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Error loading from Supabase:', error);
      return NextResponse.json({ error: 'Failed to load data' }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ events: [], groups: [] });
    }

    const key = await deriveKey(user.id);
    const decrypted = await decryptJSON(data.payload, key);

    return NextResponse.json(decrypted);
  } catch (error) {
    console.error('Error in GET /api/calendar:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 