'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Search, ArrowLeft, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import AppHeader from '@/components/ui/AppHeader'
import PageContainer from '@/components/ui/PageContainer'
import UserCard, { type UsuarioBasico } from '@/components/ui/UserCard'

interface UsuarioResult extends UsuarioBasico {
  seguindo?: boolean
}

export default function BuscarPage() {
  const router = useRouter()
  const [meId, setMeId] = useState<string | null>(null)
  const [meusSeguidosIds, setMeusSeguidosIds] = useState<Set<string>>(new Set())
  const [query, setQuery] = useState('')
  const [resultados, setResultados] = useState<UsuarioResult[]>([])
  const [sugestoes, setSugestoes] = useState<UsuarioResult[]>([])
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const supabase = createClient()
    void supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      setMeId(user.id)

      // Carregar quem já sigo para exibir estado correto nos botões
      const { data: seg } = await supabase
        .from('seguimentos')
        .select('seguido_id')
        .eq('seguidor_id', user.id)
      const ids = new Set<string>((seg ?? []).map((s: { seguido_id: string }) => s.seguido_id))
      setMeusSeguidosIds(ids)

      // Sugestões: pessoas que me seguem mas que não sigo de volta
      const { data: meSegue } = await supabase
        .from('seguimentos')
        .select('seguidor_id, perfis:seguidor_id (id, nome, username, avatar_url, bio)')
        .eq('seguido_id', user.id)
        .limit(10)

      const naoSigo = (meSegue ?? [])
        .map((s: Record<string, unknown>) => s.perfis as UsuarioBasico)
        .filter((u) => !ids.has(u.id))
        .map((u) => ({ ...u, seguindo: false }))
      setSugestoes(naoSigo)
    })
  }, [router])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (query.trim().length < 2) { setResultados([]); return }

    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/social/buscar?q=${encodeURIComponent(query.trim())}`)
        const data = await res.json() as { usuarios: UsuarioBasico[] }
        const comEstado = data.usuarios.map((u) => ({ ...u, seguindo: meusSeguidosIds.has(u.id) }))
        setResultados(comEstado)
      } finally {
        setLoading(false)
      }
    }, 380)
  }, [query, meusSeguidosIds])

  const mostrarSugestoes = query.trim().length < 2

  return (
    <PageContainer>
      <AppHeader
        actions={
          <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, color: '#525252', fontSize: 14, fontFamily: 'var(--font-body)' }}>
            <ArrowLeft size={16} /> Voltar
          </button>
        }
      />
      <main style={{ padding: '20px 20px 100px' }}>
        <h1 style={{ margin: '0 0 16px', fontSize: 20, fontWeight: 800, color: 'var(--foreground)', fontFamily: 'var(--font-body)' }}>
          Buscar pessoas
        </h1>

        {/* Campo de busca */}
        <div style={{ position: 'relative', marginBottom: 24 }}>
          <Search size={16} color="#A3A3A3" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nome ou @username..."
            autoFocus
            style={{ width: '100%', borderRadius: 14, border: '1.5px solid #E8E8E8', padding: '13px 40px', fontSize: 14, color: '#171717', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', backgroundColor: '#fff' }}
          />
          {query && (
            <button onClick={() => setQuery('')} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
              <X size={14} color="#A3A3A3" />
            </button>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <p style={{ textAlign: 'center', color: '#A3A3A3', fontSize: 14, padding: '20px 0', fontFamily: 'var(--font-body)' }}>Buscando...</p>
        )}

        {/* Resultados da busca */}
        {!loading && !mostrarSugestoes && (
          resultados.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <span style={{ fontSize: 40 }}>🔍</span>
              <p style={{ fontSize: 15, fontWeight: 600, color: '#525252', marginTop: 12, fontFamily: 'var(--font-body)' }}>
                Nenhuma usuária encontrada para "{query}"
              </p>
            </div>
          ) : (
            <div>
              <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 700, color: '#A3A3A3', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'var(--font-body)' }}>
                {resultados.length} resultado{resultados.length !== 1 ? 's' : ''}
              </p>
              {resultados.map((u) => (
                <UserCard key={u.id} usuario={u} seguindoInicial={u.seguindo} isMe={u.id === meId} />
              ))}
            </div>
          )
        )}

        {/* Sugestões (quando busca vazia) */}
        {mostrarSugestoes && sugestoes.length > 0 && (
          <div>
            <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 700, color: '#A3A3A3', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'var(--font-body)' }}>
              Seguem você mas você não segue de volta
            </p>
            {sugestoes.map((u) => (
              <UserCard key={u.id} usuario={u} seguindoInicial={false} isMe={u.id === meId} />
            ))}
          </div>
        )}

        {mostrarSugestoes && sugestoes.length === 0 && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ textAlign: 'center', padding: '40px 0' }}
          >
            <span style={{ fontSize: 48 }}>🌸</span>
            <p style={{ fontSize: 15, fontWeight: 600, color: '#525252', marginTop: 12, fontFamily: 'var(--font-body)' }}>
              Descubra outras usuárias
            </p>
            <p style={{ fontSize: 13, color: '#A3A3A3', fontFamily: 'var(--font-body)' }}>
              Digite um nome ou @username para começar
            </p>
          </motion.div>
        )}
      </main>
    </PageContainer>
  )
}
