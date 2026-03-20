import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { isPremium } from '@/lib/credits'
import { CREDIT_COSTS } from '@/lib/credits/costs'
import AppHeader from '@/components/ui/AppHeader'
import PageContainer from '@/components/ui/PageContainer'
import LogoutButton from '../LogoutButton'
import PremiumGate from '@/components/ui/PremiumGate'

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

export default async function VisagismoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: analise }, premium, { data: geracoes }] = await Promise.all([
    supabase
      .from('analise_facial')
      .select('*')
      .eq('usuario_id', user.id)
      .eq('mes_referencia', mesAtual())
      .maybeSingle(),
    isPremium(user.id),
    supabase
      .from('geracoes_visagismo')
      .select('id, foto_gerada_url, batom_nome, sombra_nome, created_at')
      .eq('usuario_id', user.id)
      .eq('status', 'concluido')
      .order('created_at', { ascending: false })
      .limit(12),
  ])

  if (analise) {
    // Tela de résumé
    return (
      <PageContainer>
        <AppHeader actions={<LogoutButton />} />
        <main className="flex flex-col px-5 py-6 gap-5">

          <h1 className="font-extrabold tracking-tight" style={{ fontSize: 24, color: '#171717' }}>
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
                marginBottom: 12,
              }}
            >
              Análise de {nomeMes(analise.mes_referencia)}
            </span>
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
                href="/app/visagismo/upload"
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
          {geracoes && geracoes.length > 0 && (
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
    )
  }

  // Tela de instrução (sem análise)
  return (
    <PageContainer>
      <AppHeader actions={<LogoutButton />} />
      <main className="flex flex-col px-5 py-6 gap-6">

        <div className="flex flex-col gap-1">
          <h1 className="font-extrabold tracking-tight" style={{ fontSize: 24, color: '#171717' }}>
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
  )
}
