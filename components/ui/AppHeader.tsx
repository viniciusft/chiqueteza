'use client'

import { ReactNode, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Logo from './Logo'
import { createClient } from '@/lib/supabase/client'
import { AvatarUser } from './UserCard'

interface AppHeaderProps {
  actions?: ReactNode
}

interface PerfilBasico {
  nome: string
  username: string | null
  avatar_url: string | null
}

export default function AppHeader({ actions }: AppHeaderProps) {
  const router = useRouter()
  const [perfil, setPerfil] = useState<PerfilBasico | null>(null)

  useEffect(() => {
    const supabase = createClient()
    void (async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: perfil } = await supabase
        .from('perfis')
        .select('nome, username, avatar_url')
        .eq('id', user.id)
        .single()
      if (perfil) setPerfil(perfil as PerfilBasico)
    })()
  }, [])

  return (
    <header
      className="flex items-center justify-between px-5 py-3.5"
      style={{
        backgroundColor: 'var(--surface)',
        borderBottom: '1px solid var(--color-silver)',
      }}
    >
      <Logo />
      {actions ? (
        <div>{actions}</div>
      ) : perfil ? (
        <button
          onClick={() => router.push('/app/perfil')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          aria-label="Meu perfil"
        >
          <AvatarUser
            usuario={{ id: '', nome: perfil.nome, username: perfil.username, avatar_url: perfil.avatar_url }}
            size={34}
          />
        </button>
      ) : null}
    </header>
  )
}
