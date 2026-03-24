'use client'

import { useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Cropper, { Area as CropArea } from 'react-easy-crop'
import AppHeader from '@/components/ui/AppHeader'
import PageContainer from '@/components/ui/PageContainer'
import { getCroppedImg } from '../cropUtils'
import { playSuccess, playError } from '@/lib/sound'
import { Suspense } from 'react'

type ViewMode = 'select' | 'crop' | 'form'
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
  aspect_ratio: number
}

function LooksNovoContent({ publico: publicoInicial }: { publico: boolean }) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  const [viewMode, setViewMode] = useState<ViewMode>('select')
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropArea | null>(null)
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
    const url = URL.createObjectURL(file)
    setImageSrc(url)
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setViewMode('crop')
    // Limpar input para permitir re-seleção
    e.target.value = ''
  }

  async function handleConfirmarCrop() {
    if (!imageSrc || !croppedAreaPixels) return
    setErro('')
    try {
      const result = await getCroppedImg(imageSrc, croppedAreaPixels)
      setFoto(result)
      setViewMode('form')
    } catch {
      setErro('Erro ao processar a foto.')
    }
  }

  async function handleSalvar() {
    if (!foto) { setErro('Selecione uma foto.'); return }
    setSalvando(true)
    setErro('')

    try {
      // Converter blob para base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(foto.blob)
      })

      const res = await fetch('/api/looks/novo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          foto_base64: base64,
          contexto: contexto ?? null,
          avaliacao: avaliacao ?? null,
          descricao: descricao.trim() || null,
          publico,
          largura: foto.largura,
          altura: foto.altura,
          aspect_ratio: foto.aspect_ratio,
        }),
      })

      if (!res.ok) {
        const data = await res.json() as { error?: string }
        throw new Error(data.error ?? 'Erro ao salvar')
      }

      playSuccess()
      router.push('/app/looks')
    } catch (err) {
      playError()
      setErro(err instanceof Error ? err.message : 'Erro ao salvar.')
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
            <button onClick={() => router.back()} style={{ fontSize: 22, color: '#999', background: 'none', border: 'none', cursor: 'pointer' }}>←</button>
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
      </PageContainer>
    )
  }

  // ── Tela: cropper ─────────────────────────────────────────────────────
  if (viewMode === 'crop' && imageSrc) {
    return (
      <div style={{ position: 'fixed', inset: 0, backgroundColor: '#000', display: 'flex', flexDirection: 'column', zIndex: 100 }}>
        {/* Área do cropper */}
        <div style={{ flex: 1, position: 'relative' }}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            // Sem aspect — crop livre
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={(_: CropArea, croppedPixels: CropArea) => setCroppedAreaPixels(croppedPixels)}
            style={{
              containerStyle: { backgroundColor: '#000' },
              cropAreaStyle: { borderRadius: 8 },
            }}
          />
        </div>

        {/* Controles de zoom */}
        <div style={{ padding: '12px 20px', backgroundColor: 'rgba(0,0,0,0.8)' }}>
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            style={{ width: '100%', accentColor: '#1B5E5A' }}
          />
        </div>

        {/* Botões */}
        <div
          style={{
            display: 'flex',
            gap: 10,
            padding: '12px 20px 32px',
            backgroundColor: 'rgba(0,0,0,0.8)',
          }}
        >
          <button
            onClick={() => { setViewMode('select'); setImageSrc(null) }}
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
            ← Trocar foto
          </button>
          <button
            onClick={handleConfirmarCrop}
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

        {erro && (
          <p style={{ padding: '0 20px 12px', fontSize: 13, color: '#f87171', textAlign: 'center' }}>{erro}</p>
        )}
      </div>
    )
  }

  // ── Tela: formulário ──────────────────────────────────────────────────
  return (
    <PageContainer>
      <AppHeader />
      <main className="flex flex-col px-5 py-6 gap-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setViewMode('crop')}
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
  return <LooksNovoContent publico={publicoInicial} />
}
