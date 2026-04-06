// Gera deeplink de afiliado para o Mercado Livre
// Após cadastro no programa (mercadolivre.com.br/afiliados), preencher:
// ML_AFFILIATE_TRACKING_ID no .env.local e Vercel

export function buildMLDeeplink(permalink: string): string {
  const trackingId = process.env.ML_AFFILIATE_TRACKING_ID

  if (!trackingId) {
    // Sem tracking ainda — retorna link limpo
    return permalink
  }

  // Adiciona parâmetro de rastreamento
  // Formato oficial: ?tracking_id={tracking_id}
  try {
    const url = new URL(permalink)
    url.searchParams.set('tracking_id', trackingId)
    return url.toString()
  } catch {
    return `${permalink}?tracking_id=${trackingId}`
  }
}
