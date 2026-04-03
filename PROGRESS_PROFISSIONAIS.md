# Progress: Busca de Profissionais por Proximidade

## Status geral

- **Iniciado em:** ___
- **Última atualização:** ___
- **Status:** 🔴 Não iniciado

---

## Pré-requisitos

- [ ] Google Places API key criada em console.cloud.google.com
- [ ] "Places API (New)" ativada na biblioteca do Google Cloud
- [ ] `GOOGLE_PLACES_API_KEY` adicionada no `.env.local`
- [ ] `GOOGLE_PLACES_API_KEY` adicionada nas env vars do Vercel (Production + Preview + Development)

---

## Fase 1 — Banco de dados PostGIS

- [ ] Extensão PostGIS verificada/ativada no projeto Supabase
- [ ] Schema de `estabelecimentos` e `busca_cache` inspecionado
- [ ] Coluna `localizacao geography(Point, 4326)` presente em `estabelecimentos`
- [ ] Índice GIST criado em `estabelecimentos.localizacao`
- [ ] Função `buscar_por_proximidade` criada no banco
- [ ] Função testada via SQL Editor do Supabase (retorna resultados ordenados por distância)
- [ ] RPC funcionando via `supabaseAdmin.rpc('buscar_por_proximidade', {...})`

---

## Fase 2 — API Route

- [ ] `app/api/profissionais/buscar/route.ts` criada
- [ ] Validação de input (lat, lng, raio_km) implementada
- [ ] Lógica de cache (consulta `busca_cache` antes de chamar Google) implementada
- [ ] Chamada à Google Places API (New) — Nearby Search funcionando
- [ ] Upsert de resultados em `estabelecimentos` funcionando
- [ ] Registro de cache inserido em `busca_cache` após busca nova
- [ ] Combinação de resultados Google + Supabase funcionando
- [ ] Tratamento de erros (0 resultados, 429, falha de rede) implementado
- [ ] Testada localmente com `curl` ou Thunder Client
- [ ] Testada com coordenadas de cache hit (< 30 dias) — sem chamada ao Google
- [ ] Testada com coordenadas de cache miss — chama Google e popula banco

---

## Fase 3 — Geolocalização

- [ ] `hooks/useLocalizacao.ts` criado
- [ ] GPS via `navigator.geolocation.getCurrentPosition` funcionando
- [ ] Fallback por IP (`ipapi.co/json/`) implementado e funcionando
- [ ] Tratamento de negativa de permissão com mensagem amigável
- [ ] Última localização persistida no `localStorage`
- [ ] Testado em desktop (Chrome + Firefox)
- [ ] Testado em mobile — Safari iOS
- [ ] Testado em mobile — Chrome Android
- [ ] Testado com GPS negado (fallback por IP ativado)

---

## Fase 4 — UI

- [ ] Seção "Perto de mim" adicionada em `app/app/profissionais/page.tsx`
- [ ] Botão "Buscar salões perto de mim" com ícone MapPin implementado
- [ ] Estados de loading (solicitando GPS → buscando → resultados) implementados
- [ ] Skeleton loading durante busca usando `SkeletonProfessional` x3
- [ ] Componente `EstabelecimentoCard` criado (nome, distância, avaliação, telefone, navegação)
- [ ] Badge de distância colorido (verde/amarelo/vermelho) nos cards
- [ ] Chips de filtro por categoria (Todos | Salões | Clínicas | Manicure | Estética)
- [ ] Empty state para "nenhum resultado" com sugestão de raio maior
- [ ] Testado visualmente em viewport 390px (iPhone 14)
- [ ] Testado visualmente em viewport 430px (max-width do app)

---

## Fase 5 — Deploy e testes finais

- [ ] `npm run build` sem erros ou warnings de TypeScript
- [ ] Deploy na Vercel concluído sem erros
- [ ] `GOOGLE_PLACES_API_KEY` confirmada nas env vars do Vercel em produção
- [ ] Testado em produção com GPS real (celular)
- [ ] Resultados reais do Google Places aparecendo corretamente
- [ ] Cache de 30 dias validado (segunda busca na mesma região sem chamada à API)
- [ ] Verificado no painel do Google Cloud que as cotas estão sendo consumidas corretamente

---

## CLAUDE.md atualizado

- [ ] Tabela `estabelecimentos` documentada (schema + propósito)
- [ ] Tabela `busca_cache` documentada
- [ ] Função RPC `buscar_por_proximidade` documentada
- [ ] Variável `GOOGLE_PLACES_API_KEY` adicionada na seção de variáveis de ambiente
- [ ] API Route `/api/profissionais/buscar` documentada
- [ ] Hook `useLocalizacao` documentado

---

## Bugs encontrados

> Preencher durante a implementação

| # | Descrição | Fase | Status |
|---|-----------|------|--------|
|   |           |      |        |

---

## Notas de implementação

> Decisões tomadas, alternativas consideradas, comportamentos inesperados

---

## Log de sessões

| Sessão | Data | O que foi feito |
|--------|------|-----------------|
|        |      |                 |
