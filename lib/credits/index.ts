import { createClient } from '@/lib/supabase/server'

function mesAtual(): string {
  const hoje = new Date()
  return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`
}

interface PlanData {
  plano_id: string
  creditos_disponiveis: number
  mes_referencia: string
}

export async function getUserPlan(userId: string): Promise<PlanData | null> {
  const supabase = await createClient()
  const mes = mesAtual()

  const { data: existing } = await supabase
    .from('creditos_usuarios')
    .select('plano_id, creditos_disponiveis, mes_referencia')
    .eq('usuario_id', userId)
    .eq('mes_referencia', mes)
    .maybeSingle()

  if (existing) return existing

  const { data: novo } = await supabase
    .from('creditos_usuarios')
    .insert({ usuario_id: userId, mes_referencia: mes, plano_id: 'free', creditos_disponiveis: 0 })
    .select('plano_id, creditos_disponiveis, mes_referencia')
    .single()

  return novo
}

export async function isPremium(userId: string): Promise<boolean> {
  const plan = await getUserPlan(userId)
  return plan?.plano_id === 'premium'
}

export async function usarCreditos(
  userId: string,
  quantidade: number,
  feature: string,
  descricao: string
): Promise<boolean> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('usar_creditos', {
    p_usuario_id: userId,
    p_quantidade: quantidade,
    p_feature: feature,
    p_descricao: descricao,
  })
  return !error && data === true
}
