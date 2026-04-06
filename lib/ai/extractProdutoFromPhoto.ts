// OCR de embalagem de produto de beleza via Gemini Flash
// Reutiliza o mesmo padrão de analyzeVisagismo.ts (mesma API key, mesmos models)

export interface ProdutoExtraido {
  nome: string | null
  marca: string | null
  categoria: 'skincare' | 'maquiagem' | 'cabelo' | 'corpo' | 'perfume' | 'unhas' | 'ferramenta' | null
  subcategoria: string | null
  volume: string | null
  ean: string | null
}

const MODELS = ['gemini-3-flash-preview', 'gemini-2.5-flash']

const PROMPT_OCR = `Analise a foto desta embalagem de produto de beleza.
Extraia as informações do produto e retorne APENAS um JSON válido com estes campos:
{
  "nome": "nome do produto (sem a marca, ex: 'Sérum Vitamina C 30%')",
  "marca": "nome da marca (ex: 'La Roche-Posay')",
  "categoria": "uma de: skincare | maquiagem | cabelo | corpo | perfume | unhas | ferramenta",
  "subcategoria": "tipo mais específico (ex: 'sérum', 'hidratante', 'protetor solar', 'shampoo')",
  "volume": "volume ou peso com unidade (ex: '50ml', '120g', '1L')",
  "ean": "código de barras EAN se visível na foto, senão null"
}

Regras:
- Se um campo não for identificável na foto, retorne null para aquele campo
- nome e marca são os campos mais importantes — tente sempre extraí-los
- categoria deve ser exatamente uma das opções listadas
- Retorne SOMENTE o JSON, sem texto adicional, sem markdown`

export async function extractProdutoFromPhoto(
  imageBase64: string,
  mimeType: string
): Promise<ProdutoExtraido> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY não configurada')

  let cleanBase64 = imageBase64
  if (cleanBase64.includes(',')) cleanBase64 = cleanBase64.split(',')[1]
  cleanBase64 = cleanBase64.replace(/[\r\n\s]/g, '')

  const body = {
    contents: [
      {
        parts: [
          { inline_data: { mime_type: mimeType, data: cleanBase64 } },
          { text: PROMPT_OCR },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      response_mime_type: 'application/json',
    },
  }

  let lastError: Error = new Error('Nenhum model disponível')

  for (const model of MODELS) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30_000)

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      })
      clearTimeout(timeoutId)

      if (!res.ok) {
        const err = await res.text()
        lastError = new Error(`Gemini ${model} erro ${res.status}: ${err.slice(0, 200)}`)
        continue
      }

      const data = await res.json()
      const parts = data?.candidates?.[0]?.content?.parts ?? []
      const text = parts.find((p: { text?: string }) => p.text?.trim().startsWith('{'))?.text

      if (!text) {
        lastError = new Error(`Gemini ${model}: resposta sem JSON`)
        continue
      }

      const parsed = JSON.parse(text) as ProdutoExtraido
      return parsed
    } catch (err) {
      clearTimeout(timeoutId)
      lastError = err instanceof Error ? err : new Error(String(err))
      continue
    }
  }

  throw lastError
}
