import { createClient } from '@supabase/supabase-js'

/**
 * Cliente admin com service role key — usar APENAS em route handlers server-side.
 * NUNCA expor no frontend.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
