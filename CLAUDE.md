# CLAUDE.md — Contexto do Projeto para o Claude Code

## Identidade do Projeto
- **Nome:** Chiqueteza
- **Repositório:** https://github.com/viniciusft/chiqueteza
- **Stack:** Next.js 14 (App Router), Supabase, Vercel, TypeScript, Tailwind CSS
- **Tipo:** PWA (Progressive Web App) — foco mobile, sem app nativo
- **Supabase Project ID:** zzrlrrzdusrtkkyvtirm
- **Supabase URL:** https://zzrlrrzdusrtkkyvtirm.supabase.co

## O que é este app
Assistente pessoal de beleza B2C. Foco em mulheres entre 18–45 anos
com alta recorrência em serviços de beleza.

## Regras absolutas
- NUNCA expor chaves de API no frontend
- Toda chamada de IA passa por route handler server-side
- NUNCA hardcodar URLs — sempre usar process.env.NEXT_PUBLIC_SITE_URL
- NUNCA quebrar RLS (Row Level Security) do Supabase
- Provider de IA abstraído em lib/ai/ — permite troca sem refatoração
- Sempre TypeScript — sem any sem justificativa
- Commits em português, descritivos
- Checkpoint com git commit antes de qualquer tarefa
- prompt_tecnico dos looks NUNCA retornado em rotas públicas
- Verificar créditos SEMPRE server-side, nunca confiar no frontend

---

## Identidade Visual
- **Ever Green:** #1B5E5A — cor primária, cards principais
- **Pink Peony:** #F472A0 — destaque e acentos
- **Silver Platter:** #E8E8E8 / #F5F5F5 — fundo geral
- **Wedding Band:** #D4A843 — dourado, card dica especial
- **Something Blue:** #A8C5CC — elementos secundários
- **Fonte:** Inter (Google Fonts)
- **Tom:** vibrante, moderno, feminino, personalidade brasileira
- **Layout:** mobile-first, max-width 430px centralizado

---

## Modelo de Negócio

### Plano Grátis — para sempre
- Rotina e agendamentos (ilimitado)
- Caderneta de profissionais (ilimitada)
- 1 análise de visagismo por mês (relatório textual apenas, sem imagens)
- 3 Try-Ons por mês (para descobrir o valor antes de pagar)

### Plano Premium — R$19,90/mês
- Tudo do grátis ilimitado
- 100 créditos por mês (não acumulam — incentiva uso mensal)
- Visagismo com imagens geradas
- Try-On ilimitado em alta qualidade
- Ideias de corte de cabelo (futuro)

### Tabela de custos em créditos (lib/credits/costs.ts)
- VISAGISMO_IMAGEM: 10 créditos (gerar look em cada seção do visagismo)
- TRYON_LOOK: 15 créditos (try-on completo)
- VISAGISMO_REFAZER: 5 créditos (refazer análise no mesmo mês)
- CORTE_CABELO: 10 créditos (futuro)

### Estratégia anti-churn
- Agenda e profissionais são ilimitadas e gratuitas (criam hábito diário)
- Créditos mensais criam motivo para renovar todo mês
- Botões "gerar imagem nesse estilo" em cada seção do visagismo
  criam desejo específico durante o uso → conversão natural para premium
- Usuária free usa o app normalmente mas vê o que poderia ter

---

## Banco de Dados — Tabelas existentes

### perfis
- id (FK auth.users), nome, avatar_url, created_at, updated_at
- Criado automaticamente via trigger on_auth_user_created

### planos
- id (TEXT: 'free' | 'premium'), nome, preco, creditos_mensais, descricao, ativo

### creditos_usuarios
- id, usuario_id → perfis
- plano_id → planos (default: 'free')
- creditos_disponiveis, creditos_usados_mes
- mes_referencia (formato 'YYYY-MM')
- renovacao_em, created_at, updated_at
- UNIQUE(usuario_id, mes_referencia)

### transacoes_creditos
- id, usuario_id → perfis
- tipo: 'uso' | 'recarga' | 'bonus'
- quantidade, feature, descricao, created_at

### looks (arsenal de maquiagem)
- id, nome, descricao_visual, imagem_referencia_url
- prompt_tecnico — NUNCA exposto no frontend
- categoria: social/noiva/formatura/dia/balada/natural/dramatico
- tags (jsonb), ativo, ordem

