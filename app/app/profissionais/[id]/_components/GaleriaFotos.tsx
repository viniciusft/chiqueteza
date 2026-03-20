'use client'

import { useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface GaleriaFotosProps {
  profissionalId: string
  fotosIniciais: string[]
}

export default function GaleriaFotos({ profissionalId, fotosIniciais }: GaleriaFotosProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [fotos, setFotos] = useState<string[]>(fotosIniciais)
  const [enviando, setEnviando] = useState(false)
  const [erroUpload, setErroUpload] = useState('')

  function extrairPath(url: string): string {
    const marker = '/profissionais-fotos/'
    const idx = url.indexOf(marker)
    return idx >= 0 ? url.slice(idx + marker.length) : ''
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0]
    if (!arquivo) return
    setErroUpload('')
    setEnviando(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setEnviando(false); return }

    const ext = arquivo.name.split('.').pop()
    const path = `${user.id}/${profissionalId}/${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('profissionais-fotos')
      .upload(path, arquivo, { upsert: false })

    if (uploadError) {
      setErroUpload('Erro ao enviar foto.')
      setEnviando(false)
      return
    }

    const { data: urlData } = supabase.storage.from('profissionais-fotos').getPublicUrl(path)
    const novasFotos = [...fotos, urlData.publicUrl]

    await supabase.from('profissionais').update({ fotos_urls: novasFotos }).eq('id', profissionalId)
    setFotos(novasFotos)
    setEnviando(false)
    if (inputRef.current) inputRef.current.value = ''
  }

  async function handleExcluir(url: string) {
    if (!confirm('Remover esta foto?')) return

    const supabase = createClient()
    const path = extrairPath(url)
    if (path) {
      await supabase.storage.from('profissionais-fotos').remove([path])
    }
    const novasFotos = fotos.filter((f) => f !== url)
    await supabase.from('profissionais').update({ fotos_urls: novasFotos }).eq('id', profissionalId)
    setFotos(novasFotos)
  }

  return (
    <div className="flex flex-col gap-3">
      {fotos.length > 0 ? (
        <div className="grid grid-cols-3 gap-2">
          {fotos.map((url, i) => (
            <div key={url} style={{ position: 'relative' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`Foto ${i + 1}`}
                className="object-cover w-full"
                style={{ borderRadius: 10, aspectRatio: '1/1' }}
              />
              <button
                onClick={() => handleExcluir(url)}
                aria-label="Remover foto"
                style={{
                  position: 'absolute',
                  top: 4,
                  right: 4,
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  color: '#fff',
                  fontSize: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: 'none',
                  cursor: 'pointer',
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-400" style={{ fontSize: 14 }}>Nenhuma foto ainda.</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleUpload}
      />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={enviando}
        className="font-bold text-white"
        style={{
          backgroundColor: '#1B5E5A',
          borderRadius: 12,
          padding: '12px 20px',
          fontSize: 14,
          opacity: enviando ? 0.6 : 1,
        }}
      >
        {enviando ? 'Enviando...' : '+ Adicionar foto'}
      </button>
      {erroUpload && <p className="text-red-500 text-xs">{erroUpload}</p>}
    </div>
  )
}
