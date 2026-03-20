export interface GeracaoParams {
  fotoOriginalUrl: string
  batomNome?: string
  batomHex?: string
  batomAcabamento?: string
  sombraNome?: string
  sombraHex?: string
  blushNome?: string
  blushHex?: string
  delineado?: string
  corteCabelo?: string
  estiloRoupa?: string
}

const IDENTITY_LOCK = `
IDENTITY LOCK — HIGHEST PRIORITY:
The person in this image must remain 100% identical.
Face shape, bone structure, skin texture, pores, eye shape,
eyebrows, nose, lips structure, hair, and expression are
absolutely untouchable. This overrides all other instructions.
`

const RESTRICTION = `
RESTRICTIONS:
Do not smooth skin. Do not beautify. Do not idealize any feature.
Reproduce everything outside the modified regions exactly as original.
Match the original photo's lighting direction, color temperature, and shadows.
The result must be recognizably the same person as the original.
`

function buildPrompt(params: GeracaoParams): string {
  const makeupParts: string[] = []

  if (params.batomNome && params.batomHex) {
    makeupParts.push(
      `LIPS: Apply ${params.batomAcabamento || 'matte'} lipstick called "${params.batomNome}" in color ${params.batomHex}. Full coverage. Blend naturally at lip border. Simulate realistic lip texture.`
    )
  }

  if (params.sombraNome && params.sombraHex) {
    makeupParts.push(
      `EYES: Apply "${params.sombraNome}" eyeshadow in color ${params.sombraHex} on upper eyelids. Blended naturally. Subtle to medium intensity.`
    )
  }

  if (params.blushNome && params.blushHex) {
    makeupParts.push(
      `CHEEKS: Apply "${params.blushNome}" blush in color ${params.blushHex} on apple of cheeks. Soft blend upward toward temples.`
    )
  }

  if (params.delineado) {
    makeupParts.push(
      `EYELINER: Apply ${params.delineado} style eyeliner. Keep it realistic and wearable.`
    )
  }

  if (params.corteCabelo) {
    makeupParts.push(
      `HAIR: Suggest ${params.corteCabelo} hairstyle while keeping the same hair color and texture.`
    )
  }

  if (params.estiloRoupa) {
    makeupParts.push(
      `OUTFIT: Show the person wearing ${params.estiloRoupa} style clothing, keeping focus on the face.`
    )
  }

  const MAKEUP_SECTION =
    makeupParts.length > 0
      ? `MODIFICATIONS TO APPLY:\n${makeupParts.join('\n')}`
      : 'Apply a natural, subtle everyday makeup look.'

  const REGIONS = `REGIONS: Only modify the areas explicitly described above. Every other pixel must be identical to the original.`

  return [IDENTITY_LOCK, REGIONS, MAKEUP_SECTION, RESTRICTION].join('\n\n')
}

export async function generateVisagismoImage(params: GeracaoParams): Promise<string> {
  const falKey = process.env.FAL_KEY
  if (!falKey) throw new Error('FAL_KEY não configurada')

  const prompt = buildPrompt(params)

  const response = await fetch('https://fal.run/fal-ai/flux-pro/kontext', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Key ${falKey}`,
    },
    body: JSON.stringify({
      image_url: params.fotoOriginalUrl,
      prompt,
      seed: 42,
      num_inference_steps: 28,
      guidance_scale: 8,
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`fal.ai error ${response.status}: ${err}`)
  }

  const data = await response.json()
  const imageUrl: string = data?.images?.[0]?.url ?? data?.image?.url

  if (!imageUrl) throw new Error('Resposta inválida do provider de imagem')

  return imageUrl
}
