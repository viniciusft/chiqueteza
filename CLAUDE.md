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
Models em uso (fallback automático): gemini-2.5-flash → gemini-2.5-flash-lite
URL: https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent
Enviar foto como inline_data (base64 limpo, sem prefixo data URL) + prompt estruturado
generationConfig: temperature 0.2, response_mime_type "application/json"
Timeout: 55s via AbortController

### Geração de imagens — EM AVALIAÇÃO
FLUX Kontext Pro via fal.ai (fal-ai/flux-pro/kontext) está listado como opção
mas NÃO está implementado ainda. Provider será escolhido na V2.

---

## Features do Produto

### Implementado
- Autenticação (Supabase Auth)
- Tab bar 5 abas: Início | Try-On | Visagismo | Rotina | Profissionais
- Módulo Rotina: agendamentos, alertas, histórico, gasto mensal
- Módulo Profissionais: caderneta, galeria, WhatsApp, compartilhar
- Ação rápida WhatsApp nos cards de agendamento
- Sistema de planos e créditos (banco criado)
- Design system com paleta Chiqueteza
- Cache stale-while-revalidate (lib/cache/ + useCache hook)
- Service Worker PWA (public/sw.js)
- Visagismo + Colorimetria: upload, análise Gemini, resultado, foto salva no Storage
- Upload com preview mode e dois inputs separados (câmera / galeria)

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

## Sinergias com Âmbar Beauty Studio
- Projetos completamente separados agora
- Futuro: cliente Chiqueteza descobre o Âmbar como profissional
- Futuro: resultado do try-on vira referência para agendamento no Âmbar
