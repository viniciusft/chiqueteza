import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const q = req.nextUrl.searchParams.get('q')?.trim() ?? ''
  if (q.length < 2) return NextResponse.json({ usuarios: [] })

  const { data } = await supabase
    .from('perfis')
    .select('id, nome, username, avatar_url, bio')
    .or(`username.ilike.%${q}%,nome.ilike.%${q}%`)
    .neq('id', user.id)
    .not('username', 'is', null)
    .limit(20)

  return NextResponse.json({ usuarios: data ?? [] })
}
