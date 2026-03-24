'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
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
  created_at: string
}

const CONTEXTO_LABELS: Record<string, string> = {
  dia_casual: '☀️ Dia casual',
  dia_formal: '👔 Dia formal',
  noite_casual: '🌙 Noite casual',
  noite_especial: '✨ Noite especial',
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

  const carregarLooks = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data } = await supabase
      .from('looks_diario')
      .select('*')
      .eq('usuario_id', user.id)
      .order('created_at', { ascending: false })

    setLooks((data as LookDiario[]) ?? [])
    setLoading(false)
  }, [router])

  useEffect(() => {
    void carregarLooks()
  }, [carregarLooks])

  async function handleDeletar(look: LookDiario) {
    setDeletando(true)
    const supabase = createClient()
    await supabase
      .from('looks_diario')
      .delete()
      .eq('id', look.id)

    setLookSelecionado(null)
    setDeletando(false)
    void carregarLooks()
  }

  async function handleTogglePublico(look: LookDiario) {
    const supabase = createClient()
    await supabase
      .from('looks_diario')
      .update({ publico: !look.publico })
      .eq('id', look.id)

    const atualizado = { ...look, publico: !look.publico }
    setLookSelecionado(atualizado)
    setLooks((prev) => prev.map((l) => l.id === look.id ? atualizado : l))
  }

  return (
    <PageContainer>
      <AppHeader />
      <main className="flex flex-col px-5 py-6 gap-6" style={{ minHeight: '80vh', position: 'relative' }}>

        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="font-extrabold tracking-tight" style={{ fontSize: 22, color: '#171717' }}>
            Meus Looks
          </h1>
          <button
            onClick={() => { router.push('/app/galeria') }}
            style={{ fontSize: 13, color: '#1B5E5A', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Ver galeria →
          </button>
        </div>

        {loading && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} style={{ aspectRatio: '1', borderRadius: 16, backgroundColor: '#E8E8E8', animation: 'pulse 1.5s infinite' }} />
            ))}
          </div>
        )}

        {!loading && looks.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-16">
            <span style={{ fontSize: 48 }}>📸</span>
            <p className="font-bold text-gray-700" style={{ fontSize: 16 }}>Nenhum look ainda</p>
            <p className="text-gray-400 text-center" style={{ fontSize: 13 }}>
              Registre seus looks do dia a dia e acompanhe sua evolução
            </p>
          </div>
        )}

        {!loading && looks.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {looks.map((look) => (
              <button
                key={look.id}
                onClick={() => { playClick(); setLookSelecionado(look) }}
                style={{
                  position: 'relative',
                  aspectRatio: '1',
                  borderRadius: 16,
                  overflow: 'hidden',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={look.foto_url}
                  alt="Look"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                {/* Badges */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: '20px 8px 8px',
                    background: 'linear-gradient(transparent, rgba(0,0,0,0.55))',
                    display: 'flex',
                    alignItems: 'flex-end',
                    gap: 4,
                    flexWrap: 'wrap',
                  }}
                >
                  {look.avaliacao && (
                    <span style={{ fontSize: 16 }}>{AVALIACAO_EMOJIS[look.avaliacao]}</span>
                  )}
                  {look.contexto && (
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: '#fff',
                        backgroundColor: 'rgba(0,0,0,0.4)',
                        borderRadius: 6,
                        padding: '2px 6px',
                      }}
                    >
                      {CONTEXTO_LABELS[look.contexto]?.split(' ').slice(1).join(' ') ?? look.contexto}
                    </span>
                  )}
                  {look.publico && (
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)', marginLeft: 'auto' }}>❤️ {look.curtidas}</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

      </main>

      {/* FAB novo look */}
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
          boxShadow: '0 4px 16px rgba(27,94,90,0.4)',
          zIndex: 20,
        }}
      >
        +
      </button>

      {/* Modal look selecionado */}
      {lookSelecionado && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            zIndex: 50,
            display: 'flex',
            alignItems: 'flex-end',
          }}
          onClick={() => setLookSelecionado(null)}
        >
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: '24px 24px 0 0',
              padding: '24px 20px 40px',
              width: '100%',
              maxWidth: 430,
              margin: '0 auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Foto grande */}
            <div style={{ borderRadius: 16, overflow: 'hidden', maxHeight: 300 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={lookSelecionado.foto_url}
                alt="Look"
                style={{ width: '100%', objectFit: 'cover' }}
              />
            </div>

            {/* Info */}
            <div className="flex flex-col gap-2">
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {lookSelecionado.avaliacao && (
                  <span
                    style={{
                      fontSize: 12, fontWeight: 700,
                      backgroundColor: '#E8F5F4', color: '#1B5E5A',
                      borderRadius: 20, padding: '4px 10px',
                    }}
                  >
                    {AVALIACAO_EMOJIS[lookSelecionado.avaliacao]}{' '}
                    {lookSelecionado.avaliacao === 'amei' ? 'Amei' : lookSelecionado.avaliacao === 'ok' ? 'Ok' : 'Não gostei'}
                  </span>
                )}
                {lookSelecionado.contexto && (
                  <span
                    style={{
                      fontSize: 12, fontWeight: 700,
                      backgroundColor: '#F5F5F5', color: '#555',
                      borderRadius: 20, padding: '4px 10px',
                    }}
                  >
                    {CONTEXTO_LABELS[lookSelecionado.contexto] ?? lookSelecionado.contexto}
                  </span>
                )}
              </div>
              {lookSelecionado.descricao && (
                <p style={{ fontSize: 14, color: '#444' }}>{lookSelecionado.descricao}</p>
              )}
              <p style={{ fontSize: 11, color: '#999' }}>
                {new Date(lookSelecionado.created_at).toLocaleDateString('pt-BR', {
                  day: 'numeric', month: 'long', year: 'numeric',
                })}
              </p>
            </div>

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
              <span style={{ fontSize: 13, fontWeight: 600, color: '#333' }}>
                {lookSelecionado.publico ? `Público · ❤️ ${lookSelecionado.curtidas}` : 'Compartilhar na galeria pública'}
              </span>
              <div
                style={{
                  width: 40,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: lookSelecionado.publico ? '#1B5E5A' : '#D0D0D0',
                  position: 'relative',
                  transition: 'background-color 0.2s',
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: 3,
                    left: lookSelecionado.publico ? 19 : 3,
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    backgroundColor: '#fff',
                    transition: 'left 0.2s',
                  }}
                />
              </div>
            </button>

            {/* Deletar */}
            <button
              onClick={() => handleDeletar(lookSelecionado)}
              disabled={deletando}
              style={{
                padding: '12px',
                borderRadius: 14,
                border: '1.5px solid #fca5a5',
                backgroundColor: 'transparent',
                color: '#ef4444',
                fontSize: 14,
                fontWeight: 600,
                cursor: deletando ? 'not-allowed' : 'pointer',
                opacity: deletando ? 0.6 : 1,
              }}
            >
              {deletando ? 'Deletando...' : 'Deletar look'}
            </button>
          </div>
        </div>
      )}
    </PageContainer>
  )
}
