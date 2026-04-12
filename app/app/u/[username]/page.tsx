'use client'

import { useState, useEffect, useCallback, use } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import AppHeader from '@/components/ui/AppHeader'
import PageContainer from '@/components/ui/PageContainer'
import { AvatarUser } from '@/components/ui/UserCard'
import UserCard, { type UsuarioBasico } from '@/components/ui/UserCard'

const Masonry = dynamic(() => import('react-masonry-css'), { ssr: false })

// ─── Types ────────────────────────────────────────────────────────────

interface PerfilPublico {
  id: string
  nome: string | null
  username: string | null
  bio: string | null
  avatar_url: string | null
}

interface LookPublico {
  id: string
  foto_url: string
  descricao: string | null
  curtidas: number
}

interface ArmarioPublico {
  id: string
  nome: string
  marca: string | null
  categoria: string | null
  nivel_atual: number
  foto_url: string | null
}

interface WishlistPublica {
  id: string
  nome: string
  marca: string | null
  preco_estimado: number | null
  foto_url: string | null
  status: string
}

type Aba = 'looks' | 'armario' | 'wishlist'
type Sheet = 'seguidores' | 'seguindo' | null

const CATEGORIAS_EMOJI: Record<string, string> = {
  skincare: '🧴', maquiagem: '💄', cabelo: '💆', corpo: '🛁',
  perfume: '🌸', unhas: '💅', ferramenta: '🔧',
}

// ─── Social Sheet ─────────────────────────────────────────────────────

