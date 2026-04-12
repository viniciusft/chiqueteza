'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

export interface UsuarioBasico {
  id: string
  nome: string | null
  username: string | null
  avatar_url: string | null
  bio?: string | null
}

interface UserCardProps {
  usuario: UsuarioBasico
  seguindoInicial?: boolean
  mostrarBotaoSeguir?: boolean
  isMe?: boolean
  onClick?: () => void
}

export function AvatarUser({ usuario, size = 44 }: { usuario: UsuarioBasico; size?: number }) {
  const iniciais = (usuario.nome ?? usuario.username ?? '?')
    .split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()

  if (usuario.avatar_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={usuario.avatar_url}
        alt={usuario.nome ?? ''}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
      />
    )
  }

  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: 'linear-gradient(135deg, #FF3366, #F472A0)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: Math.round(size * 0.35), fontWeight: 700, color: '#fff',
      fontFamily: 'var(--font-body)',
    }}>
      {iniciais}
    </div>
  )
}

export default function UserCard({
  usuario,
  seguindoInicial = false,
  mostrarBotaoSeguir = true,
  isMe = false,
  onClick,
}: UserCardProps) {
  const router = useRouter()
  const [seguindo, setSeguindo] = useState(seguindoInicial)
  const [loading, setLoading] = useState(false)

  async function handleToggleSeguir(e: React.MouseEvent) {
    e.stopPropagation()
    if (loading) return
    setLoading(true)
    try {
      const method = seguindo ? 'DELETE' : 'POST'
      const res = await fetch(`/api/social/seguir/${usuario.id}`, { method })
      if (res.ok) setSeguindo(!seguindo)
    } finally {
      setLoading(false)
    }
  }

  function handleClick() {
    if (onClick) { onClick(); return }
    if (usuario.username) router.push(`/app/u/${usuario.username}`)
  }

  return (
    <motion.div
      whileTap={{ scale: 0.99 }}
      onClick={handleClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0',
        borderBottom: '1px solid #F5F5F5', cursor: 'pointer',
      }}
    >
      <AvatarUser usuario={usuario} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--foreground)',
          fontFamily: 'var(--font-body)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {usuario.nome ?? usuario.username ?? 'Usuária'}
        </p>
        {usuario.username && (
          <p style={{ margin: 0, fontSize: 12, color: '#A3A3A3', fontFamily: 'var(--font-body)' }}>
            @{usuario.username}
          </p>
        )}
        {usuario.bio && (
          <p style={{
            margin: '2px 0 0', fontSize: 12, color: '#6B7280', fontFamily: 'var(--font-body)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {usuario.bio}
          </p>
        )}
      </div>

      {mostrarBotaoSeguir && !isMe && (
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={handleToggleSeguir}
          disabled={loading}
          style={{
            padding: '7px 16px', borderRadius: 20, flexShrink: 0,
            border: seguindo ? '1.5px solid #E8E8E8' : 'none',
            background: seguindo ? '#fff' : 'linear-gradient(135deg, #FF3366, #C41A4A)',
            color: seguindo ? '#525252' : '#fff',
            fontSize: 12, fontWeight: 700, cursor: loading ? 'default' : 'pointer',
            fontFamily: 'var(--font-body)', opacity: loading ? 0.7 : 1,
          }}
        >
          {seguindo ? 'Seguindo' : 'Seguir'}
        </motion.button>
      )}
    </motion.div>
  )
}
