'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock } from 'lucide-react'
import { FeatureKey, CREDIT_COSTS } from '@/lib/credits/costs'

interface PremiumGateProps {
  isPremium: boolean
  feature: FeatureKey
  creditCost: number
  children: React.ReactNode
  label?: string
  description?: string
}

export default function PremiumGate({
  isPremium: premium,
  feature,
  creditCost,
  children,
  label = 'Recurso Premium',
  description,
}: PremiumGateProps) {
  const [sheetAberto, setSheetAberto] = useState(false)
  const [toast, setToast] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  if (premium) return <>{children}</>

  function handleAssinar() {
    setSheetAberto(false)
    setToast(true)
    setTimeout(() => setToast(false), 2500)
  }

  void CREDIT_COSTS[feature]

  const sheet = (
    <AnimatePresence>
      {sheetAberto && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={() => setSheetAberto(false)}
            style={{
              position: 'fixed', inset: 0,
              backgroundColor: 'rgba(0,0,0,0.42)',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
              zIndex: 40,
            }}
          />
          <motion.div
            key="sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 420, damping: 32, mass: 0.8 }}
            style={{
              position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
              backgroundColor: '#fff', borderRadius: '24px 24px 0 0',
              padding: '12px 20px 44px', maxWidth: 430, margin: '0 auto',
              boxShadow: '0 -8px 40px rgba(255,51,102,0.12)',
            }}
          >
            {/* Handle */}
            <div style={{
              width: 40, height: 4,
              background: 'linear-gradient(90deg, #FF3366, #F472A0)',
              borderRadius: 2, margin: '0 auto 20px',
            }} />

            {/* Ícone */}
            <div className="flex justify-center mb-4">
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: 'rgba(255,51,102,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Lock size={28} color="var(--color-primary)" />
              </div>
            </div>

            <p className="text-section-title text-center mb-2">Recurso Premium</p>

            {description && (
              <p className="text-body text-center mb-4" style={{ lineHeight: 1.5 }}>
                {description}
              </p>
            )}

            <div className="text-center rounded-xl py-2.5 px-4 mb-5"
              style={{ background: 'rgba(255,51,102,0.06)', border: '1.5px solid rgba(255,51,102,0.15)' }}>
              <p className="text-caption m-0">
                Custo:{' '}
                <span className="font-bold" style={{ color: 'var(--color-primary)' }}>{creditCost} créditos</span>
              </p>
            </div>

            <button
              onClick={handleAssinar}
              className="font-body font-bold w-full"
              style={{
                padding: '14px', borderRadius: 14, border: 'none',
                background: 'linear-gradient(135deg, #FF3366, #C41A4A)',
                color: '#fff', fontSize: 16, cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(255,51,102,0.3)',
              }}
            >
              Assinar Premium — R$19,90/mês
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )

  return (
    <>
      <motion.button
        whileTap={{ scale: 0.96 }}
        onClick={() => setSheetAberto(true)}
        className="text-caption font-semibold"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '10px 16px', borderRadius: 12,
          border: '1.5px solid var(--color-silver)', backgroundColor: 'var(--background)',
          color: 'var(--foreground-muted)', cursor: 'pointer',
        }}
      >
        <Lock size={13} />
        {label}
      </motion.button>

      {mounted && createPortal(sheet, document.body)}

      {mounted && toast && createPortal(
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed', bottom: 100, left: '50%', transform: 'translateX(-50%)',
            background: 'linear-gradient(135deg, #1B5E5A, #0F3D3A)',
            color: '#fff', borderRadius: 12,
            padding: '10px 20px', fontSize: 14, fontWeight: 600,
            zIndex: 999, whiteSpace: 'nowrap',
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
          }}
        >
          Em breve disponível ✦
        </motion.div>,
        document.body
      )}
    </>
  )
}
