'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Masonry from 'react-masonry-css'
import { createClient } from '@/lib/supabase/client'
import AppHeader from '@/components/ui/AppHeader'
import PageContainer from '@/components/ui/PageContainer'
import EmptyState from '@/components/ui/EmptyState'
import { playClick } from '@/lib/sound'

interface LookDiario {
  id: string
  foto_url: string
  contexto: string | null
  avaliacao: string | null
  descricao: string | null
  publico: boolean
  curtidas: number
  largura: number | null
  altura: number | null
  created_at: string
  data_foto: string | null
  hashtags: string[] | null
}

interface Colecao {
  id: string
  nome: string
  emoji: string | null
}

type Aba = 'meus_looks' | 'favoritos'

const CONTEXTO_LABELS: Record<string, string> = {
  dia_casual: '☀️ Dia',
  dia_formal: '👔 Formal',
  noite_casual: '🌙 Noite',
  noite_especial: '✨ Especial',
}

const AVALIACAO_EMOJIS: Record<string, string> = {
  amei: '😍',
  ok: '😊',
  nao_gostei: '😕',
}

export default function LooksPage() {
  const router = useRouter()
  const [aba, setAba] = useState<Aba>('meus_looks')
  const [userId, setUserId] = useState<string | null>(null)

  // Meus Looks
  const [looks, setLooks] = useState<LookDiario[]>([])
  const [loading, setLoading] = useState(true)
  const [lookSelecionado, setLookSelecionado] = useState<LookDiario | null>(null)
  const [deletando, setDeletando] = useState(false)
  const [confirmarDelete, setConfirmarDelete] = useState(false)
  const [todasHashtags, setTodasHashtags] = useState<string[]>([])
  const [tagsSelecionadas, setTagsSelecionadas] = useState<string[]>([])
  const [buscaHashtag, setBuscaHashtag] = useState('')
  const [buscaFocada, setBuscaFocada] = useState(false)

  // Favoritos
  const [colecoes, setColecoes] = useState<Colecao[]>([])
  const [colecaoSelecionada, setColecaoSelecionada] = useState<string | null>(null)
  const [looksFavoritos, setLooksFavoritos] = useState<LookDiario[]>([])
  const [loadingFavoritos, setLoadingFavoritos] = useState(false)

  // Editar coleção (Ajuste 6)
  const [colecaoParaEditar, setColecaoParaEditar] = useState<Colecao | null>(null)
  const [modoEditar, setModoEditar] = useState<'menu' | 'renomear' | null>(null)
  const [editandoNome, setEditandoNome] = useState('')
  const [salvandoColecao, setSalvandoColecao] = useState(false)
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const carregarLooks = useCallback(async (tags: string[] = []) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    setUserId(user.id)

    let query = supabase
      .from('looks_diario')
      .select('*')
      .eq('usuario_id', user.id)
      .order('created_at', { ascending: false })

    if (tags.length > 0) {
      query = query.overlaps('hashtags', tags)
    }

    const [{ data }, { data: hashData }] = await Promise.all([
      query,
      supabase
        .from('looks_diario')
        .select('hashtags')
        .eq('usuario_id', user.id)
        .not('hashtags', 'is', null),
    ])
    setLooks((data as LookDiario[]) ?? [])

    const set = new Set<string>()
    ;(hashData ?? []).forEach((row: { hashtags: string[] | null }) => {
      row.hashtags?.forEach((t) => set.add(t))
    })
    setTodasHashtags(Array.from(set).sort())
    setLoading(false)
  }, [router])

  const carregarFavoritos = useCallback(async (colecaoId: string | null = null) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    let query = supabase
      .from('favoritos')
      .select('look_id, looks_diario(*)')
      .eq('usuario_id', user.id)

    if (colecaoId !== null) {
      query = query.eq('colecao_id', colecaoId)
    }

    const { data } = await query.order('created_at', { ascending: false })
    const lista = ((data ?? []) as Array<{ look_id: string; looks_diario: LookDiario }>)
      .map((f) => f.looks_diario)
      .filter(Boolean)
    setLooksFavoritos(lista)
  }, [])

  const carregarColecoes = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('favoritos_colecoes')
      .select('id, nome, emoji')
      .eq('usuario_id', user.id)
      .order('created_at', { ascending: true })
    setColecoes((data as Colecao[]) ?? [])
  }, [])

  useEffect(() => { void carregarLooks([]) }, [carregarLooks])

  useEffect(() => {
    if (aba === 'favoritos') {
      setLoadingFavoritos(true)
      void Promise.all([carregarColecoes(), carregarFavoritos(null)]).finally(() => setLoadingFavoritos(false))
    }
  }, [aba, carregarColecoes, carregarFavoritos])

  async function handleDeletar(look: LookDiario) {
    if (!confirmarDelete) { setConfirmarDelete(true); return }
    setDeletando(true)
    const supabase = createClient()
    await supabase.from('looks_diario').delete().eq('id', look.id)
    setLookSelecionado(null)
    setDeletando(false)
    setConfirmarDelete(false)
    void carregarLooks(tagsSelecionadas)
  }

  async function handleTogglePublico(look: LookDiario) {
    const supabase = createClient()
    const novoValor = !look.publico
    await supabase.from('looks_diario').update({ publico: novoValor }).eq('id', look.id)
    const atualizado = { ...look, publico: novoValor }
    setLookSelecionado(atualizado)
    setLooks((prev) => prev.map((l) => l.id === look.id ? atualizado : l))
  }

  function toggleTag(tag: string) {
    const novas = tagsSelecionadas.includes(tag)
      ? tagsSelecionadas.filter((t) => t !== tag)
      : [...tagsSelecionadas, tag]
    setTagsSelecionadas(novas)
    setLoading(true)
    void carregarLooks(novas).finally(() => setLoading(false))
  }

  function limparFiltros() {
    setTagsSelecionadas([])
    setBuscaHashtag('')
    setLoading(true)
    void carregarLooks([]).finally(() => setLoading(false))
  }

  async function handleSelecionarColecao(colecaoId: string | null) {
    setColecaoSelecionada(colecaoId)
    setLoadingFavoritos(true)
    await carregarFavoritos(colecaoId)
    setLoadingFavoritos(false)
  }

  function handleLongPressStart(colecao: Colecao) {
    longPressTimer.current = setTimeout(() => {
      setColecaoParaEditar(colecao)
      setEditandoNome(colecao.nome)
      setModoEditar('menu')
    }, 600)
  }

  function handleLongPressEnd() {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }

  async function handleRenomearColecao() {
    if (!colecaoParaEditar || !editandoNome.trim()) return
    setSalvandoColecao(true)
    const supabase = createClient()
    await supabase
      .from('favoritos_colecoes')
      .update({ nome: editandoNome.trim() })
      .eq('id', colecaoParaEditar.id)
    setColecoes((prev) => prev.map((c) => c.id === colecaoParaEditar.id ? { ...c, nome: editandoNome.trim() } : c))
    setColecaoParaEditar(null)
    setModoEditar(null)
    setSalvandoColecao(false)
  }

  async function handleExcluirColecao() {
    if (!colecaoParaEditar) return
    const supabase = createClient()
    await supabase.from('favoritos').update({ colecao_id: null }).eq('colecao_id', colecaoParaEditar.id)
    await supabase.from('favoritos_colecoes').delete().eq('id', colecaoParaEditar.id)
    setColecoes((prev) => prev.filter((c) => c.id !== colecaoParaEditar.id))
    if (colecaoSelecionada === colecaoParaEditar.id) {
      setColecaoSelecionada(null)
      void carregarFavoritos(null)
    }
    setColecaoParaEditar(null)
    setModoEditar(null)
  }

  async function handleRemoverFavorito(look: LookDiario) {
    if (!userId) return
    const supabase = createClient()
    await supabase.from('favoritos').delete().eq('usuario_id', userId).eq('look_id', look.id)
    setLooksFavoritos((prev) => prev.filter((l) => l.id !== look.id))
    setLookSelecionado(null)
  }

  const sugestoes = todasHashtags.filter((t) =>
    !tagsSelecionadas.includes(t) &&
    (buscaHashtag === '' || t.toLowerCase().includes(buscaHashtag.toLowerCase()))
  )

  function fecharModal() {
    setLookSelecionado(null)
    setConfirmarDelete(false)
  }

  return (
    <PageContainer>
      <AppHeader />
      <main style={{ padding: '24px 0 100px', minHeight: '80vh' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 mb-4">
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 26, color: 'var(--foreground)', lineHeight: 1.2, letterSpacing: '-0.01em' }}>
            Looks
          </h1>
          <button
            onClick={() => router.push('/app/galeria')}
            style={{ fontSize: 13, color: '#1B5E5A', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Galeria →
          </button>
        </div>

        {/* Tabs */}
        <div style={{ margin: '0 20px 20px', display: 'flex', backgroundColor: '#F0F0F0', borderRadius: 14, padding: 4 }}>
          {(['meus_looks', 'favoritos'] as Aba[]).map((val) => (
            <button
              key={val}
              onClick={() => setAba(val)}
              style={{
                flex: 1,
                padding: '9px',
                borderRadius: 11,
                border: 'none',
                backgroundColor: aba === val ? '#fff' : 'transparent',
                color: aba === val ? '#1B5E5A' : '#888',
                fontSize: 13,
                fontWeight: aba === val ? 700 : 500,
                cursor: 'pointer',
                boxShadow: aba === val ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.15s',
              }}
            >
              {val === 'meus_looks' ? 'Meus Looks' : '🔖 Favoritos'}
            </button>
          ))}
        </div>

        {/* ===== ABA MEUS LOOKS ===== */}
        {aba === 'meus_looks' && (
          <>
            {loading && (
              <div style={{ display: 'flex', gap: 8, padding: '0 8px' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ height: 200, borderRadius: 12, backgroundColor: '#E8E8E8' }} />
                  <div style={{ height: 140, borderRadius: 12, backgroundColor: '#E8E8E8' }} />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, marginTop: 20 }}>
                  <div style={{ height: 160, borderRadius: 12, backgroundColor: '#E8E8E8' }} />
                  <div style={{ height: 200, borderRadius: 12, backgroundColor: '#E8E8E8' }} />
                </div>
              </div>
            )}

            {!loading && looks.length === 0 && (
              <div style={{ padding: '0 20px' }}>
                <EmptyState
                  emoji="📸"
                  titulo="Seu diário começa aqui"
                  descricao="Registre seus looks favoritos e acompanhe sua evolução de beleza ao longo do tempo."
                  acao={
                    <button
                      onClick={() => router.push('/app/looks/novo')}
                      style={{
                        padding: '13px 28px', borderRadius: 14, border: 'none',
                        backgroundColor: 'var(--color-ever-green)', color: '#fff',
                        fontSize: 15, fontWeight: 700, cursor: 'pointer',
                        fontFamily: 'var(--font-body)',
                      }}
                    >
                      Registrar primeiro look
                    </button>
                  }
                />
              </div>
            )}

            {/* Busca por hashtags */}
            {!loading && (
              <div style={{ padding: '0 20px 12px', position: 'relative', zIndex: 10 }}>
                {tagsSelecionadas.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                    {tagsSelecionadas.map((tag) => (
                      <span
                        key={tag}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          backgroundColor: '#1B5E5A', color: '#fff',
                          borderRadius: 20, padding: '4px 10px', fontSize: 12, fontWeight: 700,
                        }}
                      >
                        #{tag}
                        <button
                          onClick={() => toggleTag(tag)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', fontSize: 14, lineHeight: 1, padding: 0 }}
                        >×</button>
                      </span>
                    ))}
                    <button
                      onClick={limparFiltros}
                      style={{
                        fontSize: 12, color: '#999', background: 'none',
                        border: '1px solid #E8E8E8', borderRadius: 20,
                        padding: '4px 10px', cursor: 'pointer', fontWeight: 600,
                      }}
                    >Limpar</button>
                  </div>
                )}

                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={buscaHashtag}
                    onChange={(e) => setBuscaHashtag(e.target.value)}
                    onFocus={() => setBuscaFocada(true)}
                    onBlur={() => setTimeout(() => setBuscaFocada(false), 150)}
                    placeholder={todasHashtags.length > 0 ? '# Filtrar por hashtag...' : 'Nenhuma hashtag nos seus looks'}
                    style={{
                      width: '100%', borderRadius: 12, border: '1.5px solid #E8E8E8',
                      padding: '10px 36px 10px 14px', fontSize: 14, color: '#171717',
                      outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
                      backgroundColor: '#fff',
                    }}
                  />
                  {(buscaHashtag || tagsSelecionadas.length > 0) && (
                    <button
                      onClick={limparFiltros}
                      style={{
                        position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: '#bbb', fontSize: 18, lineHeight: 1, padding: 0,
                      }}
                    >×</button>
                  )}
                </div>

                {buscaFocada && sugestoes.length > 0 && (
                  <div
                    style={{
                      position: 'absolute', top: '100%', left: 20, right: 20, zIndex: 20,
                      backgroundColor: '#fff', borderRadius: 12,
                      border: '1px solid #E8E8E8', boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                      padding: 8, display: 'flex', flexWrap: 'wrap', gap: 6,
                    }}
                  >
                    {sugestoes.map((tag) => (
                      <button
                        key={tag}
                        onMouseDown={() => { toggleTag(tag); setBuscaHashtag('') }}
                        style={{
                          padding: '5px 12px', borderRadius: 20, border: '1.5px solid #E8E8E8',
                          backgroundColor: '#F5F5F5', color: '#444',
                          fontSize: 12, fontWeight: 600, cursor: 'pointer',
                        }}
                      >#{tag}</button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Grid */}
            {!loading && looks.length > 0 && (
              <Masonry
                breakpointCols={2}
                className="masonry-grid"
                columnClassName="masonry-grid_column"
              >
                {looks.map((look) => (
                  <button
                    key={look.id}
                    onClick={() => { playClick(); setLookSelecionado(look) }}
                    style={{
                      position: 'relative', borderRadius: 12, overflow: 'hidden',
                      border: 'none', cursor: 'pointer', padding: 0, display: 'block',
                      width: '100%', backgroundColor: '#F0F0F0',
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={look.foto_url}
                      alt="Look"
                      style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 12 }}
                    />
                    {look.contexto && (
                      <span style={{
                        position: 'absolute', top: 7, left: 7, fontSize: 10, fontWeight: 700,
                        color: '#fff', backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 8,
                        padding: '3px 7px', backdropFilter: 'blur(4px)',
                      }}>
                        {CONTEXTO_LABELS[look.contexto] ?? look.contexto}
                      </span>
                    )}
                    {look.avaliacao && (
                      <span style={{ position: 'absolute', top: 7, right: 7, fontSize: 16 }}>
                        {AVALIACAO_EMOJIS[look.avaliacao]}
                      </span>
                    )}
                    {look.data_foto && (
                      <span style={{
                        position: 'absolute', bottom: 7, left: 7, fontSize: 10,
                        fontFamily: 'monospace', color: '#FFFFFF', fontWeight: 700, letterSpacing: 0.5,
                        textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000',
                      }}>
                        {new Date(look.data_foto + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                      </span>
                    )}
                    {!look.publico && (
                      <span style={{ position: 'absolute', bottom: 7, right: 7, fontSize: 14, opacity: 0.8 }}>🔒</span>
                    )}
                  </button>
                ))}
              </Masonry>
            )}
          </>
        )}

        {/* ===== ABA FAVORITOS ===== */}
        {aba === 'favoritos' && (
          <>
            {/* Chips de coleções */}
            <div style={{
              padding: '0 20px 16px',
              overflowX: 'auto',
              display: 'flex',
              gap: 8,
              scrollbarWidth: 'none',
            }}>
              <button
                onClick={() => { void handleSelecionarColecao(null) }}
                style={{
                  flexShrink: 0, padding: '7px 14px', borderRadius: 20, border: '1.5px solid',
                  borderColor: colecaoSelecionada === null ? '#1B5E5A' : '#E8E8E8',
                  backgroundColor: colecaoSelecionada === null ? '#E8F5F4' : '#fff',
                  color: colecaoSelecionada === null ? '#1B5E5A' : '#666',
                  fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
                }}
              >
                🏷️ Todas
              </button>

              {colecoes.map((colecao) => (
                <button
                  key={colecao.id}
                  onClick={() => { handleLongPressEnd(); void handleSelecionarColecao(colecao.id) }}
                  onTouchStart={() => handleLongPressStart(colecao)}
                  onTouchEnd={handleLongPressEnd}
                  onTouchMove={handleLongPressEnd}
                  onMouseDown={() => handleLongPressStart(colecao)}
                  onMouseUp={handleLongPressEnd}
                  onMouseLeave={handleLongPressEnd}
                  style={{
                    flexShrink: 0, padding: '7px 14px', borderRadius: 20, border: '1.5px solid',
                    borderColor: colecaoSelecionada === colecao.id ? '#1B5E5A' : '#E8E8E8',
                    backgroundColor: colecaoSelecionada === colecao.id ? '#E8F5F4' : '#fff',
                    color: colecaoSelecionada === colecao.id ? '#1B5E5A' : '#666',
                    fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
                  }}
                >
                  {colecao.emoji ?? '📁'} {colecao.nome}
                </button>
              ))}
            </div>

            {loadingFavoritos && (
              <div style={{ display: 'flex', gap: 8, padding: '0 8px' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ height: 180, borderRadius: 12, backgroundColor: '#E8E8E8' }} />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, marginTop: 20 }}>
                  <div style={{ height: 160, borderRadius: 12, backgroundColor: '#E8E8E8' }} />
                </div>
              </div>
            )}

            {!loadingFavoritos && looksFavoritos.length === 0 && (
              <div style={{ padding: '0 20px' }}>
                <EmptyState
                  emoji="🔖"
                  titulo={colecaoSelecionada ? 'Coleção vazia' : 'Nenhum favorito ainda'}
                  descricao={colecaoSelecionada
                    ? 'Salve looks da galeria nesta coleção para encontrá-los aqui.'
                    : 'Explore a galeria e salve os looks que inspiram você.'}
                  acao={
                    <button
                      onClick={() => router.push('/app/galeria')}
                      style={{
                        padding: '13px 28px', borderRadius: 14, border: 'none',
                        backgroundColor: 'var(--color-ever-green)', color: '#fff',
                        fontSize: 15, fontWeight: 700, cursor: 'pointer',
                        fontFamily: 'var(--font-body)',
                      }}
                    >
                      Explorar galeria
                    </button>
                  }
                />
              </div>
            )}

            {!loadingFavoritos && looksFavoritos.length > 0 && (
              <Masonry
                breakpointCols={2}
                className="masonry-grid"
                columnClassName="masonry-grid_column"
              >
                {looksFavoritos.map((look) => (
                  <button
                    key={look.id}
                    onClick={() => { playClick(); setLookSelecionado(look) }}
                    style={{
                      position: 'relative', borderRadius: 12, overflow: 'hidden',
                      border: 'none', cursor: 'pointer', padding: 0, display: 'block',
                      width: '100%', backgroundColor: '#F0F0F0',
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={look.foto_url}
                      alt="Look"
                      style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 12 }}
                    />
                    {look.data_foto && (
                      <span style={{
                        position: 'absolute', bottom: 7, left: 7, fontSize: 10,
                        fontFamily: 'monospace', color: '#FFFFFF', fontWeight: 700, letterSpacing: 0.5,
                        textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000',
                      }}>
                        {new Date(look.data_foto + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                      </span>
                    )}
                    <span style={{ position: 'absolute', top: 7, right: 7, fontSize: 14 }}>🔖</span>
                  </button>
                ))}
              </Masonry>
            )}
          </>
        )}
      </main>

      {/* FAB — só na aba Meus Looks */}
      {aba === 'meus_looks' && (
        <button
          onClick={() => { playClick(); router.push('/app/looks/novo') }}
          style={{
            position: 'fixed', bottom: 90, right: 20, width: 56, height: 56,
            borderRadius: '50%', backgroundColor: '#1B5E5A', color: '#fff',
            fontSize: 28, border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 18px rgba(27,94,90,0.45)', zIndex: 20,
          }}
        >
          +
        </button>
      )}

      {/* Modal bottom sheet */}
      {lookSelecionado && (
        <div
          style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.65)',
            zIndex: 50, display: 'flex', alignItems: 'flex-end',
          }}
          onClick={fecharModal}
        >
          <div
            style={{
              backgroundColor: '#fff', borderRadius: '24px 24px 0 0',
              padding: '20px 20px 40px', width: '100%', maxWidth: 430,
              margin: '0 auto', maxHeight: '85vh', overflowY: 'auto',
              display: 'flex', flexDirection: 'column', gap: 14,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#E0E0E0', alignSelf: 'center', marginBottom: 4 }} />

            <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', flexShrink: 0 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={lookSelecionado.foto_url}
                alt="Look"
                style={{
                  width: '100%', display: 'block', height: 'auto',
                }}
              />
              {lookSelecionado.data_foto && (
                <span style={{
                  position: 'absolute', bottom: 10, left: 10, fontSize: 11,
                  fontFamily: 'monospace', color: '#FFFFFF', fontWeight: 700, letterSpacing: 0.5,
                  textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000',
                }}>
                  {new Date(lookSelecionado.data_foto + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                </span>
              )}
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {lookSelecionado.avaliacao && (
                <span style={{ fontSize: 12, fontWeight: 700, backgroundColor: '#E8F5F4', color: '#1B5E5A', borderRadius: 20, padding: '4px 12px' }}>
                  {AVALIACAO_EMOJIS[lookSelecionado.avaliacao]}{' '}
                  {{ amei: 'Amei', ok: 'Ok', nao_gostei: 'Não gostei' }[lookSelecionado.avaliacao] ?? lookSelecionado.avaliacao}
                </span>
              )}
              {lookSelecionado.contexto && (
                <span style={{ fontSize: 12, fontWeight: 700, backgroundColor: '#F5F5F5', color: '#555', borderRadius: 20, padding: '4px 12px' }}>
                  {CONTEXTO_LABELS[lookSelecionado.contexto] ?? lookSelecionado.contexto}
                </span>
              )}
            </div>

            {lookSelecionado.descricao && (
              <p style={{ fontSize: 14, color: '#444', margin: 0 }}>{lookSelecionado.descricao}</p>
            )}

            <p style={{ fontSize: 11, color: '#bbb', margin: 0 }}>
              {new Date(lookSelecionado.created_at).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>

            {aba === 'meus_looks' && (
              <>
                <button
                  onClick={() => { void handleTogglePublico(lookSelecionado) }}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 14px', borderRadius: 14, border: '1.5px solid #E8E8E8',
                    backgroundColor: '#fff', cursor: 'pointer',
                  }}
                >
                  <div className="flex flex-col items-start gap-0.5">
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#333' }}>
                      {lookSelecionado.publico ? 'Remover da galeria' : 'Compartilhar na galeria'}
                    </span>
                    {lookSelecionado.publico && (
                      <span style={{ fontSize: 11, color: '#F472A0' }}>❤️ {lookSelecionado.curtidas} curtidas</span>
                    )}
                  </div>
                  <div style={{
                    width: 42, height: 24, borderRadius: 12,
                    backgroundColor: lookSelecionado.publico ? '#1B5E5A' : '#D0D0D0',
                    position: 'relative', transition: 'background-color 0.2s', flexShrink: 0,
                  }}>
                    <div style={{ position: 'absolute', top: 3, left: lookSelecionado.publico ? 21 : 3, width: 18, height: 18, borderRadius: '50%', backgroundColor: '#fff', transition: 'left 0.2s' }} />
                  </div>
                </button>

                <button
                  onClick={() => { void handleDeletar(lookSelecionado) }}
                  disabled={deletando}
                  style={{
                    padding: '13px', borderRadius: 14,
                    border: `1.5px solid ${confirmarDelete ? '#ef4444' : '#fca5a5'}`,
                    backgroundColor: confirmarDelete ? '#fef2f2' : 'transparent',
                    color: '#ef4444', fontSize: 14, fontWeight: 600,
                    cursor: deletando ? 'not-allowed' : 'pointer',
                    opacity: deletando ? 0.6 : 1,
                  }}
                >
                  {deletando ? 'Excluindo...' : confirmarDelete ? 'Confirmar exclusão' : 'Excluir look'}
                </button>
              </>
            )}

            {aba === 'favoritos' && (
              <button
                onClick={() => { void handleRemoverFavorito(lookSelecionado) }}
                style={{
                  padding: '13px', borderRadius: 14,
                  border: '1.5px solid #fca5a5',
                  backgroundColor: 'transparent',
                  color: '#ef4444', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                }}
              >
                Remover dos favoritos
              </button>
            )}
          </div>
        </div>
      )}

      {/* Modal editar coleção (Ajuste 6) */}
      {colecaoParaEditar && modoEditar && (
        <div
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.65)', zIndex: 60, display: 'flex', alignItems: 'flex-end' }}
          onClick={() => { setColecaoParaEditar(null); setModoEditar(null) }}
        >
          <div
            style={{
              backgroundColor: '#fff', borderRadius: '24px 24px 0 0',
              padding: '20px 20px 40px', width: '100%', maxWidth: 430,
              margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 12,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#E0E0E0', alignSelf: 'center', marginBottom: 4 }} />

            <p style={{ fontSize: 16, fontWeight: 700, color: '#171717', margin: 0 }}>
              {colecaoParaEditar.emoji ?? '📁'} {colecaoParaEditar.nome}
            </p>

            {modoEditar === 'menu' && (
              <>
                <button
                  onClick={() => setModoEditar('renomear')}
                  style={{
                    padding: '13px', borderRadius: 14, border: '1.5px solid #E8E8E8',
                    backgroundColor: '#fff', color: '#333', fontSize: 14, fontWeight: 600,
                    cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  ✏️ Renomear coleção
                </button>
                <button
                  onClick={() => { void handleExcluirColecao() }}
                  style={{
                    padding: '13px', borderRadius: 14, border: '1.5px solid #fca5a5',
                    backgroundColor: '#fef2f2', color: '#ef4444', fontSize: 14, fontWeight: 600,
                    cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  🗑️ Excluir coleção
                </button>
                <p style={{ fontSize: 11, color: '#bbb', textAlign: 'center', margin: 0 }}>
                  Os looks salvos não serão excluídos
                </p>
              </>
            )}

            {modoEditar === 'renomear' && (
              <>
                <input
                  type="text"
                  value={editandoNome}
                  onChange={(e) => setEditandoNome(e.target.value)}
                  autoFocus
                  maxLength={30}
                  style={{
                    borderRadius: 12, border: '1.5px solid #E8E8E8',
                    padding: '12px 14px', fontSize: 15, color: '#171717',
                    outline: 'none', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box',
                  }}
                />
                <button
                  onClick={() => { void handleRenomearColecao() }}
                  disabled={!editandoNome.trim() || salvandoColecao}
                  style={{
                    padding: '13px', borderRadius: 14, border: 'none',
                    backgroundColor: '#1B5E5A', color: '#fff', fontSize: 14, fontWeight: 700,
                    cursor: (!editandoNome.trim() || salvandoColecao) ? 'not-allowed' : 'pointer',
                    opacity: (!editandoNome.trim() || salvandoColecao) ? 0.6 : 1,
                  }}
                >
                  {salvandoColecao ? 'Salvando...' : 'Salvar nome'}
                </button>
                <button
                  onClick={() => setModoEditar('menu')}
                  style={{
                    padding: '10px', borderRadius: 14, border: 'none',
                    backgroundColor: 'transparent', color: '#888', fontSize: 13, cursor: 'pointer',
                  }}
                >
                  Cancelar
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </PageContainer>
  )
}
