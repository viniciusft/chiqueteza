'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import AppHeader from '@/components/ui/AppHeader'
import PageContainer from '@/components/ui/PageContainer'
import { playSuccess, playError } from '@/lib/sound'

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

async function compressImage(file: File, maxPx = 800, quality = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const { width, height } = img
      const scale = Math.min(1, maxPx / Math.max(width, height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(width * scale)
      canvas.height = Math.round(height * scale)
      const ctx = canvas.getContext('2d')
      if (!ctx) { reject(new Error('canvas context')); return }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = reject
    img.src = url
  })
}

export default function LooksNovoPage() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  const [preview, setPreview] = useState<string | null>(null)
  const [fotoBase64, setFotoBase64] = useState<string | null>(null)
  const [contexto, setContexto] = useState<Contexto | null>(null)
  const [avaliacao, setAvaliacao] = useState<Avaliacao | null>(null)
  const [descricao, setDescricao] = useState('')
  const [publico, setPublico] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  async function handleArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setErro('')
    try {
      const dataUrl = await compressImage(file)
      setPreview(dataUrl)
      setFotoBase64(dataUrl)
    } catch {
      setErro('Erro ao processar a foto.')
    }
  }

  async function handleSalvar() {
    if (!fotoBase64) { setErro('Selecione uma foto.'); return }
    setSalvando(true)
    setErro('')

    try {
      const res = await fetch('/api/looks/novo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          foto_base64: fotoBase64,
          contexto: contexto ?? null,
          avaliacao: avaliacao ?? null,
          descricao: descricao.trim() || null,
          publico,
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
      setErro(err instanceof Error ? err.message : 'Erro ao salvar. Tente novamente.')
      setSalvando(false)
    }
  }

  return (
    <PageContainer>
      <AppHeader />
      <main className="flex flex-col px-5 py-6 gap-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-gray-400 text-xl">←</button>
          <h1 className="font-extrabold tracking-tight" style={{ fontSize: 22, color: '#171717' }}>
            Novo look
          </h1>
        </div>

        {/* Upload da foto */}
        <button
          onClick={() => inputRef.current?.click()}
          style={{
            width: '100%',
            aspectRatio: '1',
            borderRadius: 20,
            border: preview ? 'none' : '2px dashed #D0D0D0',
            backgroundColor: preview ? 'transparent' : '#F5F5F5',
            overflow: 'hidden',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt="Preview do look"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <div className="flex flex-col items-center gap-2">
              <span style={{ fontSize: 40 }}>📸</span>
              <p style={{ fontSize: 14, color: '#999', fontWeight: 600 }}>Toque para adicionar foto</p>
            </div>
          )}
          {preview && (
            <div
              style={{
                position: 'absolute',
                bottom: 12,
                right: 12,
                backgroundColor: 'rgba(0,0,0,0.55)',
                borderRadius: 10,
                padding: '6px 12px',
                fontSize: 12,
                color: '#fff',
                fontWeight: 600,
              }}
            >
              Trocar foto
            </div>
          )}
        </button>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleArquivo}
        />

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
                    gap: 4,
                    padding: '12px 8px',
                    borderRadius: 14,
                    border: `1.5px solid ${ativo ? '#1B5E5A' : '#E8E8E8'}`,
                    backgroundColor: ativo ? '#E8F5F4' : '#fff',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  <span style={{ fontSize: 24 }}>{a.emoji}</span>
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
          <p className="font-bold" style={{ fontSize: 14, color: '#171717' }}>Legenda <span style={{ color: '#999', fontWeight: 400 }}>(opcional)</span></p>
          <textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value.slice(0, 200))}
            placeholder="Adicione uma legenda..."
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
            }}
          />
          <p style={{ fontSize: 11, color: '#999', textAlign: 'right' }}>{descricao.length}/200</p>
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
          <div className="flex flex-col items-start gap-0.5">
            <span style={{ fontSize: 14, fontWeight: 700, color: '#171717' }}>Compartilhar na galeria pública</span>
            <span style={{ fontSize: 12, color: '#999' }}>Outras usuárias poderão ver e curtir</span>
          </div>
          <div
            style={{
              width: 44,
              height: 26,
              borderRadius: 13,
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
                width: 20,
                height: 20,
                borderRadius: '50%',
                backgroundColor: '#fff',
                transition: 'left 0.2s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
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
          disabled={salvando || !fotoBase64}
          style={{
            width: '100%',
            padding: '16px',
            borderRadius: 16,
            border: 'none',
            backgroundColor: salvando || !fotoBase64 ? '#A0C4C2' : '#1B5E5A',
            color: '#fff',
            fontSize: 16,
            fontWeight: 700,
            cursor: salvando || !fotoBase64 ? 'not-allowed' : 'pointer',
            marginBottom: 24,
          }}
        >
          {salvando ? 'Salvando...' : 'Salvar look'}
        </button>

      </main>
    </PageContainer>
  )
}
