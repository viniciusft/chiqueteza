// Gerenciamento de Access Token da API Mercado Livre
// Usa grant_type=refresh_token (authorization_code flow).
//
// Variáveis de ambiente necessárias (Vercel):
//   ML_APP_ID       = App ID obtido em developers.mercadolivre.com.br
//   ML_APP_SECRET   = Secret Key do mesmo portal
//   ML_REFRESH_TOKEN = Obtido UMA VEZ acessando /api/ml/setup no app em produção
//
// Setup inicial (necessário uma vez):
//   1. Configure "Authorization Code" + "Refresh Token" no portal ML
//   2. Defina redirect_uri como https://[seu-site]/api/ml/callback
//   3. Visite https://[seu-site]/api/ml/setup e autorize
//   4. Copie o ML_REFRESH_TOKEN exibido e salve na Vercel → Redeploy

interface CachedToken {
  token: string
  expiresAt: number // timestamp em ms
}

// Cache em memória — dura enquanto o processo estiver ativo (OK para serverless)
let cached: CachedToken | null = null

export async function getMLToken(): Promise<string | null> {
  const appId        = process.env.ML_APP_ID
  const appSecret    = process.env.ML_APP_SECRET
  const refreshToken = process.env.ML_REFRESH_TOKEN

  if (!appId || !appSecret) {
    console.warn('[ML token] ML_APP_ID ou ML_APP_SECRET não configurados')
    return null
  }

  if (!refreshToken) {
    console.warn('[ML token] ML_REFRESH_TOKEN não configurado — acesse /api/ml/setup para obter')
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
        grant_type: 'refresh_token',
        client_id: appId,
        client_secret: appSecret,
        refresh_token: refreshToken,
      }).toString(),
      signal: AbortSignal.timeout(8000),
    })

    if (!res.ok) {
      const body = await res.text()
      console.error(`[ML token] erro ${res.status} ao renovar token:`, body)
      if (res.status === 401) {
        console.error('[ML token] refresh_token inválido ou expirado — acesse /api/ml/setup para renovar')
      }
      return null
    }

    const data = await res.json()
    const token: string = data.access_token

    // Quando ML retorna um novo refresh_token, logar para o operador atualizar a env var
    if (data.refresh_token && data.refresh_token !== refreshToken) {
      console.log('[ML token] novo refresh_token emitido — atualize ML_REFRESH_TOKEN na Vercel:', data.refresh_token)
    }

    // ML retorna expires_in em segundos (normalmente 21600 = 6h)
    const expiresIn: number = data.expires_in ?? 21600
    cached = { token, expiresAt: Date.now() + expiresIn * 1000 }

    console.log('[ML token] token renovado via refresh_token, expira em', Math.round(expiresIn / 3600), 'h')
    return token
  } catch (err) {
    console.error('[ML token] falha ao renovar token:', err)
    return null
  }
}
