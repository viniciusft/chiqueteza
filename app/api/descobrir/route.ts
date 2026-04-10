import { NextRequest, NextResponse } from 'next/server'
import { buscarEmProvider } from '@/lib/produtos/providers'
import type { Provider } from '@/lib/produtos/types'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') ?? ''
  const categoria = req.nextUrl.searchParams.get('categoria') ?? undefined
  const provider = (req.nextUrl.searchParams.get('provider') ?? 'mercadolivre') as Provider
  const limit = Math.min(Number(req.nextUrl.searchParams.get('limit') ?? '12'), 24)

  if (!q && !categoria) {
    return NextResponse.json({ produtos: [], total: 0 })
  }

  try {
    const resultado = await buscarEmProvider(provider, { query: q, categoria, limit })
    return NextResponse.json({ produtos: resultado.produtos, total: resultado.total })
  } catch (err) {
    console.error('[descobrir] erro:', err)
    return NextResponse.json({ produtos: [], total: 0, erro: 'Erro na busca' }, { status: 500 })
  }
}
