'use client'

import Link from 'next/link'

export default function RotinaSeedFAB() {
  return (
    <Link
      href="/app/rotina/agendamentos/novo"
      aria-label="Novo agendamento"
      style={{
        position: 'fixed',
        bottom: 88,
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
        zIndex: 20,
        boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
        textDecoration: 'none',
      }}
    >
      +
    </Link>
  )
}
