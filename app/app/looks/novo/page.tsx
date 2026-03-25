'use client'

import ReactCrop, { type Crop, type PixelCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { useRef, useState, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import AppHeader from '@/components/ui/AppHeader'
import PageContainer from '@/components/ui/PageContainer'
import { playSuccess, playError } from '@/lib/sound'

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

interface ImagemProcessada {
  blob: Blob
  dataUrl: string
  width: number
  height: number
}

function LooksNovoContent({ publicoInicial }: { publicoInicial: boolean }) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)

  const [viewMode, setViewMode] = useState<ViewMode>('select')
  const [fotoOriginalUrl, setFotoOriginalUrl] = useState<string | null>(null)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [crop, setCrop] = useState<Crop>()
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>()
  const [imagemProcessada, setImagemProcessada] = useState<ImagemProcessada | null>(null)

  const [contexto, setContexto] = useState<Contexto | null>(null)
  const [avaliacao, setAvaliacao] = useState<Avaliacao | null>(null)
  const [descricao, setDescricao] = useState('')
  const [isPublico, setIsPublico] = useState(publicoInicial)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  function handleSelecionarFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setErro('')
    if (fotoOriginalUrl) URL.revokeObjectURL(fotoOriginalUrl)
    const url = URL.createObjectURL(file)
    setFotoOriginalUrl(url)
    setCrop(undefined)
    setCompletedCrop(undefined)
    setIsEditorOpen(true)
    e.target.value = ''
  }

  const aplicarCrop = useCallback(async () => {
    if (!imgRef.current) return
    const image = imgRef.current
    const canvas = document.createElement('canvas')

    // Se não fez crop, usar imagem inteira
    const cropArea: PixelCrop = completedCrop ?? {
      x: 0,
      y: 0,
      width: image.naturalWidth,
      height: image.naturalHeight,
      unit: 'px',
    }

    const scaleX = image.naturalWidth / image.width
    const scaleY = image.naturalHeight / image.height
    let width = cropArea.width * scaleX
    let height = cropArea.height * scaleY

    // Redimensionar para máximo 1080px no lado maior
    const maxSize = 1080
    if (width > maxSize || height > maxSize) {
      if (width > height) {
        height = Math.round(height * maxSize / width)
        width = maxSize
      } else {
        width = Math.round(width * maxSize / height)
        height = maxSize
      }
    }

    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(
      image,
      cropArea.x * scaleX,
      cropArea.y * scaleY,
      cropArea.width * scaleX,
      cropArea.height * scaleY,
      0, 0, width, height
    )

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
    canvas.toBlob((blob) => {
      if (!blob) return
      setImagemProcessada({ blob, dataUrl, width, height })
      setIsEditorOpen(false)
      setViewMode('form')
    }, 'image/jpeg', 0.85)
  }, [completedCrop])

  async function handleSalvar() {
    if (!imagemProcessada) { setErro('Selecione uma foto.'); return }
    setSalvando(true)
    setErro('')

    try {
      const supabase = createClient()

      const { data: { user } } = await supabase.auth.getUser()
      const userId = user?.id
      console.log('1. userId:', userId)
      if (!userId) throw new Error('Usuário não autenticado')

      console.log('2. blob:', imagemProcessada.blob.size, imagemProcessada.blob.type)

      const uuid = crypto.randomUUID()
      const path = `${userId}/${uuid}.jpg`
      console.log('3. path:', path)

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('looks-diario')
        .upload(path, imagemProcessada.blob, {
          contentType: 'image/jpeg',
          upsert: false,
        })
      console.log('4. upload result:', uploadData, uploadError)
      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('looks-diario')
        .getPublicUrl(path)
      console.log('5. publicUrl:', publicUrl)

      const { data: insertData, error: insertError } = await supabase
        .from('looks_diario')
        .insert({
          usuario_id: userId,
          foto_url: publicUrl,
          contexto: contexto ?? null,
          avaliacao: avaliacao ?? null,
          descricao: descricao.trim() || null,
          publico: isPublico,
          largura: imagemProcessada.width,
          altura: imagemProcessada.height,
        })
        .select()
        .single()
      console.log('6. insert result:', insertData, insertError)
      if (insertError) throw insertError

      playSuccess()
      router.push('/app/looks')
    } catch (err) {
      console.error('[looks/novo] Erro:', err)
      playError()
      setErro(err instanceof Error ? err.message : 'Erro ao salvar. Tente novamente.')
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

        {/* Editor de crop — abre sobre a tela de seleção */}
        {isEditorOpen && fotoOriginalUrl && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9999,
              backgroundColor: '#000',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px 0',
            }}
          >
            <div style={{ width: '100%', maxHeight: '72vh', overflow: 'auto', display: 'flex', justifyContent: 'center' }}>
              <ReactCrop
                crop={crop}
                onChange={(c) => setCrop(c)}
                onComplete={(c) => setCompletedCrop(c)}
                // Sem aspect — crop completamente livre
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  ref={imgRef}
                  src={fotoOriginalUrl}
                  style={{ maxWidth: '100%', maxHeight: '70vh', display: 'block' }}
                  alt="Editar foto"
                />
              </ReactCrop>
            </div>

            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 10, textAlign: 'center' }}>
              Arraste para selecionar a área • sem seleção usa a foto inteira
            </p>

            <div style={{ display: 'flex', gap: 12, marginTop: 16, padding: '0 20px', width: '100%', maxWidth: 430 }}>
              <button
                onClick={() => { setIsEditorOpen(false); setFotoOriginalUrl(null) }}
                style={{
                  flex: 1,
                  padding: '14px',
                  borderRadius: 14,
                  border: '1.5px solid rgba(255,255,255,0.3)',
                  backgroundColor: 'transparent',
                  color: '#fff',
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                ← Cancelar
              </button>
              <button
                onClick={aplicarCrop}
                style={{
                  flex: 2,
                  padding: '14px',
                  borderRadius: 14,
                  border: 'none',
                  backgroundColor: '#1B5E5A',
                  color: '#fff',
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                ✓ Usar esta foto
              </button>
            </div>
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
            onClick={() => { setViewMode('select'); setImagemProcessada(null); setIsEditorOpen(false) }}
            style={{ fontSize: 22, color: '#999', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            ←
          </button>
          <h1 className="font-extrabold tracking-tight" style={{ fontSize: 22, color: '#171717' }}>
            Novo look
          </h1>
        </div>

        {/* Preview foto */}
        {imagemProcessada && (
          <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imagemProcessada.dataUrl}
              alt="Preview"
              style={{ width: '100%', height: 'auto', display: 'block' }}
            />
            <button
              onClick={() => { setViewMode('select'); setImagemProcessada(null) }}
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
          onClick={() => setIsPublico((v) => !v)}
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
              backgroundColor: isPublico ? '#1B5E5A' : '#D0D0D0',
              position: 'relative',
              transition: 'background-color 0.2s',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 3,
                left: isPublico ? 21 : 3,
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
