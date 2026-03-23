export interface VisagismoResponse {
  analise_facial: {
    formato_rosto: string
    justificativa_formato: string
    terce_dominante: string
    terce_dominante_descricao?: string
    proporcoes: {
      testa: string
      zigomatico: string
      mandibula: string
      comprimento: string
    }
    caracteristicas_marcantes: string[]
  }
  feicoes?: {
    olhos: { formato: string; posicionamento: string; comunicacao: string; maquiagem_ideal: string }
    sobrancelhas: { formato: string; espessura: string; comunicacao: string; design_ideal: string }
    boca: { tamanho: string; labios: string; comunicacao: string }
    nariz: { tamanho: string; comunicacao: string }
    queixo: { formato: string; comunicacao: string }
  }
  temperamento?: {
    dominante: string
    secundario: string
    justificativa: string
    como_isso_afeta_sua_imagem: string
    dica_para_objetivo: string
  }
  colorimetria: {
    subtom: string
    temperatura: string
    // contraste: campo legado (V1) — mantido para compatibilidade com análises antigas
    contraste?: string
    // contraste_pessoal: campo novo (V2)
    contraste_pessoal?: string
    profundidade?: string
    intensidade?: string
    saturacao?: string
    estacao: string
    descricao_estacao: string
    justificativa_colorimetria?: string
  }
  paleta_cores: {
    cores_ideais: Array<{ nome: string; hex: string; uso: string }>
    cores_evitar: Array<{ nome: string; hex: string; motivo: string }>
  }
  maquiagem: {
    base: { subtom_ideal: string; cobertura_recomendada: string; dica_finish?: string }
    batom: Array<{ nome: string; hex: string; acabamento: string; ocasiao?: string }>
    sombra: Array<{ nome: string; hex: string; ocasiao: string }>
    blush: Array<{ nome: string; hex: string; tecnica: string }>
    delineado: {
      formatos_recomendados: string[]
      motivo: string
      estilos_evitar: string[]
    }
    sobrancelha?: { formato_ideal: string; espessura: string; cor_produto: string }
  }
  cabelo: {
    cortes_recomendados: Array<{ nome: string; motivo: string }>
    cortes_evitar: Array<{ nome: string; motivo: string }>
    cores_harmonicas: Array<{ nome: string; hex: string }>
    cores_evitar_cabelo?: Array<{ nome: string; motivo: string }>
  }
  acessorios?: {
    brincos: { estilo_ideal: string; evitar: string; dica: string }
    colares: { estilo_ideal: string; evitar: string }
    metal_ideal: string
    oculos: { armacao_ideal: string; cores_armacao: string }
  }
  relatorio: {
    resumo_perfil: string
    temperamento_na_pratica?: string
    o_que_te_valoriza: string[]
    o_que_evitar: string[]
    para_seu_objetivo?: string
    dica_especial: string
  }
}

