import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { isPremium } from '@/lib/credits'
import { CREDIT_COSTS } from '@/lib/credits/costs'
import AppHeader from '@/components/ui/AppHeader'
import PageContainer from '@/components/ui/PageContainer'
import PremiumGate from '@/components/ui/PremiumGate'
import type { VisagismoResponse } from '@/lib/ai/analyzeVisagismo'
import { PageTransition } from '@/components/ui/PageTransition'
import { Scissors, Palette, Eye, CheckCircle2, XCircle, Star } from 'lucide-react'

// ─── Helpers de UI ────────────────────────────────────────────────

function Circulo({ hex, size = 40, opacity = 1 }: { hex: string; size?: number; opacity?: number }) {
  return (
    <div
      title={hex}
      style={{
        width: size, height: size, borderRadius: '50%',
        backgroundColor: hex, flexShrink: 0, opacity,
        border: '1px solid rgba(0,0,0,0.08)',
      }}
    />
  )
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span style={{
      background: 'rgba(255,255,255,0.2)', borderRadius: 20,
      padding: '4px 12px', fontSize: 13, fontWeight: 600, color: '#fff',
    }}>
      {children}
    </span>
  )
}

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl p-4" style={{ border: '1.5px solid rgba(0,0,0,0.06)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
      {children}
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <h2 className="text-label mb-3">{children}</h2>
}

function SubLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-card-title mb-3">{children}</p>
}

function PremiumButton({ children }: { children: React.ReactNode }) {
  return (
    <button style={{
      padding: '9px 16px', borderRadius: 10, border: 'none',
      background: 'linear-gradient(135deg, #FF3366, #C41A4A)',
      color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
      fontFamily: 'var(--font-body)',
    }}>
      {children}
    </button>
  )
}

// ─── Page ─────────────────────────────────────────────────────────

