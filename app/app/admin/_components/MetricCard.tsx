'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import Link from 'next/link'
import type { STATS_META } from '../_data/features'

interface Props {
  metaKey: string
  meta: typeof STATS_META[string]
  valor: number | null
  loading: boolean
}

export function MetricCard({ metaKey, meta, valor, loading }: Props) {
  const [aberto, setAberto] = useState(false)
  const n = valor ?? 0
  const isAlert = metaKey === 'pushSubs' && n === 0

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: loading ? 0.5 : 1, scale: 1 }}
      style={{
        background: '#fff',
        borderRadius: 14,
        border: isAlert ? '1.5px solid rgba(239,68,68,0.25)' : '1.5px solid #F0F0F0',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
      }}
    >
      <button
        onClick={() => setAberto(a => !a)}
        style={{
          width: '100%', background: 'none', border: 'none',
          padding: '14px 14px 12px', cursor: 'pointer', textAlign: 'left',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <span style={{ fontSize: 16 }}>{meta.emoji}</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: '#A3A3A3', fontFamily: 'var(--font-body)', flex: 1 }}>
            {meta.label}
          </span>
          <ChevronDown
            size={12}
            color="#C0C0C0"
            style={{ transform: aberto ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6 }}>
          <p style={{
            margin: 0, fontSize: 30, fontWeight: 800, lineHeight: 1,
            color: isAlert && !loading ? '#EF4444' : meta.cor,
            fontFamily: 'var(--font-body)',
          }}>
            {loading ? '—' : n}
          </p>
          {isAlert && !loading && (
            <span style={{ fontSize: 10, color: '#EF4444', fontWeight: 700, fontFamily: 'var(--font-body)', paddingBottom: 3 }}>
              ⚠
            </span>
          )}
        </div>
      </button>

      <AnimatePresence initial={false}>
        {aberto && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '0 14px 14px', borderTop: '1px solid #F5F5F5' }}>
              <p style={{ margin: '10px 0 8px', fontSize: 12, color: '#5A5A5A', fontFamily: 'var(--font-body)', lineHeight: 1.5 }}>
                {meta.descricao}
              </p>
              <Link
                href={meta.url}
                style={{
                  fontSize: 11, fontWeight: 700, color: meta.cor,
                  textDecoration: 'none',
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  background: `${meta.cor}12`, borderRadius: 8, padding: '5px 10px',
                }}
              >
                Ver no app →
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
