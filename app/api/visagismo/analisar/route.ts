import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { analyzeVisagismo } from '@/lib/ai/analyzeVisagismo'

function mesAtual(): string {
  const hoje = new Date()
  return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const mes = mesAtual()

  // Verificar se já tem análise este mês
  const { data: existente } = await supabase
    .from('analise_facial')
    .select('*')
    .eq('usuario_id', user.id)
    .eq('mes_referencia', mes)
    .maybeSingle()

  if (existente) {
    return NextResponse.json({ ja_existe: true, analise: existente })
  }

  const body = await req.json()
  const { foto_base64, mime_type } = body as { foto_base64: string; mime_type: string }

  if (!foto_base64 || !mime_type) {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  }

  const analise = await analyzeVisagismo(foto_base64, mime_type)

  const { data: saved, error: dbError } = await supabase
    .from('analise_facial')
    .insert({
      usuario_id: user.id,
      formato_rosto: analise.analise_facial.formato_rosto,
      subtom: analise.colorimetria.subtom,
      estacao: analise.colorimetria.estacao,
      paleta_cores: analise.paleta_cores.cores_ideais,
      cores_evitar: analise.paleta_cores.cores_evitar,
      tons_batom: analise.maquiagem.batom,
      tons_sombra: analise.maquiagem.sombra,
      tons_blush: analise.maquiagem.blush,
      estilos_delineado: analise.maquiagem.delineado.formatos_recomendados,
      formatos_corte_recomendados: analise.cabelo.cortes_recomendados,
      relatorio_texto: analise.relatorio.resumo_perfil,
      dados_brutos: analise,
      mes_referencia: mes,
    })
    .select()
    .single()

  if (dbError) {
    return NextResponse.json({ error: 'Erro ao salvar análise' }, { status: 500 })
  }

  return NextResponse.json({ analise: saved })
}
