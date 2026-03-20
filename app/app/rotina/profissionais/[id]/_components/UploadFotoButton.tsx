'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface UploadFotoButtonProps {
  profissionalId: string
  fotosAtuais: string[]
}

export default function UploadFotoButton({ profissionalId, fotosAtuais }: UploadFotoButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0]
    if (!arquivo) return
    setErro('')
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
      setErro('Erro ao enviar foto.')
      setEnviando(false)
      return
    }

    const { data: urlData } = supabase.storage
      .from('profissionais-fotos')
      .getPublicUrl(path)

    const novaUrl = urlData.publicUrl
    const novasFotos = [...fotosAtuais, novaUrl]

    await supabase
      .from('profissionais')
      .update({ fotos_urls: novasFotos })
      .eq('id', profissionalId)

    setEnviando(false)
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-1">
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
      {erro && <p className="text-red-500 text-xs">{erro}</p>}
    </div>
  )
}
