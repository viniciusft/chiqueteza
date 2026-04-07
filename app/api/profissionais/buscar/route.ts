import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const RAIO_KM_DEFAULT = 5
const CACHE_DAYS = 60

// Geohash simples: arredonda lat/lng a 2 casas decimais (~1km de precisão)
function buildCacheKey(lat: number, lng: number, raio_km: number): string {
  return `${lat.toFixed(2)},${lng.toFixed(2)},r${raio_km}`
}

interface GooglePlace {
  id: string
  displayName?: { text: string }
  formattedAddress?: string
  rating?: number
  userRatingCount?: number
  primaryType?: string
  nationalPhoneNumber?: string
  location?: { latitude: number; longitude: number }
  websiteUri?: string
}

interface EstabelecimentoRPC {
  id: string
  nome: string
  categoria: string | null
  endereco: string | null
  telefone: string | null
  avaliacao_google: number | null
  total_avaliacoes: number | null
  foto_url: string | null
  distancia_metros: number
  place_id: string | null
  website: string | null
  latitude: number | null
  longitude: number | null
}

// ─── Busca paralela por termo de texto (searchText) ──────────────────────────
// searchText suporta paginação real (nextPageToken no body da resposta)
// Máximo: 6 queries × 60 resultados = até 360 únicos
//
// searchNearby NÃO suporta paginação — max 20/call, nextPageToken inválido no FieldMask

const QUERIES_BUSCA = [
  'salão de beleza',
  'manicure pedicure unhas',
  'spa massagem relaxamento',
  'depilação laser',
  'estética skincare',
  'barbearia cabelo corte',
] as const

// nextPageToken NUNCA vai no FieldMask — aparece automaticamente no corpo da resposta
const FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.rating',
  'places.userRatingCount',
  'places.primaryType',
  'places.nationalPhoneNumber',
  'places.location',
  'places.websiteUri',
].join(',')

async function callPlacesAPI(
  body: Record<string, unknown>,
  apiKey: string
): Promise<{ places: GooglePlace[]; nextPageToken?: string }> {
  try {
    const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': FIELD_MASK,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(12_000),
    })
    if (!res.ok) {
      const errBody = await res.text().catch(() => '(sem corpo)')
      console.warn('[BUSCA] Google Places HTTP', res.status, ':', errBody.slice(0, 300))
      return { places: [] }
    }
    const data = (await res.json()) as { places?: GooglePlace[]; nextPageToken?: string }
    return { places: data.places ?? [], nextPageToken: data.nextPageToken }
  } catch (err) {
    console.warn('[BUSCA] callPlacesAPI exceção:', err instanceof Error ? err.message : err)
    return { places: [] }
  }
}

async function fetchPlacesPorQuery(
  lat: number,
  lng: number,
  raio_km: number,
  textQuery: string,
  apiKey: string
): Promise<{ places: GooglePlace[] }> {
  const baseBody = {
    textQuery,
    pageSize: 20,
    locationBias: {
      circle: { center: { latitude: lat, longitude: lng }, radius: raio_km * 1000 },
    },
    languageCode: 'pt-BR',
  }

  // Página 1
  const res1 = await callPlacesAPI(baseBody, apiKey)
  const todos = [...res1.places]

  // Página 2 — pageToken vai junto com textQuery e locationRestriction
  if (res1.nextPageToken) {
    const res2 = await callPlacesAPI({ ...baseBody, pageToken: res1.nextPageToken }, apiKey)
    todos.push(...res2.places)

    // Página 3
    if (res2.nextPageToken) {
      const res3 = await callPlacesAPI({ ...baseBody, pageToken: res2.nextPageToken }, apiKey)
      todos.push(...res3.places)
    }
  }

  return { places: todos }
}

// ─── POST — Busca por GPS + popular banco ────────────────────────────