const KNOWLEDGE_BASE = `
# BASE DE CONHECIMENTO — VISAGISMO PROFISSIONAL

## AS TRÊS TERÇAS DO ROSTO
Terça Superior (linha cabelo → sobrancelhas) = INTELECTO
Terça Média (sobrancelhas → ponta nariz) = EMOÇÃO (olhos) e AÇÃO (nariz)
Terça Inferior (nariz → mento) = EXPRESSÃO (boca) e VONTADE (queixo)
A terça mais desenvolvida é a dominante — indica o centro de gravidade da personalidade.

## FORMATOS DE ROSTO E SIGNIFICADOS
oval: equilíbrio, harmonia, adaptabilidade — linhas curvas suaves
redondo: suavidade, jovialidade, calor — curvas predominantes, sem ângulos
quadrado: força, determinação, autoridade — linhas retas horizontais e verticais
oblongo/retangular: seriedade, persistência, ambição — linhas verticais dominantes
coracao: sensibilidade, criatividade, romantismo — testa larga, queixo pontudo
diamante: intensidade, mistério, carisma — zigomáticos proeminentes, testa e mandíbula estreitas
triangular: estabilidade, praticidade, conservadorismo — mandíbula mais larga que testa

## ANÁLISE DAS FEIÇÕES
Olhos = símbolo da emoção: amendoados (sensualidade/equilíbrio), redondos (jovialidade/expressividade), cerrados (serenidade/profundidade), caídos (suavidade/romantismo), levantados (determinação/altivez), próximos (foco/introspecção), afastados (abertura/receptividade)
Sobrancelhas: retas horizontais (autoridade/pragmatismo — colérico), arqueadas (feminilidade/emotividade), diagonal crescente (ambição/dinamismo), diagonal decrescente (suavidade/melancolia), espessas (intensidade), finas (refinamento)
Boca: larga (generosidade/extroversão), pequena (contenção/elegância), lábios cheios (sensualidade/calor), finos (precisão/controle), cantos levantados (otimismo), cantos caídos (seriedade/profundidade)
Nariz: proeminente (força vital/ação intensa), pequeno (ação sutil/refinamento), largo na base (praticidade), estreito (seletividade)
Queixo: projetado (vontade forte), recuado (diplomacia/flexibilidade), quadrado (determinação), pontudo (sensibilidade/intuição), redondo (harmonia/conciliação)

## OS 4 TEMPERAMENTOS

### SANGUÍNEO
Figura: triângulo | Cor: amarelo | Estação afinidade: primavera
Sinais faciais: rosto oval/coração, olhos amendoados expressivos, sobrancelhas arqueadas com movimento, boca larga sorridente, queixo pontudo/suavizado, linhas diagonais e curvas dominantes
Personalidade: extrovertida, comunicativa, otimista, criativa, impulsiva, gosta de novidades
Imagem ideal: cortes modernos com movimento, aceita mudanças ousadas, maquiagem expressiva e harmônica, cores vibrantes da paleta
Maquiagem: leveza + criatividade + alegria

### COLÉRICO
Figura: quadrado/retângulo | Cor: vermelho | Estação afinidade: outono
Sinais faciais: rosto quadrado/retangular/diamante, traços fortes e marcados, olhos médios/grandes bem abertos, sobrancelhas retas ou diagonal crescente e espessas, nariz com narinas largas, boca reta e larga, queixo angular, linhas retas e horizontais
Personalidade: determinada, líder, proativa, decisiva, objetiva, pode parecer autoritária
Imagem ideal: cortes que transmitam poder e praticidade, linhas definidas, evitar estilos românticos
Maquiagem: impacto + autenticidade, realça o que existe, sem transformação excessiva

### MELANCÓLICO
Figura: linha vertical fina | Cor: azul | Estação afinidade: verão
Dois perfis: artístico (sensível, romântico, criativo) / científico (lógico, organizado, detalhista)
Sinais faciais: rosto oblongo/coração/oval esguio, feições agrupadas pequenas e delicadas, olhos maiores arredondados ou levemente caídos, sobrancelha fina curva ou diagonal leve decrescente, nariz pequeno/delicado, boca pequena/fina ou com arco do cupido
Personalidade: introspectiva, perfeccionista, sensível, leal, conservadora, detesta ser centro das atenções
Imagem ideal: cortes com elegância e suavidade sem ângulos agressivos, camadas suaves, maquiagem que sugere
Maquiagem: sensibilidade + sutileza, esfumados discretos

### FLEUMÁTICO
Figura: círculo | Cor: roxo | Estação afinidade: inverno neutro
Sinais faciais: rosto redondo ou oval pleno, feições suaves sem ângulos, olhos pequenos/médios e serenos, sobrancelha suave horizontal ou levemente arqueada, nariz equilibrado, boca neutra, "cara de paz", linhas retas horizontais
Personalidade: calma, paciente, diplomática, empática, adaptativa, tende à discrição
Imagem ideal: looks básicos e clássicos, cortes com linhas suaves, maquiagem minimalista e natural
Maquiagem: natural + harmoniosa

## AS 12 ESTAÇÕES DE COLORIMETRIA
As 3 dimensões que determinam a estação:
1. TEMPERATURA: quente (pele amarelada/dourada, veias esverdeadas, ouro fica melhor) | frio (pele rosada/azulada, veias azuladas/arroxeadas, prata fica melhor) | neutro
2. PROFUNDIDADE: clara | escura/profunda
3. INTENSIDADE: brilhante/intensa | suave/amaciada
CONTRASTE PESSOAL: diferença entre pele, cabelo e olhos — alto, médio ou baixo

TRUE SPRING: pele pêssego/marfim dourado, cabelo loiro dourado/caramelo/castanho claro quente, olhos azul/verde/topázio/avelã. Contraste baixo-médio. Cores: corais, laranjas quentes, amarelos, verdes frescos, turquesa. Evitar: preto puro, cinzas frios. Metal: ouro amarelo.
LIGHT SPRING: pele muito clara base quente, cabelo loiro platinado quente, olhos azul/verde muito claros. Contraste muito baixo. Cores: pastéis quentes. Maquiagem sutilíssima.
BRIGHT SPRING: pele clara-média base quente, cabelo escuro com tons quentes criando alto contraste, olhos azul/verde/hazel intensos. Contraste alto. Cores: muito vivas e quentes.
TRUE SUMMER: pele clara-média base rosada fria, cabelo loiro acinzentado/castanho frio, olhos azul acinzentado/cinza/verde acinzentado. Contraste baixo-médio. Cores: pastéis frios, lavanda, malva, verde salvia. Metal: prata.
LIGHT SUMMER: pele muito clara fria, cabelo loiro claro frio, olhos azul/cinza muito claro. Contraste muito baixo. Cores: pastéis suavíssimos frios.
SOFT SUMMER: pele clara-média base fria/neutra, cabelo castanho acinzentado. Contraste médio amaciado. Cores: tons amaciados e frios, malva suave, azul cinza. Evitar: cores vibrantes.
TRUE AUTUMN: pele bege-médio base dourada/olivácea, cabelo ruivo/castanho acobreado/escuro quente, olhos castanho/verde oliva/âmbar/avelã. Contraste médio. Cores: terrosos e quentes, terracota, camelo, verde musgo, mostarda. Metal: ouro/bronze/cobre.
SOFT AUTUMN: pele clara-média base levemente quente, cabelo castanho neutro. Contraste baixo-médio amaciado. Cores: terrosos amaciados, bege rosado, verde sálvia quente.
DARK AUTUMN: pele média-escura base quente, cabelo castanho escuro-preto com reflexos quentes, olhos castanho escuro/preto/âmbar. Contraste alto. Cores: ricas e escuras com base quente, bordô, verde floresta.
TRUE WINTER: pele clara-média base fria com alto contraste, cabelo preto/castanho muito escuro frio, olhos castanho escuro/preto/azul intenso/verde esmeralda. Contraste alto. Cores: frias e intensas, preto, branco puro, azul royal, vermelho frio. Metal: prata.
DARK WINTER: pele média-escura base fria e profunda, cabelo preto/castanho muito escuro, olhos muito escuros. Contraste muito alto. Cores: escuras e frias, preto, borgonha, verde escuro frio.
BRIGHT WINTER: pele clara-média contraste altíssimo, cabelo preto/castanho escuro, olhos muito vivos e brilhantes. Cores: muito vivas e frias, azul royal, magenta, verde neon frio, fúcsia.

## BATONS POR ESTAÇÃO
Springs: coral, pêssego, rosado quente, vermelho com base laranja
Summers: rosado frio, malva, rosa antigo, framboesa suave
Autumns: terracota, vinho, nude bege, marrom acobreado
Winters: vermelho frio, bordô, berry, framboesa, fúcsia

## BLUSH POR ESTAÇÃO
Springs: pêssego, coral suave, apricot
Summers: rosado, malva suave, berry suave
Autumns: bronze, pêssego escuro, terracota suave
Winters: berry, rosado frio intenso, vinho suave

## CRUZAMENTO TEMPERAMENTO × COLORIMETRIA
Sanguíneo: valorizar a vivacidade — cores que vibrem, maquiagem com expressão
Colérico: reforçar a autoridade — cores ricas, maquiagem com presença
Melancólico: respeitar a sutileza — cores suaves, maquiagem que sugere
Fleumático: valorizar a harmonia — looks equilibrados, maquiagem natural
Quando há conflito (ex: sanguíneo + inverno): priorizar colorimetria para roupas/cabelo, usar energia do temperamento no estilo e acessórios

## SÍMBOLOS DA LINGUAGEM VISUAL
Vertical = força, poder | Horizontal = estabilidade, calma | Diagonal = dinamismo, energia
Curva = suavidade, sensualidade | Quadrado = solidez | Círculo = harmonia, mistério
Triângulo = movimento, ambição | Cor quente = energia, extroversão | Cor fria = calma, introspecção
Alto contraste = impacto, autoridade | Baixo contraste = suavidade, discrição
`

