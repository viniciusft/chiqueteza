'use client'

import dynamic from 'next/dynamic'
import { useRef, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import AppHeader from '@/components/ui/AppHeader'
import PageContainer from '@/components/ui/PageContainer'
import { playSuccess, playError } from '@/lib/sound'

// Filerobot é client-only (acessa window) — SSR desativado
// Importar TABS/TOOLS estaticamente puxaria o módulo no servidor e causaria
// "window is not defined". Solução: dynamic import e strings inline.
const FilerobotImageEditor = dynamic(
  () => import('react-filerobot-image-editor').then((m) => m.default),
  { ssr: false }
)
// Valores de TABS.ADJUST e TOOLS.CROP extraídos das tipagens do pacote
const TAB_ADJUST = 'Adjust'
const TOOL_CROP = 'Crop'

type ViewMode = 'select' | 'form'
type Contexto = 'dia_casual' | 'dia_formal' | 'noite_casual' | 'noite_especial'
type Avaliacao = 'amei' | 'ok' | 'nao_gostei'

const CONTEXTOS: { value: Contexto; label: string; emoji: string }[] = [
  { value: 'dia_casual', label: 'Dia casual', emoji: '☀️' },
  { value: 'dia_formal', label: 'Dia formal', emoji: '👔' },
  { value: 'noite_casual', label: 'Noite casual', emoji: '🌙' },
  { value: 'noite_especial', label: 'Noite especial', emoji: '✨' },
]

const AVALIACOES: { value: Avaliacao; label: string; emoji: string }[] = [
  { value: 'amei', label: 'Amei', emoji: '😍' },
  { value: 'ok', label: 'Ok', emoji: '😊' },
  { value: 'nao_gostei', label: 'Não gostei', emoji: '😕' },
]

interface FotoProcessada {
  dataUrl: string
  blob: Blob
  largura: number
  altura: number
}

/** Converte base64 (com ou sem prefixo data:) para Blob e redimensiona para máx 1080px */
async function processarImagem(imageBase64: string): Promise<FotoProcessada> {
  const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64
  const byteCharacters = atob(base64Data)
  const byteNumbers = new Uint8Array(byteCharacters.length)
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i)
  }
  const blob = new Blob([byteNumbers], { type: 'image/jpeg' })

  // Redimensionar para máx 1080px no lado maior
  const img = new Image()
  img.src = URL.createObjectURL(blob)
  await new Promise<void>((resolve) => { img.onload = () => resolve() })

  const MAX = 1080
  let { width, height } = img
  if (width > MAX || height > MAX) {
    if (width > height) {
      height = Math.round(height * MAX / width)
      width = MAX
    } else {
      width = Math.round(width * MAX / height)
      height = MAX
    }
  }

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  canvas.getContext('2d')!.drawImage(img, 0, 0, width, height)
  URL.revokeObjectURL(img.src)

  const finalBlob = await new Promise<Blob>((resolve) => {
    canvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.85)
  })

  const dataUrl = canvas.toDataURL('image/jpeg', 0.85)

  return { dataUrl, blob: finalBlob, largura: width, altura: height }
}

