'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function RotinaSeedFAB() {
  const router = useRouter()
  const [aberto, setAberto] = useState(false)

  return (
    <>
      {/* Overlay */}
      {aberto && (
        <div
          className="fixed inset-0 z-40"
          style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
          onClick={() => setAberto(false)}
        />
      )}

      {/* Bottom sheet */}
      {aberto && (
        <div
          className="fixed bottom-0 left-0 right-0 z-50 flex flex-col gap-3 px-5 py-6 bg-white mx-auto"
          style={{ borderRadius: '20px 20px 0 0', maxWidth: 430, left: '50%', transform: 'translateX(-50%)' }}
        >
          <p className="font-bold text-gray-800 text-center mb-1" style={{ fontSize: 16 }}>
            O que deseja adicionar?
          </p>
          <button
            onClick={() => { setAberto(false); router.push('/app/rotina/agendamentos/novo') }}
            className="w-full font-bold text-white text-left flex items-center gap-3 px-4 py-4"
            style={{ backgroundColor: '#1B5E5A', borderRadius: 14, fontSize: 15 }}
          >
            <span style={{ fontSize: 22 }}>📅</span>
            Novo agendamento
          </button>
          <button
            onClick={() => { setAberto(false); router.push('/app/rotina/profissionais/novo') }}
            className="w-full font-bold text-white text-left flex items-center gap-3 px-4 py-4"
            style={{ backgroundColor: '#F472A0', borderRadius: 14, fontSize: 15 }}
          >
            <span style={{ fontSize: 22 }}>💅</span>
            Nova profissional
          </button>
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setAberto(true)}
        className="fixed z-30 flex items-center justify-center text-white font-bold shadow-lg"
        style={{
          bottom: 24,
          right: 24,
          width: 56,
          height: 56,
          borderRadius: '50%',
          backgroundColor: '#1B5E5A',
          fontSize: 28,
          lineHeight: 1,
        }}
        aria-label="Adicionar"
      >
        +
      </button>
    </>
  )
}
