'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import AppHeader from '@/components/ui/AppHeader'
import PageContainer from '@/components/ui/PageContainer'
import LogoutButton from './LogoutButton'
import { PageTransition } from '@/components/ui/PageTransition'
import { SkeletonList } from '@/components/ui/SkeletonCard'
import { setCache } from '@/lib/cache'
import { CACHE_KEYS } from '@/lib/cache/keys'

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

function IconWA() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="#25D366">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  )
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
  profissional: { nome: string; telefone: string | null } | null
}

interface HomeData {
  nome: string
  proximo: Agendamento | null
  alertas: ServicoBeleza[]
}

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

    // Prefetch em background sem bloquear a UI
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
    }, 1000) // 1s após carregar a home, sem competir com o render inicial
  }, [userId]) // eslint-disable-line react-hooks/exhaustive-deps

  const { nome, proximo, alertas } = homeData
  const tudoEmDia = !loading && !proximo && alertas.length === 0

  const waTelefone = proximo?.profissional?.telefone
    ? proximo.profissional.telefone.replace(/\D/g, '')
    : null

  return (
    <PageTransition>
    <PageContainer>
      <AppHeader actions={<LogoutButton />} />

      <main className="flex flex-col px-5 py-8 gap-6">

        {/* Saudação */}
        <div className="flex flex-col gap-1">
          <span style={{ fontSize: 13, color: 'var(--foreground-muted)', fontFamily: 'var(--font-body)', fontWeight: 400 }}>Olá,</span>
          <span style={{ fontSize: 28, color: 'var(--foreground)', fontFamily: 'var(--font-display)', fontWeight: 700, lineHeight: 1.15, letterSpacing: '-0.01em' }}>
            {nome} ✦
          </span>
        </div>

        {loading && (
          <SkeletonList count={2} height={80} />
        )}

        {/* Tudo em dia */}
        {tudoEmDia && (
          <div
            className="flex flex-col items-center gap-2 py-10"
            style={{ borderRadius: 20, backgroundColor: 'var(--surface)', border: '1.5px solid var(--color-silver)', boxShadow: 'var(--shadow-sm)' }}
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
              className="flex items-center gap-3 px-4 py-4 bg-white"
              style={{ borderRadius: 16, border: '1.5px solid #E8E8E8' }}
            >
              {/* Ícone calendário */}
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

              {/* Conteúdo */}
              <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                {/* Badge PRÓXIMO */}
                <span
                  style={{
                    display: 'inline-block',
                    alignSelf: 'flex-start',
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    color: '#1B5E5A',
                    backgroundColor: '#E8F5F4',
                    borderRadius: 4,
                    padding: '2px 6px',
                    marginBottom: 2,
                    textTransform: 'uppercase',
                  }}
                >
                  Próximo
                </span>
                <p className="font-extrabold text-gray-800 truncate" style={{ fontSize: 15 }}>
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

              {/* WhatsApp */}
              {waTelefone && (
                <a
                  href={`https://wa.me/55${waTelefone}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    backgroundColor: '#E8F8F0',
                    padding: 6,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <IconWA />
                </a>
              )}
            </div>
          </section>
        )}

      </main>
    </PageContainer>
    </PageTransition>
  )
}

// Componente principal: resolve userId antes de renderizar o conteúdo
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
        <main className="flex flex-col px-5 py-8 gap-6">
          <div className="flex flex-col gap-0.5">
            <span className="text-gray-500" style={{ fontSize: 14 }}>Olá,</span>
            <div style={{ height: 32, width: 120, borderRadius: 8, backgroundColor: '#e0e0e0' }} />
          </div>
          <SkeletonList count={2} height={80} />
        </main>
      </PageContainer>
      </PageTransition>
    )
  }

  return <HomeContent userId={user.id} nome={user.nome} />
}
