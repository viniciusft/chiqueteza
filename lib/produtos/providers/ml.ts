// Provider: Mercado Livre
// Adapta a busca ML para o formato ProdutoUnificado

import { searchMLProducts } from '@/lib/ml/searchProducts'
import { buildMLDeeplink } from '@/lib/ml/buildDeeplink'
import type { BuscaParams, BuscaResultado, ProdutoUnificado } from '../types'
import { CATEGORIA_ML_QUERY } from '../types'

export async function buscarML(params: BuscaParams): Promise<BuscaResultado> {
  const query = params.categoria
    ? `${CATEGORIA_ML_QUERY[params.categoria] ?? params.categoria} ${params.query}`.trim()
    : params.query

  try {
    const resultados = await searchMLProducts(query, params.limit ?? 10)

    const produtos: ProdutoUnificado[] = resultados
      .filter(r => {
        if (params.precoMin && r.preco < params.precoMin) return false
        if (params.precoMax && r.preco > params.precoMax) return false
        return true
      })
      .map(r => ({
        id: r.id,
        provider: 'mercadolivre' as const,
        titulo: r.titulo,
        preco: r.preco,
        thumbnail: r.thumbnail,
        permalink: r.permalink,
        deeplink: buildMLDeeplink(r.permalink),
        disponivel: r.disponivel,
        vendedor: r.vendedor,
        condicao: r.condicao,
      }))

    return { provider: 'mercadolivre', produtos, total: produtos.length }
  } catch (err) {
    console.error('[provider/ml] erro:', err)
    return { provider: 'mercadolivre', produtos: [], total: 0, erro: 'Erro ao buscar no Mercado Livre' }
  }
}
