'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Masonry from 'react-masonry-css'
import { createClient } from '@/lib/supabase/client'
import AppHeader from '@/components/ui/AppHeader'
import PageContainer from '@/components/ui/PageContainer'
import { playClick } from '@/lib/sound'

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
}

type Ordenacao = 'em_alta' | 'recentes'

const PAGE_SIZE = 20

const AVALIACAO_EMOJIS: Record<string, string> = {
  amei: '😍',
  ok: '😊',
  nao_gostei: '😕',
}

export default function GaleriaPage() {
  const router = useRouter()
  const [looks, setLooks] = useState<LookPublico[]>([])
  const [loading, setLoading] = useState(true)
  const [carregandoMais, setCarregandoMais] = useState(false)
  const [temMais, setTemMais] = useState(false)
  const [ordenacao, setOrdenacao] = useState<Ordenacao>('em_alta')
  const [curtidas, setCurtidas] = useState<Set<string>>(new Set())
  const [curtidosAnimando, setCurtidosAnimando] = useState<Set<string>>(new Set())
  const [userId, setUserId] = useState<string | null>(null)
  const [pagina, setPagina] = useState(0)

  const carregarGaleria = useCallback(async (ord: Ordenacao, pag: number, append = false) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!append) setUserId(user?.id ?? null)

    const query = supabase
      .from('looks_diario')
      .select('id, foto_url, contexto, avaliacao, descricao, curtidas, created_at, usuario_id, data_foto')
      .eq('publico', true)
      .range(pag * PAGE_SIZE, (pag + 1) * PAGE_SIZE - 1)

    if (ord === 'em_alta') {
      query.order('curtidas', { ascending: false }).order('created_at', { ascending: false })
    } else {
      query.order('created_at', { ascending: false })
    }

    const { data } = await query
    const lista = (data as LookPublico[]) ?? []
    setTemMais(lista.length === PAGE_SIZE)

    if (append) {
      setLooks((prev) => [...prev, ...lista])
    } else {
      setLooks(lista)

      // Buscar curtidas do usuário
      if (user && lista.length > 0) {
        const ids = lista.map((l) => l.id)
        const { data: minhasCurtidas } = await supabase
          .from('looks_curtidas')
          .select('look_id')
          .eq('usuario_id', user.id)
          .in('look_id', ids)
        setCurtidas(new Set<string>((minhasCurtidas ?? []).map((c: { look_id: string }) => c.look_id)))
      }
    }
  }, [])

  useEffect(() => {
    setLoading(true)
    setPagina(0)
    void carregarGaleria(ordenacao, 0, false).finally(() => setLoading(false))
  }, [ordenacao, carregarGaleria])

  async function handleVerMais() {
    setCarregandoMais(true)
    const proxPagina = pagina + 1
    setPagina(proxPagina)
    await carregarGaleria(ordenacao, proxPagina, true)
    setCarregandoMais(false)
  }

  async function handleCurtir(look: LookPublico) {
    if (!userId) { router.push('/login'); return }
    playClick()

    const jaCurtiu = curtidas.has(look.id)

    // Optimistic update
    setCurtidas((prev) => {
      const next = new Set(prev)
      if (jaCurtiu) next.delete(look.id)
      else next.add(look.id)
      return next
    })
    setLooks((prev) =>
      prev.map((l) =>
        l.id === look.id ? { ...l, curtidas: jaCurtiu ? Math.max(0, l.curtidas - 1) : l.curtidas + 1 } : l
      )
    )

    // Animação no coração
    if (!jaCurtiu) {
      setCurtidosAnimando((prev) => new Set(prev).add(look.id))
      setTimeout(() => {
        setCurtidosAnimando((prev) => {
          const next = new Set(prev)
          next.delete(look.id)
          return next
        })
      }, 400)
    }

    try {
      const res = await fetch(`/api/galeria/curtir/${look.id}`, { method: 'POST' })
      if (!res.ok) throw new Error()
      const data = await res.json() as { curtidas: number; curtido: boolean }
      setLooks((prev) =>
        prev.map((l) => l.id === look.id ? { ...l, curtidas: data.curtidas } : l)
      )
    } catch {
      // Reverter
      setCurtidas((prev) => {
        const next = new Set(prev)
        if (jaCurtiu) next.add(look.id)
        else next.delete(look.id)
        return next
      })
      setLooks((prev) =>
        prev.map((l) =>
          l.id === look.id ? { ...l, curtidas: jaCurtiu ? l.curtidas + 1 : Math.max(0, l.curtidas - 1) } : l
        )
      )
    }
  }

  return (
    <PageContainer>
      <AppHeader />
      <main style={{ padding: '24px 0 100px', minHeight: '80vh' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 mb-5">
          <h1 className="font-extrabold tracking-tight" style={{ fontSize: 22, color: '#171717' }}>
            Galeria
          </h1>
          <button
            onClick={() => router.push('/app/looks')}
            style={{ fontSize: 13, color: '#1B5E5A', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Meus looks →
          </button>
        </div>

        {/* Toggle ordenação */}
        <div style={{ margin: '0 20px 20px', display: 'flex', backgroundColor: '#F0F0F0', borderRadius: 14, padding: 4 }}>
          {([['em_alta', '✨ Em alta'], ['recentes', '🕐 Recentes']] as [Ordenacao, string][]).map(([val, label]) => (
            <button
              key={val}
              onClick={() => setOrdenacao(val)}
              style={{
                flex: 1,
                padding: '9px',
                borderRadius: 11,
                border: 'none',
                backgroundColor: ordenacao === val ? '#fff' : 'transparent',
                color: ordenacao === val ? '#1B5E5A' : '#888',
                fontSize: 13,
                fontWeight: ordenacao === val ? 700 : 500,
                cursor: 'pointer',
                boxShadow: ordenacao === val ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.15s',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ display: 'flex', gap: 8, padding: '0 8px' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ height: 200, borderRadius: 12, backgroundColor: '#E8E8E8' }} />
              <div style={{ height: 150, borderRadius: 12, backgroundColor: '#E8E8E8' }} />
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, marginTop: 24 }}>
              <div style={{ height: 170, borderRadius: 12, backgroundColor: '#E8E8E8' }} />
              <div style={{ height: 200, borderRadius: 12, backgroundColor: '#E8E8E8' }} />
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && looks.length === 0 && (
          <div className="flex flex-col items-center gap-4 py-16 px-5">
            <span style={{ fontSize: 56 }}>✨</span>
            <p className="font-bold text-gray-700" style={{ fontSize: 17 }}>Nenhum look compartilhado ainda</p>
            <p className="text-gray-400 text-center" style={{ fontSize: 14 }}>
              Seja a primeira a compartilhar!
            </p>
            <button
              onClick={() => router.push('/app/looks/novo?publico=true')}
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
              Compartilhar meu look
            </button>
          </div>
        )}

        {/* Masonry grid */}
        {!loading && looks.length > 0 && (
          <>
            <Masonry
              breakpointCols={2}
              className="masonry-grid"
              columnClassName="masonry-grid_column"
            >
              {looks.map((look) => {
                const curtiu = curtidas.has(look.id)
                const animando = curtidosAnimando.has(look.id)
                return (
                  <div
                    key={look.id}
                    style={{
                      position: 'relative',
                      borderRadius: 12,
                      overflow: 'hidden',
                      backgroundColor: '#F0F0F0',
                    }}
                  >
                    {/* Foto */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={look.foto_url}
                      alt="Look"
                      style={{ width: '100%', height: 'auto', display: 'block' }}
                    />

                    {/* Badge avaliação */}
                    {look.avaliacao && (
                      <span
                        style={{ position: 'absolute', top: 7, left: 7, fontSize: 16 }}
                      >
                        {AVALIACAO_EMOJIS[look.avaliacao]}
                      </span>
                    )}

                    {/* Data estilo foto revelada */}
                    {look.data_foto && (
                      <span
                        style={{
                          position: 'absolute',
                          bottom: 44,
                          left: 7,
                          fontSize: 10,
                          fontFamily: 'monospace',
                          color: '#D4A843',
                          fontWeight: 700,
                          letterSpacing: 0.5,
                          textShadow: '0 1px 3px rgba(0,0,0,0.5)',
                        }}
                      >
                        {new Date(look.data_foto + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                      </span>
                    )}

                    {/* Rodapé: coração */}
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: 36,
                        backgroundColor: 'rgba(255,255,255,0.92)',
                        backdropFilter: 'blur(8px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        padding: '0 8px 0 10px',
                      }}
                    >
                      <button
                        onClick={() => handleCurtir(look)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 3,
                          border: 'none',
                          backgroundColor: 'transparent',
                          cursor: 'pointer',
                          padding: '4px 2px',
                        }}
                      >
                        <span
                          style={{
                            fontSize: 16,
                            transform: animando ? 'scale(1.3)' : 'scale(1)',
                            transition: 'transform 0.2s ease',
                            display: 'inline-block',
                          }}
                        >
                          {curtiu ? '❤️' : '🤍'}
                        </span>
                        <span style={{ fontSize: 11, color: curtiu ? '#F472A0' : '#aaa', fontWeight: 600 }}>
                          {look.curtidas}
                        </span>
                      </button>
                    </div>
                  </div>
                )
              })}
            </Masonry>

            {/* Ver mais */}
            {temMais && (
              <div style={{ padding: '20px 20px 0', display: 'flex', justifyContent: 'center' }}>
                <button
                  onClick={handleVerMais}
                  disabled={carregandoMais}
                  style={{
                    padding: '12px 32px',
                    borderRadius: 14,
                    border: '1.5px solid #E8E8E8',
                    backgroundColor: '#fff',
                    color: '#1B5E5A',
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: carregandoMais ? 'not-allowed' : 'pointer',
                    opacity: carregandoMais ? 0.6 : 1,
                  }}
                >
                  {carregandoMais ? 'Carregando...' : 'Ver mais'}
                </button>
              </div>
            )}
          </>
        )}

      </main>
    </PageContainer>
  )
}
