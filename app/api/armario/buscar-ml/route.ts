import { NextRequest, NextResponse } from 'next/server'
import { searchMLProducts } from '@/lib/ml/searchProducts'
import { buildMLDeeplink } from '@/lib/ml/buildDeeplink'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')

  if (!q || q.trim().length < 2) {
    return NextResponse.json({ produtos: [] })
  }

  try {
    const produtos = await searchMLProducts(q, 8)
    // Enriquecer com deeplink de afiliado
    const comDeeplink = produtos.map(p => ({
      ...p,
      deeplink: buildMLDeeplink(p.permalink),
    }))
    return NextResponse.json({ produtos: comDeeplink })
  } catch (err) {
    console.error('[buscar-ml] erro:', err)
    return NextResponse.json({ produtos: [], erro: 'Erro ao buscar' }, { status: 500 })
  }
}
