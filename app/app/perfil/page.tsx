'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'framer-motion'
import { Pencil, X, Lock, Globe } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import AppHeader from '@/components/ui/AppHeader'
import PageContainer from '@/components/ui/PageContainer'
import { AvatarUser, type UsuarioBasico } from '@/components/ui/UserCard'
import UserCard from '@/components/ui/UserCard'

const Masonry = dynamic(() => import('react-masonry-css'), { ssr: false })

// ─── Types ────────────────────────────────────────────────────────────

interface PerfilData {
  id: string
  nome: string | null
  username: string | null
  bio: string | null
  avatar_url: string | null
}

interface LookItem {
  id: string
  foto_url: string
  descricao: string | null
  publico: boolean
  curtidas: number
  created_at: string
}

interface ArmarioItem {
  id: string
  nome: string
  marca: string | null
  categoria: string | null
  nivel_atual: number
  publico: boolean
  foto_url: string | null
}

interface WishlistItem {
  id: string
  nome: string
  marca: string | null
  preco_estimado: number | null
  publico: boolean
  status: string
  foto_url: string | null
}

type Aba = 'looks' | 'armario' | 'wishlist'
type Sheet = 'seguidores' | 'seguindo' | null

const CATEGORIAS_EMOJI: Record<string, string> = {
  skincare: '🧴', maquiagem: '💄', cabelo: '💆', corpo: '🛁',
  perfume: '🌸', unhas: '💅', ferramenta: '🔧',
}

function categoriaEmoji(cat: string | null) {
  return (cat && CATEGORIAS_EMOJI[cat]) ?? '✨'
}

// ─── Seguidores / Seguindo Sheet ──────────────────────────────────────

function SheetSocial({
  tipo, userId, onClose,
}: { tipo: Sheet; userId: string; onClose: () => void }) {
  const [lista, setLista] = useState<(UsuarioBasico & { seguindo?: boolean })[]>([])
  const [meusSeguidosIds, setMeusSeguidosIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!tipo) return
    const supabase = createClient()
    void (async () => {
      setLoading(true)
      const col = tipo === 'seguidores' ? 'seguidor_id' : 'seguido_id'
      const joinCol = tipo === 'seguidores' ? 'seguido_id' : 'seguidor_id'

      const { data: seg } = await supabase
        .from('seguimentos')
        .select(`${col}, perfis:${joinCol} (id, nome, username, avatar_url, bio)`)
        .eq(tipo === 'seguidores' ? 'seguido_id' : 'seguidor_id', userId)

      const { data: meusSeg } = await supabase
        .from('seguimentos')
        .select('seguido_id')
        .eq('seguidor_id', userId)

      const ids = new Set<string>((meusSeg ?? []).map((s: { seguido_id: string }) => s.seguido_id))
      setMeusSeguidosIds(ids)

      const usuarios = (seg ?? []).map((s: Record<string, unknown>) => ({
        ...(s.perfis as UsuarioBasico),
        seguindo: ids.has((s.perfis as UsuarioBasico).id),
      }))
      setLista(usuarios)
      setLoading(false)
    })()
  }, [tipo, userId])

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
          <p style={{ textAlign: 'center', color: '#A3A3A3', fontSize: 14, padding: '24px 0', fontFamily: 'var(--font-body)' }}>
            {tipo === 'seguidores' ? 'Nenhum seguidor ainda.' : 'Você não segue ninguém ainda.'}
          </p>
        ) : (
          lista.map((u) => (
            <UserCard
              key={u.id}
              usuario={u}
              seguindoInicial={meusSeguidosIds.has(u.id)}
              isMe={u.id === userId}
              onClick={onClose}
            />
          ))
        )}
      </motion.div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────