### geracoes (histórico de try-ons)
- id, usuario_id, look_id
- foto_original_url, foto_gerada_url, provider_usado

### analise_facial (visagismo + colorimetria)
- id, usuario_id
- formato_rosto: oval/redondo/quadrado/coracao/diamante/oblongo/triangular
- terce_dominante, caracteristicas_marcantes (text[])
- subtom: quente/frio/neutro
- estacao (das 12 estações de colorimetria)
- paleta_cores, cores_evitar (jsonb)
- tons_batom, tons_sombra, tons_blush (jsonb)
- subtom_base, estilos_delineado (text[])
- looks_recomendados (uuid[])
- formatos_corte_recomendados, cortes_evitar (jsonb — futuro)
- relatorio_texto, dados_brutos (jsonb — resposta completa da IA)
- foto_url, provider_usado
- mes_referencia (formato 'YYYY-MM')

### servicos_beleza (alertas de intervalo)
- id, usuario_id, nome
- ultimo_procedimento (date), frequencia_dias
- lembrete_ativo, observacoes

### profissionais
- id, usuario_id, nome, especialidades (text[])
- telefone, instagram, avaliacao (1-5), valor_medio
- fotos_urls (text[]), observacoes, ativo

### agendamentos_rotina
- id, usuario_id, profissional_id
- servico_nome, data_hora (timestamptz), valor
- status: agendado/concluido/cancelado
- observacoes, foto_resultado_url
- Label visual: agendado→"Agendado", concluido→"Realizado", cancelado→"Cancelado"

### fotos_referencia
- id, usuario_id, foto_url, titulo, tags (text[])

### push_subscriptions
- id, usuario_id, subscription_json (jsonb)

### Funções SQL
- usar_creditos(usuario_id, quantidade, feature, descricao) → boolean
  Chamar via supabase.rpc() sempre server-side

---

## Motor de IA — abstraído em lib/ai/

**Status: EM AVALIAÇÃO — provider pode ser trocado sem refatorar**

- lib/ai/analyzeVisagismo.ts — análise facial e colorimetria (Gemini)
- lib/ai/generateMakeup.ts — geração de look no rosto (FLUX Kontext Pro)
- lib/ai/generateHairstyle.ts — ideias de corte (futuro)

### Custo estimado por operação
- Análise visagismo (Gemini 2.5 Flash): ~$0.001 (R$0,01)
- Imagem gerada: EM AVALIAÇÃO — não implementado ainda
- Análise completa com 3 imagens: custo a confirmar após escolha de provider de imagem

### Gemini 2.5 Flash — análise visagismo (provider atual)
Models em uso (fallback automático): gemini-3-flash-preview → gemini-2.5-flash
URL: https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent
Enviar foto como inline_data (base64 limpo, sem prefixo data URL) + prompt estruturado
generationConfig: temperature 0.2, response_mime_type "application/json"
Timeout: 55s via AbortController

## Gemini API — Atenção

### Model atual em uso
- Principal: `gemini-3-flash-preview`
- Fallback: `gemini-2.5-flash`

### REGRA MAIS IMPORTANTE
Antes de trocar qualquer model do Gemini, verificar no Google AI Studio
qual model está configurado/funcionando no projeto. Trocar o model
sem verificar é a causa mais comum de quebrar o visagismo.

### Erro recorrente — "The String did not match the expected pattern"
Causas conhecidas:
1. Model retorna bloco de "thinking" antes do JSON — `parts[0]` não é o JSON
2. Model errado (ex: gemini-2.0-flash está deprecated)

Solução aplicada em lib/ai/analyzeVisagismo.ts:
- Extração robusta usando .find() em vez de parts[0]:
  const parts = data?.candidates?.[0]?.content?.parts ?? []
  const text = parts.find((p) => p.text?.trim().startsWith('{'))?.text
- Se usar model com thinking ativo, adicionar no generationConfig:
  thinkingConfig: { thinkingBudget: 0 }

### Models a evitar
- `gemini-2.0-flash` — deprecated, causa erro 429

