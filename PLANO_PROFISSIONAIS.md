# Plano de Implementação — Busca de Profissionais por Proximidade

## Contexto técnico

- **Stack:** Next.js 14 App Router + Supabase (PostGIS) + Vercel
- **Tabelas já existentes:** `estabelecimentos`, `busca_cache`
- **Função PostGIS a criar:** `buscar_por_proximidade(lat, lng, raio_km, categoria?)`
- **API externa:** Google Places API (New) — endpoint `nearbySearch`
- **Objetivo:** Permitir que a usuária encontre salões, clínicas e estúdios de beleza próximos à sua localização atual, com dados enriquecidos do Google Places e cache de 30 dias no Supabase para reduzir custos de API.

---

## Pré-requisitos antes de começar

- [ ] Criar Google Places API key em [console.cloud.google.com](https://console.cloud.google.com)
- [ ] Ativar **"Places API (New)"** na biblioteca do Google Cloud (não a versão legada)
- [ ] Adicionar `GOOGLE_PLACES_API_KEY=...` no `.env.local`
- [ ] Adicionar `GOOGLE_PLACES_API_KEY` nas variáveis de ambiente do projeto na Vercel (Settings → Environment Variables)

> **Atenção:** A "Places API (New)" usa endpoints diferentes da versão legada.
> O endpoint correto é `https://places.googleapis.com/v1/places:searchNearby` (POST).
> Não usar `maps.googleapis.com/maps/api/place/nearbysearch` (legado).

---

## Fase 1 — Função PostGIS no banco

### 1.1 — Verificar se PostGIS está ativado no projeto Supabase

Antes de criar a função, confirmar que a extensão `postgis` está ativa no projeto
`zzrlrrzdusrtkkyvtirm`. Se não estiver, ativar via `CREATE EXTENSION IF NOT EXISTS postgis`.

### 1.2 — Verificar schema das tabelas existentes

Inspecionar `estabelecimentos` e `busca_cache` para entender:
- Quais colunas já existem (especialmente se há coluna de tipo `geography` ou `point`)
- Se `estabelecimentos` tem `lat`/`lng` separados ou coluna `localizacao geography`
- Se `busca_cache` tem `regiao_geohash` ou coordenadas para evitar buscas duplicadas

### 1.3 — Adaptar a tabela `estabelecimentos` se necessário

Se a tabela não tiver coluna `geography`, adicionar:
```sql
ALTER TABLE estabelecimentos
  ADD COLUMN IF NOT EXISTS localizacao geography(Point, 4326);

UPDATE estabelecimentos
  SET localizacao = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
```
Isso converte coordenadas numéricas em ponto geográfico para uso com PostGIS,
habilitando buscas de distância eficientes com índice espacial.

### 1.4 — Criar índice espacial

```sql
CREATE INDEX IF NOT EXISTS idx_estabelecimentos_localizacao
  ON estabelecimentos USING GIST (localizacao);
```
Índice GIST é obrigatório para performance de queries PostGIS. Sem ele, cada busca
faz full table scan.

### 1.5 — Criar a função RPC `buscar_por_proximidade`

```sql
CREATE OR REPLACE FUNCTION buscar_por_proximidade(
  lat FLOAT,
  lng FLOAT,
  raio_km FLOAT DEFAULT 5,
  categoria TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  nome TEXT,
  categoria TEXT,
  endereco TEXT,
  telefone TEXT,
  avaliacao_google FLOAT,
  total_avaliacoes INT,
  foto_url TEXT,
  distancia_metros FLOAT,
  place_id TEXT
)
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT
    e.id,
    e.nome,
    e.categoria,
    e.endereco,
    e.telefone,
    e.avaliacao_google,
    e.total_avaliacoes,
    e.foto_url,
    ST_Distance(
      e.localizacao,
      ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
    ) AS distancia_metros,
    e.place_id
  FROM estabelecimentos e
  WHERE
    ST_DWithin(
      e.localizacao,
      ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
      raio_km * 1000
    )
    AND (categoria IS NULL OR e.categoria = categoria)
    AND e.ativo = true
  ORDER BY distancia_metros ASC
  LIMIT 30;
$$;
```

A função usa `ST_DWithin` (busca por raio em metros) em vez de `ST_Distance` no WHERE
para aproveitar o índice GIST. `SECURITY DEFINER` permite que o RPC seja chamado
via `supabaseAdmin` sem expor a lógica de filtering ao cliente.

### 1.6 — Testar a função no SQL Editor do Supabase

```sql
SELECT * FROM buscar_por_proximidade(-23.5505, -46.6333, 3, NULL);
```
Esperado: retornar estabelecimentos a até 3km do centro de São Paulo ordenados por distância.

---

## Fase 2 — API Route de busca

### 2.1 — Criar `app/api/profissionais/buscar/route.ts`

Route handler server-side que recebe `{ lat, lng, raio_km?, categoria? }` via POST.
Toda lógica server-side, GOOGLE_PLACES_API_KEY nunca exposta ao frontend.

### 2.2 — Verificar cache antes de chamar Google Places

Antes de qualquer chamada à API externa:
1. Gerar um "geohash" da região (arredondar lat/lng a 2 casas decimais = ~1km de precisão)
2. Consultar `busca_cache` onde `regiao = geohash` e `criado_em > now() - interval '30 days'`
3. Se cache hit: retornar dados do cache imediatamente (zero custo de API)
4. Se cache miss: prosseguir para o passo 2.3

Isso evita cobranças repetidas para a mesma região dentro de 30 dias.

### 2.3 — Chamar Google Places API (New) — Nearby Search

```
POST https://places.googleapis.com/v1/places:searchNearby
Headers:
  X-Goog-Api-Key: process.env.GOOGLE_PLACES_API_KEY
  X-Goog-FieldMask: places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.photos,places.primaryType,places.internationalPhoneNumber,places.location
Body:
  {
    "includedTypes": ["beauty_salon", "hair_care", "nail_salon", "spa"],
    "locationRestriction": {
      "circle": {
        "center": { "latitude": lat, "longitude": lng },
        "radius": raio_km * 1000
      }
    },
    "maxResultCount": 20
  }
```

`X-Goog-FieldMask` é obrigatório na API New e controla quais campos são cobrados.
Usar apenas os campos necessários reduz custo por requisição.

### 2.4 — Normalizar e upsert os resultados no Supabase

Para cada resultado do Google Places:
- Mapear campos: `displayName.text` → `nome`, `rating` → `avaliacao_google`, etc.
- Usar `supabaseAdmin.from('estabelecimentos').upsert(...)` com `onConflict: 'place_id'`
- Isso mantém o banco atualizado com dados frescos do Google sem duplicatas

### 2.5 — Salvar no cache

Inserir registro em `busca_cache`:
```
{ regiao: geohash, lat, lng, raio_km, total_resultados, criado_em: now() }
```

### 2.6 — Combinar resultados do Google com dados internos do Supabase

Após upsert, chamar `supabase.rpc('buscar_por_proximidade', { lat, lng, raio_km })`
para retornar os dados ordenados por distância — inclusive estabelecimentos que já
estavam no banco de sessões anteriores.

### 2.7 — Tratar erros e edge cases

- Google Places retorna 0 resultados: retornar array vazio, não erro 500
- Usuária sem conexão para Google: retornar resultados do banco local se houver
- Rate limit do Google (429): logar e retornar cache existente ou array vazio
- Validação de input: lat/lng inválidos retornam 400 imediatamente

---

## Fase 3 — Hook de geolocalização

### 3.1 — Criar `hooks/useLocalizacao.ts`

Hook que encapsula a lógica de geolocalização:
```typescript
interface Localizacao {
  lat: number
  lng: number
  precisao: 'gps' | 'ip' | null
  erro: string | null
  carregando: boolean
}
```

### 3.2 — Implementar GPS via `navigator.geolocation`

```typescript
navigator.geolocation.getCurrentPosition(
  (pos) => { /* sucesso */ },
  (err) => { /* fallback por IP */ },
  { timeout: 8000, maximumAge: 300000 } // 5 min de cache do GPS
)
```

`maximumAge: 300000` evita pedir GPS novamente se já foi solicitado nos últimos 5 minutos
— importante para experiência mobile onde o GPS pode demorar.

### 3.3 — Implementar fallback por IP

Se o GPS falhar (recusado ou timeout), chamar `https://ipapi.co/json/` (gratuito, sem key)
para obter lat/lng aproximados pela localização do IP. Precisão ~cidade, mas suficiente
para mostrar resultados relevantes.

### 3.4 — Tratar negativa de permissão

Se a usuária negar acesso ao GPS (`GeolocationPositionError.PERMISSION_DENIED`):
- Mostrar mensagem explicativa (não um erro genérico)
- Oferecer busca manual por CEP ou cidade como alternativa
- Não insistir ou re-solicitar automaticamente

### 3.5 — Persistir última localização conhecida no localStorage

Salvar `{ lat, lng, timestamp }` no localStorage para:
- Mostrar resultados imediatos na próxima abertura sem esperar GPS
- Comparar com nova posição — se distância < 500m, usar cache salvo

---

## Fase 4 — UI na página de profissionais

### 4.1 — Adicionar seção "Perto de mim" em `app/app/profissionais/page.tsx`

Acima da lista de profissionais pessoais, adicionar uma nova seção com:
- Botão `Buscar salões perto de mim` com ícone `MapPin` (lucide)
- Estado `idle` → `solicitando GPS` → `buscando` → `resultados` / `erro`

### 4.2 — Componente `EstabelecimentoCard`

Card para cada resultado do Google Places com:
- Nome do estabelecimento
- Distância em metros/km (ex: "320m" ou "1.4km")
- Avaliação Google (estrelas + número de avaliações)
- Categoria (ex: "Salão de beleza")
- Botão de WhatsApp se tiver telefone
- Botão de navegação (abre Google Maps)

Design: consistente com `ProfissionalCard` existente — avatar com inicial,
fundo branco, borda suave, sombra leve.

### 4.3 — Loading state durante busca

Enquanto geolocalização + API estão em andamento:
- Mostrar `SkeletonProfessional` (já existe) x3
- Texto "Encontrando salões perto de você..." com animação de ponto pulsante

### 4.4 — Estado vazio (sem resultados)

Se não houver resultados no raio especificado:
- `EmptyState` com ícone MapPin e texto "Nenhum salão encontrado nesta área"
- Sugerir aumentar o raio de busca (botão "Buscar em raio maior")

### 4.5 — Filtros por categoria

Chips filtráveis acima dos resultados:
- Todos | Salões | Clínicas | Manicure | Estética

Implementar como estado local — sem chamada extra de API, apenas filtra
os resultados já carregados em memória.

### 4.6 — Badge de distância nos cards

Chips coloridos indicando proximidade:
- 🟢 < 500m — "Pertíssimo"
- 🟡 500m–2km — "Próximo"
- 🔴 2km–5km — "Um pouco longe"

---

## Fase 5 — Testes e validação

### Como testar a API route localmente

```bash
curl -X POST http://localhost:3000/api/profissionais/buscar \
  -H "Content-Type: application/json" \
  -d '{"lat": -23.5505, "lng": -46.6333, "raio_km": 3}'
```

Verificar:
- Response 200 com array de estabelecimentos
- Campos `distancia_metros`, `avaliacao_google`, `place_id` presentes
- Segunda chamada com mesmas coordenadas retorna mais rápido (cache hit)

### Como verificar se o PostGIS está funcionando

No SQL Editor do Supabase:
```sql
-- Verificar extensão ativa
SELECT extname FROM pg_extension WHERE extname = 'postgis';

-- Testar a função diretamente
SELECT nome, distancia_metros
FROM buscar_por_proximidade(-23.5505, -46.6333, 5, NULL)
LIMIT 5;
```

### Como validar o cache de 30 dias

```sql
-- Ver registros no cache
SELECT regiao, criado_em, total_resultados
FROM busca_cache
ORDER BY criado_em DESC
LIMIT 10;

-- Simular cache expirado (alterar data para > 30 dias)
UPDATE busca_cache
  SET criado_em = now() - interval '31 days'
  WHERE id = '<id>';
-- Re-buscar no app → deve chamar Google Places novamente
```

---

## Riscos e pontos de atenção

### Custo da Google Places API

A "Nearby Search (New)" cobra **$0.032 por requisição** (março 2025).
Com o cache de 30 dias por região, o custo real depende da diversidade geográfica
das usuárias. Estimar ~100 regiões únicas/mês = ~$3,20/mês (aceitável para MVP).
**Risco:** se muitas usuárias estiverem em regiões diferentes, custo pode escalar.
**Mitigação:** cache agressivo de 30 dias + alert no Google Cloud se custo > $20/mês.

### GPS não disponível em HTTP

O `navigator.geolocation` só funciona em HTTPS ou localhost.
**Em preview do Vercel** (HTTPS): funciona normalmente.
**Em desenvolvimento local** (HTTP): funciona em localhost especificamente.
Não haverá problema em produção, mas testar localmente funciona.

### Permissão de GPS no iOS Safari

O iOS Safari exige que a solicitação de GPS seja feita dentro de um evento
de interação do usuário (clique direto). Não solicitar GPS automaticamente
ao carregar a página — sempre disparar via clique no botão.

### RLS e a função SECURITY DEFINER

A função `buscar_por_proximidade` usa `SECURITY DEFINER`, ou seja, executa
com os privilégios do criador (postgres/supabase_admin), não do usuário logado.
Isso é necessário para ler `estabelecimentos` sem expor políticas complexas no RPC.
**Atenção:** garantir que a função não exponha dados sensíveis que deveriam ser privados.
Como `estabelecimentos` são dados públicos de negócios, isso é seguro.

### Geocodificação de resultados do Google

A API Places (New) retorna `location.latitude` e `location.longitude` para cada lugar.
Esses valores precisam ser convertidos para `geography` no upsert do Supabase:
```sql
ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
```
Atenção à ordem: PostGIS usa `(longitude, latitude)`, não `(latitude, longitude)`.
Erro comum que causa resultados incorretos ou nenhum resultado.

### Limite de 20 resultados da Places API (New)

A API New tem `maxResultCount` máximo de 20. Para cobrir raios maiores
ou áreas com muitos estabelecimentos, seria necessário paginação ou múltiplas
chamadas com offsets. Para o MVP, 20 resultados dentro de 5km é suficiente.

### Variáveis de ambiente no Vercel

`GOOGLE_PLACES_API_KEY` é server-only (sem prefixo `NEXT_PUBLIC_`).
Garantir que está adicionada em **todas** as environments do Vercel:
Production, Preview e Development.
