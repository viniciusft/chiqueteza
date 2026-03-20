import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserPlan } from '@/lib/credits'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'nao_autenticado' }, { status: 401 })

  const [{ data: analise }, plan] = await Promise.all([
    supabase
      .from('analise_facial')
      .select('id, foto_url, dados_brutos')
      .eq('usuario_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    getUserPlan(user.id),
  ])

  return NextResponse.json({
    analise: analise ?? null,
    creditos: plan?.creditos_disponiveis ?? 0,
  })
}
