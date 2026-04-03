'use client'

import { useRef, useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Cropper, { Area as CropArea } from 'react-easy-crop'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { invalidateCache } from '@/lib/cache'
import { CACHE_KEYS } from '@/lib/cache/keys'
import imageCompression from 'browser-image-compression'
import AppHeader from '@/components/ui/AppHeader'
import PageContainer from '@/components/ui/PageContainer'
import { getCroppedImg } from './cropUtils'
import { playSuccess, playError } from '@/lib/sound'

type ViewMode = 'select' | 'preview' | 'crop' | 'uploading'

const ETAPAS_LOADING = [
  { emoji: '🔍', titulo: 'Lendo seu rosto...', detalhe: 'Identificando formato e proporções faciais' },
  { emoji: '🎨', titulo: 'Descobrindo suas cores...', detalhe: 'Analisando subtom, olhos e cabelo' },
  { emoji: '💄', titulo: 'Montando sua paleta...', detalhe: 'Selecionando tons de batom, sombra e blush' },
  { emoji: '✨', titulo: 'Finalizando seu perfil...', detalhe: 'Gerando seu guia de beleza personalizado' },
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
      setMensagemIdx((i) => Math.min(i + 1, ETAPAS_LOADING.length - 1))
    }, 4000)
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

  // Modo uploading — tela narrativa animada
  if (viewMode === 'uploading') {
    const etapaAtual = ETAPAS_LOADING[mensagemIdx]
    return (
      <PageContainer>
        <AppHeader />
        <main
          style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            minHeight: '75vh', gap: 32, padding: '0 28px',
          }}
        >
          {/* Spinner decorativo */}
          <div style={{ position: 'relative', width: 80, height: 80 }}>
            <div style={{
              position: 'absolute', inset: 0,
              border: '3px solid var(--color-ever-green-light)',
              borderRadius: '50%',
            }} />
            <div style={{
              position: 'absolute', inset: 0,
              border: '3px solid transparent',
              borderTopColor: 'var(--color-ever-green)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28,
            }}>
              <AnimatePresence mode="wait">
                <motion.span
                  key={mensagemIdx}
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.6 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                >
                  {etapaAtual.emoji}
                </motion.span>
              </AnimatePresence>
            </div>
          </div>

          {/* Texto animado */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, textAlign: 'center' }}>
            <AnimatePresence mode="wait">
              <motion.p
                key={`titulo-${mensagemIdx}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                style={{
                  fontSize: 20, fontWeight: 700, color: 'var(--color-ever-green)',
                  fontFamily: 'var(--font-display)', lineHeight: 1.2,
                }}
              >
                {etapaAtual.titulo}
              </motion.p>
            </AnimatePresence>
            <AnimatePresence mode="wait">
              <motion.p
                key={`detalhe-${mensagemIdx}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                style={{ fontSize: 14, color: 'var(--foreground-muted)', lineHeight: 1.5, maxWidth: 280 }}
              >
                {etapaAtual.detalhe}
              </motion.p>
            </AnimatePresence>
          </div>

          {/* Barra de progresso por etapas */}
          <div style={{ display: 'flex', gap: 8 }}>
            {ETAPAS_LOADING.map((_, i) => (
              <motion.div
                key={i}
                animate={{
                  backgroundColor: i <= mensagemIdx ? 'var(--color-ever-green)' : 'var(--color-ever-green-light)',
                  width: i === mensagemIdx ? 28 : 8,
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                style={{ height: 8, borderRadius: 4 }}
              />
            ))}
          </div>

          <p style={{ fontSize: 12, color: 'var(--foreground-subtle)', textAlign: 'center', maxWidth: 240 }}>
            A análise leva cerca de 30 segundos — não feche o app
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
          <p style={{ fontSize: 13, color: '#767676', textAlign: 'center', marginTop: -8 }}>
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
              color: '#666', fontSize: 14, cursor: 'pointer',
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
          <p style={{ fontSize: 12, color: '#767676', textAlign: 'center' }}>
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
              <p style={{ fontSize: 13, color: '#767676' }}>
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
