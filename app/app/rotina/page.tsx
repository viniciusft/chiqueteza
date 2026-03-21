import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AppHeader from '@/components/ui/AppHeader'
import PageContainer from '@/components/ui/PageContainer'
import LogoutButton from '../LogoutButton'
import AgendamentoCard from './_components/AgendamentoCard'
import RotinaSeedFAB from './_components/RotinaSeedFAB'
import { PageTransition } from '@/components/ui/PageTransition'
import { PullToRefresh } from '@/components/ui/PullToRefresh'

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

export default async function RotinaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { data: servicos },
    { data: agendamentos },
    { data: gastosMes },
    { data: historico },
  ] = await Promise.all([
    supabase
      .from('servicos_beleza')
      .select('*')
      .eq('usuario_id', user.id)
      .eq('lembrete_ativo', true)
      .not('ultimo_procedimento', 'is', null),
    supabase
      .from('agendamentos_rotina')
      .select('*, profissional:profissionais(nome, telefone)')
      .eq('usuario_id', user.id)
      .eq('status', 'agendado')
      .gte('data_hora', new Date().toISOString())
      .order('data_hora', { ascending: true }),
    supabase
      .from('agendamentos_rotina')
      .select('valor')
      .eq('usuario_id', user.id)
      .eq('status', 'concluido')
      .gte('data_hora', inicioDoMes()),
    supabase
      .from('agendamentos_rotina')
      .select('*, profissional:profissionais(nome, telefone)')
      .eq('usuario_id', user.id)
      .in('status', ['concluido', 'cancelado'])
      .order('data_hora', { ascending: false })
      .limit(10),
  ])

  const alertas = (servicos ?? []).filter(
    (s) => s.ultimo_procedimento && diasAtraso(s.ultimo_procedimento, s.frequencia_dias) > 0
  )

  const totalMes = (gastosMes ?? []).reduce(
    (acc, g) => acc + (Number(g.valor) || 0),
    0
  )

  return (
    <PageTransition>
    <PullToRefresh>
    <PageContainer>
      <AppHeader actions={<LogoutButton />} />

      <main className="flex flex-col gap-5 px-5 py-6 pb-24">

        <h1 className="font-extrabold tracking-tight" style={{ fontSize: 24, color: '#171717' }}>
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
          <h2 className="font-bold text-gray-500 uppercase tracking-widest" style={{ fontSize: 11 }}>
            Próximos agendamentos
          </h2>
          {(agendamentos ?? []).length === 0 ? (
            <div
              className="flex flex-col items-center gap-2 py-8"
              style={{ borderRadius: 16, backgroundColor: '#fff', border: '1.5px solid #E8E8E8' }}
            >
              <span style={{ fontSize: 32 }}>📅</span>
              <p className="text-gray-400 text-sm">Nenhum agendamento futuro</p>
            </div>
          ) : (
            (agendamentos ?? []).map((ag) => (
              <AgendamentoCard key={ag.id} agendamento={ag} />
            ))
          )}
        </section>

        {/* Gasto este mês */}
        <div
          className="flex items-center justify-between px-4 py-4"
          style={{ borderRadius: 16, backgroundColor: '#fff', border: '1.5px solid #E8E8E8' }}
        >
          <span className="font-semibold text-gray-500" style={{ fontSize: 14 }}>Gasto este mês</span>
          <span className="font-extrabold" style={{ fontSize: 18, color: '#1B5E5A' }}>
            {totalMes.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </span>
        </div>

        {/* Histórico */}
        {(historico ?? []).length > 0 && (
          <section className="flex flex-col gap-2">
            <h2 className="font-bold text-gray-500 uppercase tracking-widest" style={{ fontSize: 11 }}>
              Histórico
            </h2>
            {(historico ?? []).map((ag) => {
              const cfg = statusConfig[ag.status] ?? statusConfig.agendado
              const dataFmt = new Date(ag.data_hora).toLocaleDateString('pt-BR', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })
              return (
                <div
                  key={ag.id}
                  className="flex items-center justify-between px-4 py-3 bg-white"
                  style={{ borderRadius: 14, border: '1.5px solid #E8E8E8' }}
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
