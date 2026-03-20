# CLAUDE.md — Contexto do Projeto para o Claude Code

## Identidade do Projeto
- **Nome:** Chiqueteza
- **Repositório:** https://github.com/viniciusft/chiqueteza
- **Stack:** Next.js 14 (App Router), Supabase, Vercel, TypeScript, Tailwind CSS
- **Tipo:** PWA (Progressive Web App) — foco mobile, sem app nativo
- **Supabase Project ID:** zzrlrrzdusrtkkyvtirm
- **Supabase URL:** https://zzrlrrzdusrtkkyvtirm.supabase.co

## O que é este app
Assistente pessoal de beleza B2C. Múltiplas features entregando valor ao consumidor final.
Foco: mulheres entre 18–45 anos, alta recorrência em serviços de beleza.

## Regras absolutas
- NUNCA expor chaves de API no frontend — toda chamada de IA passa por route handler server-side
- NUNCA hardcodar URLs — sempre usar `process.env.NEXT_PUBLIC_SITE_URL`
- NUNCA quebrar RLS (Row Level Security) do Supabase
- Provider de IA abstraído em `lib/ai/` — permite troca sem refatoração
- Sempre TypeScript — sem `any` sem justificativa
- Commits em português, descritivos
- Checkpoint com git commit antes de qualquer tarefa
- `prompt_tecnico` dos looks NUNCA retornado em rotas públicas

---

## Identidade Visual
- **Ever Green:** `#1B5E5A` — cor primária
- **Pink Peony:** `#F472A0` — destaque e acentos
- **Silver Platter:** `#E8E8E8` / `#F5F5F5` — fundo geral
- **Wedding Band:** `#D4A843` — dourado, ícones decorativos
- **Something Blue:** `#A8C5CC` — elementos secundários
- **Fonte:** Inter (Google Fonts)
- **Tom:** vibrante, moderno, feminino, personalidade brasileira

---

## Banco de Dados — Tabelas existentes

### perfis
- id (FK auth.users), nome, avatar_url, created_at, updated_at
- Criado automaticamente via trigger on_auth_user_created

### looks (arsenal de maquiagem)
- id, nome, descricao_visual, imagem_referencia_url
- **prompt_tecnico** — NUNCA exposto no frontend
- categoria: social/noiva/formatura/dia/balada/natural/dramatico
- tags (jsonb), ativo, ordem

### geracoes (histórico de try-ons)
- id, usuario_id, look_id, foto_original_url, foto_gerada_url, provider_usado

### servicos_beleza (alertas de intervalo)
- id, usuario_id, nome, ultimo_procedimento (date)
- frequencia_dias, lembrete_ativo, observacoes

### profissionais (caderneta de profissionais)
- id, usuario_id, nome, especialidades (text[])
- telefone, instagram, avaliacao (1-5), valor_medio
- fotos_urls (text[]), observacoes, ativo

### agendamentos_rotina
- id, usuario_id, profissional_id, servico_nome
- data_hora (timestamptz), valor, status: agendado/concluido/cancelado
- observacoes, foto_resultado_url
- Label visual: "agendado"→"Agendado", "concluido"→"Realizado", "cancelado"→"Cancelado"

### fotos_referencia (inspirações da usuária)
- id, usuario_id, foto_url, titulo, tags (text[])

### analise_facial (visagismo + colorimetria)
- id, usuario_id
- formato_rosto: oval/redondo/quadrado/coracao/diamante/oblongo/triangular
- terce_dominante, caracteristicas_marcantes (text[])
- subtom: quente/frio/neutro
- estacao (das 12 estações de colorimetria)
- paleta_cores, cores_evitar (jsonb arrays com HEX)
- tons_batom, tons_sombra, tons_blush (jsonb arrays com HEX + nome)
- subtom_base, estilos_delineado (text[])
- looks_recomendados (uuid[] → looks)
- formatos_corte_recomendados, cortes_evitar (jsonb — futuro)
- relatorio_texto (texto completo para exibir)
- dados_brutos (jsonb — resposta raw da IA)
- foto_url, provider_usado, mes_referencia
- Controle: 1 análise completa (com imagens) por mês no plano premium

### push_subscriptions
- id, usuario_id, subscription_json (jsonb)

---

