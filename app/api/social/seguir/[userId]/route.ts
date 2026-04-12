import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { userId } = await params
  if (userId === user.id) return NextResponse.json({ error: 'Não pode seguir a si mesma' }, { status: 400 })

  const { error } = await supabase
    .from('seguimentos')
    .insert({ seguidor_id: user.id, seguido_id: userId })

  if (error && error.code !== '23505') {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const { count } = await supabase
    .from('seguimentos')
    .select('*', { count: 'exact', head: true })
    .eq('seguido_id', userId)

  return NextResponse.json({ seguindo: true, totalSeguidores: count ?? 0 })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { userId } = await params

  await supabase
    .from('seguimentos')
    .delete()
    .eq('seguidor_id', user.id)
    .eq('seguido_id', userId)

  const { count } = await supabase
    .from('seguimentos')
    .select('*', { count: 'exact', head: true })
    .eq('seguido_id', userId)

  return NextResponse.json({ seguindo: false, totalSeguidores: count ?? 0 })
}
