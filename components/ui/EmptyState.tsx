'use client'

import { motion } from 'framer-motion'

interface EmptyStateProps {
  emoji: string
  titulo: string
  descricao: string
  acao?: React.ReactNode
}

export default function EmptyState({ emoji, titulo, descricao, acao }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      className="flex flex-col items-center text-center"
      style={{
        gap: 10,
        padding: '36px 24px',
        borderRadius: 20,
        backgroundColor: 'var(--surface)',
        border: '1.5px solid var(--color-silver)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <motion.span
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.1 }}
        className="text-[44px] leading-none"
      >
        {emoji}
      </motion.span>

      <p className="text-section-title mt-0.5" style={{ lineHeight: 1.25 }}>
        {titulo}
      </p>

      <p className="text-caption" style={{ lineHeight: 1.5, maxWidth: 240 }}>
        {descricao}
      </p>

      {acao && (
        <div style={{ marginTop: 6 }}>
          {acao}
        </div>
      )}
    </motion.div>
  )
}
