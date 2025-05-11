import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { deriveKey, encryptJSON, decryptJSON } from '@/lib/crypto';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            // Ignore cookie setting in API routes
          },
          remove(name: string, options: any) {
            // Ignore cookie removal in API routes
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { events, groups } = body;

    const key = await deriveKey(user.id);
    const payload = await encryptJSON({ events, groups }, key);

    const { error } = await supabase
      .from('encrypted_calendars')
      .upsert({ user_id: user.id, payload });

    if (error) {
      console.error('Error saving to Supabase:', error);
      return NextResponse.json({ error: 'Failed to save data' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in POST /api/calendar:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            // Ignore cookie setting in API routes
          },
          remove(name: string, options: any) {
            // Ignore cookie removal in API routes
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