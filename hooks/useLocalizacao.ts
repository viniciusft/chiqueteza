'use client'

import { useState, useCallback } from 'react'

const STORAGE_KEY = 'chiqueteza_localizacao'
const GPS_MAX_AGE = 5 * 60 * 1000 // 5 minutos
const GPS_TIMEOUT = 8_000

export interface Coordenadas {
  lat: number
  lng: number
  precisao: 'gps' | 'ip'
  timestamp: number
}

export interface EstadoLocalizacao {
  coordenadas: Coordenadas | null
  carregando: boolean
  erro: string | null
  solicitar: () => Promise<Coordenadas | null>
}

function carregarCache(): Coordenadas | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const cached = JSON.parse(raw) as Coordenadas
    // Usar cache se tiver menos de 5 minutos
    if (Date.now() - cached.timestamp < GPS_MAX_AGE) return cached
  } catch {
    // ignore
  }
  return null
}

function salvarCache(coords: Coordenadas): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(coords))
  } catch {
    // ignore
  }
}

async function obterPorIP(): Promise<Coordenadas> {
  const res = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(5_000) })
  if (!res.ok) throw new Error('Falha no fallback por IP')
  const data = (await res.json()) as { latitude?: number; longitude?: number }
  if (!data.latitude || !data.longitude) throw new Error('IP sem coordenadas')
  return {
    lat: data.latitude,
    lng: data.longitude,
    precisao: 'ip',
    timestamp: Date.now(),
  }
}

function obterPorGPS(): Promise<Coordenadas> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocalização não suportada neste browser'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          precisao: 'gps',
          timestamp: Date.now(),
        })
      },
      (err) => reject(err),
      { timeout: GPS_TIMEOUT, maximumAge: GPS_MAX_AGE, enableHighAccuracy: false }
    )
  })
}

function mensagemErro(err: unknown): string {
  if (err instanceof GeolocationPositionError) {
    if (err.code === GeolocationPositionError.PERMISSION_DENIED) {
      return 'Permissão de localização negada. Ative o GPS nas configurações do seu navegador.'
    }
    if (err.code === GeolocationPositionError.TIMEOUT) {
      return 'GPS demorou muito. Tentando pela rede...'
    }
  }
  return 'Não foi possível obter sua localização.'
}

export function useLocalizacao(): EstadoLocalizacao {
  const [coordenadas, setCoordenadas] = useState<Coordenadas | null>(null)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const solicitar = useCallback(async (): Promise<Coordenadas | null> => {
    // 1. Usar cache se recente
    const cached = carregarCache()
    if (cached) {
      setCoordenadas(cached)
      return cached
    }

    setCarregando(true)
    setErro(null)

    // 2. Tentar GPS
    try {
      const coords = await obterPorGPS()
      salvarCache(coords)
      setCoordenadas(coords)
      setCarregando(false)
      return coords
    } catch (gpsErr) {
      // GPS negado: não tentar fallback por IP
      if (
        gpsErr instanceof GeolocationPositionError &&
        gpsErr.code === GeolocationPositionError.PERMISSION_DENIED
      ) {
        const msg = mensagemErro(gpsErr)
        setErro(msg)
        setCarregando(false)
        return null
      }

      // GPS timeout ou indisponível: fallback por IP
      try {
        const coords = await obterPorIP()
        salvarCache(coords)
        setCoordenadas(coords)
        setCarregando(false)
        return coords
      } catch {
        const msg = mensagemErro(gpsErr)
        setErro(msg)
        setCarregando(false)
        return null
      }
    }
  }, [])

  return { coordenadas, carregando, erro, solicitar }
}
