import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const RAIO_KM_DEFAULT = 5
const CACHE_DAYS = 30

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
  internationalPhoneNumber?: string
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

  if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return NextResponse.json({ error: 'Coordenadas inválidas' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const cacheKey = buildCacheKey(lat, lng, raio_km)
  const cacheExpiry = new Date(Date.now() - CACHE_DAYS * 24 * 60 * 60 * 1000).toISOString()

  // 2. Verificar cache (30 dias)
  const { data: cacheHit } = await supabase
    .from('busca_cache')
    .select('buscado_em')
    .eq('cache_key', cacheKey)
    .gte('buscado_em', cacheExpiry)
    .maybeSingle()

  // 3. Cache miss → Google Places API (New)
  if (!cacheHit) {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY
    if (apiKey) {
      try {
        const placesRes = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': apiKey,
            'X-Goog-FieldMask': [
              'places.id',
              'places.displayName',
              'places.formattedAddress',
              'places.rating',
              'places.userRatingCount',
              'places.primaryType',
              'places.internationalPhoneNumber',
              'places.location',
              'places.websiteUri',
            ].join(','),
          },
          body: JSON.stringify({
            includedTypes: ['beauty_salon', 'hair_care', 'nail_salon', 'spa'],
            locationRestriction: {
              circle: {
                center: { latitude: lat, longitude: lng },
                radius: raio_km * 1000,
              },
            },
            maxResultCount: 20,
          }),
          signal: AbortSignal.timeout(10_000),
        })

        if (placesRes.ok) {
          const json = (await placesRes.json()) as { places?: GooglePlace[] }
          const places = json.places ?? []

          if (places.length > 0) {
            const rows = places.map((p) => ({
              id: p.id,
              nome: p.displayName?.text ?? 'Sem nome',
              endereco: p.formattedAddress ?? null,
              telefone: p.internationalPhoneNumber ?? null,
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
            await supabase
              .from('estabelecimentos')
              .upsert(rows, { onConflict: 'id', ignoreDuplicates: false })
          }

          // Salvar/atualizar cache
          await supabase
            .from('busca_cache')
            .upsert(
              {
                cache_key: cacheKey,
                results_count: places.length,
                buscado_em: new Date().toISOString(),
              },
              { onConflict: 'cache_key' }
            )
        }
      } catch {
        // Google Places falhou — retorna dados do banco local sem erro
      }
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
    return NextResponse.json({ error: 'Erro ao buscar estabelecimentos' }, { status: 500 })
  }

  const lista = (resultados as EstabelecimentoRPC[] | null) ?? []

  return NextResponse.json({
    estabelecimentos: lista,
    total: lista.length,
    cache_hit: !!cacheHit,
  })
}
