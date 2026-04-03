'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import AppHeader from '@/components/ui/AppHeader'
import PageContainer from '@/components/ui/PageContainer'
import LogoutButton from './LogoutButton'
import { PageTransition } from '@/components/ui/PageTransition'
import { SkeletonList, SkeletonAppointment, SkeletonAlert } from '@/components/ui/SkeletonCard'
import { StaggerList, StaggerItem } from '@/components/ui/StaggerList'
import { setCache } from '@/lib/cache'
import { CACHE_KEYS } from '@/lib/cache/keys'
import { Sparkles, CalendarDays, Users, AlertTriangle, MessageCircle } from 'lucide-react'

// ─── Helpers ─────────────────────────────────────────────────────────

function diasAtraso(ultimoProcedimento: string, frequenciaDias: number): number {
  const ultimo = new Date(ultimoProcedimento)
  const hoje = new Date()
  const diffMs = hoje.getTime() - ultimo.getTime()
  const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  return diffDias - frequenciaDias
}

// ─── Types ────────────────────────────────────────────────────────────

interface ServicoBeleza {
  id: string
  nome: string
  ultimo_procedimento: string
  frequencia_dias: number
  lembrete_ativo: boolean
}

interface Agendamento {
  id: string
  servico_nome: string
  data_hora: string
  status: string
  valor: number | null
  profissional: { nome: string; telefone: string | null } | null
}

interface HomeData {
  nome: string
  proximo: Agendamento | null
  alertas: ServicoBeleza[]
}

// ─── Quick action pill ───────────────────────────────────────────────

function QuickAction({ href, icon, label, accent }: { href: string; icon: React.ReactNode; label: string; accent: string }) {
  return (
    <Link href={href} className="flex flex-col items-center gap-2 flex-1 no-underline">
      <motion.div
        whileTap={{ scale: 0.90 }}
        transition={{ type: 'spring', stiffness: 500, damping: 25 }}
        className="flex items-center justify-center rounded-2xl"
        style={{ width: 56, height: 56, background: accent }}
      >
        {icon}
      </motion.div>
      <span style={{
        fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600,
        color: 'var(--foreground-muted)', textAlign: 'center', lineHeight: 1.2,
      }}>
        {label}
      </span>
    </Link>
  )
}

// ─── Próximo agendamento card ─────────────────────────────────────────

