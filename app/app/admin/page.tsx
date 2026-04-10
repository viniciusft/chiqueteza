'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { RefreshCw, ExternalLink } from 'lucide-react'
import AppHeader from '@/components/ui/AppHeader'
import PageContainer from '@/components/ui/PageContainer'
import { PageTransition } from '@/components/ui/PageTransition'
import { FeatureCard } from './_components/FeatureCard'
import { MetricCard } from './_components/MetricCard'
import { EnvHealth } from './_components/EnvHealth'
import { FEATURES, STATS_META } from './_data/features'
import type { FeatureStatus } from './_data/features'

interface HealthData {
  env: Record<string, boolean>
  stats: Record<string, number | null>
  timestamp: string
}

const STATUS_ORDER: FeatureStatus[] = ['bloqueado', 'parcial', 'dev', 'ok']

const LINKS_RAPIDOS = [
  { label: 'Setup OAuth ML',   url: '/api/ml/setup',                                             desc: 'Obter ML_REFRESH_TOKEN (autenticação com ML)' },
  { label: 'Vercel',           url: 'https://vercel.com/dashboard',                              desc: 'Env vars · Deploys · Logs de erros' },
  { label: 'Supabase Studio',  url: 'https://supabase.com/dashboard/project/zzrlrrzdusrtkkyvtirm', desc: 'Banco de dados · Storage · Usuárias' },
  { label: 'Inngest',          url: 'https://app.inngest.com',                                   desc: 'Jobs agendados · Histórico de execuções' },
  { label: 'Portal ML Dev',    url: 'https://developers.mercadolivre.com.br',                    desc: 'Configurar app OAuth do Mercado Livre' },
]

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      margin: '0 0 10px',
      fontSize: 11, fontWeight: 800, color: '#A3A3A3',
      fontFamily: 'var(--font-body)', textTransform: 'uppercase', letterSpacing: '0.08em',
    }}>
      {children}
    </p>
  )
}

export default function AdminPage() {
  const [data, setData] = useState<HealthData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  async function fetchHealth(isRefresh = false) {
    if (isRefresh) setRefreshing(true)
    try {
      const res = await fetch('/api/admin/health', { cache: 'no-store' })
      if (res.ok) setData(await res.json())
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { fetchHealth() }, [])

  const env = data?.env ?? {}
  const stats = data?.stats ?? {}

  // Saúde geral
  const featuresAtivas = FEATURES.filter(f => !f.isRoadmap)
  const featuresOk = featuresAtivas.filter(f => f.status(env) === 'ok').length
  const totalFeatures = featuresAtivas.length
  const todasOk = featuresOk === totalFeatures

  // Ordena features por urgência
  const featuresSorted = [...FEATURES].sort((a, b) => {
    const sa = loading ? 2 : STATUS_ORDER.indexOf(a.status(env))
    const sb = loading ? 2 : STATUS_ORDER.indexOf(b.status(env))
    return sa - sb
  })

  const formatTs = (ts: string) =>
    new Date(ts).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })

  return (
    <PageTransition>
      <AppHeader />
      <PageContainer>
        <div style={{ paddingTop: 8, paddingBottom: 90 }}>

          {/* Cabeçalho */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <p style={{ margin: 0, fontSize: 22, fontWeight: 800, color: 'var(--foreground)', fontFamily: 'var(--font-body)', letterSpacing: '-0.01em' }}>
                Central de Controle
              </p>
              <p style={{ margin: '3px 0 0', fontSize: 12, color: '#A3A3A3', fontFamily: 'var(--font-body)' }}>
                {loading
                  ? 'Carregando...'
                  : todasOk
                  ? `✅ App saudável — ${featuresOk}/${totalFeatures} features ativas`
                  : `⚠ ${totalFeatures - featuresOk} feature(s) precisam de atenção`}
              </p>
              {data && (
                <p style={{ margin: '1px 0 0', fontSize: 10, color: '#C0C0C0', fontFamily: 'var(--font-body)' }}>
                  Atualizado em {formatTs(data.timestamp)}
                </p>
              )}
            </div>
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={() => fetchHealth(true)}
              disabled={refreshing}
              style={{
                width: 38, height: 38, borderRadius: 12, flexShrink: 0,
                border: '1.5px solid #E8E8E8', background: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <RefreshCw
                size={16} color="#767676"
                style={{ animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }}
              />
            </motion.button>
          </div>

          {/* Features do App */}
          <SectionTitle>Features do App</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
            {featuresSorted.map(f => (
              <FeatureCard key={f.id} feature={f} env={env} loading={loading} />
            ))}
          </div>

          {/* Métricas */}
          <SectionTitle>Dados e Métricas</SectionTitle>
          <p style={{ margin: '-4px 0 12px', fontSize: 12, color: '#A3A3A3', fontFamily: 'var(--font-body)' }}>
            Toque em cada card para entender o que o número representa.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 28 }}>
            {Object.entries(STATS_META).map(([key, meta]) => (
              <MetricCard
                key={key}
                metaKey={key}
                meta={meta}
                valor={stats[key] ?? null}
                loading={loading}
              />
            ))}
          </div>

          {/* Saúde das Env Vars */}
          <SectionTitle>Configurações Técnicas</SectionTitle>
          <p style={{ margin: '-4px 0 12px', fontSize: 12, color: '#A3A3A3', fontFamily: 'var(--font-body)' }}>
            Chaves e senhas que o app precisa para funcionar. Toque para expandir.
          </p>
          <div style={{ marginBottom: 28 }}>
            <EnvHealth env={env} loading={loading} />
          </div>

          {/* Links rápidos */}
          <SectionTitle>Links Rápidos</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {LINKS_RAPIDOS.map(({ label, url, desc }) => (
              <motion.a
                key={url}
                href={url}
                target={url.startsWith('http') ? '_blank' : undefined}
                rel={url.startsWith('http') ? 'noopener noreferrer' : undefined}
                whileTap={{ scale: 0.98 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  background: '#fff', borderRadius: 14,
                  border: '1.5px solid #F0F0F0', padding: '12px 14px',
                  textDecoration: 'none',
                }}
              >
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#1B5E5A', fontFamily: 'var(--font-body)' }}>
                    {label}
                  </p>
                  <p style={{ margin: '1px 0 0', fontSize: 11, color: '#A3A3A3', fontFamily: 'var(--font-body)' }}>
                    {desc}
                  </p>
                </div>
                <ExternalLink size={14} color="#C0C0C0" />
              </motion.a>
            ))}
          </div>

        </div>
      </PageContainer>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </PageTransition>
  )
}
