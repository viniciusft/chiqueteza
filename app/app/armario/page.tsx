'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, Camera, Trash2, ChevronDown, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { searchMLClient } from '@/lib/ml/clientSearch'
import AppHeader from '@/components/ui/AppHeader'
import PageContainer from '@/components/ui/PageContainer'
import EmptyState from '@/components/ui/EmptyState'
import BottomSheet from '@/components/ui/BottomSheet'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ArmarioProduto {
  id: string
  usuario_id: string
  nome: string
  marca: string | null
  categoria: string | null
  subcategoria: string | null
  volume_total: string | null
  foto_url: string | null
  data_abertura: string | null
  frequencia_uso: 'diaria' | 'semanal' | 'mensal' | 'raramente'
  nivel_atual: number
  data_validade: string | null
  data_fim_estimada: string | null
  ml_produto_id: string | null
  ml_preco_atual: number | null
  ml_deeplink: string | null
  status: 'em_uso' | 'acabando' | 'finalizado' | 'guardado'
  notas: string | null
  created_at: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIAS = [
  { value: 'skincare',    emoji: '🧴', label: 'Skincare' },
  { value: 'maquiagem',  emoji: '💄', label: 'Maquiagem' },
  { value: 'cabelo',     emoji: '💆', label: 'Cabelo' },
  { value: 'corpo',      emoji: '🛁', label: 'Corpo' },
  { value: 'perfume',    emoji: '🌸', label: 'Perfume' },
  { value: 'unhas',      emoji: '💅', label: 'Unhas' },
  { value: 'ferramenta', emoji: '🔧', label: 'Ferramenta' },
] as const

const FREQUENCIA_CONFIG = {
  diaria:    { label: 'Diária',    diasEstimados: 30  },
  semanal:   { label: 'Semanal',   diasEstimados: 90  },
  mensal:    { label: 'Mensal',    diasEstimados: 180 },
  raramente: { label: 'Raramente', diasEstimados: 365 },
}

const STATUS_CONFIG = {
  em_uso:    { label: 'Em uso',    cor: '#1B5E5A', bg: 'rgba(27,94,90,0.10)' },
  acabando:  { label: 'Acabando',  cor: '#EF4444', bg: 'rgba(239,68,68,0.10)' },
  finalizado:{ label: 'Finalizado',cor: '#A3A3A3', bg: 'rgba(163,163,163,0.12)' },
  guardado:  { label: 'Guardado',  cor: '#D4A843', bg: 'rgba(212,168,67,0.10)' },
}

function categoriaEmoji(cat: string | null): string {
  return CATEGORIAS.find(c => c.value === cat)?.emoji ?? '✨'
}

// ─── Compressão de foto ───────────────────────────────────────────────────────

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

// ─── Barra de nível ───────────────────────────────────────────────────────────

function NivelBar({ nivel, onChange }: { nivel: number; onChange?: (v: number) => void }) {
  const cor = nivel <= 15 ? '#EF4444' : nivel <= 40 ? '#F59E0B' : '#1B5E5A'
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <span style={{ fontSize: 11, color: 'var(--foreground-muted)', fontWeight: 600 }}>
          Nível restante
        </span>
        <span style={{ fontSize: 12, fontWeight: 700, color: cor }}>{nivel}%</span>
      </div>
      <div
        style={{ height: 6, background: '#EDEDED', borderRadius: 4, overflow: 'hidden', cursor: onChange ? 'pointer' : 'default' }}
        onClick={onChange ? (e) => {
          const rect = e.currentTarget.getBoundingClientRect()
          const pct = Math.round(((e.clientX - rect.left) / rect.width) * 100)
          onChange(Math.max(0, Math.min(100, pct)))
        } : undefined}
      >
        <motion.div
          animate={{ width: `${nivel}%` }}
          transition={{ duration: 0.3 }}
          style={{ height: '100%', background: cor, borderRadius: 4 }}
        />
      </div>
    </div>
  )
}

// ─── Card de produto ──────────────────────────────────────────────────────────

