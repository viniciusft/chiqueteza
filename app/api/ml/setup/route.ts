import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// GET /api/ml/setup
// Redireciona para o fluxo OAuth do Mercado Livre (authorization_code).
// Acesse esta URL UMA VEZ para obter o refresh_token e salvar na Vercel.
export async function GET() {
  const appId = process.env.ML_APP_ID
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL

  if (!appId) {
    return new NextResponse('ML_APP_ID não configurado no Vercel', { status: 500 })
  }
  if (!siteUrl) {
    return new NextResponse('NEXT_PUBLIC_SITE_URL não configurado no Vercel', { status: 500 })
  }

  const redirectUri = `${siteUrl}/api/ml/callback`
  const authUrl = new URL('https://auth.mercadolivre.com.br/authorization')
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('client_id', appId)
  authUrl.searchParams.set('redirect_uri', redirectUri)

  return NextResponse.redirect(authUrl.toString())
}
