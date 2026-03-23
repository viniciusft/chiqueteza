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
    justificativa_formato: string
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
    delineado: {
      formatos_recomendados: string[]
      motivo: string
      estilos_evitar: string[]
    }
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

const PROMPT_VISAGISMO = `Você é um especialista certificado em visagismo baseado na metodologia de Phillip Hallawell e colorimetria pelo sistema de 12 estações.

Analise esta foto com rigor técnico seguindo estas etapas obrigatórias:

ETAPA 1 - ANÁLISE GEOMÉTRICA (faça as medições mentais antes de classificar):
* Meça mentalmente: largura da testa, largura dos zigomáticos, largura da mandíbula
* Meça: comprimento total do rosto (testa ao mento)
* Compare: é mais largo que comprimento (redondo), similar (oval), comprimento maior que 1.5x a largura (oblongo)?
* Observe: mandíbula reta/angular (quadrado), pontuda (coração), mais larga que testa (triângulo invertido), zigomáticos proeminentes (diamante)
* Só classifique APÓS essas observações

ETAPA 2 - COLORIMETRIA (analise com cuidado a foto):
* Tom de pele: observe se há tendência amarelada (quente), rosada/azulada (frio) ou equilibrada (neutro) — escolha UM: quente, frio ou neutro
* Temperatura geral: quente ou frio
* Contraste entre pele, olhos e cabelo: alto, medio ou baixo
* Saturação da pele: alta, media ou baixa
* Com base em tudo isso, classifique em uma das 12 estações

ETAPA 3 - RELATÓRIO PERSONALIZADO:
* resumo_perfil: 2-3 frases descrevendo a harmonia do rosto desta pessoa especificamente, com base nas medições. Não use frases genéricas.
* o_que_te_valoriza: baseado no formato real do rosto identificado
* dica_especial: dica específica para O formato de rosto desta pessoa

Retorne APENAS JSON válido sem markdown, com esta estrutura exata:
{
  "analise_facial": {
    "formato_rosto": "",
    "terce_dominante": "",
    "caracteristicas_marcantes": [],
    "proporcoes": {
      "testa": "larga|media|estreita",
      "zigomatico": "proeminente|medio|suave",
      "mandibula": "angular|oval|pontuda",
      "comprimento": "longo|medio|curto"
    },
    "justificativa_formato": ""
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
    "delineado": {
      "formatos_recomendados": [],
      "motivo": "",
      "estilos_evitar": []
    }
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

Regras OBRIGATÓRIAS:
* formato_rosto: APENAS oval, redondo, quadrado, coracao, diamante, oblongo, triangular
* subtom: APENAS quente, frio, neutro (NUNCA use hífen ou combinações)
* temperatura: APENAS quente, frio
* contraste: APENAS alto, medio, baixo
* saturacao: APENAS alta, media, baixa
* estacao: uma das 12 estações em inglês (True Spring, Light Spring, Bright Spring, True Summer, Light Summer, Soft Summer, True Autumn, Soft Autumn, Dark Autumn, True Winter, Dark Winter, Bright Winter)
* paleta_cores.cores_ideais: 8 a 12 cores com HEX
* paleta_cores.cores_evitar: 4 a 6 cores com HEX
* maquiagem.batom: 4 a 6 opções do mais neutro ao mais ousado
* maquiagem.sombra: 3 a 5 opções
* maquiagem.blush: 2 ou 3 opções
* cabelo.cortes_recomendados: 3 a 5 opções COM motivo específico ao formato de rosto
* justificativa_formato: obrigatório — explicar POR QUE classificou como esse formato
* Todos os textos do relatório em português brasileiro informal e acolhedor
* HEX sempre no formato #RRGGBB`

// Ordem de preferência: tentar o mais capaz primeiro, fallback para o mais leve
const MODELS = ['gemini-2.5-flash', 'gemini-2.5-flash-lite']

export async function analyzeVisagismo(
  imageBase64: string,
  mimeType: string
): Promise<VisagismoResponse> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY não configurada')

  // Limpar base64: remover prefixo data URL e whitespace
  let cleanBase64 = imageBase64
  if (cleanBase64.includes(',')) {
    cleanBase64 = cleanBase64.split(',')[1]
  }
  cleanBase64 = cleanBase64.replace(/[\r\n\s]/g, '')

  const bodyBase = {
    contents: [
      {
        parts: [
          { inline_data: { mime_type: mimeType, data: cleanBase64 } },
          { text: PROMPT_VISAGISMO },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.2,
      response_mime_type: 'application/json',
    },
  }

  let lastError: Error = new Error('Nenhum model disponível')

  for (let i = 0; i < MODELS.length; i++) {
    const model = MODELS[i]
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 55_000)

    let response: Response
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyBase),
        signal: controller.signal,
      })
    } catch (err) {
      clearTimeout(timeoutId)
      lastError = new Error(`Gemini fetch falhou (${model}): ${err instanceof Error ? err.message : String(err)}`)
      // Rede/timeout: tentar próximo model
      continue
    } finally {
      clearTimeout(timeoutId)
    }

    // 429 quota excedida ou 503 indisponível: tentar próximo model
    if (response.status === 429 || response.status === 503) {
      const body = await response.text()
      lastError = new Error(`Gemini ${response.status} (${model}): ${body.slice(0, 200)}`)
      console.warn(`[analyzeVisagismo] ${model} retornou ${response.status}, tentando próximo...`)
      continue
    }

    if (!response.ok) {
      const body = await response.text()
      throw new Error(`Gemini API error ${response.status} (${model}): ${body.slice(0, 500)}`)
    }

    const data = await response.json()
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text

    if (!text) throw new Error(`Resposta inválida da IA (${model})`)

    return JSON.parse(text) as VisagismoResponse
  }

  throw lastError
}
