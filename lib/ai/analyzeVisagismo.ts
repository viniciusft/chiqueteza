export interface VisagismoResponse {
  analise_facial: {
    formato_rosto: string
    terce_dominante: string
    caracteristicas_marcantes: string[]
    proporcoes: {
      testa: string
      zigomatico: string
      mandibula: string
      comprimento: string
    }
  }
  colorimetria: {
    subtom: string
    temperatura: string
    contraste: string
    saturacao: string
    estacao: string
    descricao_estacao: string
  }
  paleta_cores: {
    cores_ideais: Array<{ nome: string; hex: string; uso: string }>
    cores_evitar: Array<{ nome: string; hex: string; motivo: string }>
  }
  maquiagem: {
    base: { subtom_ideal: string; cobertura_recomendada: string }
    batom: Array<{ nome: string; hex: string; acabamento: string }>
    sombra: Array<{ nome: string; hex: string; ocasiao: string }>
    blush: Array<{ nome: string; hex: string; tecnica: string }>
    delineado: { formatos_recomendados: string[]; estilos_evitar: string[] }
  }
  cabelo: {
    cortes_recomendados: Array<{ nome: string; motivo: string }>
    cortes_evitar: Array<{ nome: string; motivo: string }>
    cores_harmonicas: Array<{ nome: string; hex: string }>
  }
  relatorio: {
    resumo_perfil: string
    o_que_te_valoriza: string[]
    o_que_evitar: string[]
    dica_especial: string
  }
}

const PROMPT_VISAGISMO = `Você é um especialista em visagismo e colorimetria pessoal com formação baseada na metodologia de Phillip Hallawell e no sistema de 12 estações de colorimetria.
Analise esta foto com precisão técnica e retorne APENAS um JSON válido.
{
  "analise_facial": {
    "formato_rosto": "",
    "terce_dominante": "",
    "caracteristicas_marcantes": [],
    "proporcoes": {
      "testa": "",
      "zigomatico": "",
      "mandibula": "",
      "comprimento": ""
    }
  },
  "colorimetria": {
    "subtom": "",
    "temperatura": "",
    "contraste": "",
    "saturacao": "",
    "estacao": "",
    "descricao_estacao": ""
  },
  "paleta_cores": {
    "cores_ideais": [{"nome": "", "hex": "", "uso": ""}],
    "cores_evitar": [{"nome": "", "hex": "", "motivo": ""}]
  },
  "maquiagem": {
    "base": {"subtom_ideal": "", "cobertura_recomendada": ""},
    "batom": [{"nome": "", "hex": "", "acabamento": ""}],
    "sombra": [{"nome": "", "hex": "", "ocasiao": ""}],
    "blush": [{"nome": "", "hex": "", "tecnica": ""}],
    "delineado": {"formatos_recomendados": [], "estilos_evitar": []}
  },
  "cabelo": {
    "cortes_recomendados": [{"nome": "", "motivo": ""}],
    "cortes_evitar": [{"nome": "", "motivo": ""}],
    "cores_harmonicas": [{"nome": "", "hex": ""}]
  },
  "relatorio": {
    "resumo_perfil": "",
    "o_que_te_valoriza": [],
    "o_que_evitar": [],
    "dica_especial": ""
  }
}
Regras:
- formato_rosto: APENAS: oval, redondo, quadrado, coracao, diamante, oblongo, triangular
- subtom: APENAS: quente, frio, neutro
- temperatura: APENAS: quente, frio
- contraste: APENAS: alto, medio, baixo
- saturacao: APENAS: alta, media, baixa
- estacao: uma das 12 (True Spring, Light Spring, Bright Spring, True Summer, Light Summer, Soft Summer, True Autumn, Soft Autumn, Dark Autumn, True Winter, Dark Winter, Bright Winter)
- paleta_cores.cores_ideais: 8 a 12 cores
- paleta_cores.cores_evitar: 4 a 6 cores
- maquiagem.batom: 4 a 6 opções
- maquiagem.sombra: 3 a 5 opções
- maquiagem.blush: 2 ou 3 opções
- cabelo.cortes_recomendados: 3 a 5 opções
- Todos os textos em português brasileiro informal e acolhedor
- HEX sempre #RRGGBB`

export async function analyzeVisagismo(
  imageBase64: string,
  mimeType: string
): Promise<VisagismoResponse> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY não configurada')

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`

  const body = {
    contents: [
      {
        parts: [
          { inline_data: { mime_type: mimeType, data: imageBase64 } },
          { text: PROMPT_VISAGISMO },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.3,
      response_mime_type: 'application/json',
    },
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Gemini API error ${response.status}: ${err}`)
  }

  const data = await response.json()
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text

  if (!text) throw new Error('Resposta inválida da IA')

  return JSON.parse(text) as VisagismoResponse
}
