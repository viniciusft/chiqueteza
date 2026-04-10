// Gerenciamento de Access Token da API Mercado Livre
// Usa grant_type=client_credentials — não exige autorização do usuário
//
// Variáveis de ambiente necessárias (Vercel):
//   ML_APP_ID      = App ID (Client ID) obtido em developers.mercadolivre.com.br
//   ML_APP_SECRET  = Secret Key obtida no mesmo portal
//
// Como criar o App (gratuito):
//   1. Acesse developers.mercadolivre.com.br → "Crie uma aplicação"
//   2. Preencha nome, descrição e redirect_uri (pode ser http://localhost)
//   3. Copie o App ID e o Secret Key para as env vars acima

interface CachedToken {
  token: string
  expiresAt: number // timestamp em ms
}

// Cache em memória — dura enquanto o processo estiver ativo (OK para serverless)
let cached: CachedToken | null = null

export async function getMLToken(): Promise<string | null> {
  const appId = process.env.ML_APP_ID
  const appSecret = process.env.ML_APP_SECRET

  if (!appId || !appSecret) {
    console.warn('[ML token] ML_APP_ID ou ML_APP_SECRET não configurados')
    return null
  }

  // Reutilizar token se válido por mais de 60s
  if (cached && cached.expiresAt - Date.now() > 60_000) {
    return cached.token
  }

  try {
    const res = await fetch('https://api.mercadolibre.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: appId,
        client_secret: appSecret,
      }).toString(),
      signal: AbortSignal.timeout(8000),
    })

    if (!res.ok) {
      const body = await res.text()
      console.error(`[ML token] erro ${res.status} ao obter client_credentials:`, body)
      console.error('[ML token] verifique se ML_APP_ID e ML_APP_SECRET estão corretos no Vercel')
      return null
    }

    const data = await res.json()
    const token: string = data.access_token

    // ML retorna expires_in em segundos (normalmente 21600 = 6h)
    const expiresIn: number = data.expires_in ?? 21600
    cached = { token, expiresAt: Date.now() + expiresIn * 1000 }

    return token
  } catch (err) {
    console.error('[ML token] falha ao obter token:', err)
    return null
  }
}
