'use client'

import React from 'react'

// ─── Base shimmer atom ────────────────────────────────────────────────

function Bone({ className = '', style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`skeleton-shimmer rounded-lg ${className}`}
      style={style}
    />
  )
}

// ─── Genérico (mantido para retrocompatibilidade) ─────────────────────

export function SkeletonCard({ height = 80 }: { height?: number }) {
  return <Bone style={{ height, marginBottom: 8, borderRadius: 16 }} />
}

export function SkeletonList({ count = 3, height = 80 }: { count?: number; height?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} height={height} />
      ))}
    </>
  )
}

// ─── Card de agendamento ──────────────────────────────────────────────
// Espelha o layout real: ícone | badge+título+profissional+data | ação

export function SkeletonAppointment() {
  return (
    <div
      className="flex items-center gap-3 p-4 bg-white rounded-xl"
      style={{ border: '1.5px solid var(--color-silver)' }}
    >
      {/* Ícone calendário */}
      <Bone style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0 }} />

      <div className="flex-1 flex flex-col gap-2">
        {/* Badge PRÓXIMO */}
        <Bone style={{ height: 14, width: 52, borderRadius: 4 }} />
        {/* Nome do serviço */}
        <Bone style={{ height: 15, width: '65%', borderRadius: 6 }} />
        {/* Profissional */}
        <Bone style={{ height: 13, width: '45%', borderRadius: 6 }} />
        {/* Data/hora */}
        <Bone style={{ height: 12, width: '55%', borderRadius: 6 }} />
      </div>

      {/* Botão WhatsApp */}
      <Bone style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0 }} />
    </div>
  )
}

// ─── Card de profissional ─────────────────────────────────────────────
// Espelha: avatar circular | nome+especialidade+estrelas | CTA

export function SkeletonProfessional() {
  return (
    <div
      className="flex items-center gap-3 p-4 bg-white rounded-xl"
      style={{ border: '1.5px solid var(--color-silver)' }}
    >
      {/* Avatar circular */}
      <Bone style={{ width: 56, height: 56, borderRadius: '50%', flexShrink: 0 }} />

      <div className="flex-1 flex flex-col gap-2">
        {/* Nome */}
        <Bone style={{ height: 15, width: '55%', borderRadius: 6 }} />
        {/* Especialidade */}
        <Bone style={{ height: 13, width: '40%', borderRadius: 6 }} />
        {/* Estrelas */}
        <div className="flex gap-1">
          {[...Array(5)].map((_, i) => (
            <Bone key={i} style={{ width: 12, height: 12, borderRadius: '50%' }} />
          ))}
        </div>
      </div>

      {/* CTA Agendar */}
      <Bone style={{ width: 70, height: 32, borderRadius: 20, flexShrink: 0 }} />
    </div>
  )
}

// ─── Card de look (masonry) ───────────────────────────────────────────

export function SkeletonLook({ height = 200 }: { height?: number }) {
  return (
    <div className="relative rounded-xl overflow-hidden" style={{ height }}>
      <Bone className="absolute inset-0" style={{ borderRadius: 0, height: '100%' }} />
      {/* Rodapé */}
      <div className="absolute bottom-0 left-0 right-0 p-3 flex items-center justify-between">
        <Bone style={{ height: 12, width: '50%', borderRadius: 4 }} />
        <Bone style={{ width: 28, height: 28, borderRadius: '50%' }} />
      </div>
    </div>
  )
}

// ─── Linha de alerta ──────────────────────────────────────────────────

export function SkeletonAlert() {
  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-xl"
      style={{ backgroundColor: 'var(--color-primary-light)', border: '1.5px solid var(--color-silver)' }}
    >
      <Bone style={{ width: 18, height: 18, borderRadius: '50%', flexShrink: 0 }} />
      <div className="flex flex-col gap-1.5 flex-1">
        <Bone style={{ height: 14, width: '55%', borderRadius: 4 }} />
        <Bone style={{ height: 12, width: '35%', borderRadius: 4 }} />
      </div>
    </div>
  )
}
