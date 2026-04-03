'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import AppHeader from '@/components/ui/AppHeader'
import PageContainer from '@/components/ui/PageContainer'
import LogoutButton from '../LogoutButton'
import AgendamentoCard from './_components/AgendamentoCard'
import RotinaSeedFAB from './_components/RotinaSeedFAB'
import { PageTransition } from '@/components/ui/PageTransition'
import { PullToRefresh } from '@/components/ui/PullToRefresh'
import { SkeletonList } from '@/components/ui/SkeletonCard'
import { useCache } from '@/lib/cache/useCache'
import { CACHE_KEYS } from '@/lib/cache/keys'
import EmptyState from '@/components/ui/EmptyState'
import { AlertTriangle, TrendingUp } from 'lucide-react'

function diasAtraso(ultimoProcedimento: string, frequenciaDias: number): number {
  const ultimo = new Date(ultimoProcedimento)
  const hoje = new Date()
  const diffMs = hoje.getTime() - ultimo.getTime()
  const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  return diffDias - frequenciaDias
}

function inicioDoMes(): string {
  const hoje = new Date()
  return new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString()
}

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  concluido: { label: 'Realizado', color: '#1B5E5A', bg: 'rgba(27,94,90,0.08)' },
  cancelado: { label: 'Cancelado', color: '#9ca3af', bg: 'rgba(156,163,175,0.10)' },
  agendado:  { label: 'Agendado',  color: '#FF3366', bg: 'rgba(255,51,102,0.08)' },
}

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
  observacoes: string | null
  foto_resultado_url: string | null
  profissional: { nome: string; telefone: string | null } | null
}

