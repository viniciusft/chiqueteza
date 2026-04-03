'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Star, MessageCircle, ExternalLink } from 'lucide-react'

interface ProfessionalCardProps {
  nome: string
  especialidades?: string[]
  avaliacao?: number
  telefone?: string
  instagram?: string
  avatarUrl?: string
  onClick?: () => void
  onWhatsApp?: () => void
}

function StarRating({ value = 0 }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={12}
          fill={i <= Math.round(value) ? '#D4A843' : 'transparent'}
          color={i <= Math.round(value) ? '#D4A843' : '#D1D5DB'}
          strokeWidth={1.5}
        />
      ))}
      {value > 0 && (
        <span style={{ fontSize: 11, color: 'var(--foreground-muted)', marginLeft: 4 }}>
          {value.toFixed(1)}
        </span>
      )}
    </div>
  )
}

function Avatar({ url, nome }: { url?: string; nome: string }) {
  const initials = nome.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  if (url) {
    return (
      <img
        src={url}
        alt={nome}
        className="rounded-full object-cover flex-shrink-0"
        style={{ width: 56, height: 56, border: '2px solid rgba(255,51,102,0.15)' }}
      />
    )
  }

  return (
    <div
      className="rounded-full flex-shrink-0 flex items-center justify-center font-display font-semibold"
      style={{
        width: 56, height: 56,
        background: 'linear-gradient(135deg, #FF3366, #F472A0)',
        color: '#fff', fontSize: 18,
        border: '2px solid rgba(255,51,102,0.15)',
      }}
    >
      {initials}
    </div>
  )
}

export function ProfessionalCard({
  nome, especialidades = [], avaliacao = 0, telefone, instagram, avatarUrl, onClick, onWhatsApp,
}: ProfessionalCardProps) {
  return (
    <motion.div
      whileTap={{ scale: 0.985 }}
      transition={{ type: 'spring', stiffness: 400, damping: 22 }}
      onClick={onClick}
      className="bg-white rounded-2xl cursor-pointer"
      style={{
        padding: '14px 16px',
        border: '1.5px solid rgba(0,0,0,0.06)',
        boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
      }}
    >
      <div className="flex items-center gap-3">
        <Avatar url={avatarUrl} nome={nome} />

        <div className="flex-1 min-w-0">
          <p className="text-card-title truncate">{nome}</p>

          {especialidades.length > 0 && (
            <p className="text-caption truncate mt-0.5">
              {especialidades.slice(0, 2).join(' · ')}
            </p>
          )}

          <div className="mt-1">
            <StarRating value={avaliacao} />
          </div>
        </div>

        {/* Ações rápidas */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {onWhatsApp && (
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={(e) => { e.stopPropagation(); onWhatsApp() }}
              className="rounded-xl flex items-center justify-center"
              style={{ width: 36, height: 36, backgroundColor: '#25D366', border: 'none', cursor: 'pointer' }}
            >
              <MessageCircle size={16} color="#fff" />
            </motion.button>
          )}
          {instagram && (
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={(e) => { e.stopPropagation(); window.open(`https://instagram.com/${instagram.replace('@', '')}`, '_blank') }}
              className="rounded-xl flex items-center justify-center"
              style={{
                width: 36, height: 36,
                background: 'linear-gradient(135deg, #F58529, #DD2A7B, #8134AF)',
                border: 'none', cursor: 'pointer',
              }}
            >
              <ExternalLink size={16} color="#fff" />
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  )
}