### Geração de imagens — EM AVALIAÇÃO
FLUX Kontext Pro via fal.ai (fal-ai/flux-pro/kontext) está listado como opção
mas NÃO está implementado ainda. Provider será escolhido na V2.

---

## Features do Produto

### Implementado
- Autenticação (Supabase Auth)
- Tab bar 5 abas: Início | Looks | Autocuidado | Agenda | Profissionais
- Módulo Rotina (Agenda): agendamentos, alertas, histórico, gasto mensal
- Módulo Profissionais: caderneta, galeria, WhatsApp, compartilhar
- Ação rápida WhatsApp nos cards de agendamento
- Sistema de planos e créditos (banco criado)
- Design system com paleta Chiqueteza
- Cache stale-while-revalidate (lib/cache/ + useCache hook)
- Service Worker PWA (public/sw.js)
- Visagismo + Colorimetria: upload, análise Gemini, resultado, foto salva no Storage
- Upload com preview mode e dois inputs separados (câmera / galeria)
- Diário de Looks: registro pessoal + galeria pública com curtidas
- Checklist de Autocuidado: rotinas, streaks, drag-and-drop, lembretes
- Armário Digital: produtos em posse, nível de uso, ciclo completo
- Integração Mercado Livre: busca API pública, deeplinks de afiliado
- OCR de embalagem: Gemini Flash extrai nome/marca/categoria de foto
- Wishlist → Armário: migração automática ao marcar como comprado
- Jobs Inngest: verificação diária de preços ML + alertas de reposição

### Em desenvolvimento (V2)
- Try-On de maquiagem
- PremiumGate (componente de bloqueio de features)

### Roadmap V3
- Ideias de corte de cabelo (usa dados do visagismo)
- Matching de base colaborativo (após base de usuárias)

### Roadmap futuro
- Marketplace de profissionais
- Integração com Âmbar Beauty Studio

---

## Pipeline do Visagismo

```
1. Verificar se já tem análise este mês
   → Se sim: mostrar existente, oferecer refazer (custa 5 créditos premium)

2. Upload da foto
   → Instrução: frontal, rosto próximo, boa iluminação, sem filtros
   → Salvar no Supabase Storage bucket 'analises-faciais'

3. Chamada server-side: lib/ai/analyzeVisagismo.ts
   → Gemini recebe foto em base64 + prompt estruturado
   → Retorna JSON com analise_facial, colorimetria, paleta,
     maquiagem, cabelo, relatorio

4. Salvar em analise_facial (dados_brutos = JSON completo)

5. Tela de resultado — sempre visível (grátis):
   → Perfil: estação + formato + subtom
   → Paleta de cores ideais e a evitar
   → Maquiagem: batom, sombra, blush, delineado (visual com círculos HEX)
   → Cabelo: cortes recomendados e a evitar
   → Relatório: resumo, o que valoriza, o que evitar, dica especial

6. Botões PremiumGate em cada seção (premium):
   → "Experimentar este batom no meu rosto" → 10 créditos
   → "Testar este look de olho" → 10 créditos
   → Chama lib/ai/generateMakeup.ts com o tom específico
```

## Pipeline do Try-On

```
1. Upload da foto (validação: frontal, rosto próximo, boa luz)

2. Arsenal de looks navegável por categoria
   → Looks marcados como recomendados aparecem primeiro (se tiver visagismo)
   → Cada look: imagem de referência + nome + categoria

3. Seleção → chamada server-side
   → Verificar créditos (15 créditos premium ou contador free)
   → Buscar prompt_tecnico do look (NUNCA exposto)
   → Chamar lib/ai/generateMakeup.ts

4. Resultado: slider antes/depois
   → Salvar em geracoes
```

---

## Componentes UI importantes

### PremiumGate (components/ui/PremiumGate.tsx)
- Props: feature, creditCost, children, fallback
- Se premium com créditos: renderiza children
- Se free ou sem créditos: renderiza botão bloqueado com cadeado
- Ao clicar: bottom sheet com descrição + custo + botão "Assinar Premium"
- Botão assinar: por enquanto toast "Em breve disponível"

### ActionSheet (components/ui/ActionSheet.tsx)
- Props: isOpen, onClose, title, actions[]
- Reutilizável para menus de ação em agendamentos e outros

