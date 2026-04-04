'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  /** Altura máxima. Default: 90vh */
  maxHeight?: string
}

export default function BottomSheet({
  isOpen,
  onClose,
  title,
  children,
  maxHeight = '90dvh',
}: BottomSheetProps) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  if (!mounted) return null

  const sheet = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="bs-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={onClose}
            style={{
              position: 'fixed', inset: 0,
              backgroundColor: 'rgba(0,0,0,0.42)',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
              zIndex: 40,
            }}
          />

          {/* Sheet */}
          <motion.div
            key="bs-sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 420, damping: 32, mass: 0.8 }}
            style={{
              position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
              backgroundColor: 'var(--surface)',
              borderRadius: '24px 24px 0 0',
              maxHeight,
              display: 'flex', flexDirection: 'column',
              maxWidth: 430, margin: '0 auto',
              boxShadow: '0 -8px 40px rgba(255,51,102,0.12)',
            }}
          >
            {/* Handle */}
            <div style={{
              width: 40, height: 4,
              background: 'linear-gradient(90deg, #FF3366, #F472A0)',
              borderRadius: 2,
              margin: '12px auto 0',
              flexShrink: 0,
            }} />

            {/* Header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 20px 0',
              flexShrink: 0,
            }}>
              <p style={{
                fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 16,
                color: 'var(--foreground)', margin: 0,
              }}>
                {title}
              </p>
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

            {/* Scrollable content */}
            <div style={{
              overflowY: 'auto',
              padding: '16px 20px 48px',
              flex: 1,
            }}>
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )

  return createPortal(sheet, document.body)
}
