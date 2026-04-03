'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Calendar, Clock, ChevronRight } from 'lucide-react'

interface ServiceCardProps {
  nome: string
  profissional?: string
  dataHora?: string
  status?: 'agendado' | 'concluido' | 'cancelado'
  valor?: number
  onClick?: () => void
  acaoRapida?: React.ReactNode
}

const statusConfig = {
  agendado: { label: 'Agendado', bg: 'rgba(255,51,102,0.08)', color: '#FF3366', dot: '#FF3366' },
  concluido: { label: 'Realizado', bg: 'rgba(27,94,90,0.08)', color: '#1B5E5A', dot: '#1B5E5A' },
  cancelado: { label: 'Cancelado', bg: 'rgba(107,114,128,0.08)', color: '#6B7280', dot: '#9CA3AF' },
}

function formatDate(dateStr?: string) {
  if (!dateStr) return null
  const d = new Date(dateStr)
  const day = d.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })
  const time = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  return { day: day.replace('.', ''), time }
}

export function ServiceCard({ nome, profissional, dataHora, status = 'agendado', valor, onClick, acaoRapida }: ServiceCardProps) {
  const cfg = statusConfig[status]
  const date = formatDate(dataHora)

  return (
    <motion.div
      whileTap={{ scale: 0.985 }}
      transition={{ type: 'spring', stiffness: 400, damping: 22 }}
      onClick={onClick}
      className="bg-white rounded-2xl flex items-center gap-3 cursor-pointer"
      style={{
        padding: '14px 16px',
        border: '1.5px solid rgba(0,0,0,0.06)',
        boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
      }}
    >
      {/* Ícone */}
      <div
        className="flex-shrink-0 flex items-center justify-center rounded-xl"
        style={{ width: 48, height: 48, background: cfg.bg }}
      >
        <Calendar size={20} color={cfg.color} />
      </div>

      {/* Conteúdo */}
      <div className="flex-1 min-w-0">
        {/* Badge status */}
        <div className="flex items-center gap-1.5 mb-0.5">
          <div className="rounded-full" style={{ width: 6, height: 6, backgroundColor: cfg.dot }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: cfg.color, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            {cfg.label}
          </span>
        </div>

        {/* Nome do serviço */}
        <p className="text-card-title truncate mb-0.5">{nome}</p>

        {/* Profissional */}
        {profissional && (
          <p className="text-caption truncate">{profissional}</p>
        )}

        {/* Data e hora */}
        {date && (
          <div className="flex items-center gap-1 mt-1">
            <Clock size={11} color="var(--foreground-muted)" />
            <span style={{ fontSize: 12, color: 'var(--foreground-muted)' }}>
              {date.day} · {date.time}
            </span>
          </div>
        )}
      </div>

      {/* Ação rápida ou chevron */}
      <div className="flex-shrink-0 flex items-center gap-2">
        {acaoRapida}
        {!acaoRapida && onClick && (
          <ChevronRight size={18} color="var(--foreground-muted)" />
        )}
        {valor !== undefined && (
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--foreground-muted)' }}>
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor)}
          </span>
        )}
      </div>
    </motion.div>
  )
}
