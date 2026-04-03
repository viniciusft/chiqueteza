'use client'

import { useState, useEffect, useCallback } from 'react'
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
  concluido: { label: 'Realizado', color: '#1B5E5A', bg: '#E8F5F4' },
  cancelado: { label: 'Cancelado', color: '#9ca3af', bg: '#F5F5F5' },
  agendado:  { label: 'Agendado',  color: '#A8C5CC', bg: '#EFF7F8' },
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

function RevalidatingSpinner() {
  return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div
        style={{
          width: 16, height: 16,
          border: '2px solid #1B5E5A',
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
function RotinaContent({ userId }: { userId: string }) {
  const supabase = createClient()
  const [servicos, setServicos] = useState<ServicoBeleza[]>([])
  const [gastosMes, setGastosMes] = useState<number>(0)
  const [historico, setHistorico] = useState<Agendamento[]>([])

  // Dados secundários (sem cache por enquanto)
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

  // Agendamentos futuros com cache (stale-while-revalidate)
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

        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 28, color: 'var(--foreground)', lineHeight: 1.2, letterSpacing: '-0.01em' }}>
          Rotina
        </h1>

        {/* Alertas de intervalo */}
        {alertas.length > 0 && (
          <section className="flex flex-col gap-2">
            <h2 className="font-bold text-gray-500 uppercase tracking-widest" style={{ fontSize: 11 }}>
              Atenção
            </h2>
            {alertas.map((s) => {
              const atraso = diasAtraso(s.ultimo_procedimento, s.frequencia_dias)
              const critico = atraso > 7
              return (
                <div
                  key={s.id}
                  className="flex items-center gap-3 px-4 py-3"
                  style={{
                    borderRadius: 14,
                    backgroundColor: critico ? '#FFF0F5' : '#FFF8E1',
                    border: `1.5px solid ${critico ? '#F472A0' : '#D4A843'}`,
                  }}
                >
                  <span style={{ fontSize: 18 }}>{critico ? '🔴' : '⚠️'}</span>
                  <div>
                    <p className="font-bold text-gray-800" style={{ fontSize: 14 }}>{s.nome}</p>
                    <p style={{ fontSize: 12, color: critico ? '#F472A0' : '#D4A843' }}>
                      {atraso} {atraso === 1 ? 'dia' : 'dias'} atrasada
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
            <h2 className="font-bold text-gray-500 uppercase tracking-widest" style={{ fontSize: 11 }}>
              Próximos agendamentos
            </h2>
            {loadingAgendamentos && agendamentos !== null && <RevalidatingSpinner />}
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
        <div
          className="flex items-center justify-between px-4 py-4"
          style={{ borderRadius: 16, backgroundColor: 'var(--surface)', border: '1.5px solid var(--color-silver)', boxShadow: 'var(--shadow-sm)' }}
        >
          <span style={{ fontSize: 14, color: 'var(--foreground-muted)', fontWeight: 600 }}>Gasto este mês</span>
          <span style={{ fontSize: 18, color: 'var(--color-ever-green)', fontWeight: 800 }}>
            {gastosMes.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </span>
        </div>

        {/* Histórico */}
        {historico.length > 0 && (
          <section className="flex flex-col gap-2">
            <h2 className="font-bold text-gray-500 uppercase tracking-widest" style={{ fontSize: 11 }}>
              Histórico
            </h2>
            {historico.map((ag) => {
              const cfg = statusConfig[ag.status] ?? statusConfig.agendado
              const dataFmt = new Date(ag.data_hora).toLocaleDateString('pt-BR', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })
              return (
                <div
                  key={ag.id}
                  className="flex items-center justify-between px-4 py-3"
                  style={{ borderRadius: 14, border: '1.5px solid var(--color-silver)', backgroundColor: 'var(--surface)' }}
                >
                  <div className="flex flex-col gap-0.5 flex-1 min-w-0 pr-2">
                    <p className="font-bold text-gray-800 truncate" style={{ fontSize: 14 }}>
                      {ag.servico_nome}
                    </p>
                    <p className="text-gray-400" style={{ fontSize: 12 }}>
                      {dataFmt}
                      {ag.profissional?.nome ? ` · ${ag.profissional.nome}` : ''}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span
                      className="font-bold uppercase tracking-wide"
                      style={{
                        fontSize: 10,
                        color: cfg.color,
                        backgroundColor: cfg.bg,
                        borderRadius: 6,
                        padding: '2px 8px',
                      }}
                    >
                      {cfg.label}
                    </span>
                    {ag.valor && (
                      <span className="text-gray-500" style={{ fontSize: 12 }}>
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

// Componente principal: resolve userId antes de renderizar o conteúdo
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
          <h1 className="font-extrabold tracking-tight" style={{ fontSize: 24, color: '#171717' }}>
            Rotina
          </h1>
          <SkeletonList count={3} height={76} />
        </main>
      </PageContainer>
      </PageTransition>
    )
  }

  return <RotinaContent userId={userId} />
}
