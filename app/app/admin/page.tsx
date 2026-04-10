'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  CheckCircle2, XCircle, AlertTriangle, RefreshCw,
  ShoppingBag, Package, Sparkles, Calendar,
  Users, Camera, Bell, ExternalLink, Activity,
  ChevronRight, Cpu,
} from 'lucide-react'
import AppHeader from '@/components/ui/AppHeader'
import PageContainer from '@/components/ui/PageContainer'
import { PageTransition } from '@/components/ui/PageTransition'

// ─── Types ────────────────────────────────────────────────────────────

interface HealthData {
  env: Record<string, boolean>
  stats: {
    wishlist: number | null
    armario: number | null
    analises: number | null
    agendamentos: number | null
    rotinas: number | null
    looks: number | null
    profissionais: number | null
    pushSubs: number | null
  }
  timestamp: string
}

// ─── Configuração das features ────────────────────────────────────────

const FEATURES = [
  {
    id: 'ml',
    nome: 'Mercado Livre — Busca',
    descricao: 'Busca de produtos, auto-match, deeplinks de afiliado',
    deps: ['ML_APP_ID', 'ML_APP_SECRET', 'ML_REFRESH_TOKEN'],
    setupUrl: '/api/ml/setup',
    setupLabel: 'Fazer setup OAuth',
    bloqueio: (env: Record<string, boolean>) =>
      !env.ML_REFRESH_TOKEN
        ? 'ML_REFRESH_TOKEN ausente — visite /api/ml/setup'
        : !env.ML_APP_ID || !env.ML_APP_SECRET
        ? 'ML_APP_ID ou ML_APP_SECRET ausente'
        : null,
  },
  {
    id: 'afiliado',
    nome: 'ML Afiliados',
    descricao: 'Deeplinks com rastreamento de comissão (matt_tool + matt_word)',
    deps: ['ML_AFFILIATE_TRACKING_ID', 'ML_AFFILIATE_WORD'],
    bloqueio: (env: Record<string, boolean>) =>
      !env.ML_AFFILIATE_TRACKING_ID ? 'ML_AFFILIATE_TRACKING_ID ausente (opcional)' : null,
  },
  {
    id: 'push',
    nome: 'Push Notifications',
    descricao: 'Alertas de reposição e queda de preço',
    deps: ['VAPID_PRIVATE_KEY'],
    bloqueio: (env: Record<string, boolean>) =>
      !env.VAPID_PRIVATE_KEY ? 'VAPID_PRIVATE_KEY ausente — gere com npx web-push generate-vapid-keys' : null,
  },
  {
    id: 'ai',
    nome: 'Visagismo (Gemini)',
    descricao: 'Análise facial, colorimetria, OCR de embalagem',
    deps: ['GEMINI_API_KEY'],
    bloqueio: (env: Record<string, boolean>) =>
      !env.GEMINI_API_KEY ? 'GEMINI_API_KEY ausente' : null,
  },
  {
    id: 'inngest',
    nome: 'Jobs Inngest',
    descricao: 'Verificação diária de preços + alertas de reposição',
    deps: ['INNGEST_EVENT_KEY', 'INNGEST_SIGNING_KEY'],
    bloqueio: (env: Record<string, boolean>) =>
      !env.INNGEST_EVENT_KEY ? 'INNGEST_EVENT_KEY ausente' : null,
  },
  {
    id: 'tryon',
    nome: 'Try-On de Maquiagem',
    descricao: 'Geração de look no rosto via IA (V2 — em desenvolvimento)',
    deps: ['FAL_KEY'],
    bloqueio: () => 'Em desenvolvimento — V2',
    isV2: true,
  },
]

const ENV_GRUPOS = [
  {
    label: 'Supabase',
    vars: ['SUPABASE_SERVICE_ROLE_KEY'],
  },
  {
    label: 'Mercado Livre',
    vars: ['ML_APP_ID', 'ML_APP_SECRET', 'ML_REFRESH_TOKEN', 'ML_AFFILIATE_TRACKING_ID', 'ML_AFFILIATE_WORD'],
  },
  {
    label: 'Inteligência Artificial',
    vars: ['GEMINI_API_KEY', 'FAL_KEY'],
  },
  {
    label: 'Push Notifications',
    vars: ['VAPID_PRIVATE_KEY'],
  },
  {
    label: 'Inngest (Jobs)',
    vars: ['INNGEST_EVENT_KEY', 'INNGEST_SIGNING_KEY'],
  },
]