### ProfissionalActions (components/ui/ProfissionalActions.tsx)
- Props: profissional
- Renderiza 3 botões: WhatsApp, Instagram, Compartilhar
- Reutilizado na lista e no perfil da profissional

---

## Variáveis de Ambiente
```
NEXT_PUBLIC_SITE_URL
NEXT_PUBLIC_SUPABASE_URL=https://zzrlrrzdusrtkkyvtirm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
GEMINI_API_KEY
FAL_KEY
NEXT_PUBLIC_VAPID_KEY
VAPID_PRIVATE_KEY
```

---

## Notas de Privacidade (LGPD)
- Fotos de rosto são dados biométricos sensíveis
- Consentimento explícito obrigatório antes de qualquer upload de foto
- Política de privacidade visível na tela de upload
- Buckets Supabase Storage: analises-faciais, profissionais-fotos, looks-gerados
- Providers com política de não retenção de dados

---

## Diário de Looks

### Tabelas
- `looks_diario`: id, usuario_id, foto_url, contexto, avaliacao, descricao, publico, curtidas, largura, altura, aspect_ratio, created_at, updated_at
- `looks_curtidas`: id, look_id, usuario_id, created_at

### Storage
- Bucket: `looks-diario` (público para leitura)
- Path obrigatório: `{userId}/{uuid}.jpg`
- Políticas RLS: INSERT apenas para usuária autenticada no próprio diretório

### Editor de imagem
- **react-image-crop** — crop livre, React 18 compatível, mobile-friendly
- ⚠️ ATENÇÃO: NÃO usar `react-filerobot-image-editor` — incompatível com React 18 (exige React 19)
- ⚠️ ATENÇÃO: `react-easy-crop` continua sendo usado APENAS no visagismo (`app/app/visagismo/upload/page.tsx`). Não remover.

### Processamento de imagem (client-side)
- base64 do Filerobot → `atob()` → `Uint8Array` → `Blob`
- Redimensionar: máx 1080px no lado maior, quality 0.85, canvas
- Retorna `{ blob, dataUrl, largura, altura }`

### Upload e insert (client-side)
- Usar `supabase` (client, não admin) — RLS permite
- userId sempre via `supabase.auth.getUser()`, nunca hardcodado
- Upload: `supabase.storage.from('looks-diario').upload(path, blob, { contentType: 'image/jpeg' })`
- URL pública: `supabase.storage.from('looks-diario').getPublicUrl(path)`
- Insert: `supabase.from('looks_diario').insert({...})`
- `aspect_ratio` é coluna **GENERATED ALWAYS** — nunca incluir no insert; o banco calcula automaticamente a partir de `largura` e `altura`

### Layout
- `react-masonry-css` — 2 colunas, proporção livre das fotos
- Classes CSS em `app/globals.css`: `.masonry-grid`, `.masonry-grid_column`

### Rotas
- `/app/looks` — privada (redirect para login se não autenticada)
- `/app/galeria` — pública (qualquer pessoa pode ver)
- `/app/looks/novo?publico=true` — abre com toggle público ativado

---

## Checklist de Autocuidado

### Tabelas
- `checklist_rotinas`: id, usuario_id, nome, descricao, categoria, emoji, frequencia, dias_semana (text[]), hora_lembrete (time), lembrete_ativo, ativo, streak_atual, streak_maximo, total_completados, ordem, created_at, updated_at
- `checklist_completacoes`: id, rotina_id, usuario_id, data_completada (date), created_at
- UNIQUE constraint: `checklist_completacoes(rotina_id, usuario_id, data_completada)`

### ⚠️ Nomes de colunas críticos
- `hora_lembrete` (NÃO `lembrete_hora`) — tipo `time`
- `lembrete_ativo` (boolean) — correto
- `ativo` (NÃO `ativa`) — boolean
- `dias_semana` é `text[]` — sempre converter `number[]` para `string[]` antes do insert (`.map(String)`)
- `streak_atual` e `streak_maximo` existem e têm default 0 — podem ser incluídos nos updates
- `frequencia`: 'diaria' | 'semanal' | 'personalizada'

