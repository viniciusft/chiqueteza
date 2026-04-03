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
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 10,
        padding: '36px 24px',
        borderRadius: 20,
        backgroundColor: 'var(--surface)',
        border: '1.5px solid var(--color-silver)',
        boxShadow: 'var(--shadow-sm)',
        textAlign: 'center',
      }}
    >
      <motion.span
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.1 }}
        style={{ fontSize: 44, lineHeight: 1 }}
      >
        {emoji}
      </motion.span>

      <p style={{
        fontFamily: 'var(--font-display)',
        fontWeight: 700,
        fontSize: 17,
        color: 'var(--foreground)',
        lineHeight: 1.25,
        marginTop: 2,
      }}>
        {titulo}
      </p>

      <p style={{
        fontSize: 14,
        color: 'var(--foreground-muted)',
        lineHeight: 1.5,
        maxWidth: 240,
      }}>
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
