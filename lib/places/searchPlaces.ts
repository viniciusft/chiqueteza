// Módulo compartilhado de busca Google Places
// Usado pelo route handler (Fase 1) e pelo job Inngest (Fase 2 - grade hexagonal)

export const QUERIES_BUSCA = [
  'salão de beleza',
  'manicure pedicure unhas',
  'spa massagem relaxamento',
  'depilação laser',
  'estética skincare',
  'barbearia cabelo corte',
] as const

// nextPageToken NUNCA vai no FieldMask — aparece automaticamente no corpo da resposta
export const FIELD_MASK = [
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

export interface GooglePlace {
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

export async function callPlacesAPI(
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

export async function fetchPlacesPorQuery(
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

  // Página 2
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

/**
 * Gera 6 pontos em padrão hexagonal ao redor do centro, a ~7km de distância.
 * Com raio de busca de 10km por ponto, há sobreposição de ~3km entre vizinhos,
 * garantindo cobertura sem buracos na área urbana.
 *
 * Ângulos: 0° (N), 60° (NE), 120° (SE), 180° (S), 240° (SW), 300° (NW)
 */
export function gerarPontosGrade(lat: number, lng: number): [number, number][] {
  const DISTANCIA_KM = 7
  const KM_POR_GRAU_LAT = 111.32
  const kmPorGrauLng = 111.32 * Math.cos((lat * Math.PI) / 180)

  const angulos = [0, 60, 120, 180, 240, 300]
  return angulos.map((grau) => {
    const rad = (grau * Math.PI) / 180
    const dLat = (DISTANCIA_KM * Math.cos(rad)) / KM_POR_GRAU_LAT
    const dLng = (DISTANCIA_KM * Math.sin(rad)) / kmPorGrauLng
    return [lat + dLat, lng + dLng]
  })
}

/** Converte um GooglePlace no formato para upsert na tabela estabelecimentos */
export function placeParaRow(p: GooglePlace) {
  return {
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
  }
}
