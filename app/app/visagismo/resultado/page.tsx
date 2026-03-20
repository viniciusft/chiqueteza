import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { isPremium } from '@/lib/credits'
import { CREDIT_COSTS } from '@/lib/credits/costs'
import AppHeader from '@/components/ui/AppHeader'
import PageContainer from '@/components/ui/PageContainer'
import PremiumGate from '@/components/ui/PremiumGate'
import type { VisagismoResponse } from '@/lib/ai/analyzeVisagismo'


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

function SecaoTitulo({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="font-bold text-gray-500 uppercase tracking-widest"
      style={{ fontSize: 11, marginBottom: 12 }}
    >
      {children}
    </h2>
  )
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        backgroundColor: '#fff', borderRadius: 16,
        padding: '16px', border: '1.5px solid #E8E8E8',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

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
    <PageContainer>
      <AppHeader
        actions={
          <Link href="/app/visagismo" className="text-gray-400 font-medium" style={{ fontSize: 14 }}>
            ← Voltar
          </Link>
        }
      />

      <main className="flex flex-col gap-6 px-5 py-6 pb-10">

        {/* ── SEÇÃO 1: Perfil ── */}
        <section>
          <SecaoTitulo>Perfil</SecaoTitulo>
          <div
            style={{
              backgroundColor: '#1B5E5A', borderRadius: 20,
              padding: '24px 20px', color: '#fff',
            }}
          >
            <p style={{ fontWeight: 800, fontSize: 20, marginBottom: 12 }}>
              {dados.colorimetria.estacao}
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span style={{
                backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20,
                padding: '4px 12px', fontSize: 13, fontWeight: 600,
              }}>
                {dados.colorimetria.subtom}
              </span>
              <span style={{
                backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20,
                padding: '4px 12px', fontSize: 13, fontWeight: 600,
              }}>
                rosto {dados.analise_facial.formato_rosto}
              </span>
              <span style={{
                backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20,
                padding: '4px 12px', fontSize: 13, fontWeight: 600,
              }}>
                contraste {dados.colorimetria.contraste}
              </span>
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
          <SecaoTitulo>Paleta de cores</SecaoTitulo>
          <Card>
            <p className="font-semibold text-gray-700" style={{ fontSize: 13, marginBottom: 12 }}>
              Cores que te valorizam
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
              {dados.paleta_cores.cores_ideais.map((cor) => (
                <div key={cor.hex} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, width: 48 }}>
                  <Circulo hex={cor.hex} />
                  <p style={{ fontSize: 9, color: '#666', textAlign: 'center', lineHeight: 1.2 }}>{cor.nome}</p>
                </div>
              ))}
            </div>

            <p className="font-semibold text-gray-500" style={{ fontSize: 13, marginBottom: 12 }}>
              Cores a evitar
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {dados.paleta_cores.cores_evitar.map((cor) => (
                <div key={cor.hex} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, width: 48 }}>
                  <Circulo hex={cor.hex} opacity={0.5} />
                  <p style={{ fontSize: 9, color: '#999', textAlign: 'center', lineHeight: 1.2 }}>{cor.nome}</p>
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
              <button
                style={{
                  width: '100%', padding: '12px', borderRadius: 12, border: 'none',
                  backgroundColor: '#1B5E5A', color: '#fff', fontSize: 14,
                  fontWeight: 700, cursor: 'pointer',
                }}
              >
                Gerar look com estas cores
              </button>
            </PremiumGate>
          </Card>
        </section>

        {/* ── SEÇÃO 3: Maquiagem ── */}
        <section>
          <SecaoTitulo>Maquiagem</SecaoTitulo>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Batom */}
            <Card>
              <p className="font-bold text-gray-800" style={{ fontSize: 14, marginBottom: 12 }}>
                💄 Batom
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
                {dados.maquiagem.batom.map((b) => (
                  <div key={b.hex} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, width: 56 }}>
                    <Circulo hex={b.hex} />
                    <p style={{ fontSize: 10, color: '#555', textAlign: 'center', lineHeight: 1.2 }}>{b.nome}</p>
                    <p style={{ fontSize: 9, color: '#999', textAlign: 'center' }}>{b.acabamento}</p>
                  </div>
                ))}
              </div>
              <PremiumGate
                isPremium={premium}
                feature="VISAGISMO_IMAGEM"
                creditCost={CREDIT_COSTS.VISAGISMO_IMAGEM}
                label="Experimentar este batom"
                description="Aplique virtualmente um dos batons recomendados na sua foto."
              >
                <button style={{ padding: '8px 14px', borderRadius: 10, border: 'none', backgroundColor: '#F472A0', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  Experimentar este batom
                </button>
              </PremiumGate>
            </Card>

            {/* Sombra */}
            <Card>
              <p className="font-bold text-gray-800" style={{ fontSize: 14, marginBottom: 12 }}>
                👁️ Sombra
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
                {dados.maquiagem.sombra.map((s) => (
                  <div key={`${s.hex}-${s.ocasiao}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, width: 56 }}>
                    <Circulo hex={s.hex} />
                    <p style={{ fontSize: 10, color: '#555', textAlign: 'center', lineHeight: 1.2 }}>{s.nome}</p>
                  </div>
                ))}
              </div>
              <PremiumGate
                isPremium={premium}
                feature="VISAGISMO_IMAGEM"
                creditCost={CREDIT_COSTS.VISAGISMO_IMAGEM}
                label="Testar este look de olho"
                description="Veja como fica o look de sombra recomendado na sua foto."
              >
                <button style={{ padding: '8px 14px', borderRadius: 10, border: 'none', backgroundColor: '#1B5E5A', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  Testar este look de olho
                </button>
              </PremiumGate>
            </Card>

            {/* Blush */}
            <Card>
              <p className="font-bold text-gray-800" style={{ fontSize: 14, marginBottom: 12 }}>
                🌸 Blush
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                {dados.maquiagem.blush.map((b) => (
                  <div key={`${b.hex}-${b.tecnica}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, width: 56 }}>
                    <Circulo hex={b.hex} />
                    <p style={{ fontSize: 10, color: '#555', textAlign: 'center', lineHeight: 1.2 }}>{b.nome}</p>
                    <p style={{ fontSize: 9, color: '#999', textAlign: 'center' }}>{b.tecnica}</p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Delineado */}
            {dados.maquiagem.delineado.formatos_recomendados.length > 0 && (
              <Card>
                <p className="font-bold text-gray-800" style={{ fontSize: 14, marginBottom: 10 }}>
                  ✏️ Delineado
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                  {dados.maquiagem.delineado.formatos_recomendados.map((f) => (
                    <span
                      key={f}
                      style={{
                        fontSize: 12, backgroundColor: '#E8F5F4', color: '#1B5E5A',
                        borderRadius: 8, padding: '4px 10px', fontWeight: 600,
                      }}
                    >
                      {f}
                    </span>
                  ))}
                </div>
                {dados.maquiagem.delineado.estilos_evitar.length > 0 && (
                  <>
                    <p style={{ fontSize: 12, color: '#999', marginBottom: 6 }}>Evitar:</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {dados.maquiagem.delineado.estilos_evitar.map((e) => (
                        <span
                          key={e}
                          style={{
                            fontSize: 12, backgroundColor: '#F5F5F5', color: '#999',
                            borderRadius: 8, padding: '4px 10px',
                          }}
                        >
                          {e}
                        </span>
                      ))}
                    </div>
                  </>
                )}
              </Card>
            )}
          </div>
        </section>

        {/* ── SEÇÃO 4: Cabelo ── */}
        <section>
          <SecaoTitulo>Cabelo</SecaoTitulo>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Card>
              <p className="font-bold text-gray-800" style={{ fontSize: 14, marginBottom: 12 }}>
                ✂️ Cortes recomendados
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {dados.cabelo.cortes_recomendados.map((c) => (
                  <div key={c.nome} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#1B5E5A' }}>{c.nome}</p>
                    <p style={{ fontSize: 13, color: '#666' }}>{c.motivo}</p>
                  </div>
                ))}
              </div>
            </Card>

            {dados.cabelo.cores_harmonicas.length > 0 && (
              <Card>
                <p className="font-bold text-gray-800" style={{ fontSize: 14, marginBottom: 12 }}>
                  🎨 Cores harmônicas
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                  {dados.cabelo.cores_harmonicas.map((c) => (
                    <div key={c.hex} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, width: 56 }}>
                      <Circulo hex={c.hex} />
                      <p style={{ fontSize: 10, color: '#555', textAlign: 'center', lineHeight: 1.2 }}>{c.nome}</p>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </section>

        {/* ── SEÇÃO 5: Relatório ── */}
        <section>
          <SecaoTitulo>Relatório</SecaoTitulo>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Card>
              <p className="font-bold text-gray-800" style={{ fontSize: 14, marginBottom: 8 }}>
                Seu perfil
              </p>
              <p style={{ fontSize: 14, color: '#555', lineHeight: 1.6 }}>
                {dados.relatorio.resumo_perfil}
              </p>
            </Card>

            {dados.relatorio.o_que_te_valoriza.length > 0 && (
              <Card>
                <p className="font-bold text-gray-800" style={{ fontSize: 14, marginBottom: 10 }}>
                  ✦ O que te valoriza
                </p>
                <ul style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {dados.relatorio.o_que_te_valoriza.map((item) => (
                    <li key={item} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                      <span style={{ color: '#1B5E5A', fontWeight: 700, flexShrink: 0 }}>→</span>
                      <p style={{ fontSize: 14, color: '#555', lineHeight: 1.5 }}>{item}</p>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {dados.relatorio.o_que_evitar.length > 0 && (
              <Card>
                <p className="font-bold text-gray-800" style={{ fontSize: 14, marginBottom: 10 }}>
                  O que evitar
                </p>
                <ul style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {dados.relatorio.o_que_evitar.map((item) => (
                    <li key={item} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                      <span style={{ color: '#F472A0', fontWeight: 700, flexShrink: 0 }}>×</span>
                      <p style={{ fontSize: 14, color: '#555', lineHeight: 1.5 }}>{item}</p>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {/* Dica especial */}
            <div
              style={{
                backgroundColor: '#D4A843', borderRadius: 16,
                padding: '20px', color: '#fff',
              }}
            >
              <p style={{ fontWeight: 800, fontSize: 14, marginBottom: 8 }}>✦ Dica especial</p>
              <p style={{ fontSize: 14, lineHeight: 1.6 }}>
                {dados.relatorio.dica_especial}
              </p>
            </div>
          </div>
        </section>

        {/* ── CTA: Gerar imagem personalizada ── */}
        <section>
          <div
            style={{
              backgroundColor: '#1B5E5A', borderRadius: 20,
              padding: '28px 20px', display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 12, textAlign: 'center',
            }}
          >
            <span style={{ fontSize: 36, color: '#D4A843' }}>✦</span>
            <p style={{ fontWeight: 800, fontSize: 20, color: '#fff', lineHeight: 1.2 }}>
              Veja como você ficaria
            </p>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 }}>
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
                  display: 'block', padding: '14px 32px', borderRadius: 14,
                  backgroundColor: '#fff', color: '#1B5E5A',
                  fontSize: 15, fontWeight: 700, textDecoration: 'none',
                  marginTop: 4,
                }}
              >
                Criar minha imagem
              </Link>
            </PremiumGate>
          </div>
        </section>

      </main>
    </PageContainer>
  )
}
