'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AppHeader from '@/components/ui/AppHeader'
import PageContainer from '@/components/ui/PageContainer'

interface BatomOpcao { nome: string; hex: string; acabamento: string }
interface SombraOpcao { nome: string; hex: string }
interface BlushOpcao { nome: string; hex: string }

interface AnaliseData {
  id: string
  foto_url: string | null
  dados_brutos: {
    maquiagem: {
      batom: BatomOpcao[]
      sombra: SombraOpcao[]
      blush: BlushOpcao[]
      delineado: { formatos_recomendados: string[] }
    }
    cabelo: { cortes_recomendados: Array<{ nome: string }> }
    colorimetria: { estacao: string }
  }
}

const ESTILOS_ROUPA = [
  'Casual elegante',
  'Trabalho / Formal',
  'Festa / Noite',
  'Romântico',
  'Esportivo chic',
]

const MENSAGENS_GERANDO = [
  'Aplicando maquiagem...',
  'Preservando suas feições...',
  'Finalizando o look...',
]

function Circulo({ hex, size = 28 }: { hex: string; size?: number }) {
  return (
    <div
      style={{
        width: size, height: size, borderRadius: '50%',
        backgroundColor: hex, flexShrink: 0,
        border: '1.5px solid rgba(0,0,0,0.1)',
      }}
    />
  )
}

function SecaoTitulo({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontWeight: 700, fontSize: 13, color: '#555', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
      {children}
    </p>
  )
}

function Chip({
  label,
  selected,
  onClick,
}: {
  label: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '8px 16px',
        borderRadius: 20,
        border: `1px solid ${selected ? '#1B5E5A' : '#E0E0E0'}`,
        backgroundColor: selected ? '#1B5E5A' : '#fff',
        color: selected ? '#fff' : '#444',
        fontSize: 13,
        fontWeight: selected ? 600 : 400,
        cursor: 'pointer',
        flexShrink: 0,
      }}
    >
      {label}
    </button>
  )
}

