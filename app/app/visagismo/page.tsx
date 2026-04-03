'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
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
import Button from '@/components/ui/Button'
import { Gem, Palette, Theater, Scissors, ChevronRight, RefreshCw } from 'lucide-react'

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

// Ícones para cada feature
const FEATURES = [
  { Icon: Gem,     label: 'Formato do rosto e terço dominante' },
  { Icon: Palette, label: 'Colorimetria pessoal e estação' },
  { Icon: Theater, label: 'Paleta de cores ideais para você' },
  { Icon: Palette, label: 'Tons de batom, sombra e blush' },
  { Icon: Scissors,label: 'Cortes de cabelo que te valorizam' },
  { Icon: Gem,     label: 'Relatório completo com dica especial' },
]

function VisagismoContent({ userId }: { userId: string }) {
  const supabase = createClient()
  const [premium, setPremium] = useState(false)
  const [geracoes, setGeracoes] = useState<GeracaoVisagismo[]>([])

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

  const analiseFetcher = useCallback(async (): Promise<AnaliseFacial | null> => {
    const { data } = await supabase
      .from('analise_facial')
      .select('*')
      .eq('usuario_id', userId)
      .eq('mes_referencia', mesAtual())
      .maybeSingle()
    return (data ?? null) as AnaliseFacial | null
  }, [userId]) // eslint-disable-line react-hooks/exhaustive-deps

  const { data: analise, loading } = useCache<AnaliseFacial | null>(
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
            <h1 className="text-page-title">Visagismo</h1>
            <SkeletonList count={2} height={96} />
          </main>
        </PageContainer>
      </PageTransition>
    )
  }

  // ─── Com análise existente ────────────────────────────────────────
  if (analise) {
    return (
      <PageTransition>
        <PageContainer>
          <AppHeader actions={<LogoutButton />} />
          <main className="flex flex-col px-5 py-6 gap-5">

            <h1 className="text-page-title">Visagismo</h1>

            {/* Card résumé — pink gradient */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="relative overflow-hidden rounded-2xl"
              style={{
                background: 'linear-gradient(135deg, #FF3366 0%, #C41A4A 100%)',
                padding: '24px 20px',
                boxShadow: '0 6px 24px rgba(255,51,102,0.25)',
              }}
            >
              {/* Decoração */}
              <div style={{
                position: 'absolute', top: -40, right: -30, width: 140, height: 140,
                borderRadius: '50%', background: 'rgba(255,255,255,0.07)',
              }} />

              {/* Avatar */}
              {analise.foto_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={analise.foto_url}
                  alt="Sua foto"
                  style={{
                    width: 52, height: 52, borderRadius: '50%',
                    objectFit: 'cover', border: '2px solid rgba(255,255,255,0.4)',
                    marginBottom: 14, display: 'block',
                  }}
                />
              )}

              <div className="flex items-center justify-between mb-3">
                <span style={{
                  display: 'inline-block', fontSize: 10, fontWeight: 700,
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  background: 'rgba(255,255,255,0.2)', borderRadius: 6, padding: '3px 8px',
                  color: '#fff',
                }}>
                  Análise de {nomeMes(analise.mes_referencia)}
                </span>
                {loading && (
                  <RefreshCw size={14} color="rgba(255,255,255,0.6)"
                    style={{ animation: 'spin 1s linear infinite' }} />
                )}
              </div>

              <p style={{
                fontFamily: 'var(--font-display)', fontWeight: 700,
                fontSize: 24, color: '#fff', lineHeight: 1.2, marginBottom: 12,
              }}>
                {capitalizarEstacao(analise.estacao ?? '')}
              </p>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {analise.subtom && (
                  <span style={{
                    background: 'rgba(255,255,255,0.2)', borderRadius: 20,
                    padding: '4px 12px', fontSize: 13, fontWeight: 600, color: '#fff',
                  }}>
                    {analise.subtom}
                  </span>
                )}
                {analise.formato_rosto && (
                  <span style={{
                    background: 'rgba(255,255,255,0.2)', borderRadius: 20,
                    padding: '4px 12px', fontSize: 13, fontWeight: 600, color: '#fff',
                  }}>
                    rosto {analise.formato_rosto}
                  </span>
                )}
              </div>
            </motion.div>

            {/* Ações */}
            <div className="flex flex-col gap-3">
              <Link href="/app/visagismo/resultado" className="block">
                <Button variant="primary" fullWidth size="lg">
                  Ver relatório completo
                </Button>
              </Link>

              <PremiumGate
                isPremium={premium}
                feature="VISAGISMO_REFAZER"
                creditCost={CREDIT_COSTS.VISAGISMO_REFAZER}
                label="Refazer análise"
                description="Refaça sua análise com uma nova foto. Custa 5 créditos Premium."
              >
                <Link href="/app/visagismo/upload?force=true" className="block">
                  <Button variant="outline" fullWidth size="lg">
                    Refazer análise
                  </Button>
                </Link>
              </PremiumGate>
            </div>

            {/* Minhas gerações */}
            {geracoes.length > 0 && (
              <section className="flex flex-col gap-3">
                <h2 className="text-label">Minhas gerações</h2>
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
              </section>
            )}

          </main>
        </PageContainer>
      </PageTransition>
    )
  }

  // ─── Sem análise — instrução de início ──────────────────────────
  return (
    <PageTransition>
      <PageContainer>
        <AppHeader actions={<LogoutButton />} />
        <main className="flex flex-col px-5 py-6 gap-5">

          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <h1 className="text-page-title">Visagismo</h1>
            <p className="text-caption mt-1">Descubra o que te valoriza</p>
          </motion.div>

          {/* Features card */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.08 }}
            className="rounded-2xl"
            style={{
              background: '#fff',
              border: '1.5px solid rgba(0,0,0,0.06)',
              padding: '20px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
            }}
          >
            <p className="text-label mb-4" style={{ color: 'var(--foreground-muted)' }}>
              Sua análise completa vai incluir:
            </p>
            <div className="flex flex-col gap-3">
              {FEATURES.map(({ Icon, label }, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div
                    className="flex-shrink-0 flex items-center justify-center rounded-xl"
                    style={{ width: 38, height: 38, background: 'rgba(255,51,102,0.08)' }}
                  >
                    <Icon size={17} color="var(--color-primary)" />
                  </div>
                  <p style={{ fontSize: 14, color: 'var(--foreground)', margin: 0 }}>{label}</p>
                  <ChevronRight size={14} color="var(--foreground-muted)" style={{ marginLeft: 'auto', flexShrink: 0 }} />
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1], delay: 0.16 }}
          >
            <Link href="/app/visagismo/upload" className="block">
              <Button variant="primary" fullWidth size="lg">
                Começar análise ✦
              </Button>
            </Link>
          </motion.div>

        </main>
      </PageContainer>
    </PageTransition>
  )
}

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
            <h1 className="text-page-title">Visagismo</h1>
            <SkeletonList count={2} height={96} />
          </main>
        </PageContainer>
      </PageTransition>
    )
  }

  return <VisagismoContent userId={userId} />
}