### Wishlist
- `wishlist_produtos`: id, usuario_id, nome, marca, categoria, subcategoria, preco_estimado, foto_url, link_compra, status ('quero' | 'tenho' | 'comprei'), prioridade ('alta' | 'media' | 'baixa'), notas, tags, ordem, created_at
- Storage: bucket `wishlist-fotos`, path `{userId}/{uuid}.jpg`
- Status flow na UI: apenas `quero` e `comprei` (sem `tenho` — legado mantido no banco)

---

## Armário Digital

### Tabelas

**`armario_produtos`** — produtos em posse da usuária
- id, usuario_id → perfis
- nome (NOT NULL), marca, categoria, subcategoria, volume_total, foto_url, ean
- data_abertura (date), frequencia_uso ('diaria'|'semanal'|'mensal'|'raramente')
- nivel_atual (int 0-100, default 100), data_validade, data_fim_estimada
- ml_produto_id, ml_titulo, ml_preco_atual, ml_preco_minimo, ml_preco_checado_em, ml_permalink, ml_deeplink
- status ('em_uso'|'acabando'|'finalizado'|'guardado') — calculado via trigger SQL
- origem ('manual'|'busca_ml'|'ocr_foto'|'da_wishlist')
- wishlist_id → wishlist_produtos (link bidirecional)
- notas, tags (text[]), ordem, created_at, updated_at
- Trigger: `trg_status_armario` → `fn_status_armario_auto()` — auto status por nivel_atual

**`historico_precos`** — histórico de verificações de preço ML
- id, armario_produto_id → armario_produtos, wishlist_produto_id → wishlist_produtos
- ml_produto_id (NOT NULL), preco, disponivel, coletado_em
- Índice: `idx_historico_preco_produto(ml_produto_id, coletado_em DESC)`

**`wishlist_produtos`** — adicionadas 3 colunas:
- armario_id → armario_produtos (link quando migrado)
- ml_produto_id, ml_deeplink

### Storage
- Bucket: `armario-fotos` (público para leitura)
- Path obrigatório: `{userId}/{uuid}.jpg`
- Políticas RLS: INSERT apenas para usuária autenticada no próprio diretório

### Regras importantes
- Deeplinks de afiliado sempre gerados server-side (`app/api/armario/buscar-ml`) — nunca expor `ML_AFFILIATE_TRACKING_ID` no frontend
- OCR de embalagem sempre via route handler server-side (`app/api/armario/ocr-foto`) — nunca expor `GEMINI_API_KEY` no frontend
- `status` é calculado automaticamente pelo trigger SQL — não forçar manualmente
- `data_fim_estimada`: calculado como `data_abertura + dias por frequência` (diaria=30, semanal=90, mensal=180, raramente=365)
- Nível ≤ 15% → status muda para 'acabando' automaticamente

### Variáveis de Ambiente (Armário)
```
ML_AFFILIATE_TRACKING_ID=          # Portal ML Afiliados após aprovação
INNGEST_EVENT_KEY=                  # Portal inngest.com
INNGEST_SIGNING_KEY=                # Portal inngest.com
```

### Jobs Inngest
- `verificar-precos-ml`: cron `0 9 * * *` — checa preços via `getMLItemDetails()`, salva em `historico_precos`, atualiza `ml_preco_atual` e `ml_preco_minimo`
- `alertas-reposicao`: cron `0 8 * * *` — detecta nivel ≤ 15% ou data_fim ≤ hoje+7dias, envia push notification
- Webhook: `GET/POST/PUT /api/inngest`
- Testar no dashboard: inngest.com → disparar função manualmente

### Rotas
- `/app/armario` — armário digital (auth obrigatório)
- `/app/armario?nome=...&marca=...&wishlist_id=...` — abre form pré-preenchido (vindo da wishlist)
- `/app/armario?aba=acabando` — abre na aba de produtos acabando
- `GET /api/armario/buscar-ml?q=texto` — busca produtos na API ML (server-side)
- `POST /api/armario/ocr-foto` — OCR de embalagem via Gemini (autenticado, server-side)

---

## Sinergias com Âmbar Beauty Studio
- Projetos completamente separados agora
- Futuro: cliente Chiqueteza descobre o Âmbar como profissional
- Futuro: resultado do try-on vira referência para agendamento no Âmbar