function RotinaContent({ userId }: { userId: string }) {
  const supabase = createClient()
  const [servicos, setServicos] = useState<ServicoBeleza[]>([])
  const [gastosMes, setGastosMes] = useState<number>(0)
  const [historico, setHistorico] = useState<Agendamento[]>([])

  useEffect(() => {
    void (async () => {
      const mes = inicioDoMes()
      const [{ data: sv }, { data: gm }, { data: hist }] = await Promise.all([
        supabase
          .from('servicos_beleza')
          .select('*')
          .eq('usuario_id', userId)
          .eq('lembrete_ativo', true)
          .not('ultimo_procedimento', 'is', null),
        supabase
          .from('agendamentos_rotina')
          .select('valor')
          .eq('usuario_id', userId)
          .eq('status', 'concluido')
          .gte('data_hora', mes),
        supabase
          .from('agendamentos_rotina')
          .select('*, profissional:profissionais(nome, telefone)')
          .eq('usuario_id', userId)
          .in('status', ['concluido', 'cancelado'])
          .order('data_hora', { ascending: false })
          .limit(10),
      ])
      setServicos((sv ?? []) as ServicoBeleza[])
      setGastosMes(((gm ?? []) as { valor: number | null }[]).reduce((acc, g) => acc + (Number(g.valor) || 0), 0))
      setHistorico((hist ?? []) as Agendamento[])
    })()
  }, [userId]) // eslint-disable-line react-hooks/exhaustive-deps

  const agendamentosFetcher = useCallback(async (): Promise<Agendamento[]> => {
    const { data } = await supabase
      .from('agendamentos_rotina')
      .select('*, profissional:profissionais(nome, telefone)')
      .eq('usuario_id', userId)
      .eq('status', 'agendado')
      .gte('data_hora', new Date().toISOString())
      .order('data_hora', { ascending: true })
      .limit(20)
    return (data ?? []) as Agendamento[]
  }, [userId]) // eslint-disable-line react-hooks/exhaustive-deps

  const {
    data: agendamentos,
    loading: loadingAgendamentos,
  } = useCache<Agendamento[]>(
    CACHE_KEYS.agendamentos(userId),
    agendamentosFetcher,
    CACHE_KEYS.AGENDAMENTOS_TTL
  )

  const alertas = servicos.filter(
    (s) => s.ultimo_procedimento && diasAtraso(s.ultimo_procedimento, s.frequencia_dias) > 0
  )

  const showSkeleton = loadingAgendamentos && agendamentos === null

  return (
    <PageTransition>
      <PullToRefresh>
        <PageContainer>
          <AppHeader actions={<LogoutButton />} />

          <main className="flex flex-col gap-5 px-5 py-6 pb-24">

            <h1 className="text-page-title">Rotina</h1>

            {/* Alertas */}
            {alertas.length > 0 && (
              <section className="flex flex-col gap-2">
                <h2 className="text-label">Atenção</h2>
                {alertas.map((s) => {
                  const atraso = diasAtraso(s.ultimo_procedimento, s.frequencia_dias)
                  const critico = atraso > 7
                  return (
                    <div
                      key={s.id}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl"
                      style={{
                        background: critico ? 'rgba(255,51,102,0.06)' : 'rgba(212,168,67,0.07)',
                        border: `1.5px solid ${critico ? 'rgba(255,51,102,0.25)' : 'rgba(212,168,67,0.3)'}`,
                      }}
                    >
                      <div
                        className="flex items-center justify-center rounded-full flex-shrink-0"
                        style={{
                          width: 32, height: 32,
                          background: critico ? 'rgba(255,51,102,0.10)' : 'rgba(212,168,67,0.15)',
                        }}
                      >
                        <AlertTriangle size={15} color={critico ? 'var(--color-primary)' : '#D4A843'} />
                      </div>
                      <div>
                        <p className="text-card-title">{s.nome}</p>
                        <p style={{
                          fontSize: 12, fontWeight: 600,
                          color: critico ? 'var(--color-primary)' : '#D4A843',
                        }}>
                          {atraso} {atraso === 1 ? 'dia' : 'dias'} em atraso
                        </p>
                      </div>
                    </div>
                  )
                })}
              </section>
            )}

            {/* Próximos agendamentos */}
            <section className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <h2 className="text-label">Próximos agendamentos</h2>
              </div>
              {showSkeleton ? (
                <SkeletonList count={3} height={76} />
              ) : (agendamentos ?? []).length === 0 ? (
                <EmptyState
                  emoji="📅"
                  titulo="Agenda livre!"
                  descricao="Nenhum agendamento futuro. Que tal marcar seu próximo horário?"
                />
              ) : (
                (agendamentos ?? []).map((ag) => (
                  <AgendamentoCard key={ag.id} agendamento={ag} />
                ))
              )}
            </section>

            {/* Gasto este mês */}
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.15 }}
              className="flex items-center justify-between px-4 py-4 rounded-2xl"
              style={{
                background: 'linear-gradient(135deg, rgba(27,94,90,0.06) 0%, rgba(27,94,90,0.03) 100%)',
                border: '1.5px solid rgba(27,94,90,0.15)',
              }}
            >
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center rounded-xl"
                  style={{ width: 36, height: 36, background: 'rgba(27,94,90,0.10)' }}>
                  <TrendingUp size={16} color="#1B5E5A" />
                </div>
                <span className="text-card-title" style={{ color: 'var(--foreground-muted)' }}>
                  Gasto este mês
                </span>
              </div>
              <span style={{
                fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700,
                color: '#1B5E5A',
              }}>
                {gastosMes.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
            </motion.div>

            {/* Histórico */}
            {historico.length > 0 && (
              <section className="flex flex-col gap-2">
                <h2 className="text-label">Histórico</h2>
                {historico.map((ag) => {
                  const cfg = statusConfig[ag.status] ?? statusConfig.agendado
                  const dataFmt = new Date(ag.data_hora).toLocaleDateString('pt-BR', {
                    day: 'numeric', month: 'short', year: 'numeric',
                  })
                  return (
                    <div
                      key={ag.id}
                      className="flex items-center justify-between px-4 py-3 rounded-xl"
                      style={{ border: '1.5px solid var(--color-silver)', backgroundColor: 'var(--surface)' }}
                    >
                      <div className="flex flex-col gap-0.5 flex-1 min-w-0 pr-2">
                        <p className="text-card-title truncate">{ag.servico_nome}</p>
                        <p className="text-caption">
                          {dataFmt}
                          {ag.profissional?.nome ? ` · ${ag.profissional.nome}` : ''}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span
                          style={{
                            fontSize: 10, fontWeight: 700, letterSpacing: '0.04em',
                            textTransform: 'uppercase',
                            color: cfg.color,
                            background: cfg.bg,
                            borderRadius: 6, padding: '2px 8px',
                          }}
                        >
                          {cfg.label}
                        </span>
                        {ag.valor && (
                          <span className="text-caption">
                            {Number(ag.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </section>
            )}

          </main>

          <RotinaSeedFAB />
        </PageContainer>
      </PullToRefresh>
    </PageTransition>
  )
}

export default function RotinaPage() {
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
          <main className="flex flex-col gap-5 px-5 py-6 pb-24">
            <h1 className="text-page-title">Rotina</h1>
            <SkeletonList count={3} height={76} />
          </main>
        </PageContainer>
      </PageTransition>
    )
  }

  return <RotinaContent userId={userId} />
}
