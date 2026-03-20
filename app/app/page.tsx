import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AppHeader from '@/components/ui/AppHeader'
import PageContainer from '@/components/ui/PageContainer'
import LogoutButton from './LogoutButton'

function inicioDoMes(): string {
  const hoje = new Date()
  return new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString()
}

function diasAtraso(ultimoProcedimento: string, frequenciaDias: number): number {
  const ultimo = new Date(ultimoProcedimento)
  const hoje = new Date()
  const diffMs = hoje.getTime() - ultimo.getTime()
  const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  return diffDias - frequenciaDias
}

export default async function AppPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const nome = user.user_metadata?.nome ?? user.email?.split('@')[0] ?? 'usuária'

  const [
    { data: proximosAgendamentos },
    { data: servicos },
  ] = await Promise.all([
    supabase
      .from('agendamentos_rotina')
      .select('*, profissional:profissionais(nome)')
      .eq('usuario_id', user.id)
      .eq('status', 'agendado')
      .gte('data_hora', new Date().toISOString())
      .order('data_hora', { ascending: true })
      .limit(1),
    supabase
      .from('servicos_beleza')
      .select('*')
      .eq('usuario_id', user.id)
      .eq('lembrete_ativo', true)
      .not('ultimo_procedimento', 'is', null),
  ])

  const proximo = (proximosAgendamentos ?? [])[0] ?? null

  const alertas = (servicos ?? []).filter(
    (s) => s.ultimo_procedimento && diasAtraso(s.ultimo_procedimento, s.frequencia_dias) > 0
  )

  const tudoEmDia = !proximo && alertas.length === 0

  return (
    <PageContainer>
      <AppHeader actions={<LogoutButton />} />

      <main className="flex flex-col px-5 py-8 gap-6">

        {/* Saudação */}
        <div className="flex flex-col gap-0.5">
          <span className="text-gray-500" style={{ fontSize: 14 }}>Olá,</span>
          <span className="font-extrabold tracking-tight" style={{ fontSize: 26, color: '#171717' }}>
            {nome} ✦
          </span>
        </div>

        {/* Tudo em dia */}
        {tudoEmDia && (
          <div
            className="flex flex-col items-center gap-2 py-10"
            style={{ borderRadius: 20, backgroundColor: '#fff', border: '1.5px solid #E8E8E8' }}
          >
            <span style={{ fontSize: 40 }}>✨</span>
            <p className="font-bold text-gray-700" style={{ fontSize: 16 }}>Tudo em dia por aqui ✦</p>
            <p className="text-gray-400 text-center" style={{ fontSize: 13 }}>
              Nenhum alerta e nenhum agendamento próximo.
            </p>
          </div>
        )}

        {/* Alertas */}
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

        {/* Próximo agendamento */}
        {proximo && (
          <section className="flex flex-col gap-2">
            <h2 className="font-bold text-gray-500 uppercase tracking-widest" style={{ fontSize: 11 }}>
              Próximo agendamento
            </h2>
            <div
              className="flex items-center gap-4 px-4 py-4 bg-white"
              style={{ borderRadius: 16, border: '1.5px solid #E8E8E8' }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  backgroundColor: '#E8F5F4',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 22,
                  flexShrink: 0,
                }}
              >
                📅
              </div>
              <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                <p className="font-bold text-gray-800 truncate" style={{ fontSize: 15 }}>
                  {proximo.servico_nome}
                </p>
                {proximo.profissional?.nome && (
                  <p className="text-gray-500 truncate" style={{ fontSize: 13 }}>
                    {proximo.profissional.nome}
                  </p>
                )}
                <p style={{ fontSize: 12, color: '#1B5E5A', fontWeight: 600 }}>
                  {new Date(proximo.data_hora).toLocaleDateString('pt-BR', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                  })}{' '}
                  às{' '}
                  {new Date(proximo.data_hora).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          </section>
        )}

      </main>
    </PageContainer>
  )
}