export default function PerfilPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [perfil, setPerfil] = useState<PerfilData | null>(null)
  const [stats, setStats] = useState({ seguidores: 0, seguindo: 0, looksPublicos: 0 })
  const [aba, setAba] = useState<Aba>('looks')
  const [looks, setLooks] = useState<LookItem[]>([])
  const [armario, setArmario] = useState<ArmarioItem[]>([])
  const [wishlist, setWishlist] = useState<WishlistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [sheet, setSheet] = useState<Sheet>(null)

  const carregarPerfil = useCallback(async (uid: string) => {
    const supabase = createClient()
    const [
      { data: p },
      { count: seguidores },
      { count: seguindo },
      { count: looksPublicos },
    ] = await Promise.all([
      supabase.from('perfis').select('id, nome, username, bio, avatar_url').eq('id', uid).single(),
      supabase.from('seguimentos').select('*', { count: 'exact', head: true }).eq('seguido_id', uid),
      supabase.from('seguimentos').select('*', { count: 'exact', head: true }).eq('seguidor_id', uid),
      supabase.from('looks_diario').select('*', { count: 'exact', head: true }).eq('usuario_id', uid).eq('publico', true),
    ])
    setPerfil(p as PerfilData)
    setStats({ seguidores: seguidores ?? 0, seguindo: seguindo ?? 0, looksPublicos: looksPublicos ?? 0 })
  }, [])

  const carregarLooks = useCallback(async (uid: string) => {
    const supabase = createClient()
    const { data } = await supabase
      .from('looks_diario')
      .select('id, foto_url, descricao, publico, curtidas, created_at')
      .eq('usuario_id', uid)
      .order('created_at', { ascending: false })
      .limit(40)
    setLooks((data ?? []) as LookItem[])
  }, [])

  const carregarArmario = useCallback(async (uid: string) => {
    const supabase = createClient()
    const { data } = await supabase
      .from('armario_produtos')
      .select('id, nome, marca, categoria, nivel_atual, publico, foto_url')
      .eq('usuario_id', uid)
      .neq('status', 'finalizado')
      .order('created_at', { ascending: false })
      .limit(40)
    setArmario((data ?? []) as ArmarioItem[])
  }, [])

  const carregarWishlist = useCallback(async (uid: string) => {
    const supabase = createClient()
    const { data } = await supabase
      .from('wishlist_produtos')
      .select('id, nome, marca, preco_estimado, publico, status, foto_url')
      .eq('usuario_id', uid)
      .order('created_at', { ascending: false })
      .limit(40)
    setWishlist((data ?? []) as WishlistItem[])
  }, [])

  useEffect(() => {
    void (async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)
      await Promise.all([carregarPerfil(user.id), carregarLooks(user.id)])
      setLoading(false)
    })()
  }, [router, carregarPerfil, carregarLooks])

  useEffect(() => {
    if (!userId) return
    if (aba === 'armario') void carregarArmario(userId)
    if (aba === 'wishlist') void carregarWishlist(userId)
  }, [aba, userId, carregarArmario, carregarWishlist])

  if (loading || !perfil) {
    return (
      <PageContainer>
        <AppHeader />
        <div style={{ padding: '24px 20px' }}>
          <div className="skeleton-shimmer" style={{ width: 80, height: 80, borderRadius: '50%', marginBottom: 12 }} />
          <div className="skeleton-shimmer" style={{ height: 18, width: 140, borderRadius: 8, marginBottom: 8 }} />
          <div className="skeleton-shimmer" style={{ height: 14, width: 100, borderRadius: 8 }} />
        </div>
      </PageContainer>
    )
  }

  const usuarioParaAvatar: UsuarioBasico = { id: perfil.id, nome: perfil.nome, username: perfil.username, avatar_url: perfil.avatar_url }

  return (
    <PageContainer>
      <AppHeader />
      <main style={{ padding: '20px 0 100px', minHeight: '80vh' }}>

        {/* Banner setup username */}
        {!perfil.username && (
          <div
            style={{ margin: '0 20px 16px', padding: '14px 16px', borderRadius: 14, background: 'linear-gradient(135deg, rgba(255,51,102,0.07), rgba(244,114,160,0.07))', border: '1.5px dashed rgba(255,51,102,0.3)', cursor: 'pointer' }}
            onClick={() => router.push('/app/perfil/editar')}
          >
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#FF3366', fontFamily: 'var(--font-body)' }}>
              ✨ Escolha seu @username
            </p>
            <p style={{ margin: '3px 0 0', fontSize: 12, color: '#A3A3A3', fontFamily: 'var(--font-body)' }}>
              Para aparecer para outras usuárias e ser encontrada na busca.
            </p>
          </div>
        )}

        {/* Header do perfil */}
        <div style={{ padding: '0 20px 20px', display: 'flex', alignItems: 'flex-start', gap: 16 }}>
          <AvatarUser usuario={usuarioParaAvatar} size={72} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--foreground)', fontFamily: 'var(--font-body)' }}>
              {perfil.nome ?? 'Sem nome'}
            </p>
            {perfil.username && (
              <p style={{ margin: '2px 0 4px', fontSize: 13, color: '#A3A3A3', fontFamily: 'var(--font-body)' }}>
                @{perfil.username}
              </p>
            )}
            {perfil.bio && (
              <p style={{ margin: '4px 0 0', fontSize: 13, color: '#5A5A5A', fontFamily: 'var(--font-body)', lineHeight: 1.4 }}>
                {perfil.bio}
              </p>
            )}
          </div>
          <motion.button
            whileTap={{ scale: 0.93 }}
            onClick={() => router.push('/app/perfil/editar')}
            style={{ padding: '7px 14px', borderRadius: 20, border: '1.5px solid #E8E8E8', background: '#fff', fontSize: 12, fontWeight: 700, color: '#525252', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'var(--font-body)', flexShrink: 0 }}
          >
            <Pencil size={12} color="#525252" /> Editar
          </motion.button>
        </div>

        {/* Stats */}
        <div style={{ padding: '0 20px 20px', display: 'flex', gap: 0 }}>
          {[
            { label: 'looks', value: stats.looksPublicos },
            { label: 'seguidores', value: stats.seguidores, onClick: () => setSheet('seguidores') },
            { label: 'seguindo', value: stats.seguindo, onClick: () => setSheet('seguindo') },
          ].map(({ label, value, onClick }) => (
            <div
              key={label}
              onClick={onClick}
              style={{ flex: 1, textAlign: 'center', cursor: onClick ? 'pointer' : 'default', padding: '8px 4px', borderRadius: 10 }}
            >
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
              textTransform: 'capitalize',
            }}>
              {t === 'looks' ? '✨ Looks' : t === 'armario' ? '🪞 Armário' : '🤍 Wishlist'}
            </button>
          ))}
        </div>

        {/* Conteúdo */}
        {aba === 'looks' && (
          looks.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#A3A3A3', fontSize: 14, padding: '40px 20px', fontFamily: 'var(--font-body)' }}>
              Nenhum look ainda. Que tal compartilhar o primeiro?
            </p>
          ) : (
            <Masonry breakpointCols={2} className="masonry-grid" columnClassName="masonry-grid_column">
              {looks.map((look) => (
                <div key={look.id} style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', backgroundColor: '#F0F0F0', marginBottom: 8 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={look.foto_url} alt="Look" loading="lazy" style={{ width: '100%', height: 'auto', display: 'block' }} />
                  <div style={{ position: 'absolute', top: 6, right: 6 }}>
                    {look.publico
                      ? <Globe size={12} color="#fff" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.4))' }} />
                      : <Lock size={12} color="#fff" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.4))' }} />
                    }
                  </div>
                </div>
              ))}
            </Masonry>
          )
        )}

        {aba === 'armario' && (
          <div style={{ padding: '0 20px' }}>
            {armario.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#A3A3A3', fontSize: 14, padding: '40px 0', fontFamily: 'var(--font-body)' }}>
                Nenhum produto no armário.
              </p>
            ) : armario.map((p) => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #F5F5F5' }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, overflow: 'hidden', background: '#F5F5F5', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {p.foto_url
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={p.foto_url} alt={p.nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ fontSize: 22 }}>{categoriaEmoji(p.categoria)}</span>
                  }
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--foreground)', fontFamily: 'var(--font-body)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.nome}</p>
                  {p.marca && <p style={{ margin: 0, fontSize: 11, color: '#A3A3A3', fontFamily: 'var(--font-body)' }}>{p.marca}</p>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: p.nivel_atual <= 15 ? '#EF4444' : '#1B5E5A' }}>{p.nivel_atual}%</span>
                  {p.publico
                    ? <Globe size={12} color="#1B5E5A" />
                    : <Lock size={12} color="#A3A3A3" />
                  }
                </div>
              </div>
            ))}
          </div>
        )}

        {aba === 'wishlist' && (
          <div style={{ padding: '0 20px' }}>
            {wishlist.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#A3A3A3', fontSize: 14, padding: '40px 0', fontFamily: 'var(--font-body)' }}>
                Nenhum item na wishlist.
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
                {w.publico
                  ? <Globe size={12} color="#1B5E5A" />
                  : <Lock size={12} color="#A3A3A3" />
                }
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Sheet seguidores / seguindo */}
      <AnimatePresence>
        {sheet && userId && (
          <SheetSocial tipo={sheet} userId={userId} onClose={() => setSheet(null)} />
        )}
      </AnimatePresence>
    </PageContainer>
  )
}
