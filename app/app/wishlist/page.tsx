'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Search, X, ExternalLink, ChevronDown, ChevronUp,
  ShoppingBag, Trash2, Camera, Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import AppHeader from '@/components/ui/AppHeader'
import PageContainer from '@/components/ui/PageContainer'
import EmptyState from '@/components/ui/EmptyState'
import BottomSheet from '@/components/ui/BottomSheet'
import { SkeletonList } from '@/components/ui/SkeletonCard'

// ─── Types ───────────────────────────────────────────────────────────

interface ProdutoWishlist {
  id: string
  nome: string
  marca: string | null
  categoria: string | null
  subcategoria: string | null
  preco_estimado: number | null
  foto_url: string | null
  link_compra: string | null
  status: 'quero' | 'tenho' | 'comprei' // tenho exibido como comprei
  prioridade: 'alta' | 'media' | 'baixa'
  notas: string | null
  tags: string[] | null
  ordem: number | null
  created_at: string
  ml_produto_id: string | null
  ml_deeplink: string | null
}

interface MLResultado {
  id: string
  titulo: string
  preco: number
  thumbnail: string
  permalink: string
  deeplink: string
  disponivel: boolean
  vendedor: string | null
  condicao: string
}

// ─── Constants ────────────────────────────────────────────────────────

const CATEGORIAS = [
  { label: 'Todos', value: null, emoji: '✨' },
  { label: 'Skincare', value: 'skincare', emoji: '🧴' },
  { label: 'Maquiagem', value: 'maquiagem', emoji: '💄' },
  { label: 'Perfume', value: 'perfume', emoji: '🌸' },
  { label: 'Cabelo', value: 'cabelo', emoji: '💆' },
  { label: 'Corpo', value: 'corpo', emoji: '🛁' },
  { label: 'Unhas', value: 'unhas', emoji: '💅' },
] as const

type CategoriaValue = (typeof CATEGORIAS)[number]['value']

// tenho → comprei na UI; DB mantém o valor original para compat
function statusEfetivo(s: ProdutoWishlist['status']): 'quero' | 'comprei' {
  return s === 'quero' ? 'quero' : 'comprei'
}

const STATUS_CONFIG: Record<'quero' | 'comprei', { label: string; color: string; bg: string; emoji: string }> = {
  quero:   { label: 'Quero',   color: '#FF3366', bg: 'rgba(255,51,102,0.09)', emoji: '💭' },
  comprei: { label: 'Comprei', color: '#1B5E5A', bg: 'rgba(27,94,90,0.09)',  emoji: '🛍️' },
}

const PRIORIDADE_CONFIG: Record<ProdutoWishlist['prioridade'], { color: string; dot: string }> = {
  alta:  { color: '#EF4444', dot: '🔴' },
  media: { color: '#F59E0B', dot: '🟡' },
  baixa: { color: '#22C55E', dot: '🟢' },
}

// ─── Confetti ────────────────────────────────────────────────────────

function Confetti() {
  const colors = ['#FF3366', '#F472A0', '#D4A843', '#1B5E5A', '#A8C5CC', '#FFD700']
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'visible', zIndex: 10 }}>
      {colors.map((color, i) => {
        const angle = (i * 60) * Math.PI / 180
        return (
          <motion.div
            key={i}
            initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
            animate={{
              x: Math.cos(angle) * 55,
              y: Math.sin(angle) * 55 - 15,
              scale: 0,
              opacity: 0,
            }}
            transition={{ duration: 0.75, ease: 'easeOut', delay: i * 0.04 }}
            style={{
              position: 'absolute', left: '50%', top: '40%',
              width: 8, height: 8, borderRadius: '50%',
              background: color, transform: 'translate(-50%, -50%)',
            }}
          />
        )
      })}
    </div>
  )
}

// ─── Card ────────────────────────────────────────────────────────────

