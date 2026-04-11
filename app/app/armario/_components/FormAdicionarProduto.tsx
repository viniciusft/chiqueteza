'use client'

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Camera, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import type { ArmarioProduto } from '../_types'
import { CATEGORIAS, FREQUENCIA_CONFIG } from '../_types'

async function comprimirFoto(file: File): Promise<{ blob: Blob; preview: string }> {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const MAX = 800
      let { width, height } = img
      if (width > height) { if (width > MAX) { height = Math.round(height * MAX / width); width = MAX } }
      else { if (height > MAX) { width = Math.round(width * MAX / height); height = MAX } }
      const canvas = document.createElement('canvas')
      canvas.width = width; canvas.height = height
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height)
      URL.revokeObjectURL(url)
      canvas.toBlob(blob => resolve({ blob: blob!, preview: canvas.toDataURL('image/jpeg', 0.82) }), 'image/jpeg', 0.82)
    }
    img.src = url
  })
}

interface Props {
  userId: string
  onSalvar: () => void
  onClose: () => void
  prefill?: { nome: string; marca: string; categoria: string; foto_url: string; wishlist_id: string }
  produtoExistente?: ArmarioProduto
}

export function FormAdicionarProduto({ userId, onSalvar, onClose, prefill, produtoExistente }: Props) {
  const supabase = createClient()
  const isEdicao = !!produtoExistente
  const [modo, setModo] = useState<'manual' | 'foto'>('manual')

  const [form, setForm] = useState({
    nome: produtoExistente?.nome ?? prefill?.nome ?? '',
    marca: produtoExistente?.marca ?? prefill?.marca ?? '',
    categoria: produtoExistente?.categoria ?? prefill?.categoria ?? '',
    subcategoria: produtoExistente?.subcategoria ?? '',
    volume_total: produtoExistente?.volume_total ?? '',
    frequencia_uso: (produtoExistente?.frequencia_uso ?? 'diaria') as ArmarioProduto['frequencia_uso'],
    nivel_atual: produtoExistente?.nivel_atual ?? 100,
    notas: produtoExistente?.notas ?? '',
    rotatividade_ativa: produtoExistente?.rotatividade_ativa ?? false,
  })

  const set = (k: keyof typeof form, v: string | number | boolean) =>
    setForm(f => ({ ...f, [k]: v }))

  const [fotoBlob, setFotoBlob] = useState<Blob | null>(null)
  const [fotoPreview, setFotoPreview] = useState<string | null>(produtoExistente?.foto_url ?? null)
  const [fotoOriginalUrl] = useState<string | null>(produtoExistente?.foto_url ?? null)
  const [salvando, setSalvando] = useState(false)
  const [processandoOcr, setProcessandoOcr] = useState(false)
  const [ocrPreview, setOcrPreview] = useState<string | null>(null)
  const inputFotoRef = useRef<HTMLInputElement>(null)
  const inputOcrRef = useRef<HTMLInputElement>(null)

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 14px', borderRadius: 12, border: '1.5px solid #E8E8E8',
    fontSize: 14, fontFamily: 'var(--font-body)', color: 'var(--foreground)',
    outline: 'none', boxSizing: 'border-box', background: 'var(--background)',
  }

  async function handleOcrFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setProcessandoOcr(true)
    try {
      const { blob, preview } = await comprimirFoto(file)
      setOcrPreview(preview)
      const buffer = await blob.arrayBuffer()
      const bytes = new Uint8Array(buffer)
      let bin = ''
      for (let i = 0; i < bytes.byteLength; i++) bin += String.fromCharCode(bytes[i])
      const base64 = btoa(bin)
      const res = await fetch('/api/armario/ocr-foto', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${(await createClient().auth.getSession()).data.session?.access_token ?? ''}`,
        },
        body: JSON.stringify({ imageBase64: base64, mimeType: 'image/jpeg' }),
      })
      const data = await res.json()
      if (data.produto) {
        const p = data.produto
        if (p.nome) set('nome', p.nome)
        if (p.marca) set('marca', p.marca)
        if (p.volume) set('volume_total', p.volume)
        if (p.categoria) set('categoria', p.categoria)
        if (p.subcategoria) set('subcategoria', p.subcategoria)
        setFotoBlob(blob); setFotoPreview(preview)
        toast.success('Produto identificado! Confirme os dados 🔍')
        setModo('manual')
      } else {
        toast('Não consegui identificar. Preencha manualmente.')
        setModo('manual')
      }
    } catch {
      toast.error('Erro ao processar foto')
      setModo('manual')
    } finally {
      setProcessandoOcr(false)
    }
  }

  async function handleFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const { blob, preview } = await comprimirFoto(file)
    setFotoBlob(blob); setFotoPreview(preview)
    e.target.value = ''
  }

  async function salvar() {
    if (!form.nome.trim()) { toast.error('Informe o nome do produto'); return }
    setSalvando(true)

    let foto_url: string | null = fotoOriginalUrl

    if (fotoBlob) {
      const path = `${userId}/${crypto.randomUUID()}.jpg`
      const { error: upErr } = await supabase.storage.from('armario-fotos').upload(path, fotoBlob, { contentType: 'image/jpeg' })
      if (!upErr) {
        foto_url = supabase.storage.from('armario-fotos').getPublicUrl(path).data.publicUrl
      }
    }

    if (isEdicao && produtoExistente) {
      const { error } = await supabase.from('armario_produtos').update({
        nome: form.nome.trim(),
        marca: form.marca.trim() || null,
        categoria: form.categoria || null,
        subcategoria: form.subcategoria.trim() || null,
        volume_total: form.volume_total.trim() || null,
        frequencia_uso: form.frequencia_uso,
        nivel_atual: form.nivel_atual,
        notas: form.notas.trim() || null,
        rotatividade_ativa: form.rotatividade_ativa,
        ...(fotoBlob ? { foto_url } : {}),
      }).eq('id', produtoExistente.id)

      if (error) { toast.error('Erro ao salvar alterações'); setSalvando(false); return }
      toast.success('Produto atualizado! ✏️')
    } else {
      const hoje = new Date().toISOString().split('T')[0]
      const diasEst = FREQUENCIA_CONFIG[form.frequencia_uso].diasEstimados
      const dataFim = new Date(Date.now() + diasEst * 86400000).toISOString().split('T')[0]

      const { data: novoProduto, error } = await supabase.from('armario_produtos').insert({
        usuario_id: userId,
        nome: form.nome.trim(),
        marca: form.marca.trim() || null,
        categoria: form.categoria || null,
        subcategoria: form.subcategoria.trim() || null,
        volume_total: form.volume_total.trim() || null,
        foto_url: foto_url ?? null,
        frequencia_uso: form.frequencia_uso,
        nivel_atual: form.nivel_atual,
        data_abertura: hoje,
        data_fim_estimada: dataFim,
        notas: form.notas.trim() || null,
        wishlist_id: prefill?.wishlist_id || null,
        rotatividade_ativa: form.rotatividade_ativa,
        origem: prefill?.wishlist_id ? 'da_wishlist' : 'manual',
      }).select('id').single()

      if (error) { toast.error('Erro ao salvar'); setSalvando(false); return }
      toast.success('Produto adicionado ao armário! 🪞')

      if (novoProduto?.id) {
        const q = [form.nome.trim(), form.marca.trim()].filter(Boolean).join(' ')
        try {
          const res = await fetch(`/api/armario/buscar-ml?q=${encodeURIComponent(q)}`)
          const data = await res.json()
          const primeiro = data.produtos?.[0]
          if (primeiro) {
            await supabase.from('armario_produtos').update({
              ml_produto_id: primeiro.id,
              ml_preco_atual: primeiro.preco,
              ml_deeplink: primeiro.deeplink,
            }).eq('id', novoProduto.id)
            toast(`🔎 Rastreando no ML: ${primeiro.titulo} — R$${primeiro.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)
          }
        } catch { /* silencioso */ }
      }
    }

    onSalvar()
    onClose()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Seletor manual/foto (só no modo adicionar) */}
      {!isEdicao && (
        <div style={{ display: 'flex', gap: 4, background: '#F5F5F5', borderRadius: 12, padding: 4 }}>
          {([{ id: 'manual', label: '✍️ Manual' }, { id: 'foto', label: '📷 Foto' }] as const).map(m => (
            <button key={m.id} type="button" onClick={() => setModo(m.id)}
              style={{ flex: 1, padding: '8px 0', borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-body)', background: modo === m.id ? '#fff' : 'transparent', color: modo === m.id ? '#1B5E5A' : '#A3A3A3', boxShadow: modo === m.id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none', transition: 'all 0.15s' }}>
              {m.label}
            </button>
          ))}
        </div>
      )}

      {/* OCR */}
      {!isEdicao && modo === 'foto' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center', padding: '8px 0' }}>
          <input ref={inputOcrRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handleOcrFoto} />
          {ocrPreview && <img src={ocrPreview} alt="Embalagem" style={{ width: 140, height: 140, objectFit: 'cover', borderRadius: 16, border: '2px solid #1B5E5A' }} />}
          <motion.button type="button" whileTap={{ scale: 0.96 }} onClick={() => inputOcrRef.current?.click()} disabled={processandoOcr}
            style={{ width: '100%', padding: '16px', borderRadius: 14, border: '2px dashed #1B5E5A', background: 'rgba(27,94,90,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, cursor: processandoOcr ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 700, color: '#1B5E5A', opacity: processandoOcr ? 0.7 : 1 }}>
            {processandoOcr ? <><Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} /> Identificando…</> : <><Camera size={20} /> Fotografar embalagem</>}
          </motion.button>
          <p style={{ margin: 0, fontSize: 11, color: '#A3A3A3', textAlign: 'center', fontFamily: 'var(--font-body)' }}>A IA extrai nome, marca e categoria automaticamente</p>
        </div>
      )}

      {/* Nome */}
      <div>
        <label style={{ fontSize: 12, fontWeight: 700, color: '#525252', marginBottom: 6, display: 'block', fontFamily: 'var(--font-body)' }}>Nome *</label>
        <input required placeholder="ex: Protetor solar FPS 98" value={form.nome} onChange={e => set('nome', e.target.value)} style={inputStyle} />
      </div>

      {/* Marca + Volume */}
      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: '#525252', marginBottom: 6, display: 'block', fontFamily: 'var(--font-body)' }}>Marca</label>
          <input placeholder="ex: Isdin" value={form.marca} onChange={e => set('marca', e.target.value)} style={inputStyle} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: '#525252', marginBottom: 6, display: 'block', fontFamily: 'var(--font-body)' }}>Volume</label>
          <input placeholder="ex: 50ml" value={form.volume_total} onChange={e => set('volume_total', e.target.value)} style={inputStyle} />
        </div>
      </div>

      {/* Categoria */}
      <div>
        <label style={{ fontSize: 12, fontWeight: 700, color: '#525252', marginBottom: 8, display: 'block', fontFamily: 'var(--font-body)' }}>Categoria</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {CATEGORIAS.map(c => (
            <button key={c.value} type="button" onClick={() => set('categoria', form.categoria === c.value ? '' : c.value)}
              style={{ padding: '6px 12px', borderRadius: 20, border: '1.5px solid', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-body)', borderColor: form.categoria === c.value ? '#FF3366' : '#E8E8E8', background: form.categoria === c.value ? 'rgba(255,51,102,0.07)' : '#fff', color: form.categoria === c.value ? '#FF3366' : '#525252' }}>
              {c.emoji} {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Frequência */}
      <div>
        <label style={{ fontSize: 12, fontWeight: 700, color: '#525252', marginBottom: 8, display: 'block', fontFamily: 'var(--font-body)' }}>Frequência de uso</label>
        <div style={{ display: 'flex', gap: 6 }}>
          {(Object.keys(FREQUENCIA_CONFIG) as ArmarioProduto['frequencia_uso'][]).map(f => (
            <button key={f} type="button" onClick={() => set('frequencia_uso', f)}
              style={{ flex: 1, padding: '8px 4px', borderRadius: 10, border: '1.5px solid', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', borderColor: form.frequencia_uso === f ? '#1B5E5A' : '#E8E8E8', background: form.frequencia_uso === f ? 'rgba(27,94,90,0.08)' : '#fff', color: form.frequencia_uso === f ? '#1B5E5A' : '#525252' }}>
              {FREQUENCIA_CONFIG[f].label}
            </button>
          ))}
        </div>
      </div>

      {/* Nível */}
      <div>
        <label style={{ fontSize: 12, fontWeight: 700, color: '#525252', marginBottom: 8, display: 'block', fontFamily: 'var(--font-body)' }}>
          Quanto ainda tem? — {form.nivel_atual}%
        </label>
        <div style={{ height: 6, background: '#EDEDED', borderRadius: 4, overflow: 'hidden', cursor: 'pointer' }}
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect()
            const pct = Math.round(((e.clientX - rect.left) / rect.width) * 100)
            set('nivel_atual', Math.max(0, Math.min(100, pct)))
          }}>
          <motion.div animate={{ width: `${form.nivel_atual}%` }} transition={{ duration: 0.2 }}
            style={{ height: '100%', background: form.nivel_atual <= 15 ? '#EF4444' : '#1B5E5A', borderRadius: 4 }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
          {[0, 25, 50, 75, 100].map(v => (
            <button key={v} type="button" onClick={() => set('nivel_atual', v)}
              style={{ fontSize: 10, fontWeight: 600, color: form.nivel_atual === v ? '#1B5E5A' : '#A3A3A3', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
              {v}%
            </button>
          ))}
        </div>
      </div>

      {/* Foto */}
      <div>
        <label style={{ fontSize: 12, fontWeight: 700, color: '#525252', marginBottom: 8, display: 'block', fontFamily: 'var(--font-body)' }}>Foto (opcional)</label>
        <input ref={inputFotoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFoto} />
        {fotoPreview ? (
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <img src={fotoPreview} alt="Preview" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 12, display: 'block', border: '2px solid #1B5E5A' }} />
            <button type="button" onClick={() => { setFotoBlob(null); setFotoPreview(null) }}
              style={{ position: 'absolute', top: -8, right: -8, width: 22, height: 22, borderRadius: '50%', background: '#EF4444', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <X size={12} />
            </button>
          </div>
        ) : (
          <motion.button type="button" whileTap={{ scale: 0.96 }} onClick={() => inputFotoRef.current?.click()}
            style={{ width: '100%', padding: '14px', borderRadius: 12, border: '1.5px dashed #E8E8E8', background: '#FAFAFA', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', color: '#A3A3A3', fontFamily: 'var(--font-body)', fontSize: 14 }}>
            <Camera size={18} /> Adicionar foto
          </motion.button>
        )}
      </div>

      {/* Notas */}
      <div>
        <label style={{ fontSize: 12, fontWeight: 700, color: '#525252', marginBottom: 6, display: 'block', fontFamily: 'var(--font-body)' }}>Notas</label>
        <textarea placeholder="Onde comprou, quando abre o próximo…" value={form.notas} onChange={e => set('notas', e.target.value)} rows={2}
          style={{ ...inputStyle, resize: 'none', lineHeight: 1.5 }} />
      </div>

      {/* Rotatividade */}
      <button type="button" onClick={() => set('rotatividade_ativa', !form.rotatividade_ativa)}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 14, border: '1.5px solid #E8E8E8', background: '#fff', cursor: 'pointer' }}>
        <div style={{ textAlign: 'left' }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--foreground)', fontFamily: 'var(--font-body)' }}>🔄 Incluir na rotatividade</p>
          <p style={{ margin: '2px 0 0', fontSize: 11, color: '#A3A3A3', fontFamily: 'var(--font-body)' }}>O app vai sugerir alternar com outros produtos da mesma categoria</p>
        </div>
        <div style={{ width: 40, height: 24, borderRadius: 12, background: form.rotatividade_ativa ? '#1B5E5A' : '#D0D0D0', position: 'relative', transition: 'background 0.2s', flexShrink: 0, marginLeft: 12 }}>
          <div style={{ position: 'absolute', top: 2, left: form.rotatividade_ativa ? 18 : 2, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
        </div>
      </button>

      {/* Salvar */}
      <motion.button whileTap={{ scale: 0.97 }} onClick={salvar} disabled={salvando || !form.nome.trim()}
        style={{ padding: '15px', borderRadius: 14, border: 'none', background: salvando || !form.nome.trim() ? 'rgba(27,94,90,0.4)' : 'linear-gradient(135deg, #1B5E5A, #0D3533)', color: '#fff', fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 700, cursor: salvando ? 'not-allowed' : 'pointer' }}>
        {salvando ? 'Salvando…' : isEdicao ? 'Salvar alterações ✏️' : 'Adicionar ao Armário 🪞'}
      </motion.button>
    </div>
  )
}
