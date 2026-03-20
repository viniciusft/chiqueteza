'use client'

import { useRef, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import imageCompression from 'browser-image-compression'
import AppHeader from '@/components/ui/AppHeader'
import PageContainer from '@/components/ui/PageContainer'

const MENSAGENS_LOADING = [
  'Analisando proporções faciais...',
  'Identificando sua colorimetria...',
  'Montando seu guia de maquiagem...',
]

const REGRAS = [
  { icon: '👁️', texto: 'Rosto frontal e centralizado' },
  { icon: '📸', texto: 'Rosto próximo, não foto de corpo inteiro' },
  { icon: '☀️', texto: 'Boa iluminação, sem sombras fortes' },
  { icon: '🚫', texto: 'Sem filtros, óculos de sol ou chapéu' },
]

export default function VisagismoUploadPage() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [arquivoComprimido, setArquivoComprimido] = useState<File | null>(null)
  const [analisando, setAnalisando] = useState(false)
  const [mensagemIdx, setMensagemIdx] = useState(0)
  const [erro, setErro] = useState('')
  const [comprimindo, setComprimindo] = useState(false)

  useEffect(() => {
    if (!analisando) return
    const interval = setInterval(() => {
      setMensagemIdx((i) => (i + 1) % MENSAGENS_LOADING.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [analisando])

  async function handleArquivoSelecionado(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setErro('')
    setComprimindo(true)

    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 2,
        maxWidthOrHeight: 1200,
        useWebWorker: true,
        exifOrientation: true,
      })
      setArquivoComprimido(compressed)
      const reader = new FileReader()
      reader.onload = () => { setPreview(reader.result as string) }
      reader.readAsDataURL(compressed)
    } catch {
      setErro('Erro ao processar a foto. Tente outra.')
    } finally {
      setComprimindo(false)
    }
  }

  async function handleAnalisar() {
    if (!arquivoComprimido) { setErro('Selecione uma foto primeiro.'); return }
    setErro('')
    setAnalisando(true)

    const reader = new FileReader()
    reader.readAsDataURL(arquivoComprimido)
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

        router.push('/app/visagismo/resultado')
      } catch (err) {
        setErro(err instanceof Error ? err.message : 'Erro ao analisar. Tente novamente.')
        setAnalisando(false)
      }
    }
  }

  const carregando = comprimindo || analisando

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

        {/* Regras */}
        <div
          style={{
            backgroundColor: '#fff', borderRadius: 16,
            padding: '16px', border: '1.5px solid #E8E8E8',
          }}
        >
          <p className="font-bold text-gray-700" style={{ fontSize: 13, marginBottom: 12 }}>
            Para uma análise precisa:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {REGRAS.map(({ icon, texto }) => (
              <div key={texto} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>{icon}</span>
                <p style={{ fontSize: 13, color: '#555' }}>{texto}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Área de upload */}
        <div
          onClick={() => !carregando && inputRef.current?.click()}
          style={{
            borderRadius: 20,
            border: `2px dashed ${preview ? '#1B5E5A' : '#D0D0D0'}`,
            backgroundColor: preview ? '#E8F5F4' : '#F9F9F9',
            height: 300,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: carregando ? 'default' : 'pointer',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt="Preview"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : comprimindo ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: 24 }}>
              <div
                style={{
                  width: 36, height: 36, border: '3px solid #1B5E5A',
                  borderTopColor: 'transparent', borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                }}
              />
              <p style={{ fontSize: 13, color: '#1B5E5A', fontWeight: 600 }}>Processando foto...</p>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: 24 }}>
              <span style={{ fontSize: 48 }}>📷</span>
              <p style={{ fontSize: 14, color: '#999', textAlign: 'center' }}>
                Toque para escolher uma foto
              </p>
            </div>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="user"
          className="hidden"
          onChange={handleArquivoSelecionado}
        />

        {erro && (
          <p
            style={{
              fontSize: 13, color: '#dc2626', backgroundColor: '#fff5f5',
              borderRadius: 10, padding: '10px 14px', border: '1.5px solid #fca5a5',
            }}
          >
            {erro}
          </p>
        )}

        {/* Loading análise */}
        {analisando && (
          <div
            style={{
              backgroundColor: '#E8F5F4', borderRadius: 16, padding: '20px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
            }}
          >
            <div
              style={{
                width: 40, height: 40, border: '3px solid #1B5E5A',
                borderTopColor: 'transparent', borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }}
            />
            <p style={{ fontSize: 14, color: '#1B5E5A', fontWeight: 600, textAlign: 'center' }}>
              {MENSAGENS_LOADING[mensagemIdx]}
            </p>
          </div>
        )}

        {!carregando && (
          <button
            onClick={handleAnalisar}
            disabled={!arquivoComprimido}
            style={{
              width: '100%', padding: '16px', borderRadius: 14, border: 'none',
              backgroundColor: arquivoComprimido ? '#1B5E5A' : '#E0E0E0',
              color: arquivoComprimido ? '#fff' : '#999',
              fontSize: 16, fontWeight: 700, cursor: arquivoComprimido ? 'pointer' : 'not-allowed',
            }}
          >
            Analisar meu rosto ✦
          </button>
        )}

      </main>
    </PageContainer>
  )
}
