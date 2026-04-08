// Gera deeplink de afiliado para o Mercado Livre
// Após cadastro no programa (mercadolivre.com.br/afiliados):
//   Painel → Ferramentas → Barra de Afiliados → gere um link → copie o valor de ?afiliado=XXXX
//   Salve em ML_AFFILIATE_TRACKING_ID no .env.local e Vercel

export function buildMLDeeplink(permalink: string): string {
  const trackingId = process.env.ML_AFFILIATE_TRACKING_ID

  if (!trackingId) {
    // Sem código de afiliado configurado — retorna link limpo
    return permalink
  }

  // Parâmetro oficial do programa ML Afiliados: ?afiliado=<codigo>
  try {
    const url = new URL(permalink)
    url.searchParams.set('afiliado', trackingId)
    return url.toString()
  } catch {
    return `${permalink}?afiliado=${trackingId}`
  }
}
