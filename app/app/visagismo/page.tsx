'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { CREDIT_COSTS } from '@/lib/credits/costs'
import AppHeader from '@/components/ui/AppHeader'
import PageContainer from '@/components/ui/PageContainer'
import LogoutButton from '../LogoutButton'
import PremiumGate from '@/components/ui/PremiumGate'
import { PageTransition } from '@/components/ui/PageTransition'
import { SkeletonList } from '@/components/ui/SkeletonCard'
import { useCache } from '@/lib/cache/useCache'
import { CACHE_KEYS } from '@/lib/cache/keys'

function mesAtual(): string {
  const hoje = new Date()
  return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`
}

function nomeMes(mesRef: string): string {
  const [ano, mes] = mesRef.split('-')
  const data = new Date(Number(ano), Number(mes) - 1, 1)
  return data.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
}

function capitalizarEstacao(estacao: string): string {
  return estacao.replace(/\b\w/g, (l) => l.toUpperCase())
}

interface AnaliseFacial {
  id: string
  usuario_id: string
  estacao: string | null
  subtom: string | null
  formato_rosto: string | null
  mes_referencia: string
  foto_url: string | null
}

interface GeracaoVisagismo {
  id: string
  foto_gerada_url: string
  batom_nome: string | null
  sombra_nome: string | null
  created_at: string
}

function RevalidatingSpinner() {
  return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div
        style={{
          width: 16, height: 16,
          border: '2px solid #fff',
          borderTopColor: 'transparent',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
          opacity: 0.5,
        }}
      />
    </>
  )
}

// Componente interno: recebe userId já resolvido e usa useCache
function VisagismoContent({ userId }: { userId: string }) {
  const supabase = createClient()
  const [premium, setPremium] = useState(false)
  const [geracoes, setGeracoes] = useState<GeracaoVisagismo[]>([])

  // Buscar status premium client-side
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_PREMIUM_BYPASS_USER === userId) {
      setPremium(true)
      return
    }
    void (async () => {
      const { data } = await supabase
        .from('creditos_usuarios')
        .select('plano_id')
        .eq('usuario_id', userId)
        .eq('mes_referencia', mesAtual())
        .maybeSingle()
      setPremium((data as { plano_id: string } | null)?.plano_id === 'premium')
    })()
  }, [userId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Buscar gerações
  useEffect(() => {
    void (async () => {
      const { data } = await supabase
        .from('geracoes_visagismo')
        .select('id, foto_gerada_url, batom_nome, sombra_nome, created_at')
        .eq('usuario_id', userId)
        .eq('status', 'concluido')
        .order('created_at', { ascending: false })
        .limit(12)
      setGeracoes((data ?? []) as GeracaoVisagismo[])
    })()
  }, [userId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Análise facial com cache (24h)
  const analiseFetcher = useCallback(async (): Promise<AnaliseFacial | null> => {
    const { data } = await supabase
      .from('analise_facial')
      .select('*')
      .eq('usuario_id', userId)
      .eq('mes_referencia', mesAtual())
      .maybeSingle()
    return (data ?? null) as AnaliseFacial | null
  }, [userId]) // eslint-disable-line react-hooks/exhaustive-deps

  const {
    data: analise,
    loading,
  } = useCache<AnaliseFacial | null>(
    CACHE_KEYS.analise(userId),
    analiseFetcher,
    CACHE_KEYS.ANALISE_TTL
  )

  const showSkeleton = loading && analise === undefined

  if (showSkeleton) {
    return (
      <PageTransition>
      <PageContainer>
        <AppHeader actions={<LogoutButton />} />
        <main className="flex flex-col px-5 py-6 gap-5">
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 28, color: 'var(--foreground)', lineHeight: 1.2, letterSpacing: '-0.01em' }}>
            Visagismo
          </h1>
          <SkeletonList count={2} height={96} />
        </main>
      </PageContainer>
      </PageTransition>
    )
  }

  if (analise) {
    // Tela de résumé
    return (
      <PageTransition>
      <PageContainer>
        <AppHeader actions={<LogoutButton />} />
        <main className="flex flex-col px-5 py-6 gap-5">

          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 28, color: 'var(--foreground)', lineHeight: 1.2, letterSpacing: '-0.01em' }}>
            Visagismo
          </h1>

          {/* Card résumé */}
          <div
            style={{
              backgroundColor: '#1B5E5A',
              borderRadius: 20,
              padding: '24px 20px',
              color: '#fff',
            }}
          >
            {/* Foto miniatura */}
            {analise.foto_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={analise.foto_url}
                alt="Sua foto"
                style={{
                  width: 48, height: 48,
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid rgba(255,255,255,0.4)',
                  marginBottom: 12,
                  display: 'block',
                }}
              />
            )}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span
                style={{
                  display: 'inline-block',
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  borderRadius: 6,
                  padding: '3px 8px',
                }}
              >
                Análise de {nomeMes(analise.mes_referencia)}
              </span>
              {loading && <RevalidatingSpinner />}
            </div>
            <p style={{ fontWeight: 800, fontSize: 22, marginBottom: 12, lineHeight: 1.2 }}>
              {capitalizarEstacao(analise.estacao ?? '')}
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {analise.subtom && (
                <span style={{
                  backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20,
                  padding: '4px 12px', fontSize: 13, fontWeight: 600,
                }}>
                  {analise.subtom}
                </span>
              )}
              {analise.formato_rosto && (
                <span style={{
                  backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20,
                  padding: '4px 12px', fontSize: 13, fontWeight: 600,
                }}>
                  rosto {analise.formato_rosto}
                </span>
              )}
            </div>
          </div>

          {/* Ações */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Link
              href="/app/visagismo/resultado"
              style={{
                display: 'block', width: '100%', padding: '14px',
                borderRadius: 14, backgroundColor: '#1B5E5A',
                color: '#fff', fontSize: 16, fontWeight: 700,
                textAlign: 'center', textDecoration: 'none',
              }}
            >
              Ver relatório completo
            </Link>

            <PremiumGate
              isPremium={premium}
              feature="VISAGISMO_REFAZER"
              creditCost={CREDIT_COSTS.VISAGISMO_REFAZER}
              label="Refazer análise"
              description="Refaça sua análise com uma nova foto. Custa 5 créditos Premium."
            >
              <Link
                href="/app/visagismo/upload?force=true"
                style={{
                  display: 'block', width: '100%', padding: '14px',
                  borderRadius: 14, border: '1.5px solid #1B5E5A',
                  color: '#1B5E5A', fontSize: 16, fontWeight: 700,
                  textAlign: 'center', textDecoration: 'none', backgroundColor: '#fff',
                }}
              >
                Refazer análise
              </Link>
            </PremiumGate>
          </div>

          {/* Minhas gerações */}
          {geracoes.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p style={{ fontWeight: 700, fontSize: 13, color: '#555', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Minhas gerações
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {geracoes.map((g) => (
                  <Link
                    key={g.id}
                    href={`/app/visagismo/resultado-imagem/${g.id}`}
                    style={{ display: 'block', borderRadius: 12, overflow: 'hidden', textDecoration: 'none' }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={g.foto_gerada_url}
                      alt={g.batom_nome ?? 'Look gerado'}
                      style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }}
                    />
                  </Link>
                ))}
              </div>
            </div>
          )}

        </main>
      </PageContainer>
      </PageTransition>
    )
  }

  // Tela de instrução (sem análise)
  return (
    <PageTransition>
    <PageContainer>
      <AppHeader actions={<LogoutButton />} />
      <main className="flex flex-col px-5 py-6 gap-6">

        <div className="flex flex-col gap-1">
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 28, color: 'var(--foreground)', lineHeight: 1.2, letterSpacing: '-0.01em' }}>
            Visagismo
          </h1>
          <p className="text-gray-500" style={{ fontSize: 14 }}>
            Descubra o que te valoriza
          </p>
        </div>

        {/* O que será analisado */}
        <div
          style={{
            backgroundColor: '#fff', borderRadius: 20,
            padding: '20px', border: '1.5px solid #E8E8E8',
          }}
        >
          <p className="font-bold text-gray-700" style={{ fontSize: 14, marginBottom: 16 }}>
            Sua análise completa vai incluir:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { icon: '💎', label: 'Formato do seu rosto e terço dominante' },
              { icon: '🎨', label: 'Colorimetria pessoal e estação' },
              { icon: '🎭', label: 'Paleta de cores ideais para você' },
              { icon: '💄', label: 'Tons de batom, sombra e blush' },
              { icon: '✂️', label: 'Cortes de cabelo que te valorizam' },
              { icon: '✦', label: 'Relatório completo com dica especial' },
            ].map(({ icon, label }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span
                  style={{
                    width: 36, height: 36, borderRadius: 10,
                    backgroundColor: '#E8F5F4', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    fontSize: 18, flexShrink: 0,
                  }}
                >
                  {icon}
                </span>
                <p style={{ fontSize: 14, color: '#444' }}>{label}</p>
              </div>
            ))}
          </div>
        </div>

        <Link
          href="/app/visagismo/upload"
          style={{
            display: 'block', width: '100%', padding: '16px',
            borderRadius: 14, backgroundColor: '#1B5E5A',
            color: '#fff', fontSize: 16, fontWeight: 700,
            textAlign: 'center', textDecoration: 'none',
          }}
        >
          Começar análise ✦
        </Link>

      </main>
    </PageContainer>
    </PageTransition>
  )
}

// Componente principal: resolve userId antes de renderizar o conteúdo
export default function VisagismoPage() {
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user?.id ?? null)
    })()
  }, [])

  if (!userId) {
    return (
      <PageTransition>
      <PageContainer>
        <AppHeader actions={<LogoutButton />} />
        <main className="flex flex-col px-5 py-6 gap-5">
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 28, color: 'var(--foreground)', lineHeight: 1.2, letterSpacing: '-0.01em' }}>
            Visagismo
          </h1>
          <SkeletonList count={2} height={96} />
        </main>
      </PageContainer>
      </PageTransition>
    )
  }

  return <VisagismoContent userId={userId} />
}
