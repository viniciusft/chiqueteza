'use client'

import { motion } from 'framer-motion'
import { MapPin, Phone, Star, Navigation, Globe } from 'lucide-react'

export interface Estabelecimento {
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

const CATEGORIA_LABELS: Record<string, string> = {
  beauty_salon: 'Salão de beleza',
  hair_care: 'Cabeleireiro',
  nail_salon: 'Manicure',
  spa: 'Spa',
}

function formatarDistancia(metros: number): string {
  if (metros < 1000) return `${Math.round(metros)}m`
  return `${(metros / 1000).toFixed(1).replace('.', ',')}km`
}

function badgeDistancia(metros: number): { label: string; color: string; bg: string } {
  if (metros < 500) return { label: 'Pertíssimo', color: '#15803d', bg: 'rgba(21,128,61,0.09)' }
  if (metros < 2000) return { label: 'Próximo', color: '#b45309', bg: 'rgba(180,83,9,0.09)' }
  return { label: 'Um pouco longe', color: '#b91c1c', bg: 'rgba(185,28,28,0.08)' }
}

function iniciais(nome: string): string {
  return nome
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()
}

function Estrelas({ valor, total }: { valor: number; total: number | null }) {
  const cheias = Math.floor(valor)
  const meia = valor - cheias >= 0.5
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          size={11}
          fill={i < cheias || (i === cheias && meia) ? '#D4A843' : 'none'}
          color={i < cheias || (i === cheias && meia) ? '#D4A843' : '#D4D4D4'}
          strokeWidth={1.5}
        />
      ))}
      <span style={{ fontSize: 11, fontWeight: 600, color: '#525252', marginLeft: 2 }}>
        {valor.toFixed(1)}
      </span>
      {total && (
        <span style={{ fontSize: 11, color: '#A3A3A3' }}>({total.toLocaleString('pt-BR')})</span>
      )}
    </div>
  )
}

export default function EstabelecimentoCard({ est }: { est: Estabelecimento }) {
  const dist = formatarDistancia(est.distancia_metros)
  const badge = badgeDistancia(est.distancia_metros)
  const categoriaLabel = est.categoria ? (CATEGORIA_LABELS[est.categoria] ?? est.categoria) : null

  const waNumero = est.telefone?.replace(/\D/g, '')
  const mapsUrl =
    est.latitude && est.longitude
      ? `https://www.google.com/maps/dir/?api=1&destination=${est.latitude},${est.longitude}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(est.nome + ' ' + (est.endereco ?? ''))}`

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        padding: '14px 16px',
        backgroundColor: '#fff',
        borderRadius: 16,
        border: '1.5px solid #F0F0F0',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      }}
    >
      {/* Avatar */}
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 14,
          background: 'linear-gradient(135deg, rgba(255,51,102,0.12), rgba(255,51,102,0.06))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: 16,
          color: 'var(--color-primary)',
        }}
      >
        {iniciais(est.nome)}
      </div>

      {/* Conteúdo */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
          <p style={{
            fontFamily: 'var(--font-body)', fontWeight: 700,
            fontSize: 14, color: '#171717', margin: 0,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {est.nome}
          </p>
          {/* Badge distância */}
          <span style={{
            flexShrink: 0,
            display: 'inline-flex', alignItems: 'center', gap: 3,
            fontSize: 11, fontWeight: 700,
            color: badge.color, background: badge.bg,
            borderRadius: 20, padding: '2px 8px',
          }}>
            <MapPin size={9} />
            {dist}
          </span>
        </div>

        {categoriaLabel && (
          <p style={{ fontSize: 12, color: '#767676', margin: '2px 0 0', fontFamily: 'var(--font-body)' }}>
            {categoriaLabel}
          </p>
        )}

        {est.avaliacao_google !== null && (
          <div style={{ marginTop: 5 }}>
            <Estrelas valor={est.avaliacao_google} total={est.total_avaliacoes} />
          </div>
        )}

        {est.endereco && (
          <p style={{
            fontSize: 11, color: '#A3A3A3', margin: '4px 0 0',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {est.endereco}
          </p>
        )}

        {/* Badge de proximidade descritivo + ações */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10 }}>
          <span style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '0.04em',
            color: badge.color, background: badge.bg,
            borderRadius: 6, padding: '2px 7px',
          }}>
            {badge.label}
          </span>

          <div style={{ flex: 1 }} />

          {/* Navegar */}
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              width: 32, height: 32, borderRadius: 10,
              background: 'rgba(27,94,90,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              textDecoration: 'none',
            }}
            title="Abrir no Maps"
          >
            <Navigation size={15} color="#1B5E5A" />
          </a>

          {/* WhatsApp */}
          {waNumero && (
            <a
              href={`https://wa.me/${waNumero}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                width: 32, height: 32, borderRadius: 10,
                background: '#25D366',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                textDecoration: 'none',
              }}
              title="WhatsApp"
            >
              <Phone size={15} color="#fff" />
            </a>
          )}

          {/* Website */}
          {est.website && (
            <a
              href={est.website}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                width: 32, height: 32, borderRadius: 10,
                background: 'rgba(255,51,102,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                textDecoration: 'none',
              }}
              title="Site"
            >
              <Globe size={15} color="var(--color-primary)" />
            </a>
          )}
        </div>
      </div>
    </motion.div>
  )
}