const STATS_CONFIG = [
  { key: 'wishlist',      label: 'Wishlist',      icon: ShoppingBag, cor: '#F472A0' },
  { key: 'armario',       label: 'Armário',       icon: Package,     cor: '#1B5E5A' },
  { key: 'analises',      label: 'Visagismos',    icon: Sparkles,    cor: '#D4A843' },
  { key: 'agendamentos',  label: 'Agendamentos',  icon: Calendar,    cor: '#A8C5CC' },
  { key: 'rotinas',       label: 'Rotinas',       icon: Activity,    cor: '#1B5E5A' },
  { key: 'looks',         label: 'Looks Diário',  icon: Camera,      cor: '#F472A0' },
  { key: 'profissionais', label: 'Profissionais', icon: Users,       cor: '#D4A843' },
  { key: 'pushSubs',      label: 'Push Subs',     icon: Bell,        cor: '#A8C5CC' },
]

// ─── Componentes ──────────────────────────────────────────────────────

function StatusBadge({ ok, v2 }: { ok: boolean; v2?: boolean }) {
  if (v2) return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
      background: 'rgba(168,197,204,0.18)', color: '#5A95A3',
      border: '1px solid rgba(168,197,204,0.4)',
    }}>V2</span>
  )
  return ok ? (
    <CheckCircle2 size={18} color="#22C55E" />
  ) : (
    <XCircle size={18} color="#EF4444" />
  )
}

function EnvDot({ ok }: { ok: boolean }) {
  return (
    <span style={{
      display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
      background: ok ? '#22C55E' : '#EF4444', flexShrink: 0,
      boxShadow: ok ? '0 0 4px rgba(34,197,94,0.5)' : '0 0 4px rgba(239,68,68,0.5)',
    }} />
  )
}

