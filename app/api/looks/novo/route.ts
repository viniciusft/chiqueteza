import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { randomUUID } from 'crypto'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const body = await req.json()
  const { foto_base64, contexto, avaliacao, descricao, publico, largura, altura, aspect_ratio } = body as {
    foto_base64: string
    contexto: string | null
    avaliacao: string | null
    descricao: string | null
    publico: boolean
    largura: number | null
    altura: number | null
    aspect_ratio: number | null
  }

  if (!foto_base64) {
    return NextResponse.json({ error: 'Foto obrigatória' }, { status: 400 })
  }

  // Limpar base64
  let cleanBase64 = foto_base64
  if (cleanBase64.includes(',')) {
    cleanBase64 = cleanBase64.split(',')[1]
  }
  cleanBase64 = cleanBase64.replace(/[\r\n\s]/g, '')
  const buffer = Buffer.from(cleanBase64, 'base64')

  const fileName = `${user.id}/${randomUUID()}.jpg`
  const supabaseAdmin = createAdminClient()

  // Verificar/criar bucket se não existir
  const { data: buckets } = await supabaseAdmin.storage.listBuckets()
  const existe = buckets?.find((b) => b.name === 'looks-diario')
  if (!existe) {
    await supabaseAdmin.storage.createBucket('looks-diario', { public: true })
  }

  const { error: uploadError } = await supabaseAdmin
    .storage
    .from('looks-diario')
    .upload(fileName, buffer, {
      contentType: 'image/jpeg',
      upsert: false,
    })

  if (uploadError) {
    console.error('[looks/novo] Upload error:', uploadError)
    return NextResponse.json({ error: 'Erro ao enviar foto', details: uploadError.message }, { status: 500 })
  }

  const { data: urlData } = supabaseAdmin
    .storage
    .from('looks-diario')
    .getPublicUrl(fileName)

  const { data: saved, error: saveError } = await supabaseAdmin
    .from('looks_diario')
    .insert({
      usuario_id: user.id,
      foto_url: urlData.publicUrl,
      contexto: contexto ?? null,
      avaliacao: avaliacao ?? null,
      descricao: descricao ?? null,
      publico: publico ?? false,
      largura: largura ?? null,
      altura: altura ?? null,
      aspect_ratio: aspect_ratio ?? null,
    })
    .select()
    .single()

  if (saveError) {
    console.error('[looks/novo] Save error:', saveError.message)
    return NextResponse.json({ error: 'Erro ao salvar', details: saveError.message }, { status: 500 })
  }

  return NextResponse.json({ look: saved })
}