export default function GerarVisagismoPage() {
  const router = useRouter()
  const [analise, setAnalise] = useState<AnaliseData | null>(null)
  const [creditos, setCreditos] = useState<number>(0)
  const [analiseId, setAnaliseId] = useState<string>('')

  // Seleções
  const [batomSel, setBatomSel] = useState<BatomOpcao | null>(null)
  const [sombraSel, setSombraSel] = useState<SombraOpcao | null>(null)
  const [blushSel, setBlushSel] = useState<BlushOpcao | null>(null)
  const [delineadoSel, setDelineadoSel] = useState<string | null>(null)
  const [corteSel, setCorteSel] = useState<string | null>(null)
  const [roupaSel, setRoupaSel] = useState<string | null>(null)

  const [gerando, setGerando] = useState(false)
  const [msgIdx, setMsgIdx] = useState(0)
  const [erro, setErro] = useState('')

  useEffect(() => {
    fetch('/api/visagismo/dados-para-gerar')
      .then((r) => r.json())
      .then((data) => {
        if (data.analise) {
          setAnalise(data.analise)
          setAnaliseId(data.analise.id)
        }
        if (typeof data.creditos === 'number') setCreditos(data.creditos)
      })
      .catch(() => setErro('Erro ao carregar dados. Volte e tente novamente.'))
  }, [])

  useEffect(() => {
    if (!gerando) return
    const i = setInterval(() => setMsgIdx((n) => (n + 1) % MENSAGENS_GERANDO.length), 2500)
    return () => clearInterval(i)
  }, [gerando])

  async function handleGerar() {
    if (!analiseId) return
    setErro('')
    setGerando(true)

    try {
      const body = {
        analise_id: analiseId,
        fotoOriginalUrl: analise?.foto_url ?? '',
        batomNome: batomSel?.nome,
        batomHex: batomSel?.hex,
        batomAcabamento: batomSel?.acabamento,
        sombraNome: sombraSel?.nome,
        sombraHex: sombraSel?.hex,
        blushNome: blushSel?.nome,
        blushHex: blushSel?.hex,
        delineado: delineadoSel ?? undefined,
        corteCabelo: corteSel ?? undefined,
        estiloRoupa: roupaSel ?? undefined,
      }

      const res = await fetch('/api/visagismo/gerar-imagem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.error === 'premium_required') throw new Error('Recurso disponível apenas para usuários Premium.')
        if (data.error === 'sem_creditos') throw new Error('Créditos insuficientes para esta ação.')
        if (data.error === 'provider_nao_configurado') throw new Error('Geração de imagens ainda não está disponível.')
        throw new Error(data.error ?? 'Erro ao gerar imagem.')
      }

      router.push(`/app/visagismo/resultado-imagem/${data.geracao_id}`)
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao gerar. Tente novamente.')
      setGerando(false)
    }
  }

  const dados = analise?.dados_brutos
  const batons = dados?.maquiagem.batom ?? []
  const sombras = dados?.maquiagem.sombra ?? []
  const blushs = dados?.maquiagem.blush ?? []
  const delineados = dados?.maquiagem.delineado.formatos_recomendados ?? []
  const cortes = dados?.cabelo.cortes_recomendados.map((c) => c.nome) ?? []

  // Resumo das seleções
  const resumo: string[] = []
  if (batomSel) resumo.push(`Batom: ${batomSel.nome}`)
  if (sombraSel) resumo.push(`Sombra: ${sombraSel.nome}`)
  if (blushSel) resumo.push(`Blush: ${blushSel.nome}`)
  if (delineadoSel) resumo.push(`Delineado: ${delineadoSel}`)
  if (corteSel) resumo.push(`Corte: ${corteSel}`)
  if (roupaSel) resumo.push(`Estilo: ${roupaSel}`)

  if (!analise && !erro) {
    return (
      <PageContainer>
        <AppHeader />
        <main className="flex items-center justify-center" style={{ minHeight: 300 }}>
          <div style={{
            width: 36, height: 36, border: '3px solid #1B5E5A',
            borderTopColor: 'transparent', borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </main>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <AppHeader />
      <main className="flex flex-col px-5 py-6 gap-6 pb-10">

        {/* Topo */}
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-gray-400 text-xl">←</button>
          <div className="flex items-center gap-3 flex-1">
            {analise?.foto_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={analise.foto_url}
                alt="Sua foto"
                style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', border: '2px solid #1B5E5A', flexShrink: 0 }}
              />
            )}
            <div>
              <p className="font-extrabold" style={{ fontSize: 18, color: '#171717', lineHeight: 1.2 }}>
                Crie sua imagem
              </p>
              <p style={{ fontSize: 13, color: '#888' }}>Tudo é opcional — combine à vontade</p>
            </div>
          </div>
        </div>

        {erro && (
          <div style={{ backgroundColor: '#fff5f5', borderRadius: 12, padding: '12px 14px', border: '1.5px solid #fca5a5' }}>
            <p style={{ fontSize: 13, color: '#dc2626' }}>{erro}</p>
          </div>
        )}

        {/* ── SEÇÃO: Batom ── */}
        {batons.length > 0 && (
          <section>
            <SecaoTitulo>💄 Batom</SecaoTitulo>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <button
                onClick={() => setBatomSel(null)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '12px',
                  borderRadius: 12, border: `1.5px solid ${!batomSel ? '#1B5E5A' : '#E8E8E8'}`,
                  backgroundColor: !batomSel ? '#E8F5F4' : '#fff', cursor: 'pointer',
                }}
              >
                <div style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: '#F5F5F5', border: '1.5px solid #E0E0E0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 14 }}>✕</span>
                </div>
                <span style={{ fontSize: 13, color: '#666' }}>Nenhum</span>
                {!batomSel && <span style={{ marginLeft: 'auto', color: '#1B5E5A', fontSize: 14 }}>✓</span>}
              </button>

              {batons.map((b) => {
                const sel = batomSel?.nome === b.nome
                return (
                  <button
                    key={b.nome}
                    onClick={() => setBatomSel(sel ? null : b)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '12px',
                      borderRadius: 12, border: `1.5px solid ${sel ? '#1B5E5A' : '#E8E8E8'}`,
                      backgroundColor: sel ? '#E8F5F4' : '#fff', cursor: 'pointer', textAlign: 'left',
                    }}
                  >
                    <Circulo hex={b.hex} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 12, fontWeight: 600, color: '#222', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.nome}</p>
                      <p style={{ fontSize: 11, color: '#888' }}>{b.acabamento}</p>
                    </div>
                    {sel && <span style={{ color: '#1B5E5A', fontSize: 14, flexShrink: 0 }}>✓</span>}
                  </button>
                )
              })}
            </div>
          </section>
        )}

        {/* ── SEÇÃO: Sombra ── */}
        {sombras.length > 0 && (
          <section>
            <SecaoTitulo>👁️ Sombra</SecaoTitulo>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <button
                onClick={() => setSombraSel(null)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '12px',
                  borderRadius: 12, border: `1.5px solid ${!sombraSel ? '#1B5E5A' : '#E8E8E8'}`,
                  backgroundColor: !sombraSel ? '#E8F5F4' : '#fff', cursor: 'pointer',
                }}
              >
                <div style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: '#F5F5F5', border: '1.5px solid #E0E0E0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 14 }}>✕</span>
                </div>
                <span style={{ fontSize: 13, color: '#666' }}>Nenhum</span>
                {!sombraSel && <span style={{ marginLeft: 'auto', color: '#1B5E5A', fontSize: 14 }}>✓</span>}
              </button>

              {sombras.map((s) => {
                const sel = sombraSel?.nome === s.nome
                return (
                  <button
                    key={s.nome}
                    onClick={() => setSombraSel(sel ? null : s)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '12px',
                      borderRadius: 12, border: `1.5px solid ${sel ? '#1B5E5A' : '#E8E8E8'}`,
                      backgroundColor: sel ? '#E8F5F4' : '#fff', cursor: 'pointer', textAlign: 'left',
                    }}
                  >
                    <Circulo hex={s.hex} />
                    <p style={{ fontSize: 12, fontWeight: 600, color: '#222', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1, minWidth: 0 }}>{s.nome}</p>
                    {sel && <span style={{ color: '#1B5E5A', fontSize: 14, flexShrink: 0 }}>✓</span>}
                  </button>
                )
              })}
            </div>
          </section>
        )}

        {/* ── SEÇÃO: Blush ── */}
        {blushs.length > 0 && (
          <section>
            <SecaoTitulo>🌸 Blush</SecaoTitulo>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <button
                onClick={() => setBlushSel(null)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '12px',
                  borderRadius: 12, border: `1.5px solid ${!blushSel ? '#1B5E5A' : '#E8E8E8'}`,
                  backgroundColor: !blushSel ? '#E8F5F4' : '#fff', cursor: 'pointer',
                }}
              >
                <div style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: '#F5F5F5', border: '1.5px solid #E0E0E0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 14 }}>✕</span>
                </div>
                <span style={{ fontSize: 13, color: '#666' }}>Nenhum</span>
                {!blushSel && <span style={{ marginLeft: 'auto', color: '#1B5E5A', fontSize: 14 }}>✓</span>}
              </button>

              {blushs.map((b) => {
                const sel = blushSel?.nome === b.nome
                return (
                  <button
                    key={b.nome}
                    onClick={() => setBlushSel(sel ? null : b)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '12px',
                      borderRadius: 12, border: `1.5px solid ${sel ? '#1B5E5A' : '#E8E8E8'}`,
                      backgroundColor: sel ? '#E8F5F4' : '#fff', cursor: 'pointer', textAlign: 'left',
                    }}
                  >
                    <Circulo hex={b.hex} />
                    <p style={{ fontSize: 12, fontWeight: 600, color: '#222', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1, minWidth: 0 }}>{b.nome}</p>
                    {sel && <span style={{ color: '#1B5E5A', fontSize: 14, flexShrink: 0 }}>✓</span>}
                  </button>
                )
              })}
            </div>
          </section>
        )}

        {/* ── SEÇÃO: Delineado ── */}
        {delineados.length > 0 && (
          <section>
            <SecaoTitulo>✏️ Delineado</SecaoTitulo>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <Chip label="Nenhum" selected={!delineadoSel} onClick={() => setDelineadoSel(null)} />
              {delineados.map((d) => (
                <Chip
                  key={d}
                  label={d}
                  selected={delineadoSel === d}
                  onClick={() => setDelineadoSel(delineadoSel === d ? null : d)}
                />
              ))}
            </div>
          </section>
        )}

        {/* ── SEÇÃO: Corte de cabelo ── */}
        {cortes.length > 0 && (
          <section>
            <SecaoTitulo>✂️ Corte de cabelo</SecaoTitulo>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <Chip label="Nenhum" selected={!corteSel} onClick={() => setCorteSel(null)} />
              {cortes.map((c) => (
                <Chip
                  key={c}
                  label={c}
                  selected={corteSel === c}
                  onClick={() => setCorteSel(corteSel === c ? null : c)}
                />
              ))}
            </div>
          </section>
        )}

        {/* ── SEÇÃO: Estilo de roupa ── */}
        <section>
          <SecaoTitulo>👗 Estilo de roupa</SecaoTitulo>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <Chip label="Sem preferência" selected={!roupaSel} onClick={() => setRoupaSel(null)} />
            {ESTILOS_ROUPA.map((e) => (
              <Chip
                key={e}
                label={e}
                selected={roupaSel === e}
                onClick={() => setRoupaSel(roupaSel === e ? null : e)}
              />
            ))}
          </div>
        </section>

        {/* Resumo */}
        {resumo.length > 0 && (
          <div
            style={{
              backgroundColor: '#F9F9F9', borderRadius: 14,
              padding: '14px 16px', border: '1.5px solid #E8E8E8',
            }}
          >
            <p style={{ fontWeight: 700, fontSize: 13, color: '#1B5E5A', marginBottom: 8 }}>
              ✦ Selecionado
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {resumo.map((item) => (
                <p key={item} style={{ fontSize: 13, color: '#555' }}>{item}</p>
              ))}
            </div>
          </div>
        )}

        {/* Loading gerando */}
        {gerando && (
          <div style={{
            backgroundColor: '#E8F5F4', borderRadius: 16, padding: '20px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
          }}>
            <div style={{
              width: 40, height: 40, border: '3px solid #1B5E5A',
              borderTopColor: 'transparent', borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }} />
            <p style={{ fontSize: 14, color: '#1B5E5A', fontWeight: 600, textAlign: 'center' }}>
              {MENSAGENS_GERANDO[msgIdx]}
            </p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* Botão gerar */}
        {!gerando && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button
              onClick={handleGerar}
              disabled={!analiseId}
              style={{
                width: '100%', padding: '16px', borderRadius: 16, border: 'none',
                backgroundColor: analiseId ? '#1B5E5A' : '#E0E0E0',
                color: analiseId ? '#fff' : '#999',
                fontSize: 16, fontWeight: 700, cursor: analiseId ? 'pointer' : 'not-allowed',
              }}
            >
              ✦ Gerar minha imagem
            </button>
            <p style={{ fontSize: 12, color: '#999', textAlign: 'center' }}>
              Consome 10 créditos · Você tem {creditos} crédito{creditos !== 1 ? 's' : ''} disponíve{creditos !== 1 ? 'is' : 'l'}
            </p>
          </div>
        )}

      </main>
    </PageContainer>
  )
}