// ─── Página ───────────────────────────────────────────────────────────

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

  const bloqueios = data
    ? FEATURES.filter(f => !f.isV2 && f.bloqueio(data.env))
    : []

  const formatTs = (ts: string) =>
    new Date(ts).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })

  return (
    <PageTransition>
      <AppHeader />
      <PageContainer>
        <div style={{ paddingTop: 8, paddingBottom: 90 }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <p style={{ margin: 0, fontSize: 22, fontWeight: 800, color: 'var(--foreground)', fontFamily: 'var(--font-body)', letterSpacing: '-0.01em' }}>
                Admin <Cpu size={20} style={{ verticalAlign: 'middle', marginLeft: 4 }} />
              </p>
              {data && (
                <p style={{ margin: '2px 0 0', fontSize: 11, color: '#A3A3A3', fontFamily: 'var(--font-body)' }}>
                  Atualizado em {formatTs(data.timestamp)}
                </p>
              )}
            </div>
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={() => fetchHealth(true)}
              disabled={refreshing}
              style={{
                width: 38, height: 38, borderRadius: 12,
                border: '1.5px solid #E8E8E8', background: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <RefreshCw size={16} color="#767676" style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            </motion.button>
          </div>

          {/* Alertas de bloqueio */}
          {!loading && bloqueios.length > 0 && (
            <div style={{ marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {bloqueios.map(f => {
                const msg = f.bloqueio(data!.env)
                return (
                  <motion.div
                    key={f.id}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      background: 'rgba(239,68,68,0.06)', border: '1.5px solid rgba(239,68,68,0.2)',
                      borderRadius: 14, padding: '12px 14px',
                      display: 'flex', alignItems: 'flex-start', gap: 10,
                    }}
                  >
                    <AlertTriangle size={16} color="#EF4444" style={{ flexShrink: 0, marginTop: 2 }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#EF4444', fontFamily: 'var(--font-body)' }}>
                        {f.nome}
                      </p>
                      <p style={{ margin: '2px 0 0', fontSize: 11, color: '#767676', fontFamily: 'var(--font-body)' }}>
                        {msg}
                      </p>
                    </div>
                    {f.setupUrl && (
                      <a href={f.setupUrl} style={{ flexShrink: 0 }}>
                        <ExternalLink size={14} color="#EF4444" />
                      </a>
                    )}
                  </motion.div>
                )
              })}
            </div>
          )}

          {/* Stats */}
          <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 700, color: '#A3A3A3', fontFamily: 'var(--font-body)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Dados do App
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
            {STATS_CONFIG.map(({ key, label, icon: Icon, cor }) => {
              const val = data?.stats[key as keyof typeof data.stats]
              return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: loading ? 0.4 : 1, scale: 1 }}
                  style={{
                    background: '#fff', borderRadius: 14,
                    border: '1.5px solid #F0F0F0',
                    padding: '14px 14px 12px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 8,
                      background: `${cor}18`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Icon size={14} color={cor} />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#A3A3A3', fontFamily: 'var(--font-body)' }}>
                      {label}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: 26, fontWeight: 800, color: 'var(--foreground)', fontFamily: 'var(--font-body)', lineHeight: 1 }}>
                    {loading ? '—' : (val ?? 0)}
                  </p>
                </motion.div>
              )
            })}
          </div>

          {/* Status das Features */}
          <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 700, color: '#A3A3A3', fontFamily: 'var(--font-body)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Status das Features
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
            {FEATURES.map(f => {
              const bloqueio = data ? f.bloqueio(data.env) : null
              const ok = !bloqueio
              return (
                <div
                  key={f.id}
                  style={{
                    background: '#fff', borderRadius: 14,
                    border: `1.5px solid ${ok && !f.isV2 ? 'rgba(34,197,94,0.2)' : f.isV2 ? 'rgba(168,197,204,0.3)' : 'rgba(239,68,68,0.2)'}`,
                    padding: '12px 14px',
                    display: 'flex', alignItems: 'flex-start', gap: 12,
                  }}
                >
                  <div style={{ marginTop: 2 }}>
                    <StatusBadge ok={ok} v2={f.isV2} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--foreground)', fontFamily: 'var(--font-body)' }}>
                      {f.nome}
                    </p>
                    <p style={{ margin: '2px 0 0', fontSize: 11, color: '#A3A3A3', fontFamily: 'var(--font-body)' }}>
                      {f.descricao}
                    </p>
                    {bloqueio && !f.isV2 && (
                      <p style={{ margin: '4px 0 0', fontSize: 11, color: '#EF4444', fontFamily: 'var(--font-body)', fontWeight: 600 }}>
                        ⚠ {bloqueio}
                      </p>
                    )}
                  </div>
                  {f.setupUrl && !ok && (
                    <a href={f.setupUrl} style={{ flexShrink: 0, color: '#1B5E5A', display: 'flex', alignItems: 'center' }}>
                      <ChevronRight size={16} />
                    </a>
                  )}
                </div>
              )
            })}
          </div>

          {/* Saúde das Env Vars */}
          <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 700, color: '#A3A3A3', fontFamily: 'var(--font-body)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Variáveis de Ambiente
          </p>
          <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #F0F0F0', overflow: 'hidden', marginBottom: 24 }}>
            {ENV_GRUPOS.map((grupo, gi) => (
              <div key={grupo.label}>
                {gi > 0 && <div style={{ height: 1, background: '#F5F5F5' }} />}
                <div style={{ padding: '10px 14px 4px' }}>
                  <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: '#C0C0C0', fontFamily: 'var(--font-body)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    {grupo.label}
                  </p>
                </div>
                {grupo.vars.map(varName => {
                  const ok = data?.env[varName] ?? false
                  return (
                    <div key={varName} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '8px 14px',
                    }}>
                      <EnvDot ok={loading ? false : ok} />
                      <span style={{ flex: 1, fontSize: 12, fontFamily: 'monospace', color: loading ? '#D0D0D0' : ok ? 'var(--foreground)' : '#EF4444', fontWeight: ok ? 400 : 600 }}>
                        {varName}
                      </span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: loading ? '#D0D0D0' : ok ? '#22C55E' : '#EF4444', fontFamily: 'var(--font-body)' }}>
                        {loading ? '...' : ok ? 'OK' : 'FALTA'}
                      </span>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>

          {/* Links rápidos */}
          <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 700, color: '#A3A3A3', fontFamily: 'var(--font-body)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Links Rápidos
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { label: 'Setup OAuth ML', url: '/api/ml/setup', desc: 'Obter ML_REFRESH_TOKEN' },
              { label: 'Vercel Dashboard', url: 'https://vercel.com/dashboard', desc: 'Env vars + deploys + logs' },
              { label: 'Supabase Studio', url: 'https://supabase.com/dashboard/project/zzrlrrzdusrtkkyvtirm', desc: 'Banco de dados + storage + logs' },
              { label: 'Inngest Dashboard', url: 'https://app.inngest.com', desc: 'Jobs agendados + histórico' },
              { label: 'ML Developers', url: 'https://developers.mercadolivre.com.br', desc: 'Configurar app OAuth' },
            ].map(({ label, url, desc }) => (
              <motion.a
                key={url}
                href={url}
                target={url.startsWith('http') ? '_blank' : undefined}
                rel={url.startsWith('http') ? 'noopener noreferrer' : undefined}
                whileTap={{ scale: 0.98 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  background: '#fff', borderRadius: 14,
                  border: '1.5px solid #F0F0F0',
                  padding: '12px 14px',
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
                <ExternalLink size={14} color="#A3A3A3" />
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
