'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Masonry from 'react-masonry-css'
import { createClient } from '@/lib/supabase/client'
import AppHeader from '@/components/ui/AppHeader'
import PageContainer from '@/components/ui/PageContainer'
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
  const [looks, setLooks] = useState<LookDiario[]>([])
  const [loading, setLoading] = useState(true)
  const [lookSelecionado, setLookSelecionado] = useState<LookDiario | null>(null)
  const [deletando, setDeletando] = useState(false)
  const [confirmarDelete, setConfirmarDelete] = useState(false)
  const [hashtagSelecionada, setHashtagSelecionada] = useState<string | null>(null)
  const [todasHashtags, setTodasHashtags] = useState<string[]>([])

  const carregarLooks = useCallback(async (filtroHashtag: string | null = null) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    let query = supabase
      .from('looks_diario')
      .select('*')
      .eq('usuario_id', user.id)
      .order('created_at', { ascending: false })

    if (filtroHashtag) {
      query = query.contains('hashtags', [filtroHashtag])
    }

    const { data } = await query
    setLooks((data as LookDiario[]) ?? [])

    // Coletar todas as hashtags únicas para os filtros
    if (!filtroHashtag) {
      const todas = supabase
        .from('looks_diario')
        .select('hashtags')
        .eq('usuario_id', user.id)
        .not('hashtags', 'is', null)
      const { data: hashData } = await todas
      const set = new Set<string>()
      ;(hashData ?? []).forEach((row: { hashtags: string[] | null }) => {
        row.hashtags?.forEach((t) => set.add(t))
      })
      setTodasHashtags(Array.from(set).sort())
    }

    setLoading(false)
  }, [router])

  useEffect(() => { void carregarLooks(null) }, [carregarLooks])

  async function handleDeletar(look: LookDiario) {
    if (!confirmarDelete) {
      setConfirmarDelete(true)
      return
    }
    setDeletando(true)
    const supabase = createClient()
    await supabase.from('looks_diario').delete().eq('id', look.id)
    setLookSelecionado(null)
    setDeletando(false)
    setConfirmarDelete(false)
    void carregarLooks(null)
  }

  async function handleTogglePublico(look: LookDiario) {
    const supabase = createClient()
    const novoValor = !look.publico
    await supabase.from('looks_diario').update({ publico: novoValor }).eq('id', look.id)
    const atualizado = { ...look, publico: novoValor }
    setLookSelecionado(atualizado)
    setLooks((prev) => prev.map((l) => l.id === look.id ? atualizado : l))
  }

  function handleFiltroHashtag(tag: string) {
    const nova = hashtagSelecionada === tag ? null : tag
    setHashtagSelecionada(nova)
    setLoading(true)
    void carregarLooks(nova).finally(() => setLoading(false))
  }

  function fecharModal() {
    setLookSelecionado(null)
    setConfirmarDelete(false)
  }

  return (
    <PageContainer>
      <AppHeader />
      <main style={{ padding: '24px 0 100px', minHeight: '80vh' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 mb-5">
          <h1 className="font-extrabold tracking-tight" style={{ fontSize: 22, color: '#171717' }}>
            Meus Looks
          </h1>
          <button
            onClick={() => router.push('/app/galeria')}
            style={{ fontSize: 13, color: '#1B5E5A', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Galeria →
          </button>
        </div>

        {/* Loading skeletons */}
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

        {/* Empty state */}
        {!loading && looks.length === 0 && (
          <div className="flex flex-col items-center gap-4 py-16 px-5">
            <span style={{ fontSize: 56 }}>📸</span>
            <p className="font-bold text-gray-700" style={{ fontSize: 17 }}>Nenhum look ainda</p>
            <p className="text-gray-400 text-center" style={{ fontSize: 14 }}>
              Registre seu primeiro look e acompanhe sua evolução!
            </p>
            <button
              onClick={() => router.push('/app/looks/novo')}
              style={{
                marginTop: 4,
                padding: '14px 28px',
                borderRadius: 14,
                border: 'none',
                backgroundColor: '#1B5E5A',
                color: '#fff',
                fontSize: 15,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Registrar primeiro look
            </button>
          </div>
        )}

        {/* Filtro por hashtag */}
        {!loading && todasHashtags.length > 0 && (
          <div style={{ overflowX: 'auto', paddingBottom: 4 }}>
            <div style={{ display: 'flex', gap: 8, padding: '0 20px', whiteSpace: 'nowrap' }}>
              {todasHashtags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleFiltroHashtag(tag)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '6px 14px',
                    borderRadius: 20,
                    border: `1.5px solid ${hashtagSelecionada === tag ? '#1B5E5A' : '#E8E8E8'}`,
                    backgroundColor: hashtagSelecionada === tag ? '#E8F5F4' : '#fff',
                    color: hashtagSelecionada === tag ? '#1B5E5A' : '#888',
                    fontSize: 13,
                    fontWeight: hashtagSelecionada === tag ? 700 : 500,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Masonry grid */}
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
                  position: 'relative',
                  borderRadius: 12,
                  overflow: 'hidden',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'block',
                  width: '100%',
                  backgroundColor: '#F0F0F0',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={look.foto_url}
                  alt="Look"
                  style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 12 }}
                />

                {/* Badges topo */}
                {look.contexto && (
                  <span
                    style={{
                      position: 'absolute',
                      top: 7,
                      left: 7,
                      fontSize: 10,
                      fontWeight: 700,
                      color: '#fff',
                      backgroundColor: 'rgba(0,0,0,0.45)',
                      borderRadius: 8,
                      padding: '3px 7px',
                      backdropFilter: 'blur(4px)',
                    }}
                  >
                    {CONTEXTO_LABELS[look.contexto] ?? look.contexto}
                  </span>
                )}
                {look.avaliacao && (
                  <span
                    style={{
                      position: 'absolute',
                      top: 7,
                      right: 7,
                      fontSize: 16,
                    }}
                  >
                    {AVALIACAO_EMOJIS[look.avaliacao]}
                  </span>
                )}

                {/* Data estilo foto revelada */}
                {look.data_foto && (
                  <span
                    style={{
                      position: 'absolute',
                      bottom: 7,
                      left: 7,
                      fontSize: 10,
                      fontFamily: 'monospace',
                      color: '#FFFFFF',
                      fontWeight: 700,
                      letterSpacing: 0.5,
                      textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000',
                    }}
                  >
                    {new Date(look.data_foto + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                  </span>
                )}

                {/* Cadeado se privado */}
                {!look.publico && (
                  <span
                    style={{
                      position: 'absolute',
                      bottom: 7,
                      right: 7,
                      fontSize: 14,
                      opacity: 0.8,
                    }}
                  >
                    🔒
                  </span>
                )}
              </button>
            ))}
          </Masonry>
        )}
      </main>

      {/* FAB */}
      <button
        onClick={() => { playClick(); router.push('/app/looks/novo') }}
        style={{
          position: 'fixed',
          bottom: 90,
          right: 20,
          width: 56,
          height: 56,
          borderRadius: '50%',
          backgroundColor: '#1B5E5A',
          color: '#fff',
          fontSize: 28,
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 18px rgba(27,94,90,0.45)',
          zIndex: 20,
        }}
      >
        +
      </button>

      {/* Modal bottom sheet */}
      {lookSelecionado && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.65)',
            zIndex: 50,
            display: 'flex',
            alignItems: 'flex-end',
          }}
          onClick={fecharModal}
        >
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: '24px 24px 0 0',
              padding: '20px 20px 40px',
              width: '100%',
              maxWidth: 430,
              margin: '0 auto',
              maxHeight: '85vh',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle */}
            <div style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#E0E0E0', alignSelf: 'center', marginBottom: 4 }} />

            {/* Foto grande — proporção real (Ajuste 2) */}
            <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={lookSelecionado.foto_url}
                alt="Look"
                style={{
                  width: '100%',
                  display: 'block',
                  aspectRatio: lookSelecionado.largura && lookSelecionado.altura
                    ? `${lookSelecionado.largura} / ${lookSelecionado.altura}`
                    : undefined,
                  height: 'auto',
                  objectFit: 'cover',
                }}
              />
              {lookSelecionado.data_foto && (
                <span
                  style={{
                    position: 'absolute',
                    bottom: 10,
                    left: 10,
                    fontSize: 11,
                    fontFamily: 'monospace',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    letterSpacing: 0.5,
                    textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000',
                  }}
                >
                  {new Date(lookSelecionado.data_foto + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                </span>
              )}
            </div>

            {/* Info */}
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

            {/* Toggle público */}
            <button
              onClick={() => handleTogglePublico(lookSelecionado)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                borderRadius: 14,
                border: '1.5px solid #E8E8E8',
                backgroundColor: '#fff',
                cursor: 'pointer',
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
              <div
                style={{
                  width: 42,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: lookSelecionado.publico ? '#1B5E5A' : '#D0D0D0',
                  position: 'relative',
                  transition: 'background-color 0.2s',
                  flexShrink: 0,
                }}
              >
                <div style={{ position: 'absolute', top: 3, left: lookSelecionado.publico ? 21 : 3, width: 18, height: 18, borderRadius: '50%', backgroundColor: '#fff', transition: 'left 0.2s' }} />
              </div>
            </button>

            {/* Excluir */}
            <button
              onClick={() => handleDeletar(lookSelecionado)}
              disabled={deletando}
              style={{
                padding: '13px',
                borderRadius: 14,
                border: `1.5px solid ${confirmarDelete ? '#ef4444' : '#fca5a5'}`,
                backgroundColor: confirmarDelete ? '#fef2f2' : 'transparent',
                color: '#ef4444',
                fontSize: 14,
                fontWeight: 600,
                cursor: deletando ? 'not-allowed' : 'pointer',
                opacity: deletando ? 0.6 : 1,
              }}
            >
              {deletando ? 'Excluindo...' : confirmarDelete ? 'Confirmar exclusão' : 'Excluir look'}
            </button>
          </div>
        </div>
      )}
    </PageContainer>
  )
}
