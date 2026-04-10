// Busca de produtos na API do Mercado Livre
// Documentação: https://developers.mercadolivre.com.br/pt_br/itens-e-buscas
//
// Estratégia de autenticação:
//   1. Tenta obter token via client_credentials (ML_APP_ID + ML_APP_SECRET)
//   2. Se tiver token, faz a busca com Bearer — evita rate limit e aumenta cota
//   3. Se token falhar (401/403), faz fallback sem auth — busca pública ML funciona anonimamente
//   4. Se sem auth também falhar, loga o status e retorna []

import { getMLToken } from './token'

export interface MLProduto {
  id: string
  titulo: string
  preco: number
  thumbnail: string
  permalink: string
  disponivel: boolean
  vendedor: string | null
  condicao: 'new' | 'used' | string
}

interface MLSearchResult {
  id: string
  title: string
  price: number
  thumbnail?: string
  permalink: string
  available_quantity?: number
  condition: string
  seller?: { nickname: string }
  buying_mode?: string
}

function mapResults(results: MLSearchResult[]): MLProduto[] {
  return results
    // Trata available_quantity ausente como disponível (undefined = não sabemos, deixamos passar)
    .filter(r => r.available_quantity === undefined || r.available_quantity > 0)
    .map(r => ({
      id: r.id,
      titulo: r.title,
      preco: r.price,
      // thumbnail pode ser null em alguns resultados — fallback para string vazia
      thumbnail: r.thumbnail ? r.thumbnail.replace('I.jpg', 'O.jpg') : '',
      permalink: r.permalink,
      disponivel: (r.available_quantity ?? 1) > 0,
      vendedor: r.seller?.nickname ?? null,
      condicao: r.condition,
    }))
}

async function fetchML(url: string, token: string | null): Promise<Response> {
  const headers: Record<string, string> = { 'Accept': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  // IMPORTANTE: não usar `next: { revalidate }` junto com `signal` no Next.js 14 —
  // são incompatíveis e o cache é silenciosamente descartado.
  return fetch(url, {
    headers,
    signal: AbortSignal.timeout(8000),
    cache: 'no-store', // Cada busca é dinâmica (query diferente a cada vez)
  })
}

export async function searchMLProducts(query: string, limit = 10): Promise<MLProduto[]> {
  if (!query || query.trim().length < 2) return []

  const token = await getMLToken() // null se credentials não configuradas ou inválidas

  const url = new URL('https://api.mercadolibre.com/sites/MLB/search')
  url.searchParams.set('q', query.trim())
  url.searchParams.set('limit', String(Math.min(limit, 50)))
  const urlStr = url.toString()

  try {
    // Tentativa 1: com token (se disponível)
    let res = await fetchML(urlStr, token)

    // Fallback: se auth falhou, tenta sem token
    if (!res.ok && token && (res.status === 401 || res.status === 403)) {
      console.warn(`[ML search] auth falhou (${res.status}), tentando sem token...`)
      res = await fetchML(urlStr, null)
    }

    if (!res.ok) {
      console.error(`[ML search] status ${res.status} para query "${query}"`)
      return []
    }

    const data = await res.json()
    const results: MLSearchResult[] = data?.results ?? []

    console.log(`[ML search] "${query}" → ${results.length} resultados (token: ${!!token})`)

    return mapResults(results)
  } catch (err) {
    console.error('[ML search] erro de rede:', err)
    return []
  }
}

export async function getMLItemDetails(mlId: string): Promise<{ preco: number; permalink: string; titulo: string } | null> {
  const token = await getMLToken()
  try {
    const res = await fetchML(`https://api.mercadolibre.com/items/${mlId}`, token)
    if (!res.ok) return null
    const data = await res.json()
    return {
      preco: data.price ?? 0,
      permalink: data.permalink ?? '',
      titulo: data.title ?? '',
    }
  } catch {
    return null
  }
}
