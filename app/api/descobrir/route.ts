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

  // Verificação rápida de credenciais ML antes de tentar
  if (provider === 'mercadolivre' && (!process.env.ML_APP_ID || !process.env.ML_APP_SECRET)) {
    console.error('[descobrir] ML_APP_ID ou ML_APP_SECRET não configurados')
    return NextResponse.json({
      produtos: [],
      total: 0,
      erro: 'sem_credenciais',
      erro_msg: 'Integração com Mercado Livre não configurada. Configure ML_APP_ID e ML_APP_SECRET no Vercel.',
    }, { status: 503 })
  }

  try {
    const resultado = await buscarEmProvider(provider, { query: q, categoria, limit })

    if (resultado.erro) {
      console.error('[descobrir] provider retornou erro:', resultado.erro)
    }

    return NextResponse.json({
      produtos: resultado.produtos,
      total: resultado.total,
      ...(resultado.erro ? { erro: resultado.erro } : {}),
    })
  } catch (err) {
    console.error('[descobrir] erro inesperado:', err)
    return NextResponse.json({ produtos: [], total: 0, erro: 'Erro interno na busca' }, { status: 500 })
  }
}
