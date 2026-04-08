// Job: verifica preços ML diariamente às 9h
// Checa ml_produto_id dos armarios e wishlist → salva histórico → notifica queda > 10%
import { inngest } from './client'
import { createClient } from '@supabase/supabase-js'
import { getMLItemDetails } from '@/lib/ml/searchProducts'

export const verificarPrecos = inngest.createFunction(
  { id: 'verificar-precos-ml', name: 'Verificar preços Mercado Livre', triggers: [{ cron: '0 9 * * *' }] },
  async ({ step, logger }) => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 1. Buscar todos os produtos do armário com ml_produto_id
    const armarioProdutos = await step.run('buscar-armario', async () => {
      const { data } = await supabase
        .from('armario_produtos')
        .select('id, nome, ml_produto_id, ml_preco_atual, ml_preco_minimo, usuario_id')
        .not('ml_produto_id', 'is', null)
        .neq('status', 'finalizado')
      return data ?? []
    })

    // 2. Buscar produtos da wishlist com ml_produto_id
    const wishlistProdutos = await step.run('buscar-wishlist', async () => {
      const { data } = await supabase
        .from('wishlist_produtos')
        .select('id, nome, ml_produto_id, usuario_id')
        .not('ml_produto_id', 'is', null)
        .in('status', ['quero'])
      return data ?? []
    })

    const todos = [
      ...armarioProdutos.map(p => ({ ...p, tipo: 'armario' as const, wishlist_produto_id: null })),
      ...wishlistProdutos.map(p => ({ id: p.id, nome: p.nome, ml_produto_id: p.ml_produto_id, ml_preco_atual: null, ml_preco_minimo: null, usuario_id: p.usuario_id, tipo: 'wishlist' as const, wishlist_produto_id: p.id })),
    ]

    logger.info(`Verificando preços de ${todos.length} produtos`)

    const resultados = await step.run('verificar-todos', async () => {
      const out: Array<{ mlId: string; nome: string; usuario_id: string; precoAnterior: number; precoAtual: number; queda: boolean; pct: number }> = []

      for (const prod of todos) {
        if (!prod.ml_produto_id) continue

        const detalhes = await getMLItemDetails(prod.ml_produto_id)
        if (!detalhes) continue

        const precoAtual = detalhes.preco
        const precoAnterior = prod.ml_preco_atual ?? precoAtual
        const precoMinimo = prod.ml_preco_minimo ?? precoAtual
        const novoMinimo = Math.min(precoMinimo, precoAtual)
        const pctQueda = precoAnterior > 0 ? ((precoAnterior - precoAtual) / precoAnterior) * 100 : 0
        const queda = pctQueda >= 10

        // Salvar no histórico
        await supabase.from('historico_precos').insert({
          armario_produto_id: prod.tipo === 'armario' ? prod.id : null,
          wishlist_produto_id: prod.tipo === 'wishlist' ? prod.id : null,
          ml_produto_id: prod.ml_produto_id,
          preco: precoAtual,
          disponivel: true,
        })

        // Atualizar preço no produto do armário
        if (prod.tipo === 'armario') {
          await supabase.from('armario_produtos')
            .update({
              ml_preco_atual: precoAtual,
              ml_preco_minimo: novoMinimo,
              ml_preco_checado_em: new Date().toISOString(),
            })
            .eq('id', prod.id)
        }

        out.push({ mlId: prod.ml_produto_id, nome: prod.nome ?? prod.ml_produto_id, usuario_id: prod.usuario_id, precoAnterior, precoAtual, queda, pct: pctQueda })
      }

      return out
    })

    const quedas = resultados.filter(r => r.queda)
    logger.info(`Verificação concluída: ${resultados.length} produtos, ${quedas.length} com queda > 10%`)

    // 3. Notificar usuários com queda de preço
    if (quedas.length > 0) {
      await step.run('notificar-quedas', async () => {
        // Agrupar quedas por usuário
        const porUsuario = quedas.reduce<Record<string, typeof quedas>>((acc, q) => {
          if (!acc[q.usuario_id]) acc[q.usuario_id] = []
          acc[q.usuario_id].push(q)
          return acc
        }, {})

        for (const [usuarioId, produtos] of Object.entries(porUsuario)) {
          const { data: subs } = await supabase
            .from('push_subscriptions')
            .select('subscription_json')
            .eq('usuario_id', usuarioId)

          if (!subs || subs.length === 0) continue

          const primeiro = produtos[0]
          const precoFormatado = (v: number) => `R$${v.toFixed(2).replace('.', ',')}`
          const body = produtos.length === 1
            ? `${primeiro.nome}: ${precoFormatado(primeiro.precoAnterior)} → ${precoFormatado(primeiro.precoAtual)}`
            : `${primeiro.nome} e mais ${produtos.length - 1} produto(s) estão mais baratos`

          for (const sub of subs) {
            try {
              await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/push/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-inngest-secret': process.env.INNGEST_SIGNING_KEY ?? '' },
                body: JSON.stringify({
                  subscription: sub.subscription_json,
                  title: '🟢 Preço caiu no Mercado Livre!',
                  body,
                  url: '/app/armario',
                }),
              })
            } catch (err) {
              logger.warn(`Falha ao enviar push de queda para ${usuarioId}: ${err}`)
            }
          }
        }
      })
    }

    return { verificados: resultados.length, quedas: quedas.length }
  }
)
