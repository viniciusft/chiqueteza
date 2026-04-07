// Job Inngest: popular banco com todos os estabelecimentos de uma cidade
// Disparado após a Fase 1 (busca do centro) quando a cidade ainda não foi populada
// Executa grade hexagonal de 6 pontos a 7km do centro → ~250-300 estabelecimentos únicos

import { inngest } from './client'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  QUERIES_BUSCA,
  fetchPlacesPorQuery,
  gerarPontosGrade,
  placeParaRow,
  type GooglePlace,
} from '@/lib/places/searchPlaces'

export const popularCidade = inngest.createFunction(
  {
    id: 'popular-cidade-beleza',
    name: 'Popular banco com estabelecimentos da cidade',
    triggers: [{ event: 'profissionais/popular_cidade' }],
  },
  async ({ event, step }) => {
    const { lat, lng, raio_km } = event.data as { lat: number; lng: number; raio_km: number }
    const apiKey = process.env.GOOGLE_PLACES_API_KEY!
    const supabase = createAdminClient()

    if (!apiKey) {
      console.warn('[GRADE] GOOGLE_PLACES_API_KEY não configurada — job abortado')
      return { ok: false, motivo: 'api_key_ausente' }
    }

    const pontos = gerarPontosGrade(lat, lng)
    console.log(`[GRADE] Iniciando grade: ${pontos.length} pontos ao redor de (${lat},${lng})`)

    let totalNovos = 0

    // Cada step é rastreado individualmente pelo Inngest — falha num ponto não cancela os outros
    for (let i = 0; i < pontos.length; i++) {
      const [pLat, pLng] = pontos[i]
      const novos = await step.run(`ponto-${i + 1}`, async () => {
        // 6 queries em paralelo para este ponto
        const settled = await Promise.allSettled(
          QUERIES_BUSCA.map((q) => fetchPlacesPorQuery(pLat, pLng, raio_km, q, apiKey))
        )

        const allPlaces: GooglePlace[] = []
        const seenIds = new Set<string>()

        for (const result of settled) {
          if (result.status === 'fulfilled') {
            for (const place of result.value.places) {
              if (!seenIds.has(place.id)) {
                seenIds.add(place.id)
                allPlaces.push(place)
              }
            }
          }
        }

        if (allPlaces.length === 0) {
          console.log(`[GRADE] Ponto ${i + 1}: nenhum resultado`)
          return 0
        }

        const rows = allPlaces.map(placeParaRow)

        const { error } = await supabase
          .from('estabelecimentos')
          .upsert(rows, { onConflict: 'id', ignoreDuplicates: false })

        if (error) {
          console.error(`[GRADE] Ponto ${i + 1} upsert erro:`, error.message)
          return 0
        }

        console.log(`[GRADE] Ponto ${i + 1} (${pLat.toFixed(4)},${pLng.toFixed(4)}): ${rows.length} estabelecimentos`)
        return rows.length
      })

      totalNovos += novos as number
    }

    console.log(`[GRADE] Concluído. Total inserido/atualizado nos 6 pontos: ${totalNovos}`)
    return { ok: true, pontos: pontos.length, totalNovos }
  }
)
