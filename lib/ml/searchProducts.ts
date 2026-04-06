// Busca de produtos na API pública do Mercado Livre (sem autenticação)
// Documentação: https://developers.mercadolivre.com.br/pt_br/itens-e-buscas
// MLB1246 = categoria "Beleza e Cuidado Pessoal"

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
  thumbnail: string
  permalink: string
  available_quantity: number
  condition: string
  seller?: { nickname: string }
}

export async function searchMLProducts(query: string, limit = 8): Promise<MLProduto[]> {
  if (!query || query.trim().length < 2) return []

  const url = new URL('https://api.mercadolibre.com/sites/MLB/search')
  url.searchParams.set('q', query.trim())
  url.searchParams.set('category', 'MLB1246') // Beleza e Cuidado Pessoal
  url.searchParams.set('limit', String(limit))
  url.searchParams.set('condition', 'new')

  const res = await fetch(url.toString(), {
    next: { revalidate: 300 }, // cache 5 min
    headers: { 'Accept': 'application/json' },
    signal: AbortSignal.timeout(8000),
  })

  if (!res.ok) {
    console.error('[ML search] status', res.status)
    return []
  }

  const data = await res.json()
  const results: MLSearchResult[] = data?.results ?? []

  return results
    .filter(r => r.available_quantity > 0)
    .map(r => ({
      id: r.id,
      titulo: r.title,
      preco: r.price,
      thumbnail: r.thumbnail.replace('I.jpg', 'O.jpg'), // thumbnail maior
      permalink: r.permalink,
      disponivel: r.available_quantity > 0,
      vendedor: r.seller?.nickname ?? null,
      condicao: r.condition,
    }))
}

export async function getMLItemDetails(mlId: string): Promise<{ preco: number; permalink: string; titulo: string } | null> {
  try {
    const res = await fetch(`https://api.mercadolibre.com/items/${mlId}`, {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(8000),
    })
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
