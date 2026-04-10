import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// GET /api/ml/callback?code=XXX
// Chamado pelo ML após autorização. Troca o code pelo access_token + refresh_token
// e exibe o refresh_token para o usuário copiar e salvar na Vercel.
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  const error = req.nextUrl.searchParams.get('error')

  if (error) {
    return html(`
      <h2 style="color:#EF4444">Erro na autorização ML</h2>
      <p>O Mercado Livre retornou: <code>${error}</code></p>
      <p>Causas comuns:</p>
      <ul>
        <li>Redirect URI no portal ML não corresponde à URL deste callback</li>
        <li>App não tem "Authorization Code" habilitado no portal ML</li>
      </ul>
      <a href="/api/ml/setup" style="color:#1B5E5A;font-weight:700">Tentar novamente</a>
    `)
  }

  if (!code) {
    return new NextResponse('Código de autorização ausente', { status: 400 })
  }

  const appId     = process.env.ML_APP_ID
  const appSecret = process.env.ML_APP_SECRET
  const siteUrl   = process.env.NEXT_PUBLIC_SITE_URL

  if (!appId || !appSecret || !siteUrl) {
    return new NextResponse('ML_APP_ID, ML_APP_SECRET ou NEXT_PUBLIC_SITE_URL não configurados', { status: 500 })
  }

  const redirectUri = `${siteUrl}/api/ml/callback`

  try {
    const res = await fetch('https://api.mercadolibre.com/oauth/token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: appId,
        client_secret: appSecret,
        code,
        redirect_uri: redirectUri,
      }).toString(),
    })

    const data = await res.json()

    if (!res.ok) {
      return html(`
        <h2 style="color:#EF4444">Erro ao obter token (${res.status})</h2>
        <pre style="background:#f5f5f5;padding:12px;border-radius:8px;overflow:auto;font-size:12px">${JSON.stringify(data, null, 2)}</pre>
        <p>Verifique se o <strong>Redirect URI</strong> no portal ML está exatamente como:<br>
          <code style="background:#F5F5F5;padding:4px 8px;border-radius:4px">${redirectUri}</code>
        </p>
        <a href="/api/ml/setup" style="color:#1B5E5A;font-weight:700">Tentar novamente</a>
      `)
    }

    const refreshToken: string = data.refresh_token
    const accessToken: string  = data.access_token
    const expiresIn: number    = data.expires_in ?? 21600

    return html(`
      <h2 style="color:#1B5E5A">✅ Autorização concluída!</h2>
      <p>Copie o <strong>ML_REFRESH_TOKEN</strong> abaixo e adicione na Vercel:</p>

      <label style="font-size:13px;font-weight:700;display:block;margin-bottom:6px">ML_REFRESH_TOKEN</label>
      <textarea
        readonly
        onclick="this.select()"
        style="width:100%;padding:10px;border:2px solid #1B5E5A;border-radius:8px;font-family:monospace;font-size:12px;height:90px;resize:none;box-sizing:border-box"
      >${refreshToken}</textarea>

      <details style="margin-top:16px">
        <summary style="cursor:pointer;color:#767676;font-size:13px">
          Access Token (válido por ${Math.round(expiresIn / 3600)}h — não precisa salvar)
        </summary>
        <textarea
          readonly
          onclick="this.select()"
          style="width:100%;margin-top:8px;padding:10px;border:1px solid #E8E8E8;border-radius:8px;font-family:monospace;font-size:11px;height:60px;resize:none;box-sizing:border-box"
        >${accessToken}</textarea>
      </details>

      <hr style="margin:24px 0;border:none;border-top:1px solid #E8E8E8">
      <h3>Próximos passos:</h3>
      <ol style="line-height:2">
        <li>Copie o valor de <strong>ML_REFRESH_TOKEN</strong> acima (clique na caixa de texto)</li>
        <li>Acesse <a href="https://vercel.com" target="_blank" style="color:#1B5E5A">Vercel</a>
          → seu projeto → <strong>Settings → Environment Variables</strong></li>
        <li>Adicione <code>ML_REFRESH_TOKEN</code> com o valor copiado (All Environments)</li>
        <li>Clique em <strong>Save</strong> e depois em <strong>Redeploy</strong></li>
      </ol>
      <p style="color:#767676;font-size:12px">
        O refresh_token é válido por 6 meses.<br>
        Após expirar, visite <code>/api/ml/setup</code> novamente.
      </p>
    `)
  } catch (err) {
    return new NextResponse(`Erro interno: ${err}`, { status: 500 })
  }
}

function html(body: string): NextResponse {
  return new NextResponse(
    `<!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>ML Setup — Chiqueteza</title>
    </head>
    <body style="font-family:-apple-system,sans-serif;padding:24px;max-width:600px;margin:0 auto;line-height:1.6;color:#1A1A1A">
      ${body}
    </body>
    </html>`,
    { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  )
}