function LooksNovoContent({ publicoInicial }: { publicoInicial: boolean }) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  const [viewMode, setViewMode] = useState<ViewMode>('select')
  const [fotoOriginalUrl, setFotoOriginalUrl] = useState<string | null>(null)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [foto, setFoto] = useState<FotoProcessada | null>(null)

  const [contexto, setContexto] = useState<Contexto | null>(null)
  const [avaliacao, setAvaliacao] = useState<Avaliacao | null>(null)
  const [descricao, setDescricao] = useState('')
  const [publico, setPublico] = useState(publicoInicial)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  function handleSelecionarFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setErro('')
    if (fotoOriginalUrl) URL.revokeObjectURL(fotoOriginalUrl)
    const url = URL.createObjectURL(file)
    setFotoOriginalUrl(url)
    setIsEditorOpen(true)
    e.target.value = ''
  }

  async function handleSalvar() {
    if (!foto) { setErro('Selecione uma foto.'); return }
    setSalvando(true)
    setErro('')

    try {
      const supabase = createClient()

      // A) Obter userId
      const { data: { user } } = await supabase.auth.getUser()
      const userId = user?.id
      console.log('1. userId:', userId)
      if (!userId) throw new Error('Usuário não autenticado')

      // B) Blob já processado
      console.log('2. blob:', foto.blob.size, foto.blob.type)

      // C) Path do upload
      const uuid = crypto.randomUUID()
      const path = `${userId}/${uuid}.jpg`
      console.log('3. path:', path)

      // D) Upload para storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('looks-diario')
        .upload(path, foto.blob, {
          contentType: 'image/jpeg',
          upsert: false,
        })
      console.log('4. upload result:', uploadData, uploadError)
      if (uploadError) throw uploadError

      // E) URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('looks-diario')
        .getPublicUrl(path)
      console.log('5. publicUrl:', publicUrl)

      // F) Insert no banco
      const { data: insertData, error: insertError } = await supabase
        .from('looks_diario')
        .insert({
          usuario_id: userId,
          foto_url: publicUrl,
          contexto: contexto ?? null,
          avaliacao: avaliacao ?? null,
          descricao: descricao.trim() || null,
          publico,
          largura: foto.largura,
          altura: foto.altura,
          aspect_ratio: parseFloat((foto.largura / foto.altura).toFixed(4)),
        })
        .select()
        .single()
      console.log('6. insert result:', insertData, insertError)
      if (insertError) throw insertError

      playSuccess()
      router.push('/app/looks')
    } catch (err) {
      console.error('[looks/novo] Erro ao salvar:', err)
      playError()
      const msg = err instanceof Error ? err.message : 'Erro ao salvar. Tente novamente.'
      setErro(msg)
      setSalvando(false)
    }
  }

  // ── Tela: selecionar foto ─────────────────────────────────────────────
  if (viewMode === 'select') {
    return (
      <PageContainer>
        <AppHeader />
        <main className="flex flex-col px-5 py-6 gap-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              style={{ fontSize: 22, color: '#999', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              ←
            </button>
            <h1 className="font-extrabold tracking-tight" style={{ fontSize: 22, color: '#171717' }}>
              Novo look
            </h1>
          </div>

          <button
            onClick={() => inputRef.current?.click()}
            style={{
              width: '100%',
              aspectRatio: '1',
              borderRadius: 20,
              border: '2px dashed #D0D0D0',
              backgroundColor: '#F5F5F5',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
            }}
          >
            <span style={{ fontSize: 48 }}>📸</span>
            <p style={{ fontSize: 15, color: '#999', fontWeight: 600 }}>Toque para selecionar foto</p>
            <p style={{ fontSize: 12, color: '#bbb' }}>Câmera ou galeria</p>
          </button>

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleSelecionarFoto}
          />

          {erro && <p style={{ fontSize: 13, color: '#f87171', textAlign: 'center' }}>{erro}</p>}
        </main>

        {/* Editor Filerobot — abre sobre a tela de seleção */}
        {isEditorOpen && fotoOriginalUrl && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 9999 }}>
            <FilerobotImageEditor
              source={fotoOriginalUrl}
              onSave={async (editedImage) => {
                try {
                  if (!editedImage.imageBase64) throw new Error('Imagem não gerada')
                  const processada = await processarImagem(editedImage.imageBase64)
                  setFoto(processada)
                  setIsEditorOpen(false)
                  setViewMode('form')
                } catch (err) {
                  console.error('[filerobot onSave]', err)
                  setErro('Erro ao processar imagem.')
                  setIsEditorOpen(false)
                }
              }}
              onClose={() => {
                setIsEditorOpen(false)
                setFotoOriginalUrl(null)
              }}
              tabsIds={[TAB_ADJUST]}
              defaultTabId={TAB_ADJUST}
              defaultToolId={TOOL_CROP}
              Crop={{
                noPresets: true,
                ratio: 'custom',
              }}
              savingPixelRatio={2}
              previewPixelRatio={1}
            />
          </div>
        )}
      </PageContainer>
    )
  }

  // ── Tela: formulário ──────────────────────────────────────────────────
  return (
    <PageContainer>
      <AppHeader />
      <main className="flex flex-col px-5 py-6 gap-6">

        <div className="flex items-center gap-3">
          <button
            onClick={() => { setViewMode('select'); setFoto(null); setIsEditorOpen(false) }}
            style={{ fontSize: 22, color: '#999', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            ←
          </button>
          <h1 className="font-extrabold tracking-tight" style={{ fontSize: 22, color: '#171717' }}>
            Novo look
          </h1>
        </div>

        {/* Preview foto */}
        {foto && (
          <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={foto.dataUrl}
              alt="Preview"
              style={{ width: '100%', height: 'auto', display: 'block' }}
            />
            <button
              onClick={() => { setViewMode('select'); setFoto(null) }}
              style={{
                position: 'absolute',
                top: 10,
                right: 10,
                backgroundColor: 'rgba(0,0,0,0.55)',
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                padding: '6px 12px',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Trocar foto
            </button>
          </div>
        )}

        {/* Contexto */}
        <div className="flex flex-col gap-3">
          <p className="font-bold" style={{ fontSize: 14, color: '#171717' }}>Contexto</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {CONTEXTOS.map((c) => {
              const ativo = contexto === c.value
              return (
                <button
                  key={c.value}
                  onClick={() => setContexto(ativo ? null : c.value)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '12px 14px',
                    borderRadius: 14,
                    border: `1.5px solid ${ativo ? '#1B5E5A' : '#E8E8E8'}`,
                    backgroundColor: ativo ? '#E8F5F4' : '#fff',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  <span style={{ fontSize: 20 }}>{c.emoji}</span>
                  <span style={{ fontSize: 13, fontWeight: ativo ? 700 : 500, color: ativo ? '#1B5E5A' : '#444' }}>
                    {c.label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Avaliação */}
        <div className="flex flex-col gap-3">
          <p className="font-bold" style={{ fontSize: 14, color: '#171717' }}>Como ficou?</p>
          <div style={{ display: 'flex', gap: 10 }}>
            {AVALIACOES.map((a) => {
              const ativo = avaliacao === a.value
              return (
                <button
                  key={a.value}
                  onClick={() => setAvaliacao(ativo ? null : a.value)}
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 6,
                    padding: '12px 8px',
                    borderRadius: 14,
                    border: `1.5px solid ${ativo ? '#1B5E5A' : '#E8E8E8'}`,
                    backgroundColor: ativo ? '#E8F5F4' : '#fff',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  <span style={{ fontSize: 26 }}>{a.emoji}</span>
                  <span style={{ fontSize: 12, fontWeight: ativo ? 700 : 500, color: ativo ? '#1B5E5A' : '#666' }}>
                    {a.label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Legenda */}
        <div className="flex flex-col gap-2">
          <textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value.slice(0, 200))}
            placeholder="Adicione uma legenda... (opcional)"
            rows={3}
            style={{
              width: '100%',
              borderRadius: 14,
              border: '1.5px solid #E8E8E8',
              padding: '12px 14px',
              fontSize: 14,
              color: '#171717',
              resize: 'none',
              outline: 'none',
              fontFamily: 'inherit',
              boxSizing: 'border-box',
              backgroundColor: '#fff',
            }}
          />
          <p style={{ fontSize: 11, color: '#bbb', textAlign: 'right' }}>{descricao.length}/200</p>
        </div>

        {/* Toggle público */}
        <button
          onClick={() => setPublico((v) => !v)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 16px',
            borderRadius: 16,
            border: '1.5px solid #E8E8E8',
            backgroundColor: '#fff',
            cursor: 'pointer',
          }}
        >
          <div className="flex flex-col items-start gap-1">
            <span style={{ fontSize: 14, fontWeight: 700, color: '#171717' }}>Compartilhar na galeria pública</span>
            <span style={{ fontSize: 12, color: '#999' }}>Inspire outras mulheres com seu look</span>
          </div>
          <div
            style={{
              width: 46,
              height: 28,
              borderRadius: 14,
              backgroundColor: publico ? '#1B5E5A' : '#D0D0D0',
              position: 'relative',
              transition: 'background-color 0.2s',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 3,
                left: publico ? 21 : 3,
                width: 22,
                height: 22,
                borderRadius: '50%',
                backgroundColor: '#fff',
                transition: 'left 0.2s',
                boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
              }}
            />
          </div>
        </button>

        {erro && (
          <p style={{ fontSize: 13, color: '#f87171', textAlign: 'center' }}>{erro}</p>
        )}

        {/* Botão salvar */}
        <button
          onClick={handleSalvar}
          disabled={salvando}
          style={{
            width: '100%',
            padding: '16px',
            borderRadius: 16,
            border: 'none',
            backgroundColor: salvando ? '#A0C4C2' : '#1B5E5A',
            color: '#fff',
            fontSize: 16,
            fontWeight: 700,
            cursor: salvando ? 'not-allowed' : 'pointer',
            marginBottom: 24,
          }}
        >
          {salvando ? 'Salvando...' : 'Salvar look'}
        </button>

      </main>
    </PageContainer>
  )
}

export default function LooksNovoPage() {
  return (
    <Suspense fallback={null}>
      <LooksNovoInner />
    </Suspense>
  )
}

function LooksNovoInner() {
  const searchParams = useSearchParams()
  const publicoInicial = searchParams.get('publico') === 'true'
  return <LooksNovoContent publicoInicial={publicoInicial} />
}
