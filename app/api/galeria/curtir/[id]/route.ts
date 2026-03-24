import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { id: lookId } = await params
  const supabaseAdmin = createAdminClient()

  // Verificar se já curtiu
  const { data: existente } = await supabase
    .from('looks_curtidas')
    .select('id')
    .eq('look_id', lookId)
    .eq('usuario_id', user.id)
    .maybeSingle()

  // Buscar curtidas atuais
  const { data: look } = await supabaseAdmin
    .from('looks_diario')
    .select('curtidas')
    .eq('id', lookId)
    .single()

  const curtidas = look?.curtidas ?? 0

  if (existente) {
    // Descurtir
    await supabaseAdmin
      .from('looks_curtidas')
      .delete()
      .eq('id', existente.id)

    const novasCurtidas = Math.max(0, curtidas - 1)
    await supabaseAdmin
      .from('looks_diario')
      .update({ curtidas: novasCurtidas })
      .eq('id', lookId)

    return NextResponse.json({ curtido: false, curtidas: novasCurtidas })
  } else {
    // Curtir
    await supabaseAdmin
      .from('looks_curtidas')
      .insert({ look_id: lookId, usuario_id: user.id })

    const novasCurtidas = curtidas + 1
    await supabaseAdmin
      .from('looks_diario')
      .update({ curtidas: novasCurtidas })
      .eq('id', lookId)

    return NextResponse.json({ curtido: true, curtidas: novasCurtidas })
  }
}
