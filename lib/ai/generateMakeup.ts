/**
 * Abstração do provider de IA para geração de maquiagem virtual.
 * Troca o provider aqui sem mexer em nenhuma outra parte do app.
 *
 * Candidatos:
 * - Gemini 2.0 Flash (gratuito, boa preservação de identidade)
 * - FLUX Kontext Pro via fal.ai ($0.04/imagem, superior em realismo)
 */

export interface MakeupParams {
  /** URL ou base64 da foto original da usuária */
  userPhotoUrl: string
  /** Prompt técnico do look — recuperado server-side, NUNCA exposto no frontend */
  technicalPrompt: string
  /** Provider a usar; se omitido usa o padrão configurado via env */
  provider?: 'gemini' | 'flux'
}

export async function generateMakeup(params: MakeupParams): Promise<string> {
  // TODO: implementar chamada ao provider selecionado
  // Retorna URL da imagem gerada
  throw new Error('generateMakeup: provider não implementado ainda')
}