export default async function ResultadoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: analise }, premium] = await Promise.all([
    supabase
      .from('analise_facial')
      .select('*')
      .eq('usuario_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    isPremium(user.id),
  ])

  if (!analise) redirect('/app/visagismo')

  const dados = analise.dados_brutos as VisagismoResponse

  return (
    <PageTransition>
      <PageContainer>
        <AppHeader
          actions={
            <Link href="/app/visagismo" className="text-caption font-medium flex items-center gap-1" style={{ textDecoration: 'none', color: 'var(--foreground-muted)' }}>
              ← Voltar
            </Link>
          }
        />

        <main className="flex flex-col gap-6 px-5 py-6 pb-10">

          {/* ── Foto + hero ── */}
          {analise.foto_url && (
            <div className="flex flex-col items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={analise.foto_url}
                alt="Foto da análise"
                style={{
                  width: 80, height: 80, borderRadius: '50%', objectFit: 'cover',
                  border: '3px solid var(--color-primary)',
                  boxShadow: '0 4px 16px rgba(255,51,102,0.25)',
                  display: 'inline-block',
                }}
              />
              <p className="text-caption">
                Análise de {new Date(analise.created_at as string).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
              </p>
            </div>
          )}

          {/* ── SEÇÃO 1: Perfil ── */}
          <section>
            <SectionLabel>Perfil</SectionLabel>
            <div
              className="relative overflow-hidden rounded-2xl"
              style={{
                background: 'linear-gradient(135deg, #FF3366 0%, #C41A4A 100%)',
                padding: '24px 20px', color: '#fff',
                boxShadow: '0 6px 24px rgba(255,51,102,0.25)',
              }}
            >
              {/* Círculo decorativo */}
              <div style={{ position: 'absolute', top: -40, right: -30, width: 130, height: 130, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />

              <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, marginBottom: 12, color: '#fff' }}>
                {dados.colorimetria.estacao}
              </p>
              <div className="flex flex-wrap gap-2">
                <Tag>{dados.colorimetria.subtom}</Tag>
                <Tag>rosto {dados.analise_facial.formato_rosto}</Tag>
                <Tag>contraste {dados.colorimetria.contraste_pessoal ?? dados.colorimetria.contraste}</Tag>
              </div>
              {dados.colorimetria.descricao_estacao && (
                <p style={{ fontSize: 13, marginTop: 14, opacity: 0.85, lineHeight: 1.5 }}>
                  {dados.colorimetria.descricao_estacao}
                </p>
              )}
            </div>
          </section>

          {/* ── SEÇÃO 2: Paleta de cores ── */}
          <section>
            <SectionLabel>Paleta de cores</SectionLabel>
            <SectionCard>
              <SubLabel>Cores que te valorizam</SubLabel>
              <div className="flex flex-wrap gap-2 mb-5">
                {dados.paleta_cores.cores_ideais.map((cor) => (
                  <div key={cor.hex} className="flex flex-col items-center gap-1" style={{ width: 48 }}>
                    <Circulo hex={cor.hex} />
                    <p style={{ fontSize: 9, color: 'var(--foreground-muted)', textAlign: 'center', lineHeight: 1.2 }}>{cor.nome}</p>
                  </div>
                ))}
              </div>

              <p className="text-caption mb-3" style={{ fontWeight: 600 }}>Cores a evitar</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {dados.paleta_cores.cores_evitar.map((cor) => (
                  <div key={cor.hex} className="flex flex-col items-center gap-1" style={{ width: 48 }}>
                    <Circulo hex={cor.hex} opacity={0.5} />
                    <p style={{ fontSize: 9, color: 'var(--foreground-muted)', textAlign: 'center', lineHeight: 1.2 }}>{cor.nome}</p>
                  </div>
                ))}
              </div>

              <PremiumGate
                isPremium={premium}
                feature="VISAGISMO_IMAGEM"
                creditCost={CREDIT_COSTS.VISAGISMO_IMAGEM}
                label="Gerar look com estas cores"
                description="Crie um look virtual usando as cores da sua paleta personalizada."
              >
                <PremiumButton>Gerar look com estas cores</PremiumButton>
              </PremiumGate>
            </SectionCard>
          </section>

          {/* ── SEÇÃO 3: Maquiagem ── */}
          <section>
            <SectionLabel>Maquiagem</SectionLabel>
            <div className="flex flex-col gap-4">

              {/* Batom */}
              <SectionCard>
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center justify-center rounded-lg flex-shrink-0"
                    style={{ width: 28, height: 28, background: 'rgba(255,51,102,0.08)' }}>
                    <span style={{ fontSize: 14 }}>💄</span>
                  </div>
                  <SubLabel>Batom</SubLabel>
                </div>
                <div className="flex flex-wrap gap-3 mb-4">
                  {dados.maquiagem.batom.map((b) => (
                    <div key={b.hex} className="flex flex-col items-center gap-1" style={{ width: 56 }}>
                      <Circulo hex={b.hex} />
                      <p style={{ fontSize: 10, color: 'var(--foreground-muted)', textAlign: 'center', lineHeight: 1.2 }}>{b.nome}</p>
                      <p style={{ fontSize: 9, color: 'var(--foreground-muted)', textAlign: 'center' }}>{b.acabamento}</p>
                    </div>
                  ))}
                </div>
                <PremiumGate isPremium={premium} feature="VISAGISMO_IMAGEM" creditCost={CREDIT_COSTS.VISAGISMO_IMAGEM} label="Experimentar este batom" description="Aplique virtualmente um dos batons recomendados na sua foto.">
                  <PremiumButton>Experimentar este batom</PremiumButton>
                </PremiumGate>
              </SectionCard>

              {/* Sombra */}
              <SectionCard>
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center justify-center rounded-lg flex-shrink-0"
                    style={{ width: 28, height: 28, background: 'rgba(255,51,102,0.08)' }}>
                    <Eye size={14} color="var(--color-primary)" />
                  </div>
                  <SubLabel>Sombra</SubLabel>
                </div>
                <div className="flex flex-wrap gap-3 mb-4">
                  {dados.maquiagem.sombra.map((s) => (
                    <div key={`${s.hex}-${s.ocasiao}`} className="flex flex-col items-center gap-1" style={{ width: 56 }}>
                      <Circulo hex={s.hex} />
                      <p style={{ fontSize: 10, color: 'var(--foreground-muted)', textAlign: 'center', lineHeight: 1.2 }}>{s.nome}</p>
                    </div>
                  ))}
                </div>
                <PremiumGate isPremium={premium} feature="VISAGISMO_IMAGEM" creditCost={CREDIT_COSTS.VISAGISMO_IMAGEM} label="Testar este look de olho" description="Veja como fica o look de sombra recomendado na sua foto.">
                  <PremiumButton>Testar este look de olho</PremiumButton>
                </PremiumGate>
              </SectionCard>

              {/* Blush */}
              <SectionCard>
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center justify-center rounded-lg flex-shrink-0"
                    style={{ width: 28, height: 28, background: 'rgba(255,51,102,0.08)' }}>
                    <span style={{ fontSize: 14 }}>🌸</span>
                  </div>
                  <SubLabel>Blush</SubLabel>
                </div>
                <div className="flex flex-wrap gap-3">
                  {dados.maquiagem.blush.map((b) => (
                    <div key={`${b.hex}-${b.tecnica}`} className="flex flex-col items-center gap-1" style={{ width: 56 }}>
                      <Circulo hex={b.hex} />
                      <p style={{ fontSize: 10, color: 'var(--foreground-muted)', textAlign: 'center', lineHeight: 1.2 }}>{b.nome}</p>
                      <p style={{ fontSize: 9, color: 'var(--foreground-muted)', textAlign: 'center' }}>{b.tecnica}</p>
                    </div>
                  ))}
                </div>
              </SectionCard>

              {/* Delineado */}
              {dados.maquiagem.delineado.formatos_recomendados.length > 0 && (
                <SectionCard>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center justify-center rounded-lg flex-shrink-0"
                      style={{ width: 28, height: 28, background: 'rgba(255,51,102,0.08)' }}>
                      <Palette size={14} color="var(--color-primary)" />
                    </div>
                    <SubLabel>Delineado</SubLabel>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {dados.maquiagem.delineado.formatos_recomendados.map((f) => (
                      <span key={f} style={{
                        fontSize: 12, background: 'rgba(255,51,102,0.08)', color: 'var(--color-primary)',
                        borderRadius: 8, padding: '4px 10px', fontWeight: 600,
                      }}>{f}</span>
                    ))}
                  </div>
                  {dados.maquiagem.delineado.estilos_evitar.length > 0 && (
                    <>
                      <p className="text-caption mb-2" style={{ marginTop: 8 }}>Evitar:</p>
                      <div className="flex flex-wrap gap-2">
                        {dados.maquiagem.delineado.estilos_evitar.map((e) => (
                          <span key={e} style={{
                            fontSize: 12, backgroundColor: 'var(--background)', color: 'var(--foreground-muted)',
                            borderRadius: 8, padding: '4px 10px', border: '1.5px solid var(--color-silver)',
                          }}>{e}</span>
                        ))}
                      </div>
                    </>
                  )}
                </SectionCard>
              )}
            </div>
          </section>

          {/* ── SEÇÃO 4: Cabelo ── */}
          <section>
            <SectionLabel>Cabelo</SectionLabel>
            <div className="flex flex-col gap-4">
              <SectionCard>
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center justify-center rounded-lg flex-shrink-0"
                    style={{ width: 28, height: 28, background: 'rgba(27,94,90,0.08)' }}>
                    <Scissors size={14} color="var(--color-secondary)" />
                  </div>
                  <SubLabel>Cortes recomendados</SubLabel>
                </div>
                <div className="flex flex-col gap-3">
                  {dados.cabelo.cortes_recomendados.map((c) => (
                    <div key={c.nome} className="flex flex-col gap-1">
                      <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-secondary)' }}>{c.nome}</p>
                      <p className="text-caption" style={{ lineHeight: 1.5 }}>{c.motivo}</p>
                    </div>
                  ))}
                </div>
              </SectionCard>

              {dados.cabelo.cores_harmonicas.length > 0 && (
                <SectionCard>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center justify-center rounded-lg flex-shrink-0"
                      style={{ width: 28, height: 28, background: 'rgba(212,168,67,0.10)' }}>
                      <Palette size={14} color="#D4A843" />
                    </div>
                    <SubLabel>Cores harmônicas</SubLabel>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {dados.cabelo.cores_harmonicas.map((c) => (
                      <div key={c.hex} className="flex flex-col items-center gap-1" style={{ width: 56 }}>
                        <Circulo hex={c.hex} />
                        <p style={{ fontSize: 10, color: 'var(--foreground-muted)', textAlign: 'center', lineHeight: 1.2 }}>{c.nome}</p>
                      </div>
                    ))}
                  </div>
                </SectionCard>
              )}
            </div>
          </section>

          {/* ── SEÇÃO 5: Relatório ── */}
          <section>
            <SectionLabel>Relatório</SectionLabel>
            <div className="flex flex-col gap-4">
              <SectionCard>
                <SubLabel>Seu perfil</SubLabel>
                <p className="text-body" style={{ lineHeight: 1.7 }}>{dados.relatorio.resumo_perfil}</p>
              </SectionCard>

              {dados.relatorio.o_que_te_valoriza.length > 0 && (
                <SectionCard>
                  <SubLabel>O que te valoriza</SubLabel>
                  <ul className="flex flex-col gap-3">
                    {dados.relatorio.o_que_te_valoriza.map((item) => (
                      <li key={item} className="flex gap-2 items-start">
                        <CheckCircle2 size={15} color="var(--color-secondary)" style={{ flexShrink: 0, marginTop: 2 }} />
                        <p className="text-body" style={{ lineHeight: 1.5 }}>{item}</p>
                      </li>
                    ))}
                  </ul>
                </SectionCard>
              )}

              {dados.relatorio.o_que_evitar.length > 0 && (
                <SectionCard>
                  <SubLabel>O que evitar</SubLabel>
                  <ul className="flex flex-col gap-3">
                    {dados.relatorio.o_que_evitar.map((item) => (
                      <li key={item} className="flex gap-2 items-start">
                        <XCircle size={15} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: 2 }} />
                        <p className="text-body" style={{ lineHeight: 1.5 }}>{item}</p>
                      </li>
                    ))}
                  </ul>
                </SectionCard>
              )}

              {/* Dica especial — gold */}
              <div className="rounded-2xl relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #D4A843 0%, #B8922A 100%)', padding: '20px' }}>
                <div style={{ position: 'absolute', top: -30, right: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
                <div className="flex items-center gap-2 mb-2">
                  <Star size={16} color="#fff" fill="#fff" />
                  <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: '#fff' }}>Dica especial</p>
                </div>
                <p style={{ fontSize: 14, lineHeight: 1.6, color: '#fff' }}>{dados.relatorio.dica_especial}</p>
              </div>
            </div>
          </section>

          {/* ── CTA: Gerar imagem ── */}
          <section>
            <div
              className="relative overflow-hidden rounded-2xl flex flex-col items-center gap-3 text-center"
              style={{
                background: 'linear-gradient(135deg, #FF3366 0%, #C41A4A 100%)',
                padding: '28px 20px',
                boxShadow: '0 6px 24px rgba(255,51,102,0.28)',
              }}
            >
              <div style={{ position: 'absolute', top: -50, right: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
              <span style={{ fontSize: 36, color: '#F9D56E' }}>✦</span>
              <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: '#fff', lineHeight: 1.2 }}>
                Veja como você ficaria
              </p>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.82)', lineHeight: 1.5 }}>
                Gere uma imagem com os looks recomendados para o seu rosto
              </p>
              <PremiumGate
                isPremium={premium}
                feature="VISAGISMO_IMAGEM"
                creditCost={CREDIT_COSTS.VISAGISMO_IMAGEM}
                label="Criar minha imagem"
                description="Gere uma imagem personalizada com os tons recomendados para o seu tipo de rosto e colorimetria."
              >
                <Link
                  href="/app/visagismo/gerar"
                  style={{
                    display: 'inline-block', padding: '13px 32px', borderRadius: 14,
                    backgroundColor: '#fff', color: 'var(--color-primary)',
                    fontSize: 15, fontWeight: 700, textDecoration: 'none',
                    fontFamily: 'var(--font-body)', marginTop: 4,
                    boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
                  }}
                >
                  Criar minha imagem
                </Link>
              </PremiumGate>
            </div>
          </section>

        </main>
      </PageContainer>
    </PageTransition>
  )
}