export async function POST(req: NextRequest) {
  let body: { lat?: unknown; lng?: unknown; raio_km?: unknown; categoria?: unknown }
  try {
    body = (await req.json()) as typeof body
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const lat = typeof body.lat === 'number' ? body.lat : parseFloat(String(body.lat ?? ''))
  const lng = typeof body.lng === 'number' ? body.lng : parseFloat(String(body.lng ?? ''))
  const raio_km =
    typeof body.raio_km === 'number' && body.raio_km > 0 ? body.raio_km : RAIO_KM_DEFAULT
  const categoria = typeof body.categoria === 'string' && body.categoria ? body.categoria : null

  console.log('[BUSCA] lat:', lat, 'lng:', lng, 'raio_km:', raio_km)

  if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return NextResponse.json({ error: 'Coordenadas inválidas' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const cacheKey = buildCacheKey(lat, lng, raio_km)
  const cacheExpiry = new Date(Date.now() - CACHE_DAYS * 24 * 60 * 60 * 1000).toISOString()

  // Verificar cache (60 dias)
  const { data: cacheHit } = await supabase
    .from('busca_cache')
    .select('buscado_em')
    .eq('cache_key', cacheKey)
    .gte('buscado_em', cacheExpiry)
    .maybeSingle()

  console.log('[BUSCA] Cache hit:', !!cacheHit, '| cache_key:', cacheKey)

  // Cache miss → Google Places: 6 queries em paralelo, até 3 páginas cada
  if (!cacheHit) {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY
    if (apiKey) {
      try {
        // Promise.allSettled: coleta o que funcionou mesmo se 1 query falhar
        const settled = await Promise.allSettled(
          QUERIES_BUSCA.map((query) => fetchPlacesPorQuery(lat, lng, raio_km, query, apiKey))
        )

        const resultadosPorQuery = settled.map((r, i) => {
          if (r.status === 'rejected') {
            console.warn('[BUSCA] Query falhou:', QUERIES_BUSCA[i], r.reason)
            return { places: [] as GooglePlace[] }
          }
          return r.value
        })

        // Diagnóstico por query
        const cobertura = Object.fromEntries(
          QUERIES_BUSCA.map((q, i) => [q, resultadosPorQuery[i].places.length])
        )

        // Deduplicar por id (mesmo lugar pode aparecer em múltiplas queries)
        const seenIds = new Set<string>()
        const allPlaces = resultadosPorQuery
          .flatMap((r) => r.places)
          .filter((p) => {
            if (seenIds.has(p.id)) return false
            seenIds.add(p.id)
            return true
          })

        console.log('[BUSCA] Total únicos:', allPlaces.length, '| cobertura:', JSON.stringify(cobertura))

        if (allPlaces.length > 0) {
          const rows = allPlaces.map((p) => ({
            id: p.id,
            nome: p.displayName?.text ?? 'Sem nome',
            endereco: p.formattedAddress ?? null,
            telefone: p.nationalPhoneNumber ?? null,
            website: p.websiteUri ?? null,
            latitude: p.location?.latitude ?? null,
            longitude: p.location?.longitude ?? null,
            avaliacao_google: p.rating ?? null,
            total_avaliacoes: p.userRatingCount ?? null,
            categoria: p.primaryType ?? null,
            source: 'google_places',
            place_id: p.id,
            ativo: true,
          }))

          const { error: upsertErr } = await supabase
            .from('estabelecimentos')
            .upsert(rows, { onConflict: 'id', ignoreDuplicates: false })

          if (upsertErr) {
            console.error('[BUSCA] Upsert error:', upsertErr)
          } else {
            console.log('[BUSCA] Upsert concluído:', rows.length, 'registros')
          }

          // Cache salvo APENAS em sucesso — nunca salvar cache vazio (bloquearia retentativas)
          await supabase
            .from('busca_cache')
            .upsert(
              { cache_key: cacheKey, results_count: allPlaces.length, buscado_em: new Date().toISOString() },
              { onConflict: 'cache_key' }
            )
        } else {
          console.warn('[BUSCA] Nenhum resultado obtido do Google Places — cache NÃO salvo para permitir retentativa')
        }
      } catch (err) {
        console.error('[BUSCA] Exceção na chamada Google Places:', err)
      }
    } else {
      console.warn('[BUSCA] GOOGLE_PLACES_API_KEY não configurada — pulando Places')
    }
  }

  // Buscar via PostGIS (ordenado por distância)
  const { data: resultados, error } = await supabase.rpc('buscar_por_proximidade', {
    lat,
    lng,
    raio_km,
    cat: categoria,
  })

  if (error) {
    console.error('[BUSCA] RPC buscar_por_proximidade error:', error)
    return NextResponse.json({ error: 'Erro ao buscar estabelecimentos' }, { status: 500 })
  }

  const lista = (resultados as EstabelecimentoRPC[] | null) ?? []
  console.log('[BUSCA] PostGIS resultado:', lista.length, 'estabelecimentos')

  return NextResponse.json({
    estabelecimentos: lista,
    total: lista.length,
    cache_hit: !!cacheHit,
  })
}

// ─── Alias semântico: termos em português → categorias Google Places ───

const ALIAS_CATEGORIA: Record<string, string[]> = {
  maquiagem: ['beauty_salon'],
  make: ['beauty_salon'],
  sobrancelha: ['beauty_salon'],
  salao: ['beauty_salon', 'hair_care'],
  beleza: ['beauty_salon', 'hair_care'],
  cabelo: ['hair_care', 'beauty_salon'],
  coloracao: ['hair_care'],
  tintura: ['hair_care'],
  corte: ['hair_care', 'beauty_salon'],
  manicure: ['nail_salon'],
  pedicure: ['nail_salon'],
  unhas: ['nail_salon'],
  gel: ['nail_salon'],
  spa: ['spa'],
  massagem: ['spa'],
  relaxamento: ['spa'],
  depilacao: ['hair_removal'],
  laser: ['hair_removal'],
  estetica: ['skin_care_clinic'],
  skincare: ['skin_care_clinic'],
  pele: ['skin_care_clinic'],
  limpeza: ['skin_care_clinic'],
  botox: ['skin_care_clinic'],
}

function normalizar(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

const SELECT_FIELDS =
  'id, nome, categoria, endereco, telefone, avaliacao_google, total_avaliacoes, foto_url, place_id, website, latitude, longitude'

// ─── GET — Busca textual: FTS + alias em paralelo ────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')?.trim() ?? ''

  if (q.length < 2) {
    return NextResponse.json({ estabelecimentos: [], total: 0 })
  }

  const supabase = createAdminClient()

  // Resolver aliases semânticos
  const qNorm = normalizar(q)
  const categoriasAlias = Array.from(
    new Set(
      Object.entries(ALIAS_CATEGORIA)
        .filter(([term]) => qNorm.includes(normalizar(term)))
        .flatMap(([, cats]) => cats)
    )
  )

  // Estratégia 1: FTS (nome + endereço + categoria com pesos)
  const ftsPromise = supabase
    .from('estabelecimentos')
    .select(SELECT_FIELDS)
    .textSearch('search_vector', q, { type: 'websearch', config: 'portuguese' })
    .eq('ativo', true)
    .order('avaliacao_google', { ascending: false, nullsFirst: false })
    .limit(30)

  // Estratégia 2: alias semântico → categoria (ex: "maquiagem" → beauty_salon)
  const aliasPromise =
    categoriasAlias.length > 0
      ? supabase
          .from('estabelecimentos')
          .select(SELECT_FIELDS)
          .in('categoria', categoriasAlias)
          .eq('ativo', true)
          .order('avaliacao_google', { ascending: false, nullsFirst: false })
          .limit(30)
      : Promise.resolve({ data: [] as Record<string, unknown>[], error: null })

  const [ftsRes, aliasRes] = await Promise.all([ftsPromise, aliasPromise])

  if (ftsRes.error) {
    return NextResponse.json({ error: 'Erro na busca' }, { status: 500 })
  }

  // Merge + deduplicar por id + ordenar por avaliação
  const seenIds = new Set<string>()
  const merged = [...(ftsRes.data ?? []), ...(aliasRes.data ?? [])]
    .filter((e) => {
      if (seenIds.has(e.id as string)) return false
      seenIds.add(e.id as string)
      return true
    })
    .sort(
      (a, b) =>
        ((b.avaliacao_google as number) ?? 0) - ((a.avaliacao_google as number) ?? 0)
    )
    .slice(0, 30)
    .map((e) => ({ ...e, distancia_metros: 0 }))

  return NextResponse.json({ estabelecimentos: merged, total: merged.length })
}