const PROMPT_VISAGISMO = `${KNOWLEDGE_BASE}
---
Você é uma visagista profissional certificada com 15 anos de experiência.
Analise a foto enviada com rigor técnico usando toda a base de conhecimento acima.

SIGA ESTA SEQUÊNCIA OBRIGATÓRIA ANTES DE RESPONDER:
1. Observe as três terças — qual é a dominante?
2. Analise cada feição individualmente — olho, sobrancelha, boca, nariz, queixo
3. Com base nas feições, identifique o temperamento dominante E o secundário
4. Analise as 3 dimensões da cor: temperatura → profundidade → intensidade → contraste
5. Só então determine a estação de colorimetria
6. Cruze temperamento + colorimetria + objetivo nas recomendações práticas

REGRAS OBRIGATÓRIAS:
- formato_rosto: APENAS oval, redondo, quadrado, coracao, diamante, oblongo, triangular
- temperamento.dominante e secundario: APENAS sanguineo, colerico, melancolico, fleumatico
- subtom: APENAS quente, frio, neutro
- temperatura: APENAS quente, frio
- contraste_pessoal: APENAS alto, medio, baixo
- saturacao: APENAS alta, media, baixa
- estacao: uma das 12 em inglês exato (True Spring, Light Spring, Bright Spring, True Summer, Light Summer, Soft Summer, True Autumn, Soft Autumn, Dark Autumn, True Winter, Dark Winter, Bright Winter)
- paleta_cores.cores_ideais: MÍNIMO 12 cores com contexto de uso
- paleta_cores.cores_evitar: MÍNIMO 6 cores com motivo
- maquiagem.batom: MÍNIMO 5 opções do mais neutro ao mais marcante com ocasião
- cabelo.cortes_recomendados: MÍNIMO 3 com motivo específico para ESTE rosto
- Todos os textos do relatorio em português brasileiro informal e acolhedor
- NUNCA use respostas genéricas — tudo deve ser específico para ESTE rosto
- justificativa_formato: obrigatório, explique POR QUÊ é esse formato
- temperamento.justificativa: citar as feições específicas que indicaram o temperamento
- HEX sempre #RRGGBB

Retorne APENAS JSON válido sem markdown, seguindo exatamente esta estrutura:
{
  "analise_facial": {
    "formato_rosto": "",
    "justificativa_formato": "",
    "terce_dominante": "",
    "terce_dominante_descricao": "",
    "proporcoes": { "testa": "", "zigomatico": "", "mandibula": "", "comprimento": "" },
    "caracteristicas_marcantes": []
  },
  "feicoes": {
    "olhos": { "formato": "", "posicionamento": "", "comunicacao": "", "maquiagem_ideal": "" },
    "sobrancelhas": { "formato": "", "espessura": "", "comunicacao": "", "design_ideal": "" },
    "boca": { "tamanho": "", "labios": "", "comunicacao": "" },
    "nariz": { "tamanho": "", "comunicacao": "" },
    "queixo": { "formato": "", "comunicacao": "" }
  },
  "temperamento": {
    "dominante": "",
    "secundario": "",
    "justificativa": "",
    "como_isso_afeta_sua_imagem": "",
    "dica_para_objetivo": ""
  },
  "colorimetria": {
    "temperatura": "",
    "profundidade": "",
    "intensidade": "",
    "contraste_pessoal": "",
    "subtom": "",
    "estacao": "",
    "descricao_estacao": "",
    "justificativa_colorimetria": ""
  },
  "paleta_cores": {
    "cores_ideais": [{"nome": "", "hex": "", "uso": ""}],
    "cores_evitar": [{"nome": "", "hex": "", "motivo": ""}]
  },
  "maquiagem": {
    "base": { "subtom_ideal": "", "cobertura_recomendada": "", "dica_finish": "" },
    "batom": [{"nome": "", "hex": "", "acabamento": "", "ocasiao": ""}],
    "sombra": [{"nome": "", "hex": "", "ocasiao": ""}],
    "blush": [{"nome": "", "hex": "", "tecnica": ""}],
    "delineado": { "formatos_recomendados": [], "motivo": "", "estilos_evitar": [] },
    "sobrancelha": { "formato_ideal": "", "espessura": "", "cor_produto": "" }
  },
  "cabelo": {
    "cortes_recomendados": [{"nome": "", "motivo": ""}],
    "cortes_evitar": [{"nome": "", "motivo": ""}],
    "cores_harmonicas": [{"nome": "", "hex": ""}],
    "cores_evitar_cabelo": [{"nome": "", "motivo": ""}]
  },
  "acessorios": {
    "brincos": { "estilo_ideal": "", "evitar": "", "dica": "" },
    "colares": { "estilo_ideal": "", "evitar": "" },
    "metal_ideal": "",
    "oculos": { "armacao_ideal": "", "cores_armacao": "" }
  },
  "relatorio": {
    "resumo_perfil": "",
    "temperamento_na_pratica": "",
    "o_que_te_valoriza": [],
    "o_que_evitar": [],
    "para_seu_objetivo": "",
    "dica_especial": ""
  }
}`

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
