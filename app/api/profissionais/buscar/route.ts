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

export async function POST(req: NextRequest) {
  // 1. Parse e validar input
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

  console.log('[BUSCA] Iniciando. lat:', lat, 'lng:', lng, 'raio_km:', raio_km, 'categoria:', categoria)
  console.log('[BUSCA] API Key existe:', !!process.env.GOOGLE_PLACES_API_KEY)

  if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return NextResponse.json({ error: 'Coordenadas inválidas' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const cacheKey = buildCacheKey(lat, lng, raio_km)
  const cacheExpiry = new Date(Date.now() - CACHE_DAYS * 24 * 60 * 60 * 1000).toISOString()

  // 2. Verificar cache (60 dias)
  const { data: cacheHit } = await supabase
    .from('busca_cache')
    .select('buscado_em')
    .eq('cache_key', cacheKey)
    .gte('buscado_em', cacheExpiry)
    .maybeSingle()

  console.log('[BUSCA] Cache hit:', !!cacheHit, '| cache_key:', cacheKey)

  // 3. Cache miss → Google Places API (New)
  if (!cacheHit) {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY
    if (apiKey) {
      try {
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
          'nextPageToken',
        ].join(',')

        const placesBody = {
          includedTypes: ['beauty_salon', 'hair_care', 'nail_salon', 'spa', 'hair_removal', 'skin_care_clinic'],
          locationRestriction: {
            circle: {
              center: { latitude: lat, longitude: lng },
              radius: raio_km * 1000,
            },
          },
          maxResultCount: 20,
          languageCode: 'pt-BR',
        }

        const fetchPlacesPage = async (pageToken?: string): Promise<{ places: GooglePlace[]; nextPageToken?: string }> => {
          const body = pageToken ? { ...placesBody, pageToken } : placesBody
          const res = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Goog-Api-Key': apiKey,
              'X-Goog-FieldMask': FIELD_MASK,
            },
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(10_000),
          })
          if (!res.ok) return { places: [] }
          const data = (await res.json()) as { places?: GooglePlace[]; nextPageToken?: string }
          return { places: data.places ?? [], nextPageToken: data.nextPageToken }
        }

        // Primeira página
        const page1 = await fetchPlacesPage()
        let allPlaces = page1.places
        console.log('[BUSCA] Google Places página 1:', allPlaces.length, 'resultados')

        // Segunda página apenas para raio >= 10km (economiza quota)
        if (raio_km >= 10 && page1.nextPageToken) {
          const page2 = await fetchPlacesPage(page1.nextPageToken)
          allPlaces = [...allPlaces, ...page2.places]
          console.log('[BUSCA] Google Places página 2:', page2.places.length, 'resultados | total:', allPlaces.length)
        }

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

          // Upsert — trigger atualiza coluna localizacao automaticamente
          const { error: upsertErr } = await supabase
            .from('estabelecimentos')
            .upsert(rows, { onConflict: 'id', ignoreDuplicates: false })

          if (upsertErr) {
            console.error('[BUSCA] Upsert error:', upsertErr)
          } else {
            console.log('[BUSCA] Upsert concluído:', rows.length, 'registros')
          }
        }

        // Salvar/atualizar cache
        await supabase
          .from('busca_cache')
          .upsert(
            {
              cache_key: cacheKey,
              results_count: allPlaces.length,
              buscado_em: new Date().toISOString(),
            },
            { onConflict: 'cache_key' }
          )
      } catch (err) {
        console.error('[BUSCA] Exceção na chamada Google Places:', err)
      }
    } else {
      console.warn('[BUSCA] GOOGLE_PLACES_API_KEY não configurada — pulando Places')
    }
  }

  // 4. Buscar via PostGIS (ordenado por distância)
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

// ─── GET — Busca textual no banco (sem GPS, sem chamar Google Places) ───

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')?.trim() ?? ''

  if (q.length < 2) {
    return NextResponse.json({ estabelecimentos: [], total: 0 })
  }

  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('estabelecimentos')
    .select('id, nome, categoria, endereco, telefone, avaliacao_google, total_avaliacoes, foto_url, place_id, website, latitude, longitude')
    .or(`nome.ilike.%${q}%,endereco.ilike.%${q}%`)
    .eq('ativo', true)
    .order('avaliacao_google', { ascending: false, nullsFirst: false })
    .limit(30)

  if (error) {
    return NextResponse.json({ error: 'Erro na busca' }, { status: 500 })
  }

  // Busca textual não tem distância calculada — retornar 0 como placeholder
  const lista = (data ?? []).map((e) => ({ ...e, distancia_metros: 0 }))

  return NextResponse.json({ estabelecimentos: lista, total: lista.length })
}
