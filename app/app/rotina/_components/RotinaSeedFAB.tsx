'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'

export default function RotinaSeedFAB() {
  const router = useRouter()
  const [aberto, setAberto] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const sheet = (
    <>
      {/* Overlay */}
      <div
        onClick={() => setAberto(false)}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 40,
        }}
      />

      {/* Bottom sheet */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          backgroundColor: '#fff',
          borderRadius: '24px 24px 0 0',
          padding: '12px 20px 40px',
          maxWidth: 430,
          margin: '0 auto',
          transform: 'translateY(0)',
          transition: 'transform 0.3s ease-out',
        }}
      >
        {/* Alça */}
        <div
          style={{
            width: 40,
            height: 4,
            backgroundColor: '#E0E0E0',
            borderRadius: 2,
            margin: '0 auto 20px',
          }}
        />

        {/* Título */}
        <p
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: '#111',
            textAlign: 'center',
            marginBottom: 16,
          }}
        >
          O que deseja adicionar?
        </p>

        {/* Opções lado a lado */}
        <div style={{ display: 'flex', gap: 12 }}>

          {/* Novo agendamento */}
          <button
            onClick={() => { setAberto(false); router.push('/app/rotina/agendamentos/novo') }}
            style={{
              flex: 1,
              padding: '16px 12px',
              borderRadius: 16,
              border: '1.5px solid #1B5E5A',
              backgroundColor: '#fff',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                backgroundColor: '#E8F5F4',
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
              }}
            >
              📅
            </div>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#1B5E5A' }}>
              Agendamento
            </span>
          </button>

          {/* Nova profissional */}
          <button
            onClick={() => { setAberto(false); router.push('/app/rotina/profissionais/novo') }}
            style={{
              flex: 1,
              padding: '16px 12px',
              borderRadius: 16,
              border: '1.5px solid #F472A0',
              backgroundColor: '#fff',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                backgroundColor: '#FEE8F1',
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
              }}
            >
              ✂️
            </div>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#F472A0' }}>
              Profissional
            </span>
          </button>

        </div>
      </div>
    </>
  )

  return (
    <>
      {/* Portal para overlay + sheet */}
      {mounted && aberto && createPortal(sheet, document.body)}

      {/* FAB */}
      <button
        onClick={() => setAberto((v) => !v)}
        aria-label={aberto ? 'Fechar' : 'Adicionar'}
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          width: 56,
          height: 56,
          borderRadius: '50%',
          backgroundColor: '#1B5E5A',
          color: '#fff',
          fontSize: 28,
          fontWeight: 'bold',
          lineHeight: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 60,
          boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
          border: 'none',
          cursor: 'pointer',
          transform: aberto ? 'rotate(45deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s ease',
        }}
      >
        +
      </button>
    </>
  )
}
