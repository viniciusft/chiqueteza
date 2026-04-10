// Busca ML client-side — chama a API do ML diretamente do browser
//
// POR QUE client-side?
// A Vercel (e outros cloud providers) têm IPs bloqueados pela ML para chamadas
// server-to-server ao endpoint de busca. O browser do usuário não é afetado.
//
// Os parâmetros de afiliado (NEXT_PUBLIC_) são seguros no frontend:
// eles já aparecem em todas as URLs que o usuário vê/compartilha.

'use client'

export interface MLProdutoClient {
  id: string
  provider: 'mercadolivre'
  titulo: string
  preco: number
  thumbnail: string
  permalink: string
  deeplink: string
  disponivel: boolean
  vendedor: string | null
  condicao: string
}

function buildDeeplink(permalink: string): string {
  const mattTool = process.env.NEXT_PUBLIC_ML_AFFILIATE_TRACKING_ID
  const mattWord  = process.env.NEXT_PUBLIC_ML_AFFILIATE_WORD
  if (!mattTool) return permalink
  try {
    const url = new URL(permalink)
    url.searchParams.set('matt_tool', mattTool)
    if (mattWord) url.searchParams.set('matt_word', mattWord)
    return url.toString()
  } catch {
    return permalink
  }
}

export async function searchMLClient(
  query: string,
  limit = 10,
): Promise<MLProdutoClient[]> {
  if (!query || query.trim().length < 2) return []

  const url = new URL('https://api.mercadolibre.com/sites/MLB/search')
  url.searchParams.set('q', query.trim())
  url.searchParams.set('limit', String(Math.min(limit, 50)))

  try {
    const res = await fetch(url.toString(), {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) {
      console.error('[ML client] status', res.status)
      return []
    }

    const data = await res.json()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const results: any[] = data?.results ?? []

    return results
      .filter(r => (r.available_quantity ?? 1) > 0)
      .map(r => ({
        id: r.id,
        provider: 'mercadolivre' as const,
        titulo: r.title,
        preco: r.price,
        thumbnail: r.thumbnail ? String(r.thumbnail).replace('I.jpg', 'O.jpg') : '',
        permalink: r.permalink,
        deeplink: buildDeeplink(r.permalink),
        disponivel: (r.available_quantity ?? 1) > 0,
        vendedor: r.seller?.nickname ?? null,
        condicao: r.condition ?? 'new',
      }))
  } catch (err) {
    console.error('[ML client] erro de rede:', err)
    return []
  }
}
