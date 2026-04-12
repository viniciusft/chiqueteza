'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Check } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import AppHeader from '@/components/ui/AppHeader'
import PageContainer from '@/components/ui/PageContainer'
import { AvatarUser } from '@/components/ui/UserCard'
import type { UsuarioBasico } from '@/components/ui/UserCard'

const USERNAME_REGEX = /^[a-z0-9_]{3,30}$/

export default function EditarPerfilPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [nome, setNome] = useState('')
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [usernameErro, setUsernameErro] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void (async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)
      const { data } = await supabase
        .from('perfis')
        .select('nome, username, bio, avatar_url')
        .eq('id', user.id)
        .single()
      if (data) {
        setNome(data.nome ?? '')
        setUsername(data.username ?? '')
        setBio(data.bio ?? '')
        setAvatarUrl(data.avatar_url ?? null)
      }
      setLoading(false)
    })()
  }, [router])

  function validarUsername(val: string) {
    if (!val) { setUsernameErro(''); return true }
    if (!USERNAME_REGEX.test(val)) {
      setUsernameErro('Apenas letras minúsculas, números e _. Entre 3 e 30 caracteres.')
      return false
    }
    setUsernameErro('')
    return true
  }

  async function handleSalvar() {
    if (!userId) return
    if (username && !validarUsername(username)) return

    setSalvando(true)
    const supabase = createClient()

    const { error } = await supabase
      .from('perfis')
      .update({
        nome: nome.trim() || null,
        username: username.trim() || null,
        bio: bio.trim() || null,
      })
      .eq('id', userId)

    if (error) {
      if (error.code === '23505') {
        setUsernameErro('Este @username já está em uso. Escolha outro.')
      } else {
        toast.error('Erro ao salvar. Tente novamente.')
      }
      setSalvando(false)
      return
    }

    toast.success('Perfil atualizado!')
    router.push('/app/perfil')
  }

  const perfilParaAvatar: UsuarioBasico = {
    id: userId ?? '',
    nome: nome || null,
    username: username || null,
    avatar_url: avatarUrl,
  }

  if (loading) {
    return (
      <PageContainer>
        <AppHeader />
        <div style={{ padding: '24px 20px' }}>
          <div className="skeleton-shimmer" style={{ height: 80, borderRadius: 12 }} />
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <AppHeader
        actions={
          <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, color: '#525252', fontSize: 14, fontFamily: 'var(--font-body)' }}>
            <ArrowLeft size={16} /> Voltar
          </button>
        }
      />
      <main style={{ padding: '24px 20px 100px' }}>
        <h1 style={{ margin: '0 0 24px', fontSize: 20, fontWeight: 800, color: 'var(--foreground)', fontFamily: 'var(--font-body)' }}>
          Editar perfil
        </h1>

        {/* Avatar */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
          <AvatarUser usuario={perfilParaAvatar} size={80} />
        </div>

        {/* Nome */}
        <div style={{ marginBottom: 18 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#525252', marginBottom: 6, fontFamily: 'var(--font-body)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Nome
          </label>
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Seu nome"
            maxLength={60}
            style={{ width: '100%', borderRadius: 12, border: '1.5px solid #E8E8E8', padding: '12px 14px', fontSize: 15, color: '#171717', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', backgroundColor: '#fff' }}
          />
        </div>

        {/* Username */}
        <div style={{ marginBottom: 18 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#525252', marginBottom: 6, fontFamily: 'var(--font-body)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            @Username
          </label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 15, color: '#A3A3A3', fontFamily: 'inherit' }}>@</span>
            <input
              value={username}
              onChange={(e) => {
                const val = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '')
                setUsername(val)
                validarUsername(val)
              }}
              placeholder="seuusername"
              maxLength={30}
              style={{ width: '100%', borderRadius: 12, border: `1.5px solid ${usernameErro ? '#EF4444' : '#E8E8E8'}`, padding: '12px 14px 12px 28px', fontSize: 15, color: '#171717', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', backgroundColor: '#fff' }}
            />
          </div>
          {usernameErro && (
            <p style={{ margin: '4px 0 0', fontSize: 12, color: '#EF4444', fontFamily: 'var(--font-body)' }}>{usernameErro}</p>
          )}
          {!usernameErro && username && (
            <p style={{ margin: '4px 0 0', fontSize: 12, color: '#1B5E5A', fontFamily: 'var(--font-body)' }}>
              Seu perfil ficará em: /app/u/{username}
            </p>
          )}
        </div>

        {/* Bio */}
        <div style={{ marginBottom: 32 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#525252', marginBottom: 6, fontFamily: 'var(--font-body)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Bio
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Fale um pouco sobre você..."
            maxLength={160}
            rows={3}
            style={{ width: '100%', borderRadius: 12, border: '1.5px solid #E8E8E8', padding: '12px 14px', fontSize: 14, color: '#171717', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', backgroundColor: '#fff', resize: 'none', lineHeight: 1.5 }}
          />
          <p style={{ margin: '4px 0 0', fontSize: 11, color: '#A3A3A3', textAlign: 'right', fontFamily: 'var(--font-body)' }}>
            {bio.length}/160
          </p>
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleSalvar}
          disabled={salvando || !!usernameErro}
          style={{ width: '100%', padding: '15px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg, #FF3366, #C41A4A)', color: '#fff', fontSize: 15, fontWeight: 700, cursor: (salvando || !!usernameErro) ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-body)', opacity: (salvando || !!usernameErro) ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
        >
          {salvando ? 'Salvando...' : <><Check size={16} /> Salvar perfil</>}
        </motion.button>
      </main>
    </PageContainer>
  )
}