function ProdutoCard({
  produto, onNivelChange, onDelete, onFinalizar,
}: {
  produto: ArmarioProduto
  onNivelChange: (id: string, nivel: number) => void
  onDelete: (id: string) => void
  onFinalizar: (id: string) => void
}) {
  const [confirmando, setConfirmando] = useState(false)
  const st = STATUS_CONFIG[produto.status]

  return (
    <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 10 }}>
      <div style={{
        background: 'var(--surface)', borderRadius: confirmando ? '16px 16px 0 0' : 16,
        border: `1.5px solid ${produto.status === 'acabando' ? 'rgba(239,68,68,0.2)' : '#EDEDED'}`,
        padding: 14, display: 'flex', gap: 12, alignItems: 'flex-start',
        transition: 'border 0.18s',
      }}>
        {/* Foto ou emoji */}
        <div style={{
          width: 52, height: 52, borderRadius: 12, flexShrink: 0, overflow: 'hidden',
          background: 'linear-gradient(135deg, #FFF0F3, #F5F5F5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {produto.foto_url
            ? <img src={produto.foto_url} alt={produto.nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span style={{ fontSize: 26 }}>{categoriaEmoji(produto.categoria)}</span>
          }
        </div>

        {/* Conteúdo */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--foreground)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '75%' }}>
              {produto.nome}
            </p>
            <span style={{ fontSize: 10, fontWeight: 700, color: st.cor, background: st.bg, borderRadius: 6, padding: '2px 7px', flexShrink: 0 }}>
              {st.label}
            </span>
          </div>

          {produto.marca && (
            <p style={{ margin: '0 0 8px', fontSize: 12, color: 'var(--foreground-muted)' }}>
              {produto.marca}{produto.volume_total ? ` · ${produto.volume_total}` : ''}
            </p>
          )}

          <NivelBar nivel={produto.nivel_atual} onChange={(v) => onNivelChange(produto.id, v)} />

          {/* Ações */}
          <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
            {produto.status !== 'finalizado' && (
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => onFinalizar(produto.id)}
                style={{
                  flex: 1, padding: '7px 0', borderRadius: 10, border: '1.5px solid #EDEDED',
                  background: '#FAFAFA', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  color: 'var(--foreground-muted)', fontFamily: 'var(--font-body)',
                }}>
                Acabou 🪣
              </motion.button>
            )}
            {produto.ml_deeplink && (
              <motion.button whileTap={{ scale: 0.95 }}
                onClick={() => window.open(produto.ml_deeplink!, '_blank')}
                style={{
                  flex: 1, padding: '7px 0', borderRadius: 10, border: 'none',
                  background: 'rgba(255,229,0,0.15)', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  color: '#C8960C', fontFamily: 'var(--font-body)',
                }}>
                Ver no ML 🛍️
              </motion.button>
            )}
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => setConfirmando(v => !v)}
              style={{ width: 34, height: 34, borderRadius: 10, border: 'none', background: 'rgba(239,68,68,0.07)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Trash2 size={14} color="#EF4444" />
            </motion.button>
          </div>
        </div>
      </div>

      {/* Confirmação delete */}
      <AnimatePresence>
        {confirmando && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.18 }} style={{ overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(239,68,68,0.06)', border: '1.5px solid rgba(239,68,68,0.18)', borderTop: 'none', borderRadius: '0 0 16px 16px', padding: '10px 14px' }}>
              <span style={{ fontSize: 13, color: '#EF4444', fontWeight: 600 }}>Remover "{produto.nome}"?</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setConfirmando(false)} style={{ padding: '6px 14px', borderRadius: 8, border: '1.5px solid #E8E8E8', background: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', color: 'var(--foreground)' }}>Cancelar</button>
                <button onClick={() => { setConfirmando(false); onDelete(produto.id) }} style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: '#EF4444', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Remover</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ─── Auto-match ML ───────────────────────────────────────────────────────────

async function autoMatchML(
  supabase: ReturnType<typeof createClient>,
  produtoId: string,
  nome: string,
  marca: string,
) {
  const q = [nome, marca].filter(Boolean).join(' ')
  try {
    // Busca diretamente do browser — evita bloqueio de IP da Vercel na API do ML
    const resultados = await searchMLClient(q, 5)
    const primeiro = resultados[0]
    if (!primeiro) return
    await supabase.from('armario_produtos').update({
      ml_produto_id: primeiro.id,
      ml_preco_atual: primeiro.preco,
      ml_deeplink: primeiro.deeplink,
    }).eq('id', produtoId)
    toast(`🔎 Rastreando no ML: ${primeiro.titulo} — R$${primeiro.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)
  } catch {
    // silencioso — rastreamento é best-effort
  }
}

// ─── Formulário ───────────────────────────────────────────────────────────────

const FORM_VAZIO = {
  nome: '', marca: '', categoria: '' as string, subcategoria: '', volume_total: '',
  frequencia_uso: 'diaria' as ArmarioProduto['frequencia_uso'],
  nivel_atual: 100, notas: '',
}

function FormAdicionarProduto({ userId, onSalvar, onClose, prefill }: {
  userId: string
  onSalvar: () => void
  onClose: () => void
  prefill?: { nome: string; marca: string; categoria: string; foto_url: string; wishlist_id: string }
}) {
  const supabase = createClient()
  const [modo, setModo] = useState<'manual' | 'foto'>('manual')
  const [form, setForm] = useState({
    ...FORM_VAZIO,
    nome: prefill?.nome ?? '',
    marca: prefill?.marca ?? '',
    categoria: prefill?.categoria ?? '',
  })
  const set = (k: keyof typeof FORM_VAZIO, v: string | number) => setForm(f => ({ ...f, [k]: v }))
  const [fotoBlob, setFotoBlob] = useState<Blob | null>(null)
  const [fotoPreview, setFotoPreview] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [processandoOcr, setProcessandoOcr] = useState(false)
  const [ocrPreview, setOcrPreview] = useState<string | null>(null)
  const inputFotoRef = useRef<HTMLInputElement>(null)
  const inputOcrRef = useRef<HTMLInputElement>(null)

  async function handleOcrFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setProcessandoOcr(true)

    try {
      const { blob, preview } = await comprimirFoto(file)
      setOcrPreview(preview)

      // Converter para base64
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
        // Usar a foto como foto do produto também
        setFotoBlob(blob); setFotoPreview(preview)
        toast.success('Produto identificado! Confirme os dados 🔍')
        setModo('manual')
      } else {
        toast('Não consegui identificar o produto. Preencha manualmente.')
        setModo('manual')
      }
    } catch {
      toast.error('Erro ao processar foto')
      setModo('manual')
    } finally {
      setProcessandoOcr(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 14px', borderRadius: 12, border: '1.5px solid #E8E8E8',
    fontSize: 14, fontFamily: 'var(--font-body)', color: 'var(--foreground)',
    outline: 'none', boxSizing: 'border-box', background: 'var(--background)',
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

    let foto_url: string | null = null

    if (fotoBlob) {
      const path = `${userId}/${crypto.randomUUID()}.jpg`
      const { error: upErr } = await supabase.storage.from('armario-fotos').upload(path, fotoBlob, { contentType: 'image/jpeg' })
      if (!upErr) {
        foto_url = supabase.storage.from('armario-fotos').getPublicUrl(path).data.publicUrl
      }
    }

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
      ml_produto_id: null,
      ml_preco_atual: null,
      ml_deeplink: null,
      origem: prefill?.wishlist_id ? 'da_wishlist' : 'manual',
    }).select('id').single()

    if (error) { toast.error('Erro ao salvar'); console.error(error); setSalvando(false); return }
    toast.success('Produto adicionado ao armário! 🪞')
    onSalvar(); onClose()

    // Auto-match ML em background — não bloqueia o fluxo
    if (novoProduto?.id) {
      void autoMatchML(supabase, novoProduto.id, form.nome.trim(), form.marca.trim())
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Seletor de modo */}
      <div style={{ display: 'flex', gap: 4, background: '#F5F5F5', borderRadius: 12, padding: 4 }}>
        {([
          { id: 'manual', label: '✍️ Manual' },
          { id: 'foto',   label: '📷 Foto' },
        ] as const).map(m => (
          <button key={m.id} type="button" onClick={() => setModo(m.id)}
            style={{ flex: 1, padding: '8px 0', borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-body)', background: modo === m.id ? '#fff' : 'transparent', color: modo === m.id ? '#1B5E5A' : 'var(--foreground-muted)', boxShadow: modo === m.id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none', transition: 'all 0.15s' }}>
            {m.label}
          </button>
        ))}
      </div>

      {/* Aba Foto OCR */}
      {modo === 'foto' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center', padding: '8px 0' }}>
          <input ref={inputOcrRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handleOcrFoto} />
          {ocrPreview ? (
            <img src={ocrPreview} alt="Embalagem" style={{ width: 140, height: 140, objectFit: 'cover', borderRadius: 16, border: '2px solid #1B5E5A' }} />
          ) : null}
          <motion.button type="button" whileTap={{ scale: 0.96 }}
            onClick={() => inputOcrRef.current?.click()}
            disabled={processandoOcr}
            style={{ width: '100%', padding: '16px', borderRadius: 14, border: '2px dashed #1B5E5A', background: 'rgba(27,94,90,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, cursor: processandoOcr ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 700, color: '#1B5E5A', opacity: processandoOcr ? 0.7 : 1 }}>
            {processandoOcr
              ? <><Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} /> Identificando produto…</>
              : <><Camera size={20} /> Fotografar embalagem</>
            }
          </motion.button>
          <p style={{ margin: 0, fontSize: 11, color: 'var(--foreground-muted)', textAlign: 'center' }}>
            A IA vai extrair nome, marca e categoria automaticamente
          </p>
        </div>
      )}

      {/* Formulário manual — sempre visível para edição */}
      {/* Nome */}
      <div>
        <label style={{ fontSize: 12, fontWeight: 700, color: '#525252', marginBottom: 6, display: 'block' }}>Nome *</label>
        <input required placeholder="ex: Protetor solar FPS 98" value={form.nome} onChange={e => set('nome', e.target.value)} style={inputStyle} />
      </div>

      {/* Marca + Volume */}
      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: '#525252', marginBottom: 6, display: 'block' }}>Marca</label>
          <input placeholder="ex: Isdin" value={form.marca} onChange={e => set('marca', e.target.value)} style={inputStyle} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: '#525252', marginBottom: 6, display: 'block' }}>Volume</label>
          <input placeholder="ex: 50ml" value={form.volume_total} onChange={e => set('volume_total', e.target.value)} style={inputStyle} />
        </div>
      </div>

      {/* Categoria */}
      <div>
        <label style={{ fontSize: 12, fontWeight: 700, color: '#525252', marginBottom: 8, display: 'block' }}>Categoria</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {CATEGORIAS.map(c => (
            <button key={c.value} type="button" onClick={() => set('categoria', form.categoria === c.value ? '' : c.value)}
              style={{ padding: '6px 12px', borderRadius: 20, border: '1.5px solid', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-body)', borderColor: form.categoria === c.value ? '#FF3366' : '#E8E8E8', background: form.categoria === c.value ? 'rgba(255,51,102,0.07)' : '#fff', color: form.categoria === c.value ? '#FF3366' : '#525252' }}>
              {c.emoji} {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Frequência de uso */}
      <div>
        <label style={{ fontSize: 12, fontWeight: 700, color: '#525252', marginBottom: 8, display: 'block' }}>Frequência de uso</label>
        <div style={{ display: 'flex', gap: 6 }}>
          {(Object.keys(FREQUENCIA_CONFIG) as ArmarioProduto['frequencia_uso'][]).map(f => (
            <button key={f} type="button" onClick={() => set('frequencia_uso', f)}
              style={{ flex: 1, padding: '8px 4px', borderRadius: 10, border: '1.5px solid', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', borderColor: form.frequencia_uso === f ? '#1B5E5A' : '#E8E8E8', background: form.frequencia_uso === f ? 'rgba(27,94,90,0.08)' : '#fff', color: form.frequencia_uso === f ? '#1B5E5A' : '#525252' }}>
              {FREQUENCIA_CONFIG[f].label}
            </button>
          ))}
        </div>
      </div>

      {/* Nível atual */}
      <div>
        <label style={{ fontSize: 12, fontWeight: 700, color: '#525252', marginBottom: 8, display: 'block' }}>
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
              style={{ fontSize: 10, fontWeight: 600, color: form.nivel_atual === v ? '#1B5E5A' : 'var(--foreground-muted)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
              {v}%
            </button>
          ))}
        </div>
      </div>

      {/* Foto */}
      <div>
        <label style={{ fontSize: 12, fontWeight: 700, color: '#525252', marginBottom: 8, display: 'block' }}>Foto (opcional)</label>
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
        <label style={{ fontSize: 12, fontWeight: 700, color: '#525252', marginBottom: 6, display: 'block' }}>Notas</label>
        <textarea placeholder="Onde comprou, quando abre o próximo..." value={form.notas} onChange={e => set('notas', e.target.value)} rows={2}
          style={{ ...inputStyle, resize: 'none', lineHeight: 1.5 }} />
      </div>

      {/* Salvar */}
      <motion.button whileTap={{ scale: 0.97 }} onClick={salvar} disabled={salvando || !form.nome.trim()}
        style={{ padding: '15px', borderRadius: 14, border: 'none', background: salvando || !form.nome.trim() ? 'rgba(27,94,90,0.4)' : 'linear-gradient(135deg, #1B5E5A, #0D3533)', color: '#fff', fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 700, cursor: salvando ? 'not-allowed' : 'pointer' }}>
        {salvando ? 'Salvando…' : 'Adicionar ao Armário 🪞'}
      </motion.button>
    </div>
  )
}

// ─── Conteúdo principal ───────────────────────────────────────────────────────

function ArmarioContent({ userId, prefill }: {
  userId: string
  prefill?: { nome: string; marca: string; categoria: string; foto_url: string; wishlist_id: string }
}) {
  const supabase = createClient()
  const [aba, setAba] = useState<'hoje' | 'acabando' | 'todos'>('hoje')
  const [produtos, setProdutos] = useState<ArmarioProduto[]>([])
  const [carregando, setCarregando] = useState(true)
  const [sheetAberto, setSheetAberto] = useState(!!prefill)

  const carregar = useCallback(async () => {
    const { data } = await supabase
      .from('armario_produtos')
      .select('*')
      .eq('usuario_id', userId)
      .neq('status', 'finalizado')
      .order('created_at', { ascending: false })
    setProdutos(data ?? [])
    setCarregando(false)
  }, [supabase, userId])

  useEffect(() => { carregar() }, [carregar])

  async function handleNivelChange(id: string, nivel: number) {
    setProdutos(prev => prev.map(p => p.id === id ? { ...p, nivel_atual: nivel } : p))
    await supabase.from('armario_produtos').update({ nivel_atual: nivel }).eq('id', id)
  }

  async function handleDelete(id: string) {
    const backup = produtos.find(p => p.id === id)
    setProdutos(prev => prev.filter(p => p.id !== id))
    const { error } = await supabase.from('armario_produtos').delete().eq('id', id)
    if (error) { if (backup) setProdutos(prev => [backup, ...prev]); toast.error('Erro ao remover') }
    else toast.success('Produto removido')
  }

  async function handleFinalizar(id: string) {
    setProdutos(prev => prev.filter(p => p.id !== id))
    await supabase.from('armario_produtos').update({ nivel_atual: 0, status: 'finalizado' }).eq('id', id)
    toast.success('Ótimo! Produto finalizado 🎉')
  }

  const emUso = produtos.filter(p => p.status === 'em_uso')
  const acabando = produtos.filter(p => p.status === 'acabando')
  const todos = produtos

  const listaAba = aba === 'hoje' ? emUso : aba === 'acabando' ? acabando : todos

  return (
    <>
      <AppHeader />
      <PageContainer>
        <div style={{ padding: '16px 20px 0' }}>
          <h1 className="text-page-title">Armário 🪞</h1>
          <p style={{ margin: '4px 0 16px', fontSize: 13, color: 'var(--foreground-muted)' }}>
            Seus produtos de beleza
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, background: 'var(--surface)', borderRadius: 14, padding: 4, marginBottom: 16 }}>
          {([
            { id: 'hoje',     label: 'Em uso' },
            { id: 'acabando', label: `Acabando${acabando.length > 0 ? ` (${acabando.length})` : ''}` },
            { id: 'todos',    label: 'Todos' },
          ] as const).map(tab => (
            <motion.button key={tab.id} whileTap={{ scale: 0.96 }} onClick={() => setAba(tab.id)}
              style={{ flex: 1, padding: '9px 0', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-body)', background: aba === tab.id ? '#fff' : 'transparent', color: aba === tab.id ? (tab.id === 'acabando' ? '#EF4444' : '#1B5E5A') : 'var(--foreground-muted)', boxShadow: aba === tab.id ? '0 1px 6px rgba(0,0,0,0.08)' : 'none', transition: 'all 0.18s' }}>
              {tab.label}
            </motion.button>
          ))}
        </div>

        {/* Alerta acabando */}
        <AnimatePresence>
          {aba === 'hoje' && acabando.length > 0 && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              onClick={() => setAba('acabando')}
              style={{ background: 'rgba(239,68,68,0.06)', border: '1.5px solid rgba(239,68,68,0.18)', borderRadius: 14, padding: '12px 16px', marginBottom: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#EF4444' }}>
                  🔴 {acabando.length} produto{acabando.length > 1 ? 's' : ''} acabando
                </p>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--foreground-muted)' }}>
                  Hora de reabastecer
                </p>
              </div>
              <ChevronDown size={16} color="#EF4444" style={{ transform: 'rotate(-90deg)' }} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Lista */}
        <AnimatePresence mode="wait">
          <motion.div key={aba} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
            {carregando ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[1, 2, 3].map(i => <div key={i} className="skeleton-shimmer" style={{ height: 120, borderRadius: 16 }} />)}
              </div>
            ) : listaAba.length === 0 ? (
              <EmptyState
                emoji={aba === 'acabando' ? '✅' : '🪞'}
                titulo={aba === 'acabando' ? 'Nada acabando por aqui!' : 'Armário vazio'}
                descricao={aba === 'acabando' ? 'Todos os produtos estão com estoque ok' : 'Adicione seus produtos de beleza para acompanhar o uso'}
                acao={aba !== 'acabando' ? (
                  <motion.button whileTap={{ scale: 0.96 }} onClick={() => setSheetAberto(true)}
                    style={{ padding: '12px 28px', borderRadius: 14, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #1B5E5A, #0D3533)', color: '#fff', fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-body)' }}>
                    Adicionar produto
                  </motion.button>
                ) : undefined}
              />
            ) : (
              <div>
                {listaAba.map(p => (
                  <ProdutoCard
                    key={p.id}
                    produto={p}
                    onNivelChange={handleNivelChange}
                    onDelete={handleDelete}
                    onFinalizar={handleFinalizar}
                  />
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div style={{ height: 96 }} />
      </PageContainer>

      {/* FAB */}
      <motion.button whileTap={{ scale: 0.93 }} onClick={() => setSheetAberto(true)}
        style={{ position: 'fixed', bottom: 88, right: 20, width: 52, height: 52, background: 'linear-gradient(135deg, #1B5E5A, #0D3533)', borderRadius: '50%', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(27,94,90,0.35)', zIndex: 30 }}>
        <Plus size={24} color="#fff" strokeWidth={2.5} />
      </motion.button>

      <BottomSheet isOpen={sheetAberto} onClose={() => setSheetAberto(false)} title="Adicionar ao Armário" maxHeight="92dvh">
        <FormAdicionarProduto userId={userId} onSalvar={carregar} onClose={() => setSheetAberto(false)} prefill={prefill} />
      </BottomSheet>
    </>
  )
}

// ─── Shell ────────────────────────────────────────────────────────────────────

export default function ArmarioPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [userId, setUserId] = useState<string | null>(null)

  // Parâmetros vindos da wishlist ("Mover para Armário")
  const prefill = {
    nome: searchParams.get('nome') ?? '',
    marca: searchParams.get('marca') ?? '',
    categoria: searchParams.get('categoria') ?? '',
    foto_url: searchParams.get('foto_url') ?? '',
    wishlist_id: searchParams.get('wishlist_id') ?? '',
  }
  const veioDaWishlist = !!prefill.nome

  useEffect(() => {
    void (async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)
    })()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (!userId) return (
    <>
      <AppHeader />
      <PageContainer>
        <div style={{ padding: '16px 20px 0', marginBottom: 16 }}>
          <div className="skeleton-shimmer" style={{ height: 32, width: 160, borderRadius: 8 }} />
        </div>
        <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1, 2, 3].map(i => <div key={i} className="skeleton-shimmer" style={{ height: 120, borderRadius: 16 }} />)}
        </div>
      </PageContainer>
    </>
  )

  return <ArmarioContent userId={userId} prefill={veioDaWishlist ? prefill : undefined} />
}
