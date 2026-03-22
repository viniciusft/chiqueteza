'use client'

import { useRef, useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Cropper, { Area as CropArea } from 'react-easy-crop'
import { createClient } from '@/lib/supabase/client'
import { invalidateCache } from '@/lib/cache'
import { CACHE_KEYS } from '@/lib/cache/keys'
import imageCompression from 'browser-image-compression'
import AppHeader from '@/components/ui/AppHeader'
import PageContainer from '@/components/ui/PageContainer'
import { getCroppedImg } from './cropUtils'
import { playSuccess, playError } from '@/lib/sound'

type ViewMode = 'select' | 'preview' | 'crop' | 'uploading'

const MENSAGENS_LOADING = [
  'Analisando proporções faciais...',
  'Identificando sua colorimetria...',
  'Preparando seu guia personalizado...',
]

const CHIPS = ['Frontal', 'Rosto próximo', 'Boa iluminação', 'Sem filtros']

function VisagismoUploadContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const force = searchParams.get('force') === 'true'
  const [userId, setUserId] = useState<string | null>(null)
  const cameraRef = useRef<HTMLInputElement>(null)
  const galeriaRef = useRef<HTMLInputElement>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('select')
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropArea | null>(null)
  const [mensagemIdx, setMensagemIdx] = useState(0)
  const [erro, setErro] = useState('')

  useEffect(() => {
    void (async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user?.id ?? null)
    })()
  }, [])

  useEffect(() => {
    if (viewMode !== 'uploading') return
    const interval = setInterval(() => {
      setMensagemIdx((i) => (i + 1) % MENSAGENS_LOADING.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [viewMode])

  async function handleArquivoSelecionado(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setErro('')
    const url = URL.createObjectURL(file)
    setImageSrc(url)
    setViewMode('preview')
    // Reset crop state for if user goes to crop mode
    setCrop({ x: 0, y: 0 })
    setZoom(1)
  }

  async function enviarImagem(compressed: File) {
    const reader = new FileReader()
    reader.readAsDataURL(compressed)
    reader.onload = async () => {
      const result = reader.result as string
      const [header, base64] = result.split(',')
      const mimeType = header.split(':')[1].split(';')[0]

      try {
        const response = await fetch('/api/visagismo/analisar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ foto_base64: base64, mime_type: mimeType, force }),
        })

        if (!response.ok) {
          const data = await response.json() as { error?: string; details?: string }
          const msg = [data.error, data.details].filter(Boolean).join(' — ')
          throw new Error(msg || 'Erro na análise')
        }

        playSuccess()
        if (userId) invalidateCache(CACHE_KEYS.analise(userId))
        router.push('/app/visagismo/resultado')
      } catch (err) {
        playError()
        setErro(err instanceof Error ? err.message : 'Erro ao analisar. Tente novamente.')
        setViewMode('preview')
      }
    }
  }

  async function handleUsarDireto() {
    if (!imageSrc) return
    setErro('')
    setViewMode('uploading')

    try {
      const blob = await fetch(imageSrc).then((r) => r.blob())
      const file = new File([blob], 'foto.jpg', { type: 'image/jpeg' })
      const compressed = await imageCompression(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1000,
        useWebWorker: true,
      })
      await enviarImagem(compressed)
    } catch {
      playError()
      setErro('Erro ao processar a foto. Tente outra.')
      setViewMode('preview')
    }
  }

  async function handleConfirmarCrop() {
    if (!imageSrc || !croppedAreaPixels) return
    setErro('')
    setViewMode('uploading')

    try {
      const blob = await getCroppedImg(imageSrc, croppedAreaPixels)
      const file = new File([blob], 'foto.jpg', { type: 'image/jpeg' })
      const compressed = await imageCompression(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1000,
        useWebWorker: true,
      })
      await enviarImagem(compressed)
    } catch {
      playError()
      setErro('Erro ao processar a foto. Tente outra.')
      setViewMode('crop')
    }
  }

  // Modo uploading
  if (viewMode === 'uploading') {
    return (
      <PageContainer>
        <AppHeader />
        <main
          style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            minHeight: '70vh', gap: 20, padding: '0 24px',
          }}
        >
          <div
            style={{
              width: 56, height: 56, border: '4px solid #1B5E5A',
              borderTopColor: 'transparent', borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }}
          />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ fontSize: 16, color: '#1B5E5A', fontWeight: 700, textAlign: 'center' }}>
            {MENSAGENS_LOADING[mensagemIdx]}
          </p>
        </main>
      </PageContainer>
    )
  }

  // Modo preview
  if (viewMode === 'preview') {
    return (
      <div style={{ position: 'fixed', inset: 0, backgroundColor: '#000', zIndex: 50, display: 'flex', flexDirection: 'column' }}>
        {/* Foto */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          {imageSrc && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageSrc}
              alt="Pré-visualização"
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
            />
          )}
        </div>

        {/* Controles */}
        <div
          style={{
            backgroundColor: '#111', padding: '20px 24px 40px',
            display: 'flex', flexDirection: 'column', gap: 16,
          }}
        >
          <p style={{ fontSize: 16, color: '#fff', fontWeight: 700, textAlign: 'center' }}>
            Esta foto está boa?
          </p>
          <p style={{ fontSize: 13, color: '#999', textAlign: 'center', marginTop: -8 }}>
            Rosto frontal, bem iluminado e sem filtros
          </p>

          {erro && (
            <p style={{ fontSize: 13, color: '#f87171', textAlign: 'center' }}>{erro}</p>
          )}

          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={() => {
                setViewMode('crop')
                setCroppedAreaPixels(null)
              }}
              style={{
                flex: 1, padding: '14px', borderRadius: 14,
                border: '1.5px solid #555', backgroundColor: 'transparent',
                color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer',
              }}
            >
              Ajustar / Recortar
            </button>
            <button
              onClick={handleUsarDireto}
              style={{
                flex: 2, padding: '14px', borderRadius: 14, border: 'none',
                backgroundColor: '#1B5E5A', color: '#fff',
                fontSize: 15, fontWeight: 700, cursor: 'pointer',
              }}
            >
              ✓ Usar esta foto
            </button>
          </div>

          <button
            onClick={() => { setViewMode('select'); setImageSrc(null) }}
            style={{
              padding: '12px', borderRadius: 14,
              border: 'none', backgroundColor: 'transparent',
              color: '#888', fontSize: 14, cursor: 'pointer',
            }}
          >
            ← Escolher outra foto
          </button>
        </div>
      </div>
    )
  }

  // Modo crop
  if (viewMode === 'crop') {
    return (
      <div style={{ position: 'fixed', inset: 0, backgroundColor: '#000', zIndex: 50 }}>
        {/* Área do Cropper */}
        <div style={{ position: 'absolute', inset: 0, bottom: 200 }}>
          {imageSrc && (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              rotation={0}
              minZoom={0.5}
              maxZoom={3}
              cropShape="rect"
              showGrid={false}
              restrictPosition={false}
              objectFit="contain"
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={(_: unknown, pixels: CropArea) => setCroppedAreaPixels(pixels)}
            />
          )}
        </div>

        {/* Controles */}
        <div
          style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            backgroundColor: '#111', padding: '20px 24px 40px',
            display: 'flex', flexDirection: 'column', gap: 16,
          }}
        >
          <p style={{ fontSize: 12, color: '#999', textAlign: 'center' }}>
            Arraste para posicionar • Pinch para zoom
          </p>

          <input
            type="range"
            min={0.8}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            style={{ width: '100%', accentColor: '#1B5E5A' }}
          />

          {erro && (
            <p style={{ fontSize: 13, color: '#f87171', textAlign: 'center' }}>{erro}</p>
          )}

          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={() => setViewMode('preview')}
              style={{
                flex: 1, padding: '14px', borderRadius: 14,
                border: '1.5px solid #555', backgroundColor: 'transparent',
                color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer',
              }}
            >
              ← Voltar
            </button>
            <button
              onClick={handleConfirmarCrop}
              style={{
                flex: 2, padding: '14px', borderRadius: 14, border: 'none',
                backgroundColor: '#1B5E5A', color: '#fff',
                fontSize: 15, fontWeight: 700, cursor: 'pointer',
              }}
            >
              ✓ Confirmar e analisar
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Modo select (padrão)
  return (
    <PageContainer>
      <AppHeader />
      <main className="flex flex-col px-5 py-6 gap-6">

        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-gray-400 text-xl">←</button>
          <h1 className="font-extrabold tracking-tight" style={{ fontSize: 22, color: '#171717' }}>
            Sua foto
          </h1>
        </div>

        {/* Chips de regras */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {CHIPS.map((chip) => (
            <span
              key={chip}
              style={{
                fontSize: 12, fontWeight: 600,
                backgroundColor: '#E8F5F4', color: '#1B5E5A',
                borderRadius: 20, padding: '6px 14px',
              }}
            >
              {chip}
            </span>
          ))}
        </div>

        {/* Dois cards de escolha */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Câmera */}
          <button
            onClick={() => cameraRef.current?.click()}
            style={{
              display: 'flex', alignItems: 'center', gap: 16,
              borderRadius: 20, border: '2px solid #1B5E5A',
              backgroundColor: '#1B5E5A',
              padding: '20px 24px',
              cursor: 'pointer', textAlign: 'left',
            }}
          >
            <span style={{ fontSize: 36 }}>📷</span>
            <div>
              <p style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 2 }}>
                Tirar foto agora
              </p>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
                Use a câmera do celular
              </p>
            </div>
          </button>

          {/* Galeria */}
          <button
            onClick={() => galeriaRef.current?.click()}
            style={{
              display: 'flex', alignItems: 'center', gap: 16,
              borderRadius: 20, border: '2px solid #E8E8E8',
              backgroundColor: '#fff',
              padding: '20px 24px',
              cursor: 'pointer', textAlign: 'left',
            }}
          >
            <span style={{ fontSize: 36 }}>🖼️</span>
            <div>
              <p style={{ fontSize: 16, fontWeight: 700, color: '#171717', marginBottom: 2 }}>
                Escolher da galeria
              </p>
              <p style={{ fontSize: 13, color: '#999' }}>
                Selecione uma foto existente
              </p>
            </div>
          </button>
        </div>

        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="user"
          className="hidden"
          onChange={handleArquivoSelecionado}
        />
        <input
          ref={galeriaRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleArquivoSelecionado}
        />

      </main>
    </PageContainer>
  )
}

export default function VisagismoUploadPage() {
  return (
    <Suspense>
      <VisagismoUploadContent />
    </Suspense>
  )
}
