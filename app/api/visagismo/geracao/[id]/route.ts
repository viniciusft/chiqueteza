import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'nao_autenticado' }, { status: 401 })

  const { data: geracao } = await supabase
    .from('geracoes_visagismo')
    .select('id, foto_original_url, foto_gerada_url, batom_nome, batom_hex, sombra_nome, blush_nome, delineado, corte_cabelo, estilo_roupa, status')
    .eq('id', id)
    .eq('usuario_id', user.id)
    .single()

  if (!geracao) return NextResponse.json({ error: 'nao_encontrada' }, { status: 404 })

  return NextResponse.json({ geracao })
}
