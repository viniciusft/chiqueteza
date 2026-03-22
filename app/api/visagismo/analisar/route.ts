import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
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

  const body = await req.json()
  const { foto_base64, mime_type, force } = body as {
    foto_base64: string
    mime_type: string
    force?: boolean
  }

  if (!foto_base64 || !mime_type) {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  }

  const mes = mesAtual()

  // Verificar se já tem análise este mês
  const { data: existente } = await supabase
    .from('analise_facial')
    .select('*')
    .eq('usuario_id', user.id)
    .eq('mes_referencia', mes)
    .maybeSingle()

  if (existente && !force) {
    return NextResponse.json({ analise: existente, ja_existe: true })
  }

  const supabaseAdmin = createAdminClient()

  // Se force === true e existe: deletar a anterior via admin (bypass RLS)
  if (existente && force) {
    const { error: deleteError } = await supabaseAdmin
      .from('analise_facial')
      .delete()
      .eq('id', existente.id)
    if (deleteError) console.error('[visagismo] Delete error:', deleteError)
  }

  // Criar bucket se não existir
  await supabaseAdmin.storage.createBucket('analises-faciais', {
    public: false,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    fileSizeLimit: 5242880, // 5MB
  }).catch(() => {}) // ignora se já existe

  // Limpar base64: remover prefixo data:image/...;base64, e whitespace
  let cleanBase64 = foto_base64
  if (cleanBase64.includes(',')) {
    cleanBase64 = cleanBase64.split(',')[1]
  }
  cleanBase64 = cleanBase64.replace(/[\r\n\s]/g, '')
  const buffer = Buffer.from(cleanBase64, 'base64')

  // UUID original com hífens — exatamente como vem do auth
  const fileName = `${user.id}/${Date.now()}.jpg`

  console.log('Upload attempt:', {
    fileName,
    userId: user.id,
    bufferSize: buffer.length,
    base64Length: cleanBase64.length,
  })

  let fotoUrl: string | null = null

  const { error: uploadError } = await supabaseAdmin
    .storage
    .from('analises-faciais')
    .upload(fileName, buffer, {
      contentType: 'image/jpeg',
      upsert: true,
    })

  if (uploadError) {
    console.error('Upload error detalhado:', JSON.stringify(uploadError))
    // NÃO bloquear a análise — continuar sem a foto
  } else {
    const { data: urlData } = supabaseAdmin
      .storage
      .from('analises-faciais')
      .getPublicUrl(fileName)
    fotoUrl = urlData.publicUrl
  }

  // Analisar com IA
  const analise = await analyzeVisagismo(foto_base64, mime_type)

  const { data: saved, error: dbError } = await supabase
    .from('analise_facial')
    .insert({
      usuario_id: user.id,
      formato_rosto: analise.analise_facial.formato_rosto,
      terce_dominante: analise.analise_facial.terce_dominante,
      caracteristicas_marcantes: analise.analise_facial.caracteristicas_marcantes,
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
      foto_url: fotoUrl,
      mes_referencia: mes,
    })
    .select()
    .single()

  if (dbError) {
    return NextResponse.json({ error: 'Erro ao salvar análise' }, { status: 500 })
  }

  return NextResponse.json(
    { analise: saved },
    { headers: { 'x-cache-invalidate': 'analise' } }
  )
}
