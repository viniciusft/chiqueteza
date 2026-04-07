import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { inngest } from '@/lib/inngest/client'
import {
  QUERIES_BUSCA,
  fetchPlacesPorQuery,
  placeParaRow,
} from '@/lib/places/searchPlaces'

const RAIO_KM_DEFAULT = 5
const CACHE_DAYS = 60

// Geohash simples: arredonda lat/lng a 2 casas decimais (~1km de precisão)
function buildCacheKey(lat: number, lng: number, raio_km: number): string {
  return `${lat.toFixed(2)},${lng.toFixed(2)},r${raio_km}`
}

// Chave de granularidade de cidade (~10km de precisão)
function buildCidadeKey(lat: number, lng: number): string {
  return `cidade:${lat.toFixed(1)},${lng.toFixed(1)}`
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

  // Verificar cache de ponto (60 dias)
  const { data: cacheHit } = await supabase
    .from('busca_cache')
    .select('buscado_em')
    .eq('cache_key', cacheKey)
    .gte('buscado_em', cacheExpiry)
    .maybeSingle()

  console.log('[BUSCA] Cache hit:', !!cacheHit, '| cache_key:', cacheKey)

  // Cache miss → Fase 1: 6 queries do centro em paralelo
  if (!cacheHit) {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY
    if (apiKey) {
      try {
        const settled = await Promise.allSettled(
          QUERIES_BUSCA.map((query) => fetchPlacesPorQuery(lat, lng, raio_km, query, apiKey))
        )

        const resultadosPorQuery = settled.map((r, i) => {
          if (r.status === 'rejected') {
            console.warn('[BUSCA] Query falhou:', QUERIES_BUSCA[i], r.reason)
            return { places: [] as ReturnType<typeof placeParaRow>[] }
          }
          return r.value
        })

        // Diagnóstico por query
        const cobertura = Object.fromEntries(
          QUERIES_BUSCA.map((q, i) => [q, resultadosPorQuery[i].places.length])
        )

        // Deduplicar por id
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
          const rows = allPlaces.map(placeParaRow)

          const { error: upsertErr } = await supabase
            .from('estabelecimentos')
            .upsert(rows, { onConflict: 'id', ignoreDuplicates: false })

          if (upsertErr) {
            console.error('[BUSCA] Upsert error:', upsertErr)
          } else {
            console.log('[BUSCA] Upsert concluído:', rows.length, 'registros')
          }

          // Cache salvo APENAS em sucesso
          await supabase
            .from('busca_cache')
            .upsert(
              { cache_key: cacheKey, results_count: allPlaces.length, buscado_em: new Date().toISOString() },
              { onConflict: 'cache_key' }
            )

          // Fase 2: disparar job de grade hexagonal se a cidade ainda não foi populada
          // Usa chave de granularidade ~10km para evitar jobs duplicados de pontos vizinhos
          const cidadeKey = buildCidadeKey(lat, lng)
          const { data: cidadeJaBuscada } = await supabase
            .from('busca_cache')
            .select('buscado_em')
            .eq('cache_key', cidadeKey)
            .gte('buscado_em', cacheExpiry)
            .maybeSingle()

          if (!cidadeJaBuscada) {
            // Marcar ANTES de disparar para evitar jobs duplicados de buscas simultâneas
            await supabase
              .from('busca_cache')
              .upsert(
                { cache_key: cidadeKey, results_count: 1, buscado_em: new Date().toISOString() },
                { onConflict: 'cache_key' }
              )

            try {
              await inngest.send({
                name: 'profissionais/popular_cidade',
                data: { lat, lng, raio_km },
              })
              console.log('[BUSCA] Job de grade hexagonal disparado para', cidadeKey)
            } catch (inngestErr) {
              // Não bloquear a resposta se o job falhar ao disparar
              console.warn('[BUSCA] Falha ao disparar job Inngest:', inngestErr)
            }
          } else {
            console.log('[BUSCA] Cidade já populada, grade não necessária:', cidadeKey)
          }
        } else {
          console.warn('[BUSCA] Nenhum resultado obtido do Google Places — cache NÃO salvo')
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
