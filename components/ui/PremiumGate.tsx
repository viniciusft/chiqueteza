'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { FeatureKey, CREDIT_COSTS } from '@/lib/credits/costs'

interface PremiumGateProps {
  isPremium: boolean
  feature: FeatureKey
  creditCost: number
  children: React.ReactNode
  label?: string
  description?: string
}

function IconCadeado() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <rect x="3" y="11" width="18" height="11" rx="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  )
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
    setToast(true)
    setTimeout(() => setToast(false), 2500)
  }

  // Suppress unused warning — feature is available for future use
  void CREDIT_COSTS[feature]

  const sheet = (
    <>
      <div
        onClick={() => setSheetAberto(false)}
        style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 40 }}
      />
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
        backgroundColor: '#fff', borderRadius: '24px 24px 0 0',
        padding: '12px 20px 44px', maxWidth: 430, margin: '0 auto',
      }}>
        {/* Alça */}
        <div style={{ width: 40, height: 4, backgroundColor: '#E0E0E0', borderRadius: 2, margin: '0 auto 20px' }} />

        {/* Ícone cadeado */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
          <div style={{
            width: 60, height: 60, borderRadius: '50%', backgroundColor: '#E8F5F4',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="#1B5E5A" strokeWidth="2" strokeLinecap="round">
              <rect x="3" y="11" width="18" height="11" rx="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
        </div>

        <p style={{ fontWeight: 800, fontSize: 20, color: '#111', textAlign: 'center', marginBottom: 8 }}>
          Recurso Premium
        </p>

        {description && (
          <p style={{ fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 16, lineHeight: 1.5 }}>
            {description}
          </p>
        )}

        <div style={{
          backgroundColor: '#F5F5F5', borderRadius: 12,
          padding: '10px 16px', marginBottom: 20, textAlign: 'center',
        }}>
          <p style={{ fontSize: 13, color: '#666', margin: 0 }}>
            Custo:{' '}
            <span style={{ fontWeight: 700, color: '#1B5E5A' }}>{creditCost} créditos</span>
          </p>
        </div>

        <button
          onClick={handleAssinar}
          style={{
            width: '100%', padding: '14px', borderRadius: 14, border: 'none',
            backgroundColor: '#1B5E5A', color: '#fff', fontSize: 16, fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Assinar Premium — R$19,90/mês
        </button>
      </div>
    </>
  )

  return (
    <>
      <button
        onClick={() => setSheetAberto(true)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '10px 16px', borderRadius: 12,
          border: '1.5px solid #E8E8E8', backgroundColor: '#F9F9F9',
          color: '#999', fontSize: 13, fontWeight: 600, cursor: 'pointer',
        }}
      >
        <IconCadeado />
        {label}
      </button>

      {mounted && sheetAberto && createPortal(sheet, document.body)}

      {mounted && toast && createPortal(
        <div style={{
          position: 'fixed', bottom: 100, left: '50%', transform: 'translateX(-50%)',
          backgroundColor: '#171717', color: '#fff', borderRadius: 10,
          padding: '10px 20px', fontSize: 14, fontWeight: 600, zIndex: 999, whiteSpace: 'nowrap',
        }}>
          Em breve disponível ✦
        </div>,
        document.body
      )}
    </>
  )
}