## Motor de IA
**Status: EM AVALIAÇÃO — provider abstraído em lib/ai/**

Candidatos:
- **Gemini** (Google AI Studio) — gratuito, bom para análise de visão e texto
- **FLUX Kontext Pro** (fal.ai) — $0.04/imagem, melhor para geração de maquiagem
- **Claude/Gemini Vision** — para análise facial do visagismo

Arquivos de abstração:
- `lib/ai/generateMakeup.ts` — geração de look no rosto (Try-On)
- `lib/ai/analyzeVisagismo.ts` — análise facial e colorimetria
- `lib/ai/generateHairstyle.ts` — ideias de corte de cabelo (futuro)

---

## Features do Produto

### MVP (implementado)
- ✅ Autenticação (Supabase Auth)
- ✅ Tab bar com 4 abas: Início, Try-On, Rotina, Profissionais
- ✅ Módulo Rotina: agendamentos, alertas, histórico, gasto mensal
- ✅ Módulo Profissionais: caderneta, galeria de fotos, WhatsApp, compartilhar
- ✅ Ação rápida WhatsApp nos cards de agendamento

### V2 — Visagismo + Colorimetria (próximo)
Pipeline: foto → lib/ai/analyzeVisagismo.ts → JSON estruturado → relatório

**Análise entregue:**
1. Formato do rosto + proporções
2. Colorimetria — estação (12 estações), subtom de pele
3. Paleta de cores pessoal (30+ cores com HEX)
4. Aplicado à maquiagem: tons de batom, sombra, blush, base
5. Estilos de delineado que valorizam o olho
6. 3 looks recomendados do arsenal (badge "✦ Para você")
7. Relatório completo em português em linguagem acessível

**Modelo de acesso:**
- Grátis: relatório textual apenas
- Premium: relatório + 2-3 imagens geradas mostrando looks no rosto
- Limite: 1 análise completa por mês (mes_referencia controla isso)
- Pode refazer se mudou o visual (ex: corte de cabelo novo)

**Referência de mercado:** PandaMi (pandami.com.br) — analisar o produto
deles como benchmark, especialmente a seção de colorimetria com 10 seções.
O diferencial do Chiqueteza vs PandaMi é fechar o ciclo completo:
análise → ver como fica (try-on) → agendar com profissional.

### V2 — Try-On de Maquiagem
Pipeline: foto + look selecionado → lib/ai/generateMakeup.ts → resultado

**Arsenal de looks:**
- Cada look: imagem de referência (visual) + prompt_tecnico (server-side)
- Prompt técnico nunca exposto no frontend
- Looks marcados como "✦ Para você" baseado no visagismo da usuária
- Variações de cor: modelo leve para preview, modelo pesado para HD final

### V3 — Corte de Cabelo (ideias)
Pipeline: dados do visagismo → lib/ai/generateHairstyle.ts → imagens de referência
- Usa formato_rosto e caracteristicas_marcantes da analise_facial
- Gera referências visuais de cortes recomendados
- NÃO aplica no rosto (difícil de fazer bem) — mostra referências externas
- Pipeline específico a definir quando implementar

### V3 — Matching de Base
- Sistema colaborativo de equivalência entre bases de marcas
- Só após base de usuárias real (problema do ovo e da galinha)

### Futuro — Marketplace
- Perfis de profissionais e salões
- Integração com Âmbar Beauty Studio e similares

---

## Modelo de Negócio (freemium)

**Grátis:**
- Rotina e agendamentos (completo)
- Caderneta de profissionais (completo)
- Visagismo — apenas relatório textual
- Try-On — X gerações por mês (a definir)

**Premium:**
- Visagismo completo com imagens geradas
- Try-On ilimitado ou limite maior
- Corte de cabelo (quando implementado)
- Histórico completo e insights

---

## Pipeline do Visagismo (V2)

```
1. Tela de instrução
   "Use foto frontal, boa iluminação, sem filtros, cabelo atrás das orelhas"

2. Upload da foto
   → Validação básica (tem rosto? boa iluminação?)
   → Salvar no Supabase Storage bucket 'analises-faciais'

3. Verificação de uso mensal
   → Checar analise_facial WHERE usuario_id = X AND mes_referencia = 'YYYY-MM'
   → Se já tem e é premium: perguntar se quer refazer
   → Se é free: entregar só o relatório textual

4. Chamada server-side: lib/ai/analyzeVisagismo.ts
   → Gemini Vision analisa a foto
   → Retorna JSON estruturado (ver campos da tabela analise_facial)
   → Prompt engenheirado para retornar sempre o mesmo formato

5. Salvar JSON no banco (tabela analise_facial)

6. Para premium: gerar 2-3 looks recomendados via lib/ai/generateMakeup.ts
   → Usa os tons recomendados pelo visagismo como base dos prompts

7. Tela de resultado
   → Seções: formato do rosto, colorimetria, paleta, maquiagem recomendada
   → Looks gerados (se premium) com slider antes/depois
   → Badge "✦ Para você" nos looks do arsenal

8. Perfil da usuária
   → Dados do visagismo salvos e consultáveis a qualquer hora
   → Looks do arsenal filtrados pelas recomendações
```

---

## Pipeline do Try-On (V2)

```
1. Upload da foto (validação: frontal, rosto próximo, boa iluminação)

2. Arsenal de looks navegável por categoria
   → Buscar looks WHERE ativo = true
   → Looks marcados como recomendados aparecem primeiro (se tiver visagismo)
   → Cada look: imagem de referência + nome + categoria

3. Seleção do look → chamada server-side
   → Sistema busca prompt_tecnico do look (NUNCA exposto)
   → Chamada para lib/ai/generateMakeup.ts

4. Preview rápido (modelo leve) → confirmar → resultado HD (modelo pesado)

5. Salvar em geracoes → histórico da usuária
```

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
- Consentimento explícito obrigatório antes do upload
- Política de privacidade clara na tela de upload
- Usar providers com política de não retenção de dados
- Imagens armazenadas no Supabase Storage deste projeto
- Buckets: 'analises-faciais', 'profissionais-fotos', 'looks-gerados'

## Sinergias com Âmbar Beauty Studio
- Projetos completamente separados por ora
- Futuro: cliente Chiqueteza descobre o Âmbar como profissional
- Futuro: resultado do try-on vira referência para agendamento
