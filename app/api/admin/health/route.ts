import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// GET /api/admin/health
// Retorna status das variáveis de ambiente (booleano — NUNCA retorna valores)
// e contadores básicos do Supabase.
// Protegido: requer sessão válida.
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })
  }

  // ─── Env vars (boolean apenas) ────────────────────────────────────
  const env = {
    // Supabase
    SUPABASE_SERVICE_ROLE_KEY:           !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    // Mercado Livre
    ML_APP_ID:                           !!process.env.ML_APP_ID,
    ML_APP_SECRET:                       !!process.env.ML_APP_SECRET,
    ML_REFRESH_TOKEN:                    !!process.env.ML_REFRESH_TOKEN,
    ML_AFFILIATE_TRACKING_ID:            !!process.env.ML_AFFILIATE_TRACKING_ID,
    ML_AFFILIATE_WORD:                   !!process.env.ML_AFFILIATE_WORD,
    // IA
    GEMINI_API_KEY:                      !!process.env.GEMINI_API_KEY,
    FAL_KEY:                             !!process.env.FAL_KEY,
    // Push Notifications
    VAPID_PRIVATE_KEY:                   !!process.env.VAPID_PRIVATE_KEY,
    // Inngest
    INNGEST_EVENT_KEY:                   !!process.env.INNGEST_EVENT_KEY,
    INNGEST_SIGNING_KEY:                 !!process.env.INNGEST_SIGNING_KEY,
  }

  // ─── Stats do banco ────────────────────────────────────────────────
  const [
    { count: wishlist },
    { count: armario },
    { count: analises },
    { count: agendamentos },
    { count: rotinas },
    { count: looks },
    { count: profissionais },
    { count: pushSubs },
  ] = await Promise.all([
    supabase.from('wishlist_produtos').select('*', { count: 'exact', head: true }),
    supabase.from('armario_produtos').select('*', { count: 'exact', head: true }),
    supabase.from('analise_facial').select('*', { count: 'exact', head: true }),
    supabase.from('agendamentos_rotina').select('*', { count: 'exact', head: true }),
    supabase.from('checklist_rotinas').select('*', { count: 'exact', head: true }),
    supabase.from('looks_diario').select('*', { count: 'exact', head: true }),
    supabase.from('profissionais').select('*', { count: 'exact', head: true }),
    supabase.from('push_subscriptions').select('*', { count: 'exact', head: true }),
  ])

  return NextResponse.json({
    env,
    stats: { wishlist, armario, analises, agendamentos, rotinas, looks, profissionais, pushSubs },
    timestamp: new Date().toISOString(),
  })
}
