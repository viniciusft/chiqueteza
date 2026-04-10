# Feature: Visagismo + Colorimetria

**Status:** ✅ Concluído
**Última atualização:** 2026-04-10

---

## O que é
Análise facial e de colorimetria via IA (Gemini). A usuária faz upload de uma foto do rosto
e recebe: formato do rosto, estação de colorimetria, paleta de cores, recomendações de
maquiagem e cabelo. Resultado sempre visível (grátis); geração de imagens é premium (futuro).

---

## Arquivos principais

| Arquivo | O que faz |
|---|---|
| `app/app/visagismo/page.tsx` | Hub do visagismo (verifica análise existente) |
| `app/app/visagismo/upload/page.tsx` | Upload da foto com react-easy-crop |
| `app/app/visagismo/resultado/page.tsx` | Exibe resultado completo da análise |
| `app/app/visagismo/gerar/page.tsx` | Try-on de look (premium, futuro) |
| `app/api/visagismo/analisar/route.ts` | Chama lib/ai/analyzeVisagismo.ts |
| `lib/ai/analyzeVisagismo.ts` | Gemini Flash: análise facial + colorimetria |

---

## Progresso

- ✅ Upload com dois inputs separados (câmera / galeria) + react-easy-crop
- ✅ Consentimento LGPD antes do upload
- ✅ Análise via Gemini Flash com JSON estruturado
- ✅ Resultado completo: formato, estação, subtom, paleta, maquiagem, cabelo, relatório
- ✅ Cores exibidas como círculos HEX
- ✅ Verificação de análise existente no mês (não cobra de novo)
- ✅ Foto salva no Storage bucket `analises-faciais`
- ⏳ Geração de imagens (PremiumGate — V2, aguarda escolha de provider)

---

## Contexto técnico crítico

### Extração robusta do JSON do Gemini
```typescript
// lib/ai/analyzeVisagismo.ts
const parts = data?.candidates?.[0]?.content?.parts ?? []
const text = parts.find((p) => p.text?.trim().startsWith('{'))?.text
```
**Por quê:** Alguns modelos Gemini retornam bloco de "thinking" antes do JSON.
`parts[0]` pode não ser o JSON. O `.find()` garante que pegamos o JSON certo.

### Models em uso
- Principal: `gemini-3-flash-preview`
- Fallback: `gemini-2.5-flash`
- **NÃO usar:** `gemini-2.0-flash` (deprecated, causa erro 429)
- **REGRA:** Antes de trocar modelo, verificar no Google AI Studio qual está funcionando

### Formato da foto enviada ao Gemini
- Base64 limpo (sem prefixo `data:image/jpeg;base64,`)
- Enviado como `inline_data` no corpo da requisição
- Timeout: 55s via AbortController

### Tabela `analise_facial`
- `dados_brutos` (jsonb) = resposta completa da IA
- `mes_referencia` (formato `YYYY-MM`) — uma análise por mês no plano grátis
- `prompt_tecnico` dos looks: NUNCA retornado em rotas públicas

---

## Próximos passos (V2)
- Geração de imagem com look aplicado (FLUX Kontext Pro via fal.ai)
- PremiumGate: "Experimentar este batom no meu rosto" → 10 créditos
- Botões em cada seção do resultado → geração específica
</content>
</invoke>