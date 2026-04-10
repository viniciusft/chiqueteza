import { NextRequest, NextResponse } from 'next/server'
import webpush from 'web-push'
import { createClient } from '@/lib/supabase/server'

// Configura VAPID uma vez — reutiliza entre invocações quentes
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_KEY ?? ''
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY ?? ''
const vapidSubject = `mailto:contato@${process.env.NEXT_PUBLIC_SITE_URL?.replace(/https?:\/\//, '') ?? 'chiqueteza.app'}`

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey)
}

interface PushPayload {
  title: string
  body: string
  url?: string
  tag?: string
}

// Rota interna — chamada pelo Inngest ou outros jobs server-side
// Requer SUPABASE_SERVICE_ROLE_KEY para leitura de subscriptions de outros usuários
export async function POST(req: NextRequest) {
  // Verificar chave interna de serviço
  const authHeader = req.headers.get('authorization')
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!authHeader || authHeader !== `Bearer ${serviceKey}`) {
    return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })
  }

  if (!vapidPublicKey || !vapidPrivateKey) {
    return NextResponse.json({ erro: 'VAPID não configurado' }, { status: 500 })
  }

  let body: { usuario_id: string; payload: PushPayload }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ erro: 'Payload inválido' }, { status: 400 })
  }

  const { usuario_id, payload } = body
  if (!usuario_id || !payload) {
    return NextResponse.json({ erro: 'usuario_id e payload obrigatórios' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: sub, error } = await supabase
    .from('push_subscriptions')
    .select('subscription_json')
    .eq('usuario_id', usuario_id)
    .single()

  if (error || !sub?.subscription_json) {
    return NextResponse.json({ ok: false, motivo: 'Sem subscription' })
  }

  try {
    await webpush.sendNotification(
      sub.subscription_json as webpush.PushSubscription,
      JSON.stringify(payload),
    )
    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const statusCode = (err as { statusCode?: number }).statusCode
    // 410 Gone = subscription expirada/inválida — remover
    if (statusCode === 410) {
      await supabase.from('push_subscriptions').delete().eq('usuario_id', usuario_id)
      return NextResponse.json({ ok: false, motivo: 'Subscription expirada, removida' })
    }
    console.error('[push/send] erro:', err)
    return NextResponse.json({ ok: false, motivo: 'Erro ao enviar' }, { status: 500 })
  }
}