function SheetSocial({ tipo, perfilId, meId, onClose }: { tipo: Sheet; perfilId: string; meId: string; onClose: () => void }) {
  const [lista, setLista] = useState<(UsuarioBasico & { seguindo?: boolean })[]>([])
  const [meusSeguidosIds, setMeusSeguidosIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!tipo) return
    const supabase = createClient()
    void (async () => {
      setLoading(true)
      const joinCol = tipo === 'seguidores' ? 'seguidor_id' : 'seguido_id'
      const filterCol = tipo === 'seguidores' ? 'seguido_id' : 'seguidor_id'

      const { data: seg } = await supabase
        .from('seguimentos')
        .select(`${joinCol}, perfis:${joinCol} (id, nome, username, avatar_url, bio)`)
        .eq(filterCol, perfilId)

      const { data: meusSeg } = await supabase
        .from('seguimentos')
        .select('seguido_id')
        .eq('seguidor_id', meId)

      const ids = new Set<string>((meusSeg ?? []).map((s: { seguido_id: string }) => s.seguido_id))
      setMeusSeguidosIds(ids)

      const usuarios = (seg ?? []).map((s: Record<string, unknown>) => ({
        ...(s.perfis as UsuarioBasico),
        seguindo: ids.has((s.perfis as UsuarioBasico).id),
      }))
      setLista(usuarios)
      setLoading(false)
    })()
  }, [tipo, perfilId, meId])

  return (
    <div
      style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 50, display: 'flex', alignItems: 'flex-end' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 400, damping: 40 }}
        style={{ backgroundColor: '#fff', borderRadius: '24px 24px 0 0', padding: '20px 20px 48px', width: '100%', maxWidth: 430, margin: '0 auto', maxHeight: '75vh', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#E0E0E0', margin: '0 auto 16px' }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <p style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--foreground)', fontFamily: 'var(--font-body)' }}>
            {tipo === 'seguidores' ? 'Seguidores' : 'Seguindo'}
          </p>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <X size={20} color="#A3A3A3" />
          </button>
        </div>
        {loading ? (
          <p style={{ textAlign: 'center', color: '#A3A3A3', fontSize: 14, padding: '24px 0', fontFamily: 'var(--font-body)' }}>Carregando...</p>
        ) : lista.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#A3A3A3', fontSize: 14, padding: '24px 0', fontFamily: 'var(--font-body)' }}>Nenhuma usuária aqui.</p>
        ) : (
          lista.map((u) => (
            <UserCard
              key={u.id}
              usuario={u}
              seguindoInicial={meusSeguidosIds.has(u.id)}
              isMe={u.id === meId}
              onClick={onClose}
            />
          ))
        )}
      </motion.div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────

export default function PerfilPublicoPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params)
  const router = useRouter()
  const [meId, setMeId] = useState<string | null>(null)
  const [perfil, setPerfil] = useState<PerfilPublico | null>(null)
  const [stats, setStats] = useState({ seguidores: 0, seguindo: 0, looksPublicos: 0 })
  const [seguindo, setSeguindo] = useState(false)
  const [loadingSeguir, setLoadingSeguir] = useState(false)
  const [aba, setAba] = useState<Aba>('looks')
  const [looks, setLooks] = useState<LookPublico[]>([])
  const [armario, setArmario] = useState<ArmarioPublico[]>([])
  const [wishlist, setWishlist] = useState<WishlistPublica[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [sheet, setSheet] = useState<Sheet>(null)

  const carregarPerfil = useCallback(async (uid: string, myId: string) => {
    const supabase = createClient()
    const [
      { count: seguidores },
      { count: seguindoCount },
      { count: looksPublicos },
      { data: meuSeg },
    ] = await Promise.all([
      supabase.from('seguimentos').select('*', { count: 'exact', head: true }).eq('seguido_id', uid),
      supabase.from('seguimentos').select('*', { count: 'exact', head: true }).eq('seguidor_id', uid),
      supabase.from('looks_diario').select('*', { count: 'exact', head: true }).eq('usuario_id', uid).eq('publico', true),
      supabase.from('seguimentos').select('id').eq('seguidor_id', myId).eq('seguido_id', uid).maybeSingle(),
    ])
    setStats({ seguidores: seguidores ?? 0, seguindo: seguindoCount ?? 0, looksPublicos: looksPublicos ?? 0 })
    setSeguindo(!!meuSeg)
  }, [])

  const carregarLooks = useCallback(async (uid: string) => {
    const supabase = createClient()
    const { data } = await supabase
      .from('looks_diario')
      .select('id, foto_url, descricao, curtidas')
      .eq('usuario_id', uid)
      .eq('publico', true)
      .order('created_at', { ascending: false })
      .limit(40)
    setLooks((data ?? []) as LookPublico[])
  }, [])

  const carregarArmario = useCallback(async (uid: string) => {
    const supabase = createClient()
    const { data } = await supabase
      .from('armario_produtos')
      .select('id, nome, marca, categoria, nivel_atual, foto_url')
      .eq('usuario_id', uid)
      .eq('publico', true)
      .neq('status', 'finalizado')
      .order('created_at', { ascending: false })
      .limit(40)
    setArmario((data ?? []) as ArmarioPublico[])
  }, [])

  const carregarWishlist = useCallback(async (uid: string) => {
    const supabase = createClient()
    const { data } = await supabase
      .from('wishlist_produtos')
      .select('id, nome, marca, preco_estimado, foto_url, status')
      .eq('usuario_id', uid)
      .eq('publico', true)
      .order('created_at', { ascending: false })
      .limit(40)
    setWishlist((data ?? []) as WishlistPublica[])
  }, [])

  useEffect(() => {
    void (async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setMeId(user.id)

      const { data: p } = await supabase
        .from('perfis')
        .select('id, nome, username, bio, avatar_url')
        .eq('username', username)
        .maybeSingle()

      if (!p) { setNotFound(true); setLoading(false); return }

      // Redireciona para meu próprio perfil
      if (p.id === user.id) { router.replace('/app/perfil'); return }

      setPerfil(p as PerfilPublico)
      await Promise.all([
        carregarPerfil(p.id, user.id),
        carregarLooks(p.id),
      ])
      setLoading(false)
    })()
  }, [username, router, carregarPerfil, carregarLooks])

  useEffect(() => {
    if (!perfil) return
    if (aba === 'armario') void carregarArmario(perfil.id)
    if (aba === 'wishlist') void carregarWishlist(perfil.id)
  }, [aba, perfil, carregarArmario, carregarWishlist])

  async function handleToggleSeguir() {
    if (!perfil || !meId) return
    setLoadingSeguir(true)
    const method = seguindo ? 'DELETE' : 'POST'
    try {
      const res = await fetch(`/api/social/seguir/${perfil.id}`, { method })
      if (res.ok) {
        const data = await res.json() as { seguindo: boolean; totalSeguidores: number }
        setSeguindo(data.seguindo)
        setStats((prev) => ({ ...prev, seguidores: data.totalSeguidores }))
      }
    } finally {
      setLoadingSeguir(false)
    }
  }

  if (loading) {
    return (
      <PageContainer>
        <AppHeader actions={<button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><ArrowLeft size={20} color="#525252" /></button>} />
        <div style={{ padding: '24px 20px' }}>
          <div className="skeleton-shimmer" style={{ width: 80, height: 80, borderRadius: '50%', marginBottom: 12 }} />
          <div className="skeleton-shimmer" style={{ height: 18, width: 140, borderRadius: 8, marginBottom: 8 }} />
        </div>
      </PageContainer>
    )
  }

  if (notFound || !perfil) {
    return (
      <PageContainer>
        <AppHeader actions={<button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><ArrowLeft size={20} color="#525252" /></button>} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 20px' }}>
          <span style={{ fontSize: 48 }}>🔍</span>
          <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--foreground)', marginTop: 12, fontFamily: 'var(--font-body)' }}>Usuária não encontrada</p>
          <p style={{ fontSize: 14, color: '#A3A3A3', fontFamily: 'var(--font-body)' }}>@{username} não existe.</p>
        </div>
      </PageContainer>
    )
  }

  const perfilParaAvatar: UsuarioBasico = { id: perfil.id, nome: perfil.nome, username: perfil.username, avatar_url: perfil.avatar_url }

  return (
    <PageContainer>
      <AppHeader
        actions={
          <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, color: '#525252', fontSize: 14, fontFamily: 'var(--font-body)' }}>
            <ArrowLeft size={16} /> Voltar
          </button>
        }
      />
      <main style={{ padding: '20px 0 100px' }}>

        {/* Header */}
        <div style={{ padding: '0 20px 16px', display: 'flex', alignItems: 'flex-start', gap: 16 }}>
          <AvatarUser usuario={perfilParaAvatar} size={72} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--foreground)', fontFamily: 'var(--font-body)' }}>
              {perfil.nome ?? perfil.username}
            </p>
            {perfil.username && (
              <p style={{ margin: '2px 0 6px', fontSize: 13, color: '#A3A3A3', fontFamily: 'var(--font-body)' }}>
                @{perfil.username}
              </p>
            )}
            {perfil.bio && (
              <p style={{ margin: '4px 0 10px', fontSize: 13, color: '#5A5A5A', fontFamily: 'var(--font-body)', lineHeight: 1.4 }}>
                {perfil.bio}
              </p>
            )}
            <motion.button
              whileTap={{ scale: 0.94 }}
              onClick={handleToggleSeguir}
              disabled={loadingSeguir}
              style={{
                padding: '8px 22px', borderRadius: 20, border: seguindo ? '1.5px solid #E8E8E8' : 'none',
                background: seguindo ? '#fff' : 'linear-gradient(135deg, #FF3366, #C41A4A)',
                color: seguindo ? '#525252' : '#fff',
                fontSize: 13, fontWeight: 700, cursor: loadingSeguir ? 'default' : 'pointer',
                fontFamily: 'var(--font-body)', opacity: loadingSeguir ? 0.7 : 1,
              }}
            >
              {loadingSeguir ? '...' : seguindo ? 'Seguindo ✓' : '+ Seguir'}
            </motion.button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ padding: '0 20px 20px', display: 'flex', borderTop: '1px solid #F5F5F5', paddingTop: 16, marginTop: 4 }}>
          {[
            { label: 'looks', value: stats.looksPublicos },
            { label: 'seguidores', value: stats.seguidores, onClick: () => setSheet('seguidores') },
            { label: 'seguindo', value: stats.seguindo, onClick: () => setSheet('seguindo') },
          ].map(({ label, value, onClick }) => (
            <div key={label} onClick={onClick} style={{ flex: 1, textAlign: 'center', cursor: onClick ? 'pointer' : 'default', padding: '8px 4px', borderRadius: 10 }}>
              <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--foreground)', fontFamily: 'var(--font-body)' }}>{value}</p>
              <p style={{ margin: 0, fontSize: 11, color: '#A3A3A3', fontFamily: 'var(--font-body)' }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ margin: '0 20px 20px', display: 'flex', backgroundColor: '#F0F0F0', borderRadius: 14, padding: 4 }}>
          {(['looks', 'armario', 'wishlist'] as Aba[]).map((t) => (
            <button key={t} onClick={() => setAba(t)} style={{
              flex: 1, padding: '9px 0', borderRadius: 11, border: 'none',
              backgroundColor: aba === t ? '#fff' : 'transparent',
              color: aba === t ? 'var(--color-primary)' : '#888',
              fontSize: 12, fontWeight: aba === t ? 700 : 500,
              cursor: 'pointer', fontFamily: 'var(--font-body)',
              boxShadow: aba === t ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.15s',
            }}>
              {t === 'looks' ? '✨ Looks' : t === 'armario' ? '🪞 Armário' : '🤍 Wishlist'}
            </button>
          ))}
        </div>

        {/* Conteúdo */}
        {aba === 'looks' && (
          looks.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#A3A3A3', fontSize: 14, padding: '40px 20px', fontFamily: 'var(--font-body)' }}>
              Nenhum look público ainda.
            </p>
          ) : (
            <Masonry breakpointCols={2} className="masonry-grid" columnClassName="masonry-grid_column">
              {looks.map((look) => (
                <div key={look.id} style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', backgroundColor: '#F0F0F0', marginBottom: 8 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={look.foto_url} alt="Look" loading="lazy" style={{ width: '100%', height: 'auto', display: 'block' }} />
                  {look.curtidas > 0 && (
                    <div style={{ position: 'absolute', bottom: 6, right: 6, display: 'flex', alignItems: 'center', gap: 3, background: 'rgba(0,0,0,0.45)', borderRadius: 12, padding: '2px 6px' }}>
                      <span style={{ fontSize: 11, color: '#fff', fontFamily: 'var(--font-body)', fontWeight: 600 }}>♥ {look.curtidas}</span>
                    </div>
                  )}
                </div>
              ))}
            </Masonry>
          )
        )}

        {aba === 'armario' && (
          <div style={{ padding: '0 20px' }}>
            {armario.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#A3A3A3', fontSize: 14, padding: '40px 0', fontFamily: 'var(--font-body)' }}>
                Nenhum produto público no armário.
              </p>
            ) : armario.map((p) => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #F5F5F5' }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, overflow: 'hidden', background: '#F5F5F5', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {p.foto_url
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={p.foto_url} alt={p.nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ fontSize: 22 }}>{(p.categoria && CATEGORIAS_EMOJI[p.categoria]) ?? '✨'}</span>
                  }
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--foreground)', fontFamily: 'var(--font-body)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.nome}</p>
                  {p.marca && <p style={{ margin: 0, fontSize: 11, color: '#A3A3A3', fontFamily: 'var(--font-body)' }}>{p.marca}</p>}
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: p.nivel_atual <= 15 ? '#EF4444' : '#1B5E5A', flexShrink: 0 }}>{p.nivel_atual}%</span>
              </div>
            ))}
          </div>
        )}

        {aba === 'wishlist' && (
          <div style={{ padding: '0 20px' }}>
            {wishlist.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#A3A3A3', fontSize: 14, padding: '40px 0', fontFamily: 'var(--font-body)' }}>
                Nenhum item público na wishlist.
              </p>
            ) : wishlist.map((w) => (
              <div key={w.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #F5F5F5' }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, overflow: 'hidden', background: '#F5F5F5', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {w.foto_url
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={w.foto_url} alt={w.nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ fontSize: 22 }}>🤍</span>
                  }
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--foreground)', fontFamily: 'var(--font-body)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.nome}</p>
                  {w.marca && <p style={{ margin: 0, fontSize: 11, color: '#A3A3A3', fontFamily: 'var(--font-body)' }}>{w.marca}</p>}
                  {w.preco_estimado && (
                    <p style={{ margin: 0, fontSize: 11, color: '#1B5E5A', fontWeight: 600, fontFamily: 'var(--font-body)' }}>
                      R${w.preco_estimado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <AnimatePresence>
        {sheet && meId && (
          <SheetSocial tipo={sheet} perfilId={perfil.id} meId={meId} onClose={() => setSheet(null)} />
        )}
      </AnimatePresence>
    </PageContainer>
  )
}
