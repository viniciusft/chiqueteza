// Job: detecta produtos acabando e envia alerta push
// Cron: todo dia às 8h — antes do verificarPrecos
import { inngest } from './client'
import { createClient } from '@supabase/supabase-js'

export const alertasReposicao = inngest.createFunction(
  { id: 'alertas-reposicao', name: 'Alertas de reposição de produtos', triggers: [{ cron: '0 8 * * *' }] },
  async ({ step, logger }) => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const hoje = new Date().toISOString().split('T')[0]
    const em7dias = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]

    // Produtos acabando: nivel <= 15% OU data_fim_estimada nos próximos 7 dias
    const acabando = await step.run('buscar-acabando', async () => {
      const { data } = await supabase
        .from('armario_produtos')
        .select('id, nome, usuario_id, nivel_atual, data_fim_estimada, status')
        .or(`nivel_atual.lte.15,data_fim_estimada.lte.${em7dias}`)
        .neq('status', 'finalizado')
        .neq('status', 'guardado')
      return data ?? []
    })

    logger.info(`Encontrados ${acabando.length} produtos acabando`)

    if (acabando.length === 0) return { alertas: 0 }

    // Agrupar por usuário
    const porUsuario = acabando.reduce<Record<string, typeof acabando>>((acc, p) => {
      if (!acc[p.usuario_id]) acc[p.usuario_id] = []
      acc[p.usuario_id].push(p)
      return acc
    }, {})

    let alertasEnviados = 0

    await step.run('enviar-alertas', async () => {
      for (const [usuarioId, produtos] of Object.entries(porUsuario)) {
        // Buscar push subscriptions do usuário
        const { data: subs } = await supabase
          .from('push_subscriptions')
          .select('subscription_json')
          .eq('usuario_id', usuarioId)

        if (!subs || subs.length === 0) continue

        const nomes = produtos.slice(0, 3).map(p => p.nome).join(', ')
        const restante = produtos.length > 3 ? ` +${produtos.length - 3}` : ''
        const mensagem = `${nomes}${restante} estão acabando`

        // Chamar endpoint de push (reutiliza lógica existente de service worker)
        for (const sub of subs) {
          try {
            await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/push/send`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'x-inngest-secret': process.env.INNGEST_SIGNING_KEY ?? '' },
              body: JSON.stringify({
                subscription: sub.subscription_json,
                title: '🔴 Produtos acabando',
                body: mensagem,
                url: '/app/armario?aba=acabando',
              }),
            })
            alertasEnviados++
          } catch (err) {
            logger.warn(`Falha ao enviar push para ${usuarioId}: ${err}`)
          }
        }
      }
    })

    return { alertas: alertasEnviados, produtos: acabando.length }
  }
)
