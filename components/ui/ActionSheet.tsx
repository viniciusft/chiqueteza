'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'

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

  if (!mounted || !isOpen) return null

  const sheet = (
    <>
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 40 }}
      />
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
        backgroundColor: '#fff', borderRadius: '24px 24px 0 0',
        padding: '12px 20px 40px', maxWidth: 430, margin: '0 auto',
      }}>
        {/* Alça */}
        <div style={{
          width: 40, height: 4, backgroundColor: '#E0E0E0',
          borderRadius: 2, margin: '0 auto 16px',
        }} />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <p style={{ fontWeight: 700, fontSize: 16, color: '#111', margin: 0 }}>{title}</p>
          <button
            onClick={onClose}
            style={{
              width: 28, height: 28, borderRadius: '50%', backgroundColor: '#F5F5F5',
              border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 18, color: '#666', lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {/* Ações */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {actions.map((action, i) => (
            <button
              key={i}
              onClick={action.onClick}
              style={{
                width: '100%', padding: '14px 16px', borderRadius: 12,
                border: '1.5px solid #F0F0F0', backgroundColor: '#fff',
                display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
                color: action.variant === 'danger' ? '#EF4444' : '#171717',
                fontSize: 15, fontWeight: 600, textAlign: 'left',
              }}
            >
              <span style={{ fontSize: 18 }}>{action.icon}</span>
              <span>{action.label}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  )

  return createPortal(sheet, document.body)
}
