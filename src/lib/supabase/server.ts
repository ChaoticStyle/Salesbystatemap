import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/** Server-side client for the auth session (cookie-based, respects RLS as the logged-in user). */
export async function createServerSupabaseClient() {
  const cookieStore = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component without a way to set cookies; safe to ignore
          // when middleware is refreshing the session.
        }
      },
    },
  });
}
