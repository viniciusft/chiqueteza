// Gera deeplink de afiliado para o Mercado Livre
// Parâmetros reais confirmados pelos links do painel ML Afiliados:
//   matt_tool = ID único do publisher (obtido em: painel Afiliados → qualquer link gerado → valor de matt_tool=)
//   matt_word = username/campaign word do afiliado (valor de matt_word= no mesmo link)
//
// Variáveis de ambiente necessárias (Vercel):
//   ML_AFFILIATE_TRACKING_ID = valor de matt_tool (ex: 43428740)
//   ML_AFFILIATE_WORD        = valor de matt_word (ex: amandaibc)

export function buildMLDeeplink(permalink: string): string {
  const mattTool = process.env.ML_AFFILIATE_TRACKING_ID
  const mattWord = process.env.ML_AFFILIATE_WORD

  if (!mattTool) {
    // Sem ID de afiliado configurado — retorna link limpo
    return permalink
  }

  try {
    const url = new URL(permalink)
    url.searchParams.set('matt_tool', mattTool)
    if (mattWord) url.searchParams.set('matt_word', mattWord)
    return url.toString()
  } catch {
    const sep = permalink.includes('?') ? '&' : '?'
    const word = mattWord ? `&matt_word=${mattWord}` : ''
    return `${permalink}${sep}matt_tool=${mattTool}${word}`
  }
}
