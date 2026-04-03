'use client'

import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

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
          {/* Backdrop com blur */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={onClose}
            style={{
              position: 'fixed', inset: 0,
              backgroundColor: 'rgba(0,0,0,0.40)',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
              zIndex: 40,
            }}
          />

          {/* Sheet — spring bouncy */}
          <motion.div
            key="sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 420, damping: 32, mass: 0.8 }}
            style={{
              position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
              backgroundColor: 'var(--surface)',
              borderRadius: '24px 24px 0 0',
              padding: '12px 20px 40px',
              maxWidth: 430,
              margin: '0 auto',
              boxShadow: '0 -8px 40px rgba(255,51,102,0.12)',
            }}
          >
            {/* Alça pink */}
            <div style={{
              width: 40, height: 4,
              background: 'linear-gradient(90deg, #FF3366, #F472A0)',
              borderRadius: 2,
              margin: '0 auto 16px',
            }} />

            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-card-title m-0" style={{ color: 'var(--foreground)' }}>{title}</p>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                style={{
                  width: 32, height: 32, borderRadius: '50%',
                  backgroundColor: 'var(--background)',
                  border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--foreground-muted)',
                }}
              >
                <X size={16} />
              </motion.button>
            </div>

            {/* Ações */}
            <div className="flex flex-col gap-2">
              {actions.map((action, i) => (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 28, delay: i * 0.05 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={action.onClick}
                  className="font-body font-semibold text-left w-full"
                  style={{
                    padding: '14px 16px', borderRadius: 12,
                    border: action.variant === 'danger'
                      ? '1.5px solid rgba(239,68,68,0.3)'
                      : '1.5px solid var(--color-silver)',
                    backgroundColor: action.variant === 'danger'
                      ? 'rgba(239,68,68,0.04)'
                      : 'var(--surface)',
                    display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
                    color: action.variant === 'danger' ? '#EF4444' : 'var(--foreground)',
                    fontSize: 15,
                  }}
                >
                  <span className="text-[18px]">{action.icon}</span>
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
