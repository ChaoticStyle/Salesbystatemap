import 'server-only';
import { createClient } from '@supabase/supabase-js';

/**
 * Service-role client: bypasses RLS entirely. Only ever import this from
 * server-only code (API routes) that has already verified the caller is an
 * authenticated admin -- never expose this key or client to the browser.
 */
export function createServiceRoleClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

const ADMIN_EMAILS = new Set(
  (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean),
);

/** Defense-in-depth: even a valid logged-in session must also match this allowlist to perform admin writes. */
export function isAdminEmail(email: string | null | undefined): boolean {
  return !!email && ADMIN_EMAILS.has(email.toLowerCase());
}
