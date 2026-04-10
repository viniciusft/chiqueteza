import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ erro: 'Não autenticado' }, { status: 401 })
  }

  let subscription: PushSubscriptionJSON
  try {
    subscription = await req.json()
  } catch {
    return NextResponse.json({ erro: 'Payload inválido' }, { status: 400 })
  }

  if (!subscription.endpoint) {
    return NextResponse.json({ erro: 'Endpoint ausente' }, { status: 400 })
  }

  const { error } = await supabase
    .from('push_subscriptions')
    .upsert({
      usuario_id: user.id,
      subscription_json: subscription,
    }, { onConflict: 'usuario_id' })

  if (error) {
    console.error('[push/subscribe] erro:', error)
    return NextResponse.json({ erro: 'Erro ao salvar subscription' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ erro: 'Não autenticado' }, { status: 401 })

  await supabase.from('push_subscriptions').delete().eq('usuario_id', user.id)
  return NextResponse.json({ ok: true })
}
