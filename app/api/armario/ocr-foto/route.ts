import { NextRequest, NextResponse } from 'next/server'
import { extractProdutoFromPhoto } from '@/lib/ai/extractProdutoFromPhoto'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  // Verificar autenticação via Supabase
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })

  try {
    const body = await req.json()
    const { imageBase64, mimeType } = body as { imageBase64: string; mimeType: string }

    if (!imageBase64 || !mimeType) {
      return NextResponse.json({ erro: 'Campos obrigatórios: imageBase64, mimeType' }, { status: 400 })
    }

    const produto = await extractProdutoFromPhoto(imageBase64, mimeType)
    return NextResponse.json({ produto })
  } catch (err) {
    console.error('[ocr-foto] erro:', err)
    return NextResponse.json({ produto: null, erro: 'Erro ao processar imagem' }, { status: 500 })
  }
}
