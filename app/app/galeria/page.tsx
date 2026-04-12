'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Masonry from 'react-masonry-css'
import { Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import AppHeader from '@/components/ui/AppHeader'
import PageContainer from '@/components/ui/PageContainer'
import { AvatarUser } from '@/components/ui/UserCard'
import type { UsuarioBasico } from '@/components/ui/UserCard'
import { playClick } from '@/lib/sound'
import { Heart, Bookmark } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────

interface LookPublico {
  id: string
  foto_url: string
  contexto: string | null
  avaliacao: string | null
  descricao: string | null
  curtidas: number
  created_at: string
  usuario_id: string
  data_foto: string | null
  hashtags: string[] | null
}

interface LookComAutor extends LookPublico {
  autor?: UsuarioBasico | null
}

interface Colecao {
  id: string
  nome: string
  emoji: string | null
}

type FeedTipo = 'explorar' | 'seguindo'
type Ordenacao = 'em_alta' | 'recentes'

const PAGE_SIZE = 20

const AVALIACAO_EMOJIS: Record<string, string> = {
  amei: '😍',
  ok: '😊',
  nao_gostei: '😕',
}

const EMOJIS_COLECAO = ['💄', '👗', '🌙', '💍', '🌸', '🌟', '👑', '🎨', '💅', '🌈']

// ─── Page ─────────────────────────────────────────────────────────────

export default function GaleriaPage() {
  const router = useRouter()
  const [feedTipo, setFeedTipo] = useState<FeedTipo>('explorar')
  const [looks, setLooks] = useState<LookComAutor[]>([])
  const [loading, setLoading] = useState(true)
  const [carregandoMais, setCarregandoMais] = useState(false)
  const [temMais, setTemMais] = useState(false)
  const [ordenacao, setOrdenacao] = useState<Ordenacao>('em_alta')
  const [curtidas, setCurtidas] = useState<Set<string>>(new Set())
  const [curtidosAnimando, setCurtidosAnimando] = useState<Set<string>>(new Set())
  const [userId, setUserId] = useState<string | null>(null)
  const [pagina, setPagina] = useState(0)
  const [filtroHashtag, setFiltroHashtag] = useState<string | null>(null)
  const [buscaGaleria, setBuscaGaleria] = useState('')
  const [buscaFocada, setBuscaFocada] = useState(false)
  const [topHashtags, setTopHashtags] = useState<string[]>([])
  const [seguidosIds, setSeguidosIds] = useState<string[]>([])

  // Favoritos
  const [favoritos, setFavoritos] = useState<Set<string>>(new Set())
  const [colecoes, setColecoes] = useState<Colecao[]>([])
  const [lookParaSalvar, setLookParaSalvar] = useState<LookComAutor | null>(null)
  const [mostrarBSColecao, setMostrarBSColecao] = useState(false)
  const [jaNaFavoritos, setJaNaFavoritos] = useState(false)
  const [criandoColecao, setCriandoColecao] = useState(false)
  const [novaColecaoNome, setNovaColecaoNome] = useState('')
  const [novaColecaoEmoji, setNovaColecaoEmoji] = useState('')
  const [salvandoFavorito, setSalvandoFavorito] = useState(false)

  // Enriquecer looks com dados de autor
  async function enriquecerAutores(lista: LookPublico[]): Promise<LookComAutor[]> {
    if (lista.length === 0) return []
    const supabase = createClient()
    const ids = [...new Set(lista.map((l) => l.usuario_id))]
    const { data: perfis } = await supabase
      .from('perfis')
      .select('id, nome, username, avatar_url')
      .in('id', ids)
    const map = Object.fromEntries((perfis ?? []).map((p) => [p.id, p as UsuarioBasico]))
    return lista.map((l) => ({ ...l, autor: map[l.usuario_id] ?? null }))
  }

  const carregarGaleria = useCallback(async (
    ord: Ordenacao,
    pag: number,
    append = false,
    hashtag: string | null = null,
    feed: FeedTipo = 'explorar',
    segIds: string[] = [],
    uid: string | null = null,
  ) => {
    const supabase = createClient()

    // Feed "Seguindo" — sem conteúdo se não segue ninguém
    if (feed === 'seguindo' && segIds.length === 0) {
      if (!append) setLooks([])
      setTemMais(false)
      return
    }

    let query = supabase
      .from('looks_diario')
      .select('id, foto_url, contexto, avaliacao, descricao, curtidas, created_at, usuario_id, data_foto, hashtags')
      .eq('publico', true)
      .range(pag * PAGE_SIZE, (pag + 1) * PAGE_SIZE - 1)

    if (feed === 'seguindo') {
      query = query.in('usuario_id', segIds)
    }

    if (hashtag) {
      query = query.contains('hashtags', [hashtag])
    }

    if (ord === 'em_alta') {
      query = query.order('curtidas', { ascending: false }).order('created_at', { ascending: false })
    } else {
      query = query.order('created_at', { ascending: false })
    }

    const { data } = await query
    const lista = (data ?? []) as LookPublico[]
    setTemMais(lista.length === PAGE_SIZE)

    const listaComAutor = await enriquecerAutores(lista)

    if (append) {
      setLooks((prev) => [...prev, ...listaComAutor])
    } else {
      setLooks(listaComAutor)

      if (uid && lista.length > 0) {
        const ids = lista.map((l) => l.id)
        const { data: minhasCurtidas } = await supabase
          .from('looks_curtidas')
          .select('look_id')
          .eq('usuario_id', uid)
          .in('look_id', ids)
        setCurtidas(new Set<string>((minhasCurtidas ?? []).map((c: { look_id: string }) => c.look_id)))
      }
    }
  }, [])

  // Carregar userId + seguidos ao montar
  useEffect(() => {
    const supabase = createClient()
    void supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      setUserId(user.id)

      const { data: seg } = await supabase
        .from('seguimentos')
        .select('seguido_id')
        .eq('seguidor_id', user.id)
      const ids = (seg ?? []).map((s: { seguido_id: string }) => s.seguido_id)
      setSeguidosIds(ids)

      const { data: favs } = await supabase.from('favoritos').select('look_id').eq('usuario_id', user.id)
      setFavoritos(new Set<string>((favs ?? []).map((f: { look_id: string }) => f.look_id)))

      const { data: cols } = await supabase.from('favoritos_colecoes').select('id, nome, emoji').eq('usuario_id', user.id).order('created_at', { ascending: true })
      setColecoes((cols ?? []) as Colecao[])

      setLoading(true)
      setPagina(0)
      await carregarGaleria('em_alta', 0, false, null, 'explorar', ids, user.id)
      setLoading(false)
    })
  }, [carregarGaleria])

  useEffect(() => {
    setLoading(true)
    setPagina(0)
    void carregarGaleria(ordenacao, 0, false, filtroHashtag, feedTipo, seguidosIds, userId).finally(() => setLoading(false))
  }, [ordenacao, filtroHashtag, feedTipo, carregarGaleria, seguidosIds, userId])

  // Top hashtags
  useEffect(() => {
    const supabase = createClient()
    void supabase
      .from('looks_diario')
      .select('hashtags')
      .eq('publico', true)
      .not('hashtags', 'is', null)
      .then(({ data }: { data: { hashtags: string[] | null }[] | null }) => {
        const contagem: Record<string, number> = {}
        ;(data ?? []).forEach((look) => {
          look.hashtags?.forEach((tag) => { contagem[tag] = (contagem[tag] ?? 0) + 1 })
        })
        const top10 = Object.entries(contagem).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([tag]) => tag)
        setTopHashtags(top10)
      })
  }, [])

  async function handleVerMais() {
    setCarregandoMais(true)
    const proxPagina = pagina + 1
    setPagina(proxPagina)
    await carregarGaleria(ordenacao, proxPagina, true, filtroHashtag, feedTipo, seguidosIds, userId)
    setCarregandoMais(false)
  }

  async function handleCurtir(look: LookComAutor) {
    if (!userId) { router.push('/login'); return }
    playClick()
    const jaCurtiu = curtidas.has(look.id)
    setCurtidas((prev) => { const next = new Set(prev); if (jaCurtiu) next.delete(look.id); else next.add(look.id); return next })
    setLooks((prev) => prev.map((l) => l.id === look.id ? { ...l, curtidas: jaCurtiu ? Math.max(0, l.curtidas - 1) : l.curtidas + 1 } : l))
    if (!jaCurtiu) {
      setCurtidosAnimando((prev) => new Set(prev).add(look.id))
      setTimeout(() => setCurtidosAnimando((prev) => { const next = new Set(prev); next.delete(look.id); return next }), 400)
    }
    try {
      const res = await fetch(`/api/galeria/curtir/${look.id}`, { method: 'POST' })
      if (!res.ok) throw new Error()
      const data = await res.json() as { curtidas: number; curtido: boolean }
      setLooks((prev) => prev.map((l) => l.id === look.id ? { ...l, curtidas: data.curtidas } : l))
    } catch {
      setCurtidas((prev) => { const next = new Set(prev); if (jaCurtiu) next.add(look.id); else next.delete(look.id); return next })
      setLooks((prev) => prev.map((l) => l.id === look.id ? { ...l, curtidas: jaCurtiu ? l.curtidas + 1 : Math.max(0, l.curtidas - 1) } : l))
    }
  }

  function handleBookmark(look: LookComAutor) {
    if (!userId) { router.push('/login'); return }
    setLookParaSalvar(look)
    setJaNaFavoritos(favoritos.has(look.id))
    setCriandoColecao(false)
    setNovaColecaoNome('')
    setNovaColecaoEmoji('')
    setMostrarBSColecao(true)
  }

  async function handleSalvarFavorito(colecaoId: string | null) {
    if (!lookParaSalvar || !userId) return
    setSalvandoFavorito(true)
    const supabase = createClient()
    await supabase.from('favoritos').insert({ usuario_id: userId, look_id: lookParaSalvar.id, colecao_id: colecaoId })
    setFavoritos((prev) => new Set(prev).add(lookParaSalvar.id))
    setMostrarBSColecao(false)
    setLookParaSalvar(null)
    setSalvandoFavorito(false)
  }

  async function handleDesfavoritar() {
    if (!lookParaSalvar || !userId) return
    setSalvandoFavorito(true)
    const supabase = createClient()
    await supabase.from('favoritos').delete().eq('usuario_id', userId).eq('look_id', lookParaSalvar.id)
    setFavoritos((prev) => { const next = new Set(prev); next.delete(lookParaSalvar.id); return next })
    setMostrarBSColecao(false)
    setLookParaSalvar(null)
    setSalvandoFavorito(false)
  }

  async function handleCriarColecao() {
    if (!novaColecaoNome.trim() || !userId) return
    setSalvandoFavorito(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('favoritos_colecoes')
      .insert({ usuario_id: userId, nome: novaColecaoNome.trim(), emoji: novaColecaoEmoji || null })
      .select('id, nome, emoji')
      .single()
    if (data) {
      const novaColecao = data as Colecao
      setColecoes((prev) => [...prev, novaColecao])
      await handleSalvarFavorito(novaColecao.id)
    } else {
      setSalvandoFavorito(false)
    }
  }

  const sugestoesGaleria = topHashtags.filter((t) =>
    t !== filtroHashtag && (buscaGaleria === '' || t.toLowerCase().includes(buscaGaleria.toLowerCase()))
  )

  return (
    <PageContainer>
      <AppHeader />
      <main style={{ padding: '24px 0 100px', minHeight: '80vh' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 mb-4">
          <h1 className="text-page-title">Galeria</h1>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              onClick={() => router.push('/app/buscar')}
              style={{ background: 'rgba(255,51,102,0.08)', border: 'none', borderRadius: 10, padding: '7px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            >
              <Search size={16} color="var(--color-primary)" />
            </button>
            <button
              onClick={() => router.push('/app/looks')}
              style={{ fontSize: 13, color: 'var(--color-primary)', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)' }}
            >
              Meus looks →
            </button>
          </div>
        </div>

        {/* Feed tipo: Explorar / Seguindo */}
        <div style={{ margin: '0 20px 16px', display: 'flex', backgroundColor: '#F0F0F0', borderRadius: 14, padding: 4 }}>
          {([['explorar', '✨ Explorar'], ['seguindo', '👥 Seguindo']] as [FeedTipo, string][]).map(([val, label]) => (
            <button
              key={val}
              onClick={() => setFeedTipo(val)}
              style={{
                flex: 1, padding: '9px', borderRadius: 11, border: 'none',
                backgroundColor: feedTipo === val ? '#fff' : 'transparent',
                color: feedTipo === val ? 'var(--color-primary)' : '#888',
                fontSize: 13, fontWeight: feedTipo === val ? 700 : 500,
                cursor: 'pointer', fontFamily: 'var(--font-body)',
                boxShadow: feedTipo === val ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.15s',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Busca por hashtag (só no Explorar) */}
        {feedTipo === 'explorar' && (
          <div style={{ margin: '0 20px 16px', position: 'relative', zIndex: 10 }}>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={buscaGaleria}
                onChange={(e) => setBuscaGaleria(e.target.value)}
                onFocus={() => setBuscaFocada(true)}
                onBlur={() => setTimeout(() => setBuscaFocada(false), 150)}
                placeholder="# Buscar por hashtag..."
                style={{ width: '100%', borderRadius: 12, border: '1.5px solid #E8E8E8', padding: '10px 36px 10px 14px', fontSize: 14, color: '#171717', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', backgroundColor: '#fff' }}
              />
              {(filtroHashtag || buscaGaleria) && (
                <button
                  onClick={() => { setFiltroHashtag(null); setBuscaGaleria('') }}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#767676', fontSize: 18, lineHeight: 1, padding: 0 }}
                >×</button>
              )}
            </div>

            {filtroHashtag && (
              <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'linear-gradient(90deg, #FF3366, #F472A0)', color: '#fff', borderRadius: 20, padding: '4px 10px', fontSize: 12, fontWeight: 700 }}>
                  #{filtroHashtag}
                  <button onClick={() => setFiltroHashtag(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', fontSize: 14, lineHeight: 1, padding: 0 }}>×</button>
                </span>
              </div>
            )}

            {buscaFocada && !filtroHashtag && sugestoesGaleria.length > 0 && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20, backgroundColor: '#fff', borderRadius: 12, border: '1px solid #E8E8E8', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', padding: 8, display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                {sugestoesGaleria.map((tag) => (
                  <button key={tag} onMouseDown={() => { setFiltroHashtag(tag); setBuscaGaleria('') }} style={{ padding: '5px 12px', borderRadius: 20, border: '1.5px solid #E8E8E8', backgroundColor: '#F5F5F5', color: '#444', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                    #{tag}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Toggle ordenação (só no Explorar) */}
        {feedTipo === 'explorar' && (
          <div style={{ margin: '0 20px 20px', display: 'flex', backgroundColor: '#F0F0F0', borderRadius: 14, padding: 4 }}>
            {([['em_alta', '✨ Em alta'], ['recentes', '🕐 Recentes']] as [Ordenacao, string][]).map(([val, label]) => (
              <button
                key={val}
                onClick={() => setOrdenacao(val)}
                style={{ flex: 1, padding: '9px', borderRadius: 11, border: 'none', backgroundColor: ordenacao === val ? '#fff' : 'transparent', color: ordenacao === val ? 'var(--color-primary)' : '#888', fontSize: 13, fontWeight: ordenacao === val ? 700 : 500, cursor: 'pointer', fontFamily: 'var(--font-body)', boxShadow: ordenacao === val ? '0 1px 4px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.15s' }}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ display: 'flex', gap: 8, padding: '0 8px' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div className="skeleton-shimmer" style={{ height: 200, borderRadius: 12 }} />
              <div className="skeleton-shimmer" style={{ height: 150, borderRadius: 12 }} />
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, marginTop: 24 }}>
              <div className="skeleton-shimmer" style={{ height: 170, borderRadius: 12 }} />
              <div className="skeleton-shimmer" style={{ height: 200, borderRadius: 12 }} />
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && looks.length === 0 && (
          <div className="flex flex-col items-center gap-4 py-16 px-5">
            <span style={{ fontSize: 56 }}>
              {feedTipo === 'seguindo' ? '👥' : '✨'}
            </span>
            <p className="font-bold text-gray-700" style={{ fontSize: 17 }}>
              {feedTipo === 'seguindo'
                ? seguidosIds.length === 0
                  ? 'Você ainda não segue ninguém'
                  : 'Nenhum look das pessoas que você segue'
                : 'Nenhum look compartilhado ainda'}
            </p>
            <p className="text-gray-400 text-center" style={{ fontSize: 14 }}>
              {feedTipo === 'seguindo'
                ? 'Descubra e siga outras usuárias para ver o look delas aqui.'
                : 'Seja a primeira a compartilhar!'}
            </p>
            {feedTipo === 'seguindo' && (
              <button
                onClick={() => router.push('/app/buscar')}
                style={{ marginTop: 4, padding: '12px 24px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg, #FF3366, #C41A4A)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)', boxShadow: '0 4px 16px rgba(255,51,102,0.3)' }}
              >
                Buscar pessoas
              </button>
            )}
            {feedTipo === 'explorar' && (
              <button
                onClick={() => router.push('/app/looks/novo?publico=true')}
                style={{ marginTop: 4, padding: '14px 28px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg, #FF3366, #C41A4A)', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)', boxShadow: '0 4px 16px rgba(255,51,102,0.3)' }}
              >
                Compartilhar meu look
              </button>
            )}
          </div>
        )}

        {/* Grid */}
        {!loading && looks.length > 0 && (
          <>
            <Masonry breakpointCols={2} className="masonry-grid" columnClassName="masonry-grid_column">
              {looks.map((look) => {
                const curtiu = curtidas.has(look.id)
                const animando = curtidosAnimando.has(look.id)
                const favoritou = favoritos.has(look.id)
                return (
                  <div key={look.id} style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', backgroundColor: '#F0F0F0' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={look.foto_url} alt="Look" loading="lazy" decoding="async" style={{ width: '100%', height: 'auto', display: 'block' }} />

                    {look.avaliacao && (
                      <span style={{ position: 'absolute', top: 7, left: 7, fontSize: 16 }}>
                        {AVALIACAO_EMOJIS[look.avaliacao]}
                      </span>
                    )}

                    {look.data_foto && (
                      <span style={{ position: 'absolute', bottom: 44, left: 7, fontSize: 10, fontFamily: 'monospace', color: '#FFFFFF', fontWeight: 700, letterSpacing: 0.5, textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000' }}>
                        {new Date(look.data_foto + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                      </span>
                    )}

                    {/* Rodapé com autor + ações */}
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', padding: '0 8px', minHeight: 38 }}>
                      {/* Autor */}
                      {look.autor && (
                        <button
                          onClick={() => look.autor?.username && router.push(`/app/u/${look.autor.username}`)}
                          style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1, minWidth: 0, background: 'none', border: 'none', cursor: look.autor.username ? 'pointer' : 'default', padding: '4px 0' }}
                        >
                          <AvatarUser usuario={look.autor} size={20} />
                          <span style={{ fontSize: 10, fontWeight: 700, color: '#525252', fontFamily: 'var(--font-body)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {look.autor.username ? `@${look.autor.username}` : look.autor.nome ?? ''}
                          </span>
                        </button>
                      )}

                      {/* Bookmark */}
                      <motion.button whileTap={{ scale: 0.82 }} onClick={() => handleBookmark(look)} style={{ display: 'flex', alignItems: 'center', gap: 2, border: 'none', backgroundColor: 'transparent', cursor: 'pointer', padding: '4px 2px', flexShrink: 0 }}>
                        <Bookmark size={16} color={favoritou ? '#D4A843' : '#bbb'} fill={favoritou ? '#D4A843' : 'none'} strokeWidth={2} />
                      </motion.button>

                      {/* Like */}
                      <motion.button onClick={() => { void handleCurtir(look) }} style={{ display: 'flex', alignItems: 'center', gap: 3, position: 'relative', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', padding: '4px 2px', flexShrink: 0 }}>
                        <motion.div animate={animando ? { scale: [1, 1.5, 0.85, 1.2, 1], rotate: [0, -15, 10, -5, 0] } : { scale: 1, rotate: 0 }} transition={{ duration: 0.45, ease: 'easeOut' }}>
                          <Heart size={17} color={curtiu ? '#FF3366' : '#bbb'} fill={curtiu ? '#FF3366' : 'none'} strokeWidth={2} />
                        </motion.div>
                        <AnimatePresence>
                          {animando && (
                            <>
                              {[0, 60, 120, 180, 240, 300].map((deg, i) => (
                                <motion.div key={deg} initial={{ scale: 0, x: 0, y: 0, opacity: 1 }} animate={{ scale: [0, 1, 0], x: Math.cos((deg * Math.PI) / 180) * 14, y: Math.sin((deg * Math.PI) / 180) * 14, opacity: [1, 1, 0] }} exit={{ opacity: 0 }} transition={{ duration: 0.5, delay: i * 0.03 }} style={{ position: 'absolute', width: 5, height: 5, borderRadius: '50%', background: i % 2 === 0 ? '#FF3366' : '#F9D56E', pointerEvents: 'none' }} />
                              ))}
                            </>
                          )}
                        </AnimatePresence>
                        <span style={{ fontSize: 11, color: curtiu ? '#FF3366' : '#aaa', fontWeight: 600 }}>{look.curtidas}</span>
                      </motion.button>
                    </div>
                  </div>
                )
              })}
            </Masonry>

            {temMais && (
              <div style={{ padding: '20px 20px 0', display: 'flex', justifyContent: 'center' }}>
                <button
                  onClick={() => { void handleVerMais() }}
                  disabled={carregandoMais}
                  style={{ padding: '12px 32px', borderRadius: 14, border: '1.5px solid rgba(255,51,102,0.25)', backgroundColor: '#fff', color: 'var(--color-primary)', fontSize: 14, fontWeight: 700, cursor: carregandoMais ? 'not-allowed' : 'pointer', opacity: carregandoMais ? 0.6 : 1 }}
                >
                  {carregandoMais ? 'Carregando...' : 'Ver mais'}
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Bottom sheet — Salvar em coleção */}
      {mostrarBSColecao && lookParaSalvar && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.65)', zIndex: 50, display: 'flex', alignItems: 'flex-end' }} onClick={() => { setMostrarBSColecao(false); setLookParaSalvar(null) }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '24px 24px 0 0', padding: '20px 20px 48px', width: '100%', maxWidth: 430, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 12, maxHeight: '80vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#E0E0E0', alignSelf: 'center', marginBottom: 4 }} />

            {jaNaFavoritos ? (
              <>
                <p style={{ fontSize: 16, fontWeight: 700, color: '#171717', margin: 0 }}>🔖 Look salvo nos favoritos</p>
                <p style={{ fontSize: 13, color: '#666', margin: 0 }}>Deseja remover este look dos seus favoritos?</p>
                <button onClick={() => { void handleDesfavoritar() }} disabled={salvandoFavorito} style={{ padding: '13px', borderRadius: 14, border: '1.5px solid #fca5a5', backgroundColor: '#fef2f2', color: '#ef4444', fontSize: 14, fontWeight: 600, cursor: salvandoFavorito ? 'not-allowed' : 'pointer', opacity: salvandoFavorito ? 0.6 : 1 }}>
                  {salvandoFavorito ? 'Removendo...' : 'Remover dos favoritos'}
                </button>
              </>
            ) : criandoColecao ? (
              <>
                <p style={{ fontSize: 16, fontWeight: 700, color: '#171717', margin: 0 }}>Nova coleção</p>
                <input type="text" value={novaColecaoNome} onChange={(e) => setNovaColecaoNome(e.target.value)} autoFocus maxLength={30} placeholder="Ex: looks de trabalho" style={{ borderRadius: 12, border: '1.5px solid #E8E8E8', padding: '12px 14px', fontSize: 15, color: '#171717', outline: 'none', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' }} />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {EMOJIS_COLECAO.map((emoji) => (
                    <button key={emoji} onClick={() => setNovaColecaoEmoji(novaColecaoEmoji === emoji ? '' : emoji)} style={{ width: 40, height: 40, borderRadius: 10, border: '1.5px solid', borderColor: novaColecaoEmoji === emoji ? '#1B5E5A' : '#E8E8E8', backgroundColor: novaColecaoEmoji === emoji ? '#E8F5F4' : '#fff', fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {emoji}
                    </button>
                  ))}
                </div>
                <button onClick={() => { void handleCriarColecao() }} disabled={!novaColecaoNome.trim() || salvandoFavorito} style={{ padding: '13px', borderRadius: 14, border: 'none', backgroundColor: '#1B5E5A', color: '#fff', fontSize: 14, fontWeight: 700, cursor: (!novaColecaoNome.trim() || salvandoFavorito) ? 'not-allowed' : 'pointer', opacity: (!novaColecaoNome.trim() || salvandoFavorito) ? 0.6 : 1 }}>
                  {salvandoFavorito ? 'Criando...' : 'Criar e salvar'}
                </button>
                <button onClick={() => setCriandoColecao(false)} style={{ padding: '10px', borderRadius: 14, border: 'none', backgroundColor: 'transparent', color: '#666', fontSize: 13, cursor: 'pointer' }}>Voltar</button>
              </>
            ) : (
              <>
                <p style={{ fontSize: 16, fontWeight: 700, color: '#171717', margin: 0 }}>Salvar em coleção</p>
                {colecoes.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {colecoes.map((colecao) => (
                      <button key={colecao.id} onClick={() => { void handleSalvarFavorito(colecao.id) }} disabled={salvandoFavorito} style={{ padding: '8px 16px', borderRadius: 20, border: '1.5px solid #E8E8E8', backgroundColor: '#F5F5F5', color: '#333', fontSize: 13, fontWeight: 700, cursor: salvandoFavorito ? 'not-allowed' : 'pointer' }}>
                        {colecao.emoji ?? '📁'} {colecao.nome}
                      </button>
                    ))}
                  </div>
                )}
                <button onClick={() => setCriandoColecao(true)} style={{ padding: '13px', borderRadius: 14, border: '1.5px dashed #1B5E5A', backgroundColor: '#F0FAF9', color: '#1B5E5A', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                  + Criar nova coleção
                </button>
                <button onClick={() => { void handleSalvarFavorito(null) }} disabled={salvandoFavorito} style={{ padding: '13px', borderRadius: 14, border: '1.5px solid #E8E8E8', backgroundColor: '#fff', color: '#555', fontSize: 14, fontWeight: 600, cursor: salvandoFavorito ? 'not-allowed' : 'pointer', opacity: salvandoFavorito ? 0.6 : 1 }}>
                  {salvandoFavorito ? 'Salvando...' : 'Salvar sem coleção'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </PageContainer>
  )
}
