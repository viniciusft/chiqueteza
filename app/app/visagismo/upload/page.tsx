'use client'

import { useRef, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Cropper, { Area as CropArea } from 'react-easy-crop'
import imageCompression from 'browser-image-compression'
import AppHeader from '@/components/ui/AppHeader'
import PageContainer from '@/components/ui/PageContainer'
import { getCroppedImg } from './cropUtils'
import { playSuccess, playError } from '@/lib/sound'

type ViewMode = 'select' | 'crop' | 'uploading'

const MENSAGENS_LOADING = [
  'Analisando proporções faciais...',
  'Identificando sua colorimetria...',
  'Preparando seu guia personalizado...',
]

const CHIPS = ['Frontal', 'Rosto próximo', 'Boa iluminação', 'Sem filtros']

export default function VisagismoUploadPage() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('select')
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropArea | null>(null)
  const [mensagemIdx, setMensagemIdx] = useState(0)
  const [erro, setErro] = useState('')

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
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setViewMode('crop')
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
            body: JSON.stringify({ foto_base64: base64, mime_type: mimeType }),
          })

          if (!response.ok) {
            const data = await response.json()
            throw new Error(data.error ?? 'Erro na análise')
          }

          playSuccess()
          router.push('/app/visagismo/resultado')
        } catch (err) {
          playError()
          setErro(err instanceof Error ? err.message : 'Erro ao analisar. Tente novamente.')
          setViewMode('crop')
        }
      }
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
              onClick={() => { setViewMode('select'); setImageSrc(null) }}
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
              Usar esta foto →
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

        {/* Área clicável */}
        <div
          onClick={() => inputRef.current?.click()}
          style={{
            borderRadius: 20,
            border: '2px dashed #D0D0D0',
            backgroundColor: '#F9F9F9',
            height: 280,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            gap: 10,
          }}
        >
          <span style={{ fontSize: 48 }}>📷</span>
          <p style={{ fontSize: 15, fontWeight: 700, color: '#333' }}>
            Toque para escolher uma foto
          </p>
          <p style={{ fontSize: 13, color: '#999' }}>
            Use uma foto frontal com boa iluminação
          </p>
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

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="user"
          className="hidden"
          onChange={handleArquivoSelecionado}
        />

      </main>
    </PageContainer>
  )
}