function ProximoAgendamento({ proximo }: { proximo: Agendamento }) {
  const waTelefone = proximo.profissional?.telefone
    ? proximo.profissional.telefone.replace(/\D/g, '')
    : null

  const dataFormatada = new Date(proximo.data_hora).toLocaleDateString('pt-BR', {
    weekday: 'short', day: 'numeric', month: 'short',
  })
  const horaFormatada = new Date(proximo.data_hora).toLocaleTimeString('pt-BR', {
    hour: '2-digit', minute: '2-digit',
  })

  return (
    <div
      className="flex items-center gap-3 px-4 py-4 rounded-2xl"
      style={{
        background: 'linear-gradient(135deg, #fff 0%, rgba(255,51,102,0.03) 100%)',
        border: '1.5px solid rgba(255,51,102,0.15)',
        boxShadow: '0 2px 12px rgba(255,51,102,0.08)',
      }}
    >
      {/* Ícone */}
      <div
        className="flex items-center justify-center rounded-xl flex-shrink-0"
        style={{ width: 48, height: 48, background: 'rgba(255,51,102,0.08)' }}
      >
        <CalendarDays size={22} color="var(--color-primary)" />
      </div>

      <div className="flex-1 min-w-0">
        {/* Badge */}
        <span style={{
          display: 'inline-block',
          fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase',
          color: 'var(--color-primary)',
          background: 'rgba(255,51,102,0.08)',
          borderRadius: 4, padding: '2px 7px', marginBottom: 4,
        }}>
          Próximo
        </span>
        <p className="text-card-title truncate">{proximo.servico_nome}</p>
        {proximo.profissional?.nome && (
          <p className="text-caption truncate">{proximo.profissional.nome}</p>
        )}
        <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-secondary)', marginTop: 2 }}>
          {dataFormatada} · {horaFormatada}
        </p>
      </div>

      {waTelefone && (
        <a
          href={`https://wa.me/55${waTelefone}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="flex items-center justify-center rounded-xl flex-shrink-0"
          style={{ width: 36, height: 36, background: '#25D366', textDecoration: 'none' }}
        >
          <MessageCircle size={17} color="#fff" />
        </a>
      )}
    </div>
  )
}

// ─── Alert card ───────────────────────────────────────────────────────

function AlertCard({ servico }: { servico: ServicoBeleza }) {
  const atraso = diasAtraso(servico.ultimo_procedimento, servico.frequencia_dias)
  const critico = atraso > 7

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-xl"
      style={{
        background: critico ? 'rgba(255,51,102,0.06)' : 'rgba(212,168,67,0.07)',
        border: `1.5px solid ${critico ? 'rgba(255,51,102,0.25)' : 'rgba(212,168,67,0.3)'}`,
      }}
    >
      <div
        className="flex items-center justify-center rounded-full flex-shrink-0"
        style={{ width: 32, height: 32, background: critico ? 'rgba(255,51,102,0.10)' : 'rgba(212,168,67,0.15)' }}
      >
        <AlertTriangle size={15} color={critico ? 'var(--color-primary)' : '#D4A843'} />
      </div>
      <div>
        <p className="text-card-title">{servico.nome}</p>
        <p style={{ fontSize: 12, color: critico ? 'var(--color-primary)' : '#D4A843', fontWeight: 600 }}>
          {atraso} {atraso === 1 ? 'dia' : 'dias'} em atraso
        </p>
      </div>
    </div>
  )
}

// ─── Hero saudação ───────────────────────────────────────────────────

function HeroGreeting({ nome }: { nome: string }) {
  const hora = new Date().getHours()
  const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite'

  return (
    <div
      className="relative overflow-hidden rounded-2xl px-5 py-5"
      style={{
        background: 'linear-gradient(135deg, #FF3366 0%, #C41A4A 100%)',
        boxShadow: '0 6px 20px rgba(255,51,102,0.25)',
      }}
    >
      {/* Círculo decorativo */}
      <div style={{
        position: 'absolute', top: -40, right: -30, width: 120, height: 120,
        borderRadius: '50%', background: 'rgba(255,255,255,0.08)',
      }} />
      <div style={{
        position: 'absolute', bottom: -20, right: 40, width: 70, height: 70,
        borderRadius: '50%', background: 'rgba(249,213,110,0.12)',
      }} />

      <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(255,255,255,0.75)', margin: 0 }}>
        {saudacao},
      </p>
      <h1 style={{
        fontFamily: 'var(--font-display)', fontWeight: 700,
        fontSize: 26, color: '#fff', lineHeight: 1.15, margin: '2px 0 0',
      }}>
        {nome} <span style={{ color: '#F9D56E' }}>✦</span>
      </h1>
    </div>
  )
}

// ─── HomeContent ──────────────────────────────────────────────────────

function HomeContent({ userId, nome: nomeInicial }: { userId: string; nome: string }) {
  const supabase = createClient()
  const [homeData, setHomeData] = useState<HomeData>({
    nome: nomeInicial,
    proximo: null,
    alertas: [],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void (async () => {
      const [{ data: proximos }, { data: servicos }] = await Promise.all([
        supabase
          .from('agendamentos_rotina')
          .select('*, profissional:profissionais(nome, telefone)')
          .eq('usuario_id', userId)
          .eq('status', 'agendado')
          .gte('data_hora', new Date().toISOString())
          .order('data_hora', { ascending: true })
          .limit(1),
        supabase
          .from('servicos_beleza')
          .select('*')
          .eq('usuario_id', userId)
          .eq('lembrete_ativo', true)
          .not('ultimo_procedimento', 'is', null),
      ])
      const proximo = ((proximos ?? []) as Agendamento[])[0] ?? null
      const alertas = ((servicos ?? []) as ServicoBeleza[]).filter(
        (s) => s.ultimo_procedimento && diasAtraso(s.ultimo_procedimento, s.frequencia_dias) > 0
      )
      setHomeData({ nome: nomeInicial, proximo, alertas })
      setLoading(false)
    })()

    setTimeout(async () => {
      const { data: prefetchData } = await supabase
        .from('agendamentos_rotina')
        .select('id, servico_nome, data_hora, status, valor, profissional:profissionais(nome, telefone)')
        .eq('usuario_id', userId)
        .eq('status', 'agendado')
        .gte('data_hora', new Date().toISOString())
        .order('data_hora', { ascending: true })
        .limit(20)
      if (prefetchData) setCache(
        CACHE_KEYS.agendamentos(userId),
        prefetchData as Agendamento[],
        CACHE_KEYS.AGENDAMENTOS_TTL
      )
    }, 1000)
  }, [userId]) // eslint-disable-line react-hooks/exhaustive-deps

  const { nome, proximo, alertas } = homeData
  const tudoEmDia = !loading && !proximo && alertas.length === 0

  return (
    <PageTransition>
      <PageContainer>
        <AppHeader actions={<LogoutButton />} />

        <main className="flex flex-col px-5 py-5 gap-5">

          {/* Hero saudação */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <HeroGreeting nome={nome} />
          </motion.div>

          {/* Quick actions */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.08 }}
            className="flex items-start justify-between gap-2"
          >
            <QuickAction
              href="/app/visagismo"
              icon={<Sparkles size={22} color="#FF3366" />}
              label="Visagismo"
              accent="rgba(255,51,102,0.10)"
            />
            <QuickAction
              href="/app/rotina/agendamentos/novo"
              icon={<CalendarDays size={22} color="#1B5E5A" />}
              label="Agendar"
              accent="rgba(27,94,90,0.10)"
            />
            <QuickAction
              href="/app/profissionais"
              icon={<Users size={22} color="#D4A843" />}
              label="Profissionais"
              accent="rgba(212,168,67,0.12)"
            />
          </motion.div>

          {/* Loading */}
          {loading && (
            <div className="flex flex-col gap-3">
              <SkeletonAlert />
              <SkeletonAppointment />
            </div>
          )}

          {/* Tudo em dia */}
          {tudoEmDia && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 280, damping: 26, delay: 0.1 }}
              className="flex flex-col items-center gap-2 py-10 rounded-2xl"
              style={{
                background: 'linear-gradient(135deg, #FFF0F3 0%, #FFFBFC 60%, #FFF0F3 100%)',
                border: '1.5px solid rgba(255,51,102,0.12)',
              }}
            >
              <span style={{ fontSize: 42, lineHeight: 1 }}>✨</span>
              <p className="text-section-title">Você está em dia!</p>
              <p className="text-caption text-center" style={{ maxWidth: 220 }}>
                Nenhum alerta e nenhum agendamento próximo. Aproveite!
              </p>
            </motion.div>
          )}

          {/* Alertas */}
          {alertas.length > 0 && (
            <section className="flex flex-col gap-2">
              <h2 className="text-label">Atenção</h2>
              <StaggerList className="flex flex-col gap-2">
                {alertas.map((s) => (
                  <StaggerItem key={s.id}>
                    <AlertCard servico={s} />
                  </StaggerItem>
                ))}
              </StaggerList>
            </section>
          )}

          {/* Próximo agendamento */}
          {proximo && (
            <section className="flex flex-col gap-2">
              <h2 className="text-label">Próximo agendamento</h2>
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: 0.12 }}
              >
                <ProximoAgendamento proximo={proximo} />
              </motion.div>
            </section>
          )}

        </main>
      </PageContainer>
    </PageTransition>
  )
}

// ─── AppPage ──────────────────────────────────────────────────────────

export default function AppPage() {
  const [user, setUser] = useState<{ id: string; nome: string } | null>(null)

  useEffect(() => {
    const supabase = createClient()
    void (async () => {
      const { data: { user: u } } = await supabase.auth.getUser()
      if (u) {
        const nome = (u.user_metadata?.nome as string | undefined) ?? u.email?.split('@')[0] ?? 'usuária'
        setUser({ id: u.id, nome })
      }
    })()
  }, [])

  if (!user) {
    return (
      <PageTransition>
        <PageContainer>
          <AppHeader actions={<LogoutButton />} />
          <main className="flex flex-col px-5 py-5 gap-5">
            <div className="rounded-2xl" style={{ height: 100, background: 'linear-gradient(135deg, #FF3366, #C41A4A)', opacity: 0.15 }} />
            <SkeletonList count={2} height={80} />
          </main>
        </PageContainer>
      </PageTransition>
    )
  }

  return <HomeContent userId={user.id} nome={user.nome} />
}