function ProdutoCard({
  produto,
  onStatusChange,
  onDelete,
  showConfetti,
}: {
  produto: ProdutoWishlist
  onStatusChange: (id: string, novoStatus: ProdutoWishlist['status']) => void
  onDelete: (id: string, nome: string) => void
  showConfetti: boolean
}) {
  const efetivo = statusEfetivo(produto.status)
  const status = STATUS_CONFIG[efetivo]
  const prio = PRIORIDADE_CONFIG[produto.prioridade]

  return (
    <div style={{ position: 'relative' }}>
      {/* Delete button behind */}
      <div style={{
        position: 'absolute', right: 0, top: 0, bottom: 0, width: 72,
        background: 'linear-gradient(135deg, #EF4444, #DC2626)',
        borderRadius: '0 14px 14px 0',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Trash2 size={20} color="#fff" />
      </div>

      {/* Draggable card */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -72, right: 0 }}
        dragElastic={0.08}
        onDragEnd={(_, info) => {
          if (info.offset.x < -60) {
            onDelete(produto.id, produto.nome)
          }
        }}
        whileTap={{ cursor: 'grabbing' }}
        style={{
          position: 'relative',
          background: '#fff',
          borderRadius: 14,
          border: '1.5px solid #F0F0F0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          overflow: 'hidden',
        }}
      >
        {showConfetti && <Confetti />}

        <div style={{ display: 'flex', gap: 12, padding: '12px 14px', alignItems: 'flex-start' }}>
          {/* Placeholder de foto / emoji categoria */}
          <div style={{
            width: 52, height: 52, borderRadius: 12, flexShrink: 0,
            background: status.bg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22,
          }}>
            {produto.foto_url
              ? <img src={produto.foto_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 12 }} />
              : (CATEGORIAS.find(c => c.value === produto.categoria)?.emoji ?? '✨')
            }
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
              <p style={{
                fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14,
                color: 'var(--foreground)', margin: 0,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {produto.nome}
              </p>
              {produto.link_compra && (
                <a
                  href={produto.link_compra}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  style={{ flexShrink: 0, color: 'var(--color-primary)', textDecoration: 'none' }}
                >
                  <ExternalLink size={12} />
                </a>
              )}
            </div>

            {produto.marca && (
              <p style={{ fontSize: 12, color: '#767676', margin: '0 0 5px', fontFamily: 'var(--font-body)' }}>
                {produto.marca}
              </p>
            )}

            {/* Badges */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
              {produto.categoria && (
                <span style={{
                  fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 6,
                  background: 'rgba(168,197,204,0.18)', color: '#5A95A3',
                }}>
                  {CATEGORIAS.find(c => c.value === produto.categoria)?.label ?? produto.categoria}
                </span>
              )}
              {produto.subcategoria && (
                <span style={{
                  fontSize: 10, fontWeight: 500, padding: '2px 7px', borderRadius: 6,
                  background: '#F5F5F5', color: '#767676',
                }}>
                  {produto.subcategoria}
                </span>
              )}
              <span style={{ fontSize: 11 }} title={`Prioridade ${produto.prioridade}`}>
                {prio.dot}
              </span>
              {produto.preco_estimado && (
                <span style={{ fontSize: 11, fontWeight: 700, color: '#525252', marginLeft: 2 }}>
                  {produto.preco_estimado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              )}
            </div>
          </div>

          {/* Ação de status */}
          {efetivo === 'quero' ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
              <motion.button
                whileTap={{ scale: 0.88 }}
                onClick={() => onStatusChange(produto.id, 'comprei')}
                style={{
                  padding: '6px 10px', borderRadius: 20,
                  border: '1.5px solid #1B5E5A',
                  background: 'rgba(27,94,90,0.09)', color: '#1B5E5A',
                  fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700,
                  cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 4,
                }}
              >
                ✓ Comprei!
              </motion.button>
              {produto.ml_deeplink && (
                <motion.button
                  whileTap={{ scale: 0.88 }}
                  onClick={() => window.open(produto.ml_deeplink!, '_blank')}
                  style={{
                    padding: '5px 9px', borderRadius: 20,
                    border: '1.5px solid #F4A526',
                    background: 'rgba(244,165,38,0.09)', color: '#C47F00',
                    fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 700,
                    cursor: 'pointer', whiteSpace: 'nowrap',
                  }}
                >
                  🛒 Ver no ML
                </motion.button>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
              <span style={{
                padding: '4px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700,
                background: 'rgba(27,94,90,0.09)', color: '#1B5E5A', whiteSpace: 'nowrap',
              }}>
                🛍️ Comprado
              </span>
              {produto.ml_deeplink && (
                <motion.button
                  whileTap={{ scale: 0.88 }}
                  onClick={() => window.open(produto.ml_deeplink!, '_blank')}
                  style={{
                    padding: '4px 8px', borderRadius: 20,
                    border: '1.5px solid #F4A526',
                    background: 'rgba(244,165,38,0.09)', color: '#C47F00',
                    fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 700,
                    cursor: 'pointer', whiteSpace: 'nowrap',
                  }}
                >
                  🛒 Ver no ML
                </motion.button>
              )}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => onStatusChange(produto.id, 'quero')}
                style={{
                  fontSize: 10, color: '#A3A3A3', background: 'none',
                  border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', padding: 0,
                }}
              >
                ↩ desfazer
              </motion.button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}

// ─── Seção colapsável ─────────────────────────────────────────────────

function Secao({
  emoji, titulo, produtos, aberta, onToggle, onStatusChange, onDelete, confettiId,
}: {
  emoji: string
  titulo: string
  produtos: ProdutoWishlist[]
  aberta: boolean
  onToggle: () => void
  onStatusChange: (id: string, status: ProdutoWishlist['status']) => void
  onDelete: (id: string, nome: string) => void
  confettiId: string | null
}) {
  if (produtos.length === 0) return null

  return (
    <div>
      <button
        onClick={onToggle}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          width: '100%', background: 'none', border: 'none', cursor: 'pointer',
          padding: '6px 0 10px',
        }}
      >
        <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14, color: 'var(--foreground)' }}>
          {emoji} {titulo} <span style={{ fontWeight: 400, color: '#767676' }}>({produtos.length})</span>
        </span>
        {aberta ? <ChevronUp size={16} color="#767676" /> : <ChevronDown size={16} color="#767676" />}
      </button>

      <AnimatePresence initial={false}>
        {aberta && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingBottom: 8 }}>
              {produtos.map(p => (
                <ProdutoCard
                  key={p.id}
                  produto={p}
                  onStatusChange={onStatusChange}
                  onDelete={onDelete}
                  showConfetti={confettiId === p.id}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Formulário de adição ─────────────────────────────────────────────

const FORM_EMPTY = {
  nome: '',
  marca: '',
  categoria: '' as string,
  subcategoria: '',
  preco_estimado: '',
  link_compra: '',
  prioridade: 'media' as ProdutoWishlist['prioridade'],
  notas: '',
}

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
      canvas.toBlob(blob => {
        resolve({ blob: blob!, preview: canvas.toDataURL('image/jpeg', 0.82) })
      }, 'image/jpeg', 0.82)
    }
    img.src = url
  })
}

function FormAdicionarProduto({
  userId, onSalvar, salvando,
}: {
  userId: string
  onSalvar: (dados: typeof FORM_EMPTY & { foto_blob: Blob | null; ml_produto_id: string | null; ml_deeplink: string | null }) => Promise<void>
  salvando: boolean
}) {
  const [form, setForm] = useState(FORM_EMPTY)
  const set = (k: keyof typeof FORM_EMPTY, v: string) => setForm(f => ({ ...f, [k]: v }))
  const inputFotoRef = useRef<HTMLInputElement>(null)
  const [fotoBlob, setFotoBlob] = useState<Blob | null>(null)
  const [fotoPreview, setFotoPreview] = useState<string | null>(null)

  // Busca ML
  const [mlQuery, setMlQuery] = useState('')
  const [mlResultados, setMlResultados] = useState<MLResultado[]>([])
  const [mlBuscando, setMlBuscando] = useState(false)
  const [mlSelecionado, setMlSelecionado] = useState<MLResultado | null>(null)
  const mlTimerRef = useRef<ReturnType<typeof setTimeout>>()

  function handleMlInput(v: string) {
    setMlQuery(v)
    clearTimeout(mlTimerRef.current)
    if (v.trim().length < 2) { setMlResultados([]); return }
    setMlBuscando(true)
    mlTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/armario/buscar-ml?q=${encodeURIComponent(v)}`)
        const data = await res.json()
        setMlResultados(data.produtos ?? [])
      } catch {
        setMlResultados([])
      } finally {
        setMlBuscando(false)
      }
    }, 400)
  }

  function handleSelecionarML(r: MLResultado) {
    setMlSelecionado(r)
    setMlResultados([])
    setMlQuery('')
    set('nome', r.titulo)
    if (r.vendedor) set('marca', r.vendedor)
    set('preco_estimado', String(r.preco))
    set('link_compra', r.permalink)
  }

  async function handleFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const { blob, preview } = await comprimirFoto(file)
    setFotoBlob(blob)
    setFotoPreview(preview)
    e.target.value = ''
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 14px', borderRadius: 12,
    border: '1.5px solid #E8E8E8', fontSize: 14, fontFamily: 'var(--font-body)',
    color: 'var(--foreground)', outline: 'none', boxSizing: 'border-box',
    background: '#FFFBFC',
  }

  return (
    <form
      onSubmit={async e => { e.preventDefault(); await onSalvar({ ...form, foto_blob: fotoBlob, ml_produto_id: mlSelecionado?.id ?? null, ml_deeplink: mlSelecionado?.deeplink ?? null }) }}
      style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
    >
      {/* Busca ML */}
      <div>
        <label style={{ fontSize: 12, fontWeight: 700, color: '#525252', marginBottom: 6, display: 'block' }}>
          Buscar no Mercado Livre
          <span style={{ fontWeight: 400, color: '#A3A3A3', marginLeft: 6 }}>opcional</span>
        </label>
        {mlSelecionado ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12, background: 'rgba(27,94,90,0.06)', border: '1.5px solid rgba(27,94,90,0.18)' }}>
            <img src={mlSelecionado.thumbnail} alt={mlSelecionado.titulo} style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#1B5E5A' }}>🔗 Vinculado ao ML</p>
              <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--foreground-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                R$ {mlSelecionado.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <button type="button" onClick={() => setMlSelecionado(null)}
              style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(239,68,68,0.1)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={12} color="#EF4444" />
            </button>
          </div>
        ) : (
          <div style={{ position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#A3A3A3' }} />
            <input
              value={mlQuery}
              onChange={e => handleMlInput(e.target.value)}
              placeholder="ex: Protetor solar, batom, sérum..."
              style={{ ...inputStyle, paddingLeft: 36 }}
            />
            {mlBuscando && <Loader2 size={15} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#A3A3A3', animation: 'spin 1s linear infinite' }} />}
          </div>
        )}
        {mlResultados.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 240, overflowY: 'auto', marginTop: 8, border: '1.5px solid #EDEDED', borderRadius: 12, padding: 6 }}>
            {mlResultados.map(r => (
              <motion.button key={r.id} type="button" whileTap={{ scale: 0.97 }}
                onClick={() => handleSelecionarML(r)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 10, border: 'none', background: '#FAFAFA', cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-body)' }}>
                <img src={r.thumbnail} alt={r.titulo} style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--foreground)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {r.titulo}
                  </p>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: '#1B5E5A', fontWeight: 700 }}>
                    R$ {r.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    {r.vendedor && <span style={{ fontWeight: 400, color: '#767676' }}> · {r.vendedor}</span>}
                  </p>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>

      {/* Nome */}
      <div>
        <label style={{ fontSize: 12, fontWeight: 700, color: '#525252', marginBottom: 6, display: 'block' }}>
          Nome *
        </label>
        <input
          required
          placeholder="ex: Protetor solar FPS 50"
          value={form.nome}
          onChange={e => set('nome', e.target.value)}
          style={inputStyle}
        />
      </div>

      {/* Marca */}
      <div>
        <label style={{ fontSize: 12, fontWeight: 700, color: '#525252', marginBottom: 6, display: 'block' }}>
          Marca
        </label>
        <input
          placeholder="ex: La Roche-Posay"
          value={form.marca}
          onChange={e => set('marca', e.target.value)}
          style={inputStyle}
        />
      </div>

      {/* Categoria */}
      <div>
        <label style={{ fontSize: 12, fontWeight: 700, color: '#525252', marginBottom: 8, display: 'block' }}>
          Categoria
        </label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {CATEGORIAS.filter(c => c.value !== null).map(c => (
            <button
              key={c.value}
              type="button"
              onClick={() => set('categoria', form.categoria === c.value ? '' : (c.value ?? ''))}
              style={{
                padding: '6px 12px', borderRadius: 20, border: '1.5px solid',
                borderColor: form.categoria === c.value ? 'var(--color-primary)' : '#E8E8E8',
                background: form.categoria === c.value ? 'rgba(255,51,102,0.07)' : '#fff',
                color: form.categoria === c.value ? 'var(--color-primary)' : '#525252',
                fontSize: 13, fontWeight: form.categoria === c.value ? 700 : 400,
                cursor: 'pointer', fontFamily: 'var(--font-body)',
              }}
            >
              {c.emoji} {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Subcategoria + Preço (row) */}
      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: '#525252', marginBottom: 6, display: 'block' }}>
            Subcategoria
          </label>
          <input
            placeholder="ex: Hidratante"
            value={form.subcategoria}
            onChange={e => set('subcategoria', e.target.value)}
            style={inputStyle}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: '#525252', marginBottom: 6, display: 'block' }}>
            Preço (R$)
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="0,00"
            value={form.preco_estimado}
            onChange={e => set('preco_estimado', e.target.value)}
            style={inputStyle}
          />
        </div>
      </div>

      {/* Link de compra */}
      <div>
        <label style={{ fontSize: 12, fontWeight: 700, color: '#525252', marginBottom: 6, display: 'block' }}>
          Link de compra
        </label>
        <input
          type="url"
          placeholder="https://..."
          value={form.link_compra}
          onChange={e => set('link_compra', e.target.value)}
          style={inputStyle}
        />
      </div>

      {/* Upload de foto */}
      <div>
        <label style={{ fontSize: 12, fontWeight: 700, color: '#525252', marginBottom: 8, display: 'block' }}>
          Foto do produto (opcional)
        </label>
        <input ref={inputFotoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFoto} />
        {fotoPreview ? (
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <img
              src={fotoPreview} alt="Preview"
              style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 12, display: 'block', border: '2px solid #FF3366' }}
            />
            <button
              type="button"
              onClick={() => { setFotoBlob(null); setFotoPreview(null) }}
              style={{
                position: 'absolute', top: -8, right: -8,
                width: 22, height: 22, borderRadius: '50%',
                background: '#EF4444', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
              }}
            >
              <X size={12} />
            </button>
          </div>
        ) : (
          <motion.button
            type="button"
            whileTap={{ scale: 0.96 }}
            onClick={() => inputFotoRef.current?.click()}
            style={{
              width: '100%', padding: '14px', borderRadius: 12,
              border: '1.5px dashed #E8E8E8', background: '#FAFAFA',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              cursor: 'pointer', color: '#A3A3A3', fontFamily: 'var(--font-body)', fontSize: 14,
            }}
          >
            <Camera size={18} /> Adicionar foto
          </motion.button>
        )}
      </div>

      {/* Prioridade */}
      <div>
        <label style={{ fontSize: 12, fontWeight: 700, color: '#525252', marginBottom: 8, display: 'block' }}>
          Prioridade
        </label>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['alta', 'media', 'baixa'] as const).map(p => {
            const cfg = PRIORIDADE_CONFIG[p]
            const ativo = form.prioridade === p
            return (
              <button
                key={p}
                type="button"
                onClick={() => set('prioridade', p)}
                style={{
                  flex: 1, padding: '9px 6px', borderRadius: 12, border: '1.5px solid',
                  borderColor: ativo ? cfg.color : '#E8E8E8',
                  background: ativo ? `${cfg.color}14` : '#fff',
                  color: ativo ? cfg.color : '#525252',
                  fontSize: 12, fontWeight: ativo ? 700 : 400,
                  cursor: 'pointer', fontFamily: 'var(--font-body)',
                }}
              >
                {cfg.dot} {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            )
          })}
        </div>
      </div>

      {/* Notas */}
      <div>
        <label style={{ fontSize: 12, fontWeight: 700, color: '#525252', marginBottom: 6, display: 'block' }}>
          Notas
        </label>
        <textarea
          placeholder="Ex: Aguardar promoção, testar antes de comprar..."
          value={form.notas}
          onChange={e => set('notas', e.target.value)}
          rows={3}
          style={{ ...inputStyle, resize: 'none', lineHeight: 1.5 }}
        />
      </div>

      {/* Salvar */}
      <motion.button
        type="submit"
        disabled={salvando || !form.nome.trim()}
        whileTap={{ scale: 0.97 }}
        style={{
          padding: '15px', borderRadius: 14, border: 'none',
          background: salvando || !form.nome.trim()
            ? 'rgba(255,51,102,0.4)'
            : 'linear-gradient(135deg, #FF3366, #C41A4A)',
          color: '#fff', fontFamily: 'var(--font-body)',
          fontSize: 15, fontWeight: 700, cursor: salvando ? 'not-allowed' : 'pointer',
          marginTop: 4,
        }}
      >
        {salvando ? 'Salvando...' : 'Adicionar à Wishlist'}
      </motion.button>
    </form>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────

export default function WishlistPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [produtos, setProdutos] = useState<ProdutoWishlist[]>([])
  const [loading, setLoading] = useState(true)
  const [sheetAberto, setSheetAberto] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [busca, setBusca] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState<CategoriaValue>(null)
  const [confettiId, setConfettiId] = useState<string | null>(null)
  const [secoesAbertas, setSecoesAbertas] = useState({ quero: true, comprei: false })

  const carregarProdutos = useCallback(async (uid: string) => {
    const supabase = createClient()
    const { data } = await supabase
      .from('wishlist_produtos')
      .select('*')
      .eq('usuario_id', uid)
      .order('created_at', { ascending: false })
    setProdutos((data as ProdutoWishlist[]) ?? [])
    setLoading(false)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    void (async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)
      await carregarProdutos(user.id)
    })()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Filtrar
  const filtrados = produtos.filter(p => {
    const matchBusca = !busca
      || p.nome.toLowerCase().includes(busca.toLowerCase())
      || (p.marca?.toLowerCase().includes(busca.toLowerCase()) ?? false)
    const matchCat = filtroCategoria === null || p.categoria === filtroCategoria
    return matchBusca && matchCat
  })

  const grupos = {
    quero:   filtrados.filter(p => p.status === 'quero'),
    comprei: filtrados.filter(p => p.status !== 'quero'), // tenho + comprei
  }

  const totalEstimado = grupos.quero
    .filter(p => p.preco_estimado)
    .reduce((acc, p) => acc + (p.preco_estimado ?? 0), 0)

  // Totais (sem filtro de busca — para o header)
  const totais = {
    quero:   produtos.filter(p => p.status === 'quero').length,
    comprei: produtos.filter(p => p.status !== 'quero').length,
  }

  async function handleStatusChange(id: string, novoStatus: ProdutoWishlist['status']) {
    if (!userId) return
    const supabase = createClient()
    const { error } = await supabase
      .from('wishlist_produtos')
      .update({ status: novoStatus })
      .eq('id', id)
      .eq('usuario_id', userId)
    if (error) { toast.error('Erro ao atualizar status'); return }

    setProdutos(prev => prev.map(p => p.id === id ? { ...p, status: novoStatus } : p))

    if (novoStatus === 'comprei' || novoStatus === 'tenho') {
      setSecoesAbertas(s => ({ ...s, comprei: true }))
      setConfettiId(id)
      setTimeout(() => setConfettiId(null), 1200)
      // Sugerir mover para o armário
      const prod = produtos.find(p => p.id === id)
      if (prod) {
        toast.success('🛍️ Marcado como comprado!', {
          action: {
            label: 'Mover para Armário 🪞',
            onClick: () => {
              const params = new URLSearchParams({
                nome: prod.nome,
                marca: prod.marca ?? '',
                categoria: prod.categoria ?? '',
                foto_url: prod.foto_url ?? '',
                wishlist_id: prod.id,
              })
              window.location.href = `/app/armario?${params.toString()}`
            },
          },
          duration: 6000,
        })
      } else {
        toast.success('🛍️ Produto marcado como comprado!')
      }
    }
  }

  async function handleDelete(id: string, nome: string) {
    if (!userId) return
    // Otimistic
    const backup = produtos.find(p => p.id === id)
    setProdutos(prev => prev.filter(p => p.id !== id))

    const supabase = createClient()
    const { error } = await supabase
      .from('wishlist_produtos')
      .delete()
      .eq('id', id)
      .eq('usuario_id', userId)

    if (error) {
      if (backup) setProdutos(prev => [backup, ...prev])
      toast.error('Erro ao excluir produto')
      return
    }
    toast.success(`"${nome}" removido da wishlist`)
  }

  async function handleSalvar(dados: typeof FORM_EMPTY & { foto_blob: Blob | null; ml_produto_id: string | null; ml_deeplink: string | null }) {
    if (!userId) return
    setSalvando(true)
    const supabase = createClient()

    // Upload da foto
    let fotoUrl: string | null = null
    if (dados.foto_blob) {
      const path = `${userId}/${crypto.randomUUID()}.jpg`
      const { error: uploadErr } = await supabase.storage
        .from('wishlist-fotos')
        .upload(path, dados.foto_blob, { contentType: 'image/jpeg' })
      if (uploadErr) {
        toast('Foto não salva — crie o bucket wishlist-fotos no Supabase', { icon: '⚠️' })
      } else {
        fotoUrl = supabase.storage.from('wishlist-fotos').getPublicUrl(path).data.publicUrl
      }
    }

    const { data, error } = await supabase
      .from('wishlist_produtos')
      .insert({
        usuario_id: userId,
        nome: dados.nome.trim(),
        marca: dados.marca.trim() || null,
        categoria: dados.categoria || null,
        subcategoria: dados.subcategoria.trim() || null,
        preco_estimado: dados.preco_estimado ? parseFloat(dados.preco_estimado) : null,
        link_compra: dados.link_compra.trim() || null,
        foto_url: fotoUrl,
        prioridade: dados.prioridade,
        notas: dados.notas.trim() || null,
        status: 'quero',
        ml_produto_id: dados.ml_produto_id ?? null,
        ml_deeplink: dados.ml_deeplink ?? null,
      })
      .select()
      .single()

    setSalvando(false)
    if (error) { toast.error('Erro ao adicionar produto'); return }
    setProdutos(prev => [data as ProdutoWishlist, ...prev])
    setSheetAberto(false)
    setSecoesAbertas(s => ({ ...s, quero: true }))
    toast.success('✨ Produto adicionado à wishlist!')
  }

  const temProdutos = produtos.length > 0
  const temResultados = filtrados.length > 0

  return (
    <PageContainer>
      <AppHeader />

      <main style={{ padding: '20px 20px 100px', minHeight: '80vh' }}>

        {/* Header */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <h1 className="text-page-title">Minha Wishlist 💄</h1>
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={() => setSheetAberto(true)}
              style={{
                width: 38, height: 38, borderRadius: '50%',
                background: 'linear-gradient(135deg, #FF3366, #F472A0)',
                border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(255,51,102,0.35)',
              }}
            >
              <Plus size={20} color="#fff" strokeWidth={2.5} />
            </motion.button>
          </div>

          {temProdutos && (
            <p className="text-caption">
              {totais.quero > 0 && `${totais.quero} na lista`}
              {totais.quero > 0 && totais.comprei > 0 && ' · '}
              {totais.comprei > 0 && `${totais.comprei} comprado${totais.comprei > 1 ? 's' : ''}`}
              {totalEstimado > 0 && ` · ${totalEstimado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} estimado`}
            </p>
          )}
        </div>

        {/* Busca */}
        {temProdutos && (
          <div style={{ position: 'relative', marginBottom: 14 }}>
            <Search size={15} color="#A3A3A3" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Buscar por nome ou marca..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              style={{
                width: '100%', padding: '10px 36px 10px 36px',
                borderRadius: 12, border: '1.5px solid #E8E8E8',
                fontSize: 14, fontFamily: 'var(--font-body)',
                color: 'var(--foreground)', outline: 'none',
                backgroundColor: '#fff', boxSizing: 'border-box',
              }}
            />
            {busca && (
              <button onClick={() => setBusca('')} style={{
                position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', color: '#A3A3A3', padding: 0,
              }}>
                <X size={16} />
              </button>
            )}
          </div>
        )}

        {/* Filtros de categoria */}
        {temProdutos && (
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none', marginBottom: 20, paddingBottom: 2 }}>
            {CATEGORIAS.map(c => {
              const ativo = filtroCategoria === c.value
              return (
                <button
                  key={String(c.value)}
                  onClick={() => setFiltroCategoria(c.value)}
                  style={{
                    flexShrink: 0, padding: '6px 14px', borderRadius: 20, border: '1.5px solid',
                    borderColor: ativo ? 'var(--color-primary)' : '#E8E8E8',
                    background: ativo ? 'rgba(255,51,102,0.07)' : '#fff',
                    color: ativo ? 'var(--color-primary)' : '#666',
                    fontSize: 13, fontWeight: ativo ? 700 : 400,
                    cursor: 'pointer', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap',
                  }}
                >
                  {c.emoji} {c.label}
                </button>
              )
            })}
          </div>
        )}

        {/* Loading */}
        {loading && <SkeletonList count={4} height={80} />}

        {/* Empty state */}
        {!loading && !temProdutos && (
          <EmptyState
            emoji="💄"
            titulo="Sua wishlist está vazia ✨"
            descricao="Adicione produtos que você deseja experimentar e acompanhe do 'quero' ao 'comprei'!"
            acao={
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setSheetAberto(true)}
                style={{
                  padding: '13px 28px', borderRadius: 14, border: 'none',
                  background: 'linear-gradient(135deg, #FF3366, #C41A4A)',
                  color: '#fff', fontSize: 15, fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'var(--font-body)',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}
              >
                <Plus size={18} /> Adicionar produto
              </motion.button>
            }
          />
        )}

        {/* Sem resultados na busca */}
        {!loading && temProdutos && !temResultados && (
          <p style={{ textAlign: 'center', color: '#767676', fontSize: 14, padding: '32px 0', fontFamily: 'var(--font-body)' }}>
            Nenhum produto encontrado.
          </p>
        )}

        {/* Grupos */}
        {!loading && temResultados && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <Secao
              emoji="💭"
              titulo={`Quero${totalEstimado > 0 ? ` · ${totalEstimado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}` : ''}`}
              produtos={grupos.quero}
              aberta={secoesAbertas.quero}
              onToggle={() => setSecoesAbertas(s => ({ ...s, quero: !s.quero }))}
              onStatusChange={handleStatusChange}
              onDelete={handleDelete}
              confettiId={confettiId}
            />
            <Secao
              emoji="🛍️" titulo="Comprados"
              produtos={grupos.comprei}
              aberta={secoesAbertas.comprei}
              onToggle={() => setSecoesAbertas(s => ({ ...s, comprei: !s.comprei }))}
              onStatusChange={handleStatusChange}
              onDelete={handleDelete}
              confettiId={confettiId}
            />
          </div>
        )}

      </main>

      {/* FAB flutuante */}
      {temProdutos && (
        <motion.button
          whileTap={{ scale: 0.90 }}
          onClick={() => setSheetAberto(true)}
          style={{
            position: 'fixed', bottom: 88, right: 20,
            width: 54, height: 54, borderRadius: '50%',
            background: 'linear-gradient(135deg, #FF3366, #F472A0)',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 6px 20px rgba(255,51,102,0.4)', zIndex: 20,
          }}
        >
          <Plus size={24} color="#fff" strokeWidth={2.5} />
        </motion.button>
      )}

      {/* Bottom sheet */}
      <BottomSheet
        isOpen={sheetAberto}
        onClose={() => setSheetAberto(false)}
        title="Adicionar produto"
      >
        <FormAdicionarProduto userId={userId ?? ''} onSalvar={handleSalvar} salvando={salvando} />
      </BottomSheet>
    </PageContainer>
  )
}
