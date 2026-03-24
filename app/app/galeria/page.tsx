'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
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
}

type Ordenacao = 'recentes' | 'curtidos'

const AVALIACAO_EMOJIS: Record<string, string> = {
  amei: '😍',
  ok: '😊',
  nao_gostei: '😕',
}

function pontuacao(look: LookPublico): number {
  const agora = Date.now()
  const criado = new Date(look.created_at).getTime()
  const diffHoras = (agora - criado) / (1000 * 60 * 60)
  // Recência: 1 em 0h, 0 em 168h (7 dias), linear
  const recencia = Math.max(0, 1 - diffHoras / 168)
  return look.curtidas * 0.7 + recencia * 0.3
}

export default function GaleriaPage() {
  const router = useRouter()
  const [looks, setLooks] = useState<LookPublico[]>([])
  const [loading, setLoading] = useState(true)
  const [ordenacao, setOrdenacao] = useState<Ordenacao>('recentes')
  const [curtidas, setCurtidas] = useState<Set<string>>(new Set())
  const [userId, setUserId] = useState<string | null>(null)

  const carregarGaleria = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    setUserId(user?.id ?? null)

    const { data } = await supabase
      .from('looks_diario')
      .select('id, foto_url, contexto, avaliacao, descricao, curtidas, created_at, usuario_id')
      .eq('publico', true)
      .order('created_at', { ascending: false })
      .limit(100)

    const lista = (data as LookPublico[]) ?? []
    setLooks(lista)

    // Buscar curtidas do usuário atual
    if (user && lista.length > 0) {
      const ids = lista.map((l) => l.id)
      const { data: minhasCurtidas } = await supabase
        .from('looks_curtidas')
        .select('look_id')
        .eq('usuario_id', user.id)
        .in('look_id', ids)

      const set = new Set<string>((minhasCurtidas ?? []).map((c: { look_id: string }) => c.look_id))
      setCurtidas(set)
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    void carregarGaleria()
  }, [carregarGaleria])

  async function handleCurtir(look: LookPublico) {
    if (!userId) { router.push('/login'); return }
    playClick()

    // Otimistic update
    const jaCurtiu = curtidas.has(look.id)
    setCurtidas((prev) => {
      const next = new Set(prev)
      if (jaCurtiu) next.delete(look.id)
      else next.add(look.id)
      return next
    })
    setLooks((prev) =>
      prev.map((l) =>
        l.id === look.id
          ? { ...l, curtidas: jaCurtiu ? Math.max(0, l.curtidas - 1) : l.curtidas + 1 }
          : l
      )
    )

    try {
      const res = await fetch(`/api/galeria/curtir/${look.id}`, { method: 'POST' })
      if (!res.ok) throw new Error()
      const data = await res.json() as { curtidas: number; curtido: boolean }
      // Sync com valor real do servidor
      setLooks((prev) =>
        prev.map((l) => l.id === look.id ? { ...l, curtidas: data.curtidas } : l)
      )
    } catch {
      // Reverter se falhar
      setCurtidas((prev) => {
        const next = new Set(prev)
        if (jaCurtiu) next.add(look.id)
        else next.delete(look.id)
        return next
      })
      setLooks((prev) =>
        prev.map((l) =>
          l.id === look.id
            ? { ...l, curtidas: jaCurtiu ? l.curtidas + 1 : Math.max(0, l.curtidas - 1) }
            : l
        )
      )
    }
  }

  const looksOrdenados = [...looks].sort((a, b) =>
    ordenacao === 'curtidos'
      ? b.curtidas - a.curtidas
      : pontuacao(b) - pontuacao(a)
  )

  return (
    <PageContainer>
      <AppHeader />
      <main className="flex flex-col px-5 py-6 gap-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="font-extrabold tracking-tight" style={{ fontSize: 22, color: '#171717' }}>
            Galeria de Looks
          </h1>
          <button
            onClick={() => router.push('/app/looks')}
            style={{ fontSize: 13, color: '#1B5E5A', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Meus looks →
          </button>
        </div>

        {/* Toggle ordenação */}
        <div
          style={{
            display: 'flex',
            backgroundColor: '#F0F0F0',
            borderRadius: 12,
            padding: 4,
            gap: 4,
          }}
        >
          {(['recentes', 'curtidos'] as Ordenacao[]).map((op) => (
            <button
              key={op}
              onClick={() => setOrdenacao(op)}
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: 10,
                border: 'none',
                backgroundColor: ordenacao === op ? '#fff' : 'transparent',
                color: ordenacao === op ? '#1B5E5A' : '#888',
                fontSize: 13,
                fontWeight: ordenacao === op ? 700 : 500,
                cursor: 'pointer',
                boxShadow: ordenacao === op ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.15s',
              }}
            >
              {op === 'recentes' ? 'Recentes' : 'Mais curtidos'}
            </button>
          ))}
        </div>

        {loading && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} style={{ aspectRatio: '1', borderRadius: 16, backgroundColor: '#E8E8E8' }} />
            ))}
          </div>
        )}

        {!loading && looksOrdenados.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-16">
            <span style={{ fontSize: 48 }}>✨</span>
            <p className="font-bold text-gray-700" style={{ fontSize: 16 }}>Nenhum look por aqui ainda</p>
            <p className="text-gray-400 text-center" style={{ fontSize: 13 }}>
              Seja a primeira a compartilhar seu look!
            </p>
            <button
              onClick={() => router.push('/app/looks/novo')}
              style={{
                marginTop: 8,
                padding: '12px 24px',
                borderRadius: 14,
                border: 'none',
                backgroundColor: '#1B5E5A',
                color: '#fff',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Adicionar look
            </button>
          </div>
        )}

        {!loading && looksOrdenados.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {looksOrdenados.map((look) => {
              const curtiu = curtidas.has(look.id)
              return (
                <div
                  key={look.id}
                  style={{
                    borderRadius: 16,
                    overflow: 'hidden',
                    position: 'relative',
                    backgroundColor: '#F5F5F5',
                  }}
                >
                  {/* Foto */}
                  <div style={{ aspectRatio: '1', position: 'relative' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={look.foto_url}
                      alt="Look"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                    {/* Badge avaliação */}
                    {look.avaliacao && (
                      <span
                        style={{
                          position: 'absolute',
                          top: 8,
                          left: 8,
                          fontSize: 18,
                        }}
                      >
                        {AVALIACAO_EMOJIS[look.avaliacao]}
                      </span>
                    )}
                  </div>

                  {/* Rodapé */}
                  <div
                    style={{
                      padding: '8px 10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: '#fff',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {look.descricao && (
                        <p
                          style={{
                            fontSize: 11, color: '#555',
                            overflow: 'hidden', textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {look.descricao}
                        </p>
                      )}
                      <p style={{ fontSize: 10, color: '#aaa' }}>
                        {new Date(look.created_at).toLocaleDateString('pt-BR', {
                          day: 'numeric', month: 'short',
                        })}
                      </p>
                    </div>

                    {/* Botão curtir */}
                    <button
                      onClick={() => handleCurtir(look)}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 1,
                        border: 'none',
                        backgroundColor: 'transparent',
                        cursor: 'pointer',
                        padding: '4px 6px',
                        flexShrink: 0,
                      }}
                    >
                      <span style={{ fontSize: 18, transition: 'transform 0.15s', transform: curtiu ? 'scale(1.2)' : 'scale(1)' }}>
                        {curtiu ? '❤️' : '🤍'}
                      </span>
                      <span style={{ fontSize: 10, color: curtiu ? '#F472A0' : '#aaa', fontWeight: 600 }}>
                        {look.curtidas}
                      </span>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

      </main>
    </PageContainer>
  )
}
