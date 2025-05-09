# Supabase Environment Variables

Add the two public variables below to your deployment platform (Vercel, Netlify, etc.) **and** in a local `.env.local` file when running locally.

```
NEXT_PUBLIC_SUPABASE_URL="https://xxxxxxxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1..."
```

Steps (Vercel)
1. Project → Settings → Environment Variables → **Add**
2. Name: `NEXT_PUBLIC_SUPABASE_URL`, Value: your project URL, Environment: *All* → Add
3. Name: `NEXT_PUBLIC_SUPABASE_ANON_KEY`, Value: anon key, Environment: *All* → Add
4. Trigger a redeploy.

Locally, create a file called `.env.local` at the repo root with the same lines and restart `npm run dev`. 