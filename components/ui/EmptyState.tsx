'use client'

import React from 'react'
import { motion } from 'framer-motion'

// SVG illustrations mapeadas por tipo semântico
const illustrations: Record<string, React.ReactNode> = {
  calendar: (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      <rect x="4" y="12" width="56" height="48" rx="10" fill="#FFF0F3" />
      <rect x="4" y="12" width="56" height="48" rx="10" stroke="#FF3366" strokeWidth="2" />
      <rect x="14" y="4" width="6" height="16" rx="3" fill="#FF3366" />
      <rect x="44" y="4" width="6" height="16" rx="3" fill="#FF3366" />
      <rect x="4" y="24" width="56" height="2" fill="#FFB3C6" />
      <rect x="14" y="34" width="8" height="6" rx="2" fill="#FF3366" opacity=".5" />
      <rect x="28" y="34" width="8" height="6" rx="2" fill="#FF3366" opacity=".3" />
      <rect x="42" y="34" width="8" height="6" rx="2" fill="#FF3366" opacity=".2" />
      <rect x="14" y="46" width="8" height="6" rx="2" fill="#FF3366" opacity=".2" />
      <rect x="28" y="46" width="8" height="6" rx="2" fill="#FF3366" opacity=".3" />
    </svg>
  ),
  person: (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      <circle cx="32" cy="20" r="14" fill="#FFF0F3" stroke="#FF3366" strokeWidth="2" />
      <circle cx="32" cy="20" r="8" fill="#FFB3C6" />
      <path d="M8 56c0-13.255 10.745-24 24-24s24 10.745 24 24" stroke="#FF3366" strokeWidth="2" strokeLinecap="round" fill="#FFF0F3" />
      <path d="M12 56c0-11.046 8.954-20 20-20s20 8.954 20 20" fill="#FFF0F3" />
    </svg>
  ),
  sparkle: (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      <path d="M32 4L35.8 26.2L58 30L35.8 33.8L32 56L28.2 33.8L6 30L28.2 26.2L32 4Z" fill="#FFF0F3" stroke="#FF3366" strokeWidth="2" strokeLinejoin="round" />
      <path d="M52 4L53.5 12.5L62 14L53.5 15.5L52 24L50.5 15.5L42 14L50.5 12.5L52 4Z" fill="#FFB3C6" />
      <path d="M14 44L15 49L20 50L15 51L14 56L13 51L8 50L13 49L14 44Z" fill="#FFB3C6" />
    </svg>
  ),
  heart: (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      <path d="M32 54L8.4 31.4C3.2 26.2 3.2 17.8 8.4 12.6C13.6 7.4 22 7.4 27.2 12.6L32 17.4L36.8 12.6C42 7.4 50.4 7.4 55.6 12.6C60.8 17.8 60.8 26.2 55.6 31.4L32 54Z" fill="#FFF0F3" stroke="#FF3366" strokeWidth="2" strokeLinejoin="round" />
      <path d="M32 46L14 28.6C11 25.6 11 20.6 14 17.6C17 14.6 22 14.6 25 17.6L32 24.6L39 17.6C42 14.6 47 14.6 50 17.6C53 20.6 53 25.6 50 28.6L32 46Z" fill="#FFB3C6" opacity=".5" />
    </svg>
  ),
  photo: (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      <rect x="4" y="10" width="56" height="44" rx="10" fill="#FFF0F3" stroke="#FF3366" strokeWidth="2" />
      <circle cx="20" cy="26" r="6" fill="#FFB3C6" />
      <path d="M4 42L18 30L28 40L38 28L60 54H4V42Z" fill="#FF3366" opacity=".15" />
      <path d="M4 44L18 32L28 42L38 30L60 54" stroke="#FF3366" strokeWidth="2" strokeLinejoin="round" fill="none" />
    </svg>
  ),
}

// Detecta qual ilustração usar com base no emoji ou tipo passado
function resolveIllustration(emoji: string): React.ReactNode {
  if (emoji.includes('📅') || emoji.includes('🗓') || emoji.includes('📆')) return illustrations.calendar
  if (emoji.includes('💄') || emoji.includes('✨') || emoji.includes('💅')) return illustrations.sparkle
  if (emoji.includes('❤') || emoji.includes('💕') || emoji.includes('🩷')) return illustrations.heart
  if (emoji.includes('👩') || emoji.includes('👤') || emoji.includes('🧖')) return illustrations.person
  if (emoji.includes('📸') || emoji.includes('🖼') || emoji.includes('🎨')) return illustrations.photo
  return illustrations.sparkle // fallback
}

interface EmptyStateProps {
  emoji: string
  titulo: string
  descricao: string
  acao?: React.ReactNode
}

export default function EmptyState({ emoji, titulo, descricao, acao }: EmptyStateProps) {
  const illustration = resolveIllustration(emoji)

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      className="flex flex-col items-center text-center rounded-2xl shadow-pink"
      style={{
        gap: 12,
        padding: '36px 24px',
        background: 'linear-gradient(135deg, #FFF0F3 0%, #FFFBFC 60%, #FFF0F3 100%)',
        border: '1.5px solid rgba(255,51,102,0.15)',
      }}
    >
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.1 }}
      >
        {illustration}
      </motion.div>

      <p className="text-section-title mt-0.5" style={{ lineHeight: 1.25 }}>
        {titulo}
      </p>

      <p className="text-caption" style={{ lineHeight: 1.5, maxWidth: 240 }}>
        {descricao}
      </p>

      {acao && (
        <div className="mt-1.5">
          {acao}
        </div>
      )}
    </motion.div>
  )
}
