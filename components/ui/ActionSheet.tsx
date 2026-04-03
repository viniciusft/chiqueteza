'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'

export interface SheetAction {
  label: string
  icon: string
  variant?: 'default' | 'danger'
  onClick: () => void
}

interface ActionSheetProps {
  isOpen: boolean
  onClose: () => void
  title: string
  actions: SheetAction[]
}

export default function ActionSheet({ isOpen, onClose, title, actions }: ActionSheetProps) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  if (!mounted) return null

  const sheet = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', zIndex: 40 }}
          />

          {/* Sheet */}
          <motion.div
            key="sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 36 }}
            style={{
              position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
              backgroundColor: 'var(--surface)',
              borderRadius: '24px 24px 0 0',
              padding: '12px 20px 40px',
              maxWidth: 430,
              margin: '0 auto',
            }}
          >
            {/* Alça */}
            <div style={{
              width: 40, height: 4, backgroundColor: 'var(--color-silver)',
              borderRadius: 2, margin: '0 auto 16px',
            }} />

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <p style={{ fontWeight: 700, fontSize: 16, color: 'var(--foreground)', margin: 0, fontFamily: 'var(--font-body)' }}>{title}</p>
              <button
                onClick={onClose}
                style={{
                  width: 32, height: 32, borderRadius: '50%', backgroundColor: 'var(--background)',
                  border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: 18, color: 'var(--foreground-muted)', lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>

            {/* Ações */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {actions.map((action, i) => (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.2 }}
                  onClick={action.onClick}
                  style={{
                    width: '100%', padding: '14px 16px', borderRadius: 12,
                    border: '1.5px solid var(--color-silver)', backgroundColor: 'var(--surface)',
                    display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
                    color: action.variant === 'danger' ? '#EF4444' : 'var(--foreground)',
                    fontSize: 15, fontWeight: 600, textAlign: 'left',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  <span style={{ fontSize: 18 }}>{action.icon}</span>
                  <span>{action.label}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )

  return createPortal(sheet, document.body)
}
