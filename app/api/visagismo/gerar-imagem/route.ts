import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isPremium, usarCreditos } from '@/lib/credits'
import { CREDIT_COSTS } from '@/lib/credits/costs'
import { generateVisagismoImage, type GeracaoParams } from '@/lib/ai/generateVisagismoImage'

export async function POST(req: NextRequest) {
  if (!process.env.FAL_KEY) {
    return NextResponse.json({ error: 'provider_nao_configurado' }, { status: 503 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'nao_autenticado' }, { status: 401 })

  const premium = await isPremium(user.id)
  if (!premium) return NextResponse.json({ error: 'premium_required' }, { status: 403 })

  const creditosDescontados = await usarCreditos(
    user.id,
    CREDIT_COSTS.VISAGISMO_IMAGEM,
    'VISAGISMO_IMAGEM',
    'Geração de imagem personalizada do visagismo'
  )
  if (!creditosDescontados) {
    return NextResponse.json({ error: 'sem_creditos' }, { status: 402 })
  }

  const body = await req.json() as GeracaoParams & { analise_id: string }
  const { analise_id, ...params } = body

  // Buscar foto_url da análise
  const { data: analise } = await supabase
    .from('analise_facial')
    .select('foto_url')
    .eq('id', analise_id)
    .eq('usuario_id', user.id)
    .single()

  if (!analise) return NextResponse.json({ error: 'analise_nao_encontrada' }, { status: 404 })

  // Inserir geração com status "gerando"
  const { data: geracao } = await supabase
    .from('geracoes_visagismo')
    .insert({
      usuario_id: user.id,
      analise_id,
      foto_original_url: analise.foto_url,
      batom_nome: params.batomNome ?? null,
      batom_hex: params.batomHex ?? null,
      batom_acabamento: params.batomAcabamento ?? null,
      sombra_nome: params.sombraNome ?? null,
      sombra_hex: params.sombraHex ?? null,
      blush_nome: params.blushNome ?? null,
      blush_hex: params.blushHex ?? null,
      delineado: params.delineado ?? null,
      corte_cabelo: params.corteCabelo ?? null,
      estilo_roupa: params.estiloRoupa ?? null,
      status: 'gerando',
    })
    .select('id')
    .single()

  if (!geracao) return NextResponse.json({ error: 'erro_ao_criar_geracao' }, { status: 500 })

  try {
    // Montar params com a foto original da análise
    const geracaoParams: GeracaoParams = {
      ...params,
      fotoOriginalUrl: analise.foto_url,
    }

    const imagemUrl = await generateVisagismoImage(geracaoParams)

    // Download da imagem e upload para Storage
    const imgResponse = await fetch(imagemUrl)
    const imgBuffer = await imgResponse.arrayBuffer()
    const storagePath = `${user.id}/${geracao.id}.jpg`

    const { error: uploadError } = await supabase.storage
      .from('looks-gerados')
      .upload(storagePath, imgBuffer, {
        contentType: 'image/jpeg',
        upsert: true,
      })

    if (uploadError) throw new Error(`Storage upload error: ${uploadError.message}`)

    const { data: { publicUrl } } = supabase.storage
      .from('looks-gerados')
      .getPublicUrl(storagePath)

    // Atualizar geração com url e status concluido
    await supabase
      .from('geracoes_visagismo')
      .update({ foto_gerada_url: publicUrl, status: 'concluido' })
      .eq('id', geracao.id)

    return NextResponse.json({ url: publicUrl, geracao_id: geracao.id })
  } catch (err) {
    await supabase
      .from('geracoes_visagismo')
      .update({ status: 'erro' })
      .eq('id', geracao.id)

    const message = err instanceof Error ? err.message : 'Erro interno'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
