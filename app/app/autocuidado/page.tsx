'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import { Plus, ChevronLeft, ChevronRight, Flame, X, Bell, BellOff, Trash2, Pencil, GripVertical } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import AppHeader from '@/components/ui/AppHeader'
import PageContainer from '@/components/ui/PageContainer'
import EmptyState from '@/components/ui/EmptyState'
import BottomSheet from '@/components/ui/BottomSheet'
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  closestCenter,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// ─── Types ────────────────────────────────────────────────────────────

interface RotinaBeleza {
  id: string
  usuario_id: string
  emoji: string | null
  nome: string
  categoria: string
  frequencia: 'diaria' | 'semanal' | 'personalizada'
  dias_semana: string[] | null   // text[] no banco
  lembrete_ativo: boolean
  hora_lembrete: string | null   // nome correto no banco
  streak_atual: number
  streak_maximo: number
  ativo: boolean                 // nome correto no banco
  created_at: string
}

interface Completacao {
  id: string
  rotina_id: string
  data_completada: string
}

// ─── Constants ────────────────────────────────────────────────────────

const CATEGORIAS = [
  { label: 'Pele', emoji: '🧴', value: 'pele' },
  { label: 'Cabelo', emoji: '💆', value: 'cabelo' },
  { label: 'Corpo', emoji: '🛁', value: 'corpo' },
  { label: 'Unhas', emoji: '💅', value: 'unhas' },
  { label: 'Saúde', emoji: '💊', value: 'saude' },
  { label: 'Exercício', emoji: '🏃', value: 'exercicio' },
  { label: 'Mente', emoji: '🧘', value: 'mente' },
  { label: 'Outro', emoji: '✨', value: 'outro' },
] as const

const EMOJIS = [
  '🧴','💄','💅','🪥','🧖','🏃','🧘','💊','🌿','🌸',
  '⭐','🌙','☀️','💧','🍃','🥗','🧃','🛁','💆','✨',
  '🎯','🔥','💪','🩺','🌺','🫧','🪷','💎','🌟','🩷',
]

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

function hojeStr(): string {
  return new Date().toISOString().split('T')[0]
}

function ontemStr(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toISOString().split('T')[0]
}

function diaDaSemanaHoje(): number {
  return new Date().getDay()
}

function rotinaDeHoje(r: RotinaBeleza): boolean {
  if (!r.ativo) return false
  if (r.frequencia === 'diaria') return true
  // semanal/personalizada: verifica dias_semana; null = todos os dias
  if (!r.dias_semana) return true
  return r.dias_semana.includes(String(diaDaSemanaHoje()))
}

// ─── Checkbox animado ─────────────────────────────────────────────────

function AnimatedCheckbox({ checked, onToggle }: { checked: boolean; onToggle: () => void }) {
  return (
    <motion.button
      whileTap={{ scale: 0.85 }}
      onClick={onToggle}
      style={{
        width: 28, height: 28,
        borderRadius: 8,
        border: checked ? 'none' : '2px solid #D0D0D0',
        background: checked ? 'linear-gradient(135deg, #FF3366, #C41A4A)' : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', flexShrink: 0,
        transition: 'background 0.18s, border 0.18s',
      }}
    >
      <AnimatePresence>
        {checked && (
          <motion.svg
            key="check"
            width={16} height={16} viewBox="0 0 16 16" fill="none"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ type: 'spring', stiffness: 500, damping: 22 }}
          >
            <motion.path
              d="M3 8l3.5 3.5L13 5"
              stroke="#fff" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
            />
          </motion.svg>
        )}
      </AnimatePresence>
    </motion.button>
  )
}

// ─── Barra de progresso do dia ─────────────────────────────────────────

function ProgressoHoje({ feitas, total }: { feitas: number; total: number }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })
  const pct = total === 0 ? 0 : feitas / total

  return (
    <div ref={ref} style={{
      background: 'linear-gradient(135deg, #FF3366 0%, #C41A4A 100%)',
      borderRadius: 20, padding: '20px 20px 18px',
      marginBottom: 8, color: '#fff',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <p style={{ margin: 0, fontSize: 13, opacity: 0.85, fontWeight: 500 }}>Progresso hoje</p>
          <p style={{ margin: '2px 0 0', fontSize: 28, fontWeight: 800, letterSpacing: -0.5 }}>
            {feitas}<span style={{ fontSize: 16, opacity: 0.75, fontWeight: 500 }}>/{total}</span>
          </p>
        </div>
        {feitas === total && total > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 18 }}
            style={{ fontSize: 32 }}
          >
            🌟
          </motion.div>
        )}
      </div>
      <div style={{ height: 8, background: 'rgba(255,255,255,0.25)', borderRadius: 4, overflow: 'hidden' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: inView ? `${pct * 100}%` : 0 }}
          transition={{ duration: 0.9, ease: [0.33, 1, 0.68, 1], delay: 0.2 }}
          style={{ height: '100%', background: '#fff', borderRadius: 4 }}
        />
      </div>
      {feitas === total && total > 0 && (
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ margin: '10px 0 0', fontSize: 13, opacity: 0.92, fontWeight: 600, textAlign: 'center' }}
        >
          🌟 Rotina completa! Você arrasou hoje!
        </motion.p>
      )}
    </div>
  )
}

// ─── Card de rotina ────────────────────────────────────────────────────

function RotinaCard({
  rotina, concluida, onToggle, onEdit, onDelete, isDraggable,
}: {
  rotina: RotinaBeleza
  concluida: boolean
  onToggle: () => void
  onEdit?: (r: RotinaBeleza) => void
  onDelete?: (id: string) => void
  isDraggable?: boolean
}) {
  const [confirmando, setConfirmando] = useState(false)

  return (
    <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 8 }}>
      {/* Linha principal */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        background: 'var(--surface)',
        border: `1.5px solid ${concluida ? 'rgba(255,51,102,0.15)' : '#EDEDED'}`,
        borderRadius: confirmando ? '14px 14px 0 0' : 14,
        padding: '13px 12px',
        transition: 'border 0.18s, border-radius 0.15s',
      }}>
        {/* Indicador visual de drag — apenas ícone, sem handle funcional */}
        {isDraggable && (
          <div style={{ color: '#D0D0D0', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
            <GripVertical size={16} />
          </div>
        )}

        <AnimatedCheckbox checked={concluida} onToggle={onToggle} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            margin: 0, fontSize: 15, fontWeight: 600,
            color: concluida ? 'var(--foreground-muted)' : 'var(--foreground)',
            textDecoration: concluida ? 'line-through' : 'none',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {rotina.emoji ? `${rotina.emoji} ` : ''}{rotina.nome}
          </p>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--foreground-muted)' }}>
            {CATEGORIAS.find(c => c.value === rotina.categoria)?.label ?? rotina.categoria}
            {rotina.frequencia === 'diaria' ? ' · Diária' : ` · ${(rotina.dias_semana ?? []).map(d => DIAS_SEMANA[Number(d)]).join(', ')}`}
          </p>
        </div>

        {/* Streak */}
        {rotina.streak_atual > 2 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
            <Flame size={13} color="#FF8C00" fill="#FF8C00" />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#FF8C00' }}>{rotina.streak_atual}</span>
          </div>
        )}

        {/* Botões de ação */}
        {(onEdit || onDelete) && (
          <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
            {onEdit && (
              <motion.button whileTap={{ scale: 0.85 }} onClick={() => onEdit(rotina)}
                style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: 'rgba(27,94,90,0.08)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Pencil size={14} color="#1B5E5A" />
              </motion.button>
            )}
            {onDelete && (
              <motion.button whileTap={{ scale: 0.85 }}
                onClick={() => setConfirmando(v => !v)}
                style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: confirmando ? 'rgba(239,68,68,0.12)' : 'rgba(239,68,68,0.06)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Trash2 size={14} color="#EF4444" />
              </motion.button>
            )}
          </div>
        )}
      </div>

      {/* Confirmação de exclusão */}
      <AnimatePresence>
        {confirmando && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.18 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: 'rgba(239,68,68,0.06)', border: '1.5px solid rgba(239,68,68,0.18)',
              borderTop: 'none', borderRadius: '0 0 14px 14px', padding: '10px 14px',
            }}>
              <span style={{ fontSize: 13, color: '#EF4444', fontWeight: 600 }}>
                Remover "{rotina.nome}"?
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setConfirmando(false)}
                  style={{ padding: '6px 14px', borderRadius: 8, border: '1.5px solid #E8E8E8', background: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', color: 'var(--foreground)' }}>
                  Cancelar
                </button>
                <button onClick={() => { setConfirmando(false); onDelete?.(rotina.id) }}
                  style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: '#EF4444', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                  Remover
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ─── Sortable card (DnD wrapper) ──────────────────────────────────────

function SortableRotinaCard({
  rotina, concluida, onToggle, onEdit, onDelete,
}: {
  rotina: RotinaBeleza
  concluida: boolean
  onToggle: () => void
  onEdit?: (r: RotinaBeleza) => void
  onDelete?: (id: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: rotina.id })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.45 : 1,
    zIndex: isDragging ? 10 : undefined,
    cursor: isDragging ? 'grabbing' : 'grab',
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    >
      <RotinaCard
        rotina={rotina}
        concluida={concluida}
        onToggle={onToggle}
        onEdit={onEdit}
        onDelete={onDelete}
        isDraggable
      />
    </div>
  )
}

// ─── Mini calendário ───────────────────────────────────────────────────

function MiniCalendario({ completacoes }: { completacoes: Completacao[] }) {
  const [mes, setMes] = useState(new Date())

  const diasCompletados = new Set(completacoes.map(c => c.data_completada))

  const ano = mes.getFullYear()
  const mesNum = mes.getMonth()
  const primeiroDia = new Date(ano, mesNum, 1).getDay()
  const totalDias = new Date(ano, mesNum + 1, 0).getDate()

  const nomeMes = mes.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  const cells: (number | null)[] = []
  for (let i = 0; i < primeiroDia; i++) cells.push(null)
  for (let d = 1; d <= totalDias; d++) cells.push(d)

  function dateStr(d: number) {
    return `${ano}-${String(mesNum + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  }

  return (
    <div style={{ background: 'var(--surface)', borderRadius: 16, padding: '16px 16px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => setMes(m => { const n = new Date(m); n.setMonth(n.getMonth() - 1); return n })}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--foreground-muted)', padding: 4 }}>
          <ChevronLeft size={18} />
        </motion.button>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--foreground)', textTransform: 'capitalize' }}>
          {nomeMes}
        </p>
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => setMes(m => { const n = new Date(m); n.setMonth(n.getMonth() + 1); return n })}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--foreground-muted)', padding: 4 }}>
          <ChevronRight size={18} />
        </motion.button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
        {DIAS_SEMANA.map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, color: 'var(--foreground-muted)', padding: '0 0 4px' }}>
            {d}
          </div>
        ))}
        {cells.map((d, i) => {
          if (d === null) return <div key={`e${i}`} />
          const ds = dateStr(d)
          const completado = diasCompletados.has(ds)
          const hoje = ds === hojeStr()
          return (
            <div key={ds} style={{
              textAlign: 'center', fontSize: 13, fontWeight: hoje ? 700 : 500,
              color: completado ? '#fff' : hoje ? '#FF3366' : 'var(--foreground)',
              background: completado ? 'linear-gradient(135deg, #FF3366, #C41A4A)' : hoje ? 'rgba(255,51,102,0.08)' : 'transparent',
              borderRadius: 8, padding: '5px 0',
              transition: 'background 0.18s',
            }}>
              {d}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Templates ────────────────────────────────────────────────────────

const TEMPLATES = [
  { emoji: '🧴', nome: 'Hidratante facial', categoria: 'pele' },
  { emoji: '☀️', nome: 'Protetor solar', categoria: 'pele' },
  { emoji: '💧', nome: 'Beber água', categoria: 'saude' },
  { emoji: '💊', nome: 'Vitaminas', categoria: 'saude' },
  { emoji: '🧖', nome: 'Máscara facial', categoria: 'pele' },
  { emoji: '🏃', nome: 'Exercício', categoria: 'exercicio' },
  { emoji: '🧘', nome: 'Meditação', categoria: 'mente' },
  { emoji: '💆', nome: 'Cuidado com cabelo', categoria: 'cabelo' },
  { emoji: '🫧', nome: 'Limpeza de pele', categoria: 'pele' },
  { emoji: '💅', nome: 'Cuidado com unhas', categoria: 'unhas' },
] as const

// ─── Formulário nova rotina ────────────────────────────────────────────

function FormNovaRotina({
  onSalvar,
  onClose,
  rotinaParaEditar,
}: {
  onSalvar: () => void
  onClose: () => void
  rotinaParaEditar?: RotinaBeleza
}) {
  const supabase = createClient()
  const editando = !!rotinaParaEditar
  const [salvando, setSalvando] = useState(false)
  const [emojiSelecionado, setEmojiSelecionado] = useState(rotinaParaEditar?.emoji ?? '✨')
  const [nome, setNome] = useState(rotinaParaEditar?.nome ?? '')
  const [categoria, setCategoria] = useState(rotinaParaEditar?.categoria ?? 'pele')
  const [mostrarEmojis, setMostrarEmojis] = useState(false)
  const [diasSemana, setDiasSemana] = useState<number[]>(() => {
    if (!rotinaParaEditar || rotinaParaEditar.frequencia === 'diaria' || !rotinaParaEditar.dias_semana) {
      return [0, 1, 2, 3, 4, 5, 6]
    }
    return rotinaParaEditar.dias_semana.map(Number)
  })
  const [lembrete, setLembrete] = useState(rotinaParaEditar?.lembrete_ativo ?? false)
  const [lembreteHora, setLembreteHora] = useState(rotinaParaEditar?.hora_lembrete ?? '08:00')

  function toggleDia(d: number) {
    setDiasSemana(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d])
  }

  async function salvar() {
    if (!nome.trim()) { toast.error('Informe o nome da rotina'); return }
    setSalvando(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('Sessão expirada'); setSalvando(false); return }

    // frequencia: se todos os 7 dias selecionados (ou nenhum selecionado) = diaria
    const todosOsDias = diasSemana.length === 7 || diasSemana.length === 0
    const freqFinal = todosOsDias ? 'diaria' : 'semanal'
    // dias_semana é text[] no banco — converter number[] para string[]
    const diasFinal = todosOsDias ? null : diasSemana.map(String)

    const payload: Record<string, unknown> = {
      emoji: emojiSelecionado,
      nome: nome.trim(),
      categoria,
      frequencia: freqFinal,
      dias_semana: diasFinal,
      lembrete_ativo: lembrete,
      hora_lembrete: lembrete ? lembreteHora : null,
    }

    let error
    if (editando && rotinaParaEditar) {
      const { error: e } = await supabase
        .from('checklist_rotinas')
        .update(payload)
        .eq('id', rotinaParaEditar.id)
      error = e
    } else {
      payload.usuario_id = user.id
      const { error: e } = await supabase.from('checklist_rotinas').insert(payload)
      error = e
    }

    if (error) {
      console.error('[autocuidado] save error:', error)
      toast.error(`Erro ao salvar: ${error.message}`)
      setSalvando(false)
      return
    }

    toast.success(editando ? 'Rotina atualizada!' : 'Rotina criada!')
    onSalvar()
    onClose()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Templates rápidos */}
      <div>
        <p style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 600, color: 'var(--foreground-muted)' }}>
          ⚡ Adicionar rapidamente
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {TEMPLATES.map(t => (
            <motion.button
              key={t.nome} type="button" whileTap={{ scale: 0.92 }}
              onClick={() => {
                setEmojiSelecionado(t.emoji)
                setNome(t.nome)
                setCategoria(t.categoria)
              }}
              style={{
                padding: '7px 12px', borderRadius: 20, border: '1.5px solid #E8E8E8',
                background: nome === t.nome ? 'rgba(255,51,102,0.08)' : '#FAFAFA',
                borderColor: nome === t.nome ? '#FF3366' : '#E8E8E8',
                color: nome === t.nome ? '#FF3366' : 'var(--foreground)',
                fontSize: 13, fontWeight: 500, cursor: 'pointer',
                fontFamily: 'var(--font-body)',
              }}
            >
              {t.emoji} {t.nome}
            </motion.button>
          ))}
        </div>
      </div>

      <div style={{ height: 1, background: '#F0F0F0' }} />

      {/* Emoji picker (colapsável) */}
      <div>
        <button
          type="button"
          onClick={() => setMostrarEmojis(v => !v)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, background: 'none',
            border: 'none', cursor: 'pointer', padding: 0, marginBottom: mostrarEmojis ? 10 : 0,
          }}
        >
          <span style={{ fontSize: 24 }}>{emojiSelecionado}</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--foreground-muted)' }}>
            {mostrarEmojis ? '▲ Fechar emojis' : '▼ Trocar emoji'}
          </span>
        </button>
        <AnimatePresence>
          {mostrarEmojis && (
            <motion.div
              initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
              style={{ overflow: 'hidden' }}
            >
        <p style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 600, color: 'var(--foreground-muted)' }}>Emoji</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {EMOJIS.map(e => (
            <motion.button
              key={e} type="button" whileTap={{ scale: 0.85 }}
              onClick={() => { setEmojiSelecionado(e); setMostrarEmojis(false) }}
              style={{
                width: 40, height: 40, borderRadius: 10, fontSize: 20,
                border: e === emojiSelecionado ? '2px solid #FF3366' : '1.5px solid #E8E8E8',
                background: e === emojiSelecionado ? 'rgba(255,51,102,0.06)' : '#fff',
                cursor: 'pointer',
              }}
            >
              {e}
            </motion.button>
          ))}
        </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nome */}
      <div>
        <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 600, color: 'var(--foreground-muted)' }}>Nome</p>
        <input
          value={nome}
          onChange={e => setNome(e.target.value)}
          placeholder="ex: Hidratante facial, Escova progressiva..."
          maxLength={60}
          style={{
            width: '100%', padding: '12px 14px', borderRadius: 12, fontSize: 15,
            border: '1.5px solid #E8E8E8', outline: 'none',
            fontFamily: 'var(--font-body)', boxSizing: 'border-box',
            background: 'var(--background)', color: 'var(--foreground)',
          }}
        />
      </div>

      {/* Categoria */}
      <div>
        <p style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 600, color: 'var(--foreground-muted)' }}>Categoria</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {CATEGORIAS.map(c => (
            <motion.button
              key={c.value} whileTap={{ scale: 0.94 }}
              onClick={() => setCategoria(c.value)}
              style={{
                padding: '7px 14px', borderRadius: 20, fontSize: 13, fontWeight: 500, cursor: 'pointer',
                border: `1.5px solid ${categoria === c.value ? '#FF3366' : '#E8E8E8'}`,
                background: categoria === c.value ? 'rgba(255,51,102,0.06)' : '#fff',
                color: categoria === c.value ? '#FF3366' : 'var(--foreground)',
              }}
            >
              {c.emoji} {c.label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Frequência — seletor livre de dias */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--foreground-muted)' }}>Quando fazer</p>
          <span style={{ fontSize: 12, color: '#FF3366', fontWeight: 600 }}>
            {diasSemana.length === 7 ? '☀️ Todos os dias' :
             diasSemana.length === 0 ? 'Nenhum dia' :
             diasSemana.length === 5 && !diasSemana.includes(0) && !diasSemana.includes(6) ? '💼 Dias úteis' :
             `${diasSemana.length}× por semana`}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 6, justifyContent: 'space-between' }}>
          {DIAS_SEMANA.map((d, i) => (
            <motion.button
              key={i} whileTap={{ scale: 0.88 }} type="button"
              onClick={() => toggleDia(i)}
              style={{
                flex: 1, padding: '9px 0', borderRadius: 10, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                border: `1.5px solid ${diasSemana.includes(i) ? '#FF3366' : '#E8E8E8'}`,
                background: diasSemana.includes(i) ? 'rgba(255,51,102,0.10)' : '#FAFAFA',
                color: diasSemana.includes(i) ? '#FF3366' : 'var(--foreground-muted)',
                transition: 'all 0.15s',
              }}
            >
              {d}
            </motion.button>
          ))}
        </div>
        <p style={{ margin: '8px 0 0', fontSize: 11, color: 'var(--foreground-muted)', textAlign: 'center' }}>
          Toque nos dias para selecionar
        </p>
      </div>

      {/* Lembrete */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {lembrete ? <Bell size={18} color="#FF3366" /> : <BellOff size={18} color="var(--foreground-muted)" />}
          <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--foreground)' }}>Lembrete</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {lembrete && (
            <input
              type="time"
              value={lembreteHora}
              onChange={e => setLembreteHora(e.target.value)}
              style={{
                padding: '6px 10px', borderRadius: 8, border: '1.5px solid #E8E8E8',
                fontSize: 14, fontFamily: 'var(--font-body)', outline: 'none',
                background: 'var(--background)', color: 'var(--foreground)',
              }}
            />
          )}
          <motion.button
            whileTap={{ scale: 0.93 }}
            onClick={() => setLembrete(v => !v)}
            style={{
              width: 44, height: 26, borderRadius: 13,
              backgroundColor: lembrete ? '#FF3366' : '#D0D0D0',
              border: 'none', cursor: 'pointer', position: 'relative',
              transition: 'background-color 0.22s',
            }}
          >
            <motion.div
              animate={{ x: lembrete ? 20 : 2 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              style={{
                width: 20, height: 20, borderRadius: '50%', background: '#fff',
                position: 'absolute', top: 3,
                boxShadow: '0 1px 4px rgba(0,0,0,0.18)',
              }}
            />
          </motion.button>
        </div>
      </div>

      {/* Botão salvar */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={salvar}
        disabled={salvando}
        style={{
          width: '100%', padding: '15px',
          background: salvando ? 'rgba(255,51,102,0.5)' : 'linear-gradient(135deg, #FF3366, #C41A4A)',
          color: '#fff', border: 'none', borderRadius: 14,
          fontSize: 16, fontWeight: 700, cursor: salvando ? 'not-allowed' : 'pointer',
          fontFamily: 'var(--font-body)',
        }}
      >
        {salvando ? 'Salvando…' : editando ? 'Salvar alterações' : 'Criar rotina'}
      </motion.button>
    </div>
  )
}

// ─── Content ──────────────────────────────────────────────────────────

function AutocuidadoContent({ userId }: { userId: string }) {
  const supabase = createClient()

  const [aba, setAba] = useState<'hoje' | 'todas' | 'historico'>('hoje')
  const [rotinas, setRotinas] = useState<RotinaBeleza[]>([])
  const [completacoes, setCompletacoes] = useState<Completacao[]>([])
  const [todasCompletacoes, setTodasCompletacoes] = useState<Completacao[]>([])
  const [carregando, setCarregando] = useState(true)
  const [sheetAberto, setSheetAberto] = useState(false)
  const [sheetEditando, setSheetEditando] = useState<RotinaBeleza | null>(null)

  const sensors = useSensors(
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    setRotinas(prev => {
      const oldIndex = prev.findIndex(r => r.id === active.id)
      const newIndex = prev.findIndex(r => r.id === over.id)
      const reordered = arrayMove(prev, oldIndex, newIndex)
      // Persist ordem ao banco (fire-and-forget)
      reordered.forEach((r, idx) => {
        supabase.from('checklist_rotinas').update({ ordem: idx }).eq('id', r.id).then(() => {})
      })
      return reordered
    })
  }

  function handleDragEndHoje(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    setRotinas(prev => {
      const hoje = prev.filter(rotinaDeHoje)
      const oldIndex = hoje.findIndex(r => r.id === active.id)
      const newIndex = hoje.findIndex(r => r.id === over.id)
      const reorderedHoje = arrayMove(hoje, oldIndex, newIndex)

      // Rebuild full rotinas array preserving non-hoje items positions
      let hojeIdx = 0
      const result = prev.map(r => rotinaDeHoje(r) ? reorderedHoje[hojeIdx++] : r)

      result.forEach((r, idx) => {
        supabase.from('checklist_rotinas').update({ ordem: idx }).eq('id', r.id).then(() => {})
      })
      return result
    })
  }

  const rotinasDeHoje = rotinas.filter(rotinaDeHoje)
  const concluidas = new Set(
    completacoes.filter(c => c.data_completada === hojeStr()).map(c => c.rotina_id)
  )

  // ── Carregar dados ───────────────────────────────────────────────────

  const carregarDados = useCallback(async () => {
    const [{ data: rots }, { data: comps }, { data: todasComps }] = await Promise.all([
      supabase.from('checklist_rotinas').select('*').eq('usuario_id', userId).eq('ativo', true).order('created_at'),
      supabase.from('checklist_completacoes').select('*').eq('usuario_id', userId).eq('data_completada', hojeStr()),
      supabase.from('checklist_completacoes').select('*').eq('usuario_id', userId).order('data_completada', { ascending: false }).limit(365),
    ])

    setRotinas(rots ?? [])
    setCompletacoes(comps ?? [])
    setTodasCompletacoes(todasComps ?? [])
    setCarregando(false)

    // Resetar streaks quebrados
    if (rots) {
      const ontem = ontemStr()
      const hoje = hojeStr()
      for (const r of rots) {
        if (!rotinaDeHoje(r) || r.streak_atual === 0) continue
        const ultimaComp = (todasComps ?? []).find((c: Completacao) => c.rotina_id === r.id)
        if (!ultimaComp) continue
        if (ultimaComp.data_completada !== ontem && ultimaComp.data_completada !== hoje) {
          await supabase.from('checklist_rotinas')
            .update({ streak_atual: 0 })
            .eq('id', r.id)
        }
      }
    }
  }, [supabase, userId])

  useEffect(() => {
    carregarDados()
  }, [carregarDados])

  // ── Toggle completação ────────────────────────────────────────────────

  async function toggleCompletacao(rotinaId: string) {
    const jaFeita = concluidas.has(rotinaId)
    const hoje = hojeStr()
    const ontem = ontemStr()

    if (jaFeita) {
      // Desmarcar
      await supabase.from('checklist_completacoes')
        .delete()
        .eq('rotina_id', rotinaId)
        .eq('data_completada', hoje)
        .eq('usuario_id', userId)

      setCompletacoes(prev => prev.filter(c => !(c.rotina_id === rotinaId && c.data_completada === hoje)))

      // Decrementar streak
      const rotina = rotinas.find(r => r.id === rotinaId)
      if (rotina && rotina.streak_atual > 0) {
        const novoStreak = rotina.streak_atual - 1
        await supabase.from('checklist_rotinas').update({ streak_atual: novoStreak }).eq('id', rotinaId)
        setRotinas(prev => prev.map(r => r.id === rotinaId ? { ...r, streak_atual: novoStreak } : r))
      }
    } else {
      // Marcar — tenta INSERT, ignora 23505 (duplicata)
      const { error } = await supabase.from('checklist_completacoes').insert({
        rotina_id: rotinaId,
        usuario_id: userId,
        data_completada: hoje,
      })

      if (error && error.code !== '23505') {
        toast.error('Erro ao marcar rotina')
        return
      }

      if (!error) {
        const novaComp: Completacao = { id: crypto.randomUUID(), rotina_id: rotinaId, data_completada: hoje }
        setCompletacoes(prev => [...prev, novaComp])

        // Atualizar streak
        const rotina = rotinas.find(r => r.id === rotinaId)
        if (rotina) {
          const ultimaAntes = todasCompletacoes.find(c => c.rotina_id === rotinaId && c.data_completada !== hoje)
          const novoStreak = ultimaAntes?.data_completada === ontem ? rotina.streak_atual + 1 : 1
          const novoMax = Math.max(novoStreak, rotina.streak_maximo)
          await supabase.from('checklist_rotinas').update({
            streak_atual: novoStreak,
            streak_maximo: novoMax,
          }).eq('id', rotinaId)
          setRotinas(prev => prev.map(r =>
            r.id === rotinaId ? { ...r, streak_atual: novoStreak, streak_maximo: novoMax } : r
          ))

          if (novoStreak > 2) toast.success(`🔥 ${novoStreak} dias seguidos!`)
        }
      }

      // Celebração se completou tudo
      const novasConcluidas = new Set([...Array.from(concluidas), rotinaId])
      const faltam = rotinasDeHoje.filter(r => !novasConcluidas.has(r.id))
      if (faltam.length === 0 && rotinasDeHoje.length > 0) {
        setTimeout(() => toast.success('🌟 Rotina completa! Você arrasou hoje!'), 300)
      }
    }
  }

  async function handleDeleteRotina(rotinaId: string) {
    const backup = rotinas.find(r => r.id === rotinaId)
    setRotinas(prev => prev.filter(r => r.id !== rotinaId))
    const { error } = await supabase.from('checklist_rotinas').delete().eq('id', rotinaId)
    if (error) {
      if (backup) setRotinas(prev => [backup, ...prev])
      toast.error('Erro ao remover rotina')
    } else {
      toast.success('Rotina removida')
    }
  }

  // ─── Render ─────────────────────────────────────────────────────────

  return (
    <>
      <AppHeader />
      <PageContainer>

        {/* Título */}
        <div style={{ padding: '16px 20px 0' }}>
          <h1 className="text-page-title">Autocuidado 🌿</h1>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex', gap: 0,
          background: 'var(--surface)',
          borderRadius: 14, padding: 4,
          marginBottom: 16,
        }}>
          {(['hoje', 'todas', 'historico'] as const).map(tab => (
            <motion.button
              key={tab}
              whileTap={{ scale: 0.96 }}
              onClick={() => setAba(tab)}
              style={{
                flex: 1, padding: '9px 0', borderRadius: 10, border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-body)',
                background: aba === tab ? '#fff' : 'transparent',
                color: aba === tab ? '#FF3366' : 'var(--foreground-muted)',
                boxShadow: aba === tab ? '0 1px 6px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.18s',
              }}
            >
              {tab === 'hoje' ? 'Hoje' : tab === 'todas' ? 'Todas' : 'Histórico'}
            </motion.button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* ── ABA HOJE ─────────────────────────────────────────────── */}
          {aba === 'hoje' && (
            <motion.div
              key="hoje"
              initial={{ opacity: 0, x: -18 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 18 }}
              transition={{ duration: 0.2 }}
            >
              {carregando ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[1,2,3].map(i => (
                    <div key={i} className="skeleton-shimmer" style={{ height: 66, borderRadius: 14 }} />
                  ))}
                </div>
              ) : rotinasDeHoje.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  style={{
                    textAlign: 'center', padding: '40px 24px',
                    background: 'linear-gradient(135deg, #FFF0F3 0%, #FFFBFC 60%, #FFF0F3 100%)',
                    borderRadius: 20, border: '1.5px solid rgba(255,51,102,0.12)',
                  }}
                >
                  <div style={{ fontSize: 48, marginBottom: 12 }}>🌿</div>
                  <p style={{ fontWeight: 700, fontSize: 16, color: 'var(--foreground)', margin: '0 0 8px' }}>
                    Comece seu autocuidado hoje
                  </p>
                  <p style={{ fontSize: 14, color: 'var(--foreground-muted)', margin: '0 0 20px', lineHeight: 1.5 }}>
                    Pequenos gestos diários fazem toda a diferença. Crie sua primeira rotina e sinta a mudança!
                  </p>
                  <motion.button
                    whileTap={{ scale: 0.96 }} onClick={() => setSheetAberto(true)}
                    style={{
                      padding: '12px 28px', borderRadius: 14, border: 'none', cursor: 'pointer',
                      background: 'linear-gradient(135deg, #FF3366, #C41A4A)', color: '#fff',
                      fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-body)',
                      display: 'inline-flex', alignItems: 'center', gap: 8,
                    }}
                  >
                    <Plus size={18} /> Criar minha primeira rotina
                  </motion.button>
                </motion.div>
              ) : (
                <>
                  <ProgressoHoje feitas={concluidas.size} total={rotinasDeHoje.length} />
                  {concluidas.size > 0 && concluidas.size < rotinasDeHoje.length && (
                    <p style={{
                      textAlign: 'center', fontSize: 13, color: 'var(--foreground-muted)',
                      margin: '4px 0 12px', fontStyle: 'italic',
                    }}>
                      {rotinasDeHoje.length - concluidas.size === 1
                        ? 'Só mais uma! Você está quase lá 💪'
                        : `Faltam ${rotinasDeHoje.length - concluidas.size}. Continue assim! ✨`}
                    </p>
                  )}
                  <div style={{ marginTop: 8 }}>
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEndHoje}>
                      <SortableContext items={rotinasDeHoje.map(r => r.id)} strategy={verticalListSortingStrategy}>
                        {rotinasDeHoje.map(r => (
                          <SortableRotinaCard
                            key={r.id}
                            rotina={r}
                            concluida={concluidas.has(r.id)}
                            onToggle={() => toggleCompletacao(r.id)}
                            onEdit={r => setSheetEditando(r)}
                            onDelete={handleDeleteRotina}
                          />
                        ))}
                      </SortableContext>
                    </DndContext>
                  </div>
                </>
              )}
            </motion.div>
          )}

          {/* ── ABA TODAS ────────────────────────────────────────────── */}
          {aba === 'todas' && (
            <motion.div
              key="todas"
              initial={{ opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -18 }}
              transition={{ duration: 0.2 }}
            >
              {carregando ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[1,2,3,4].map(i => (
                    <div key={i} className="skeleton-shimmer" style={{ height: 66, borderRadius: 14 }} />
                  ))}
                </div>
              ) : rotinas.length === 0 ? (
                <EmptyState
                  emoji="✨"
                  titulo="Nenhuma rotina criada"
                  descricao="Adicione rotinas de autocuidado para o seu dia a dia"
                  acao={
                    <motion.button whileTap={{ scale: 0.96 }} onClick={() => setSheetAberto(true)}
                      style={{ padding: '10px 24px', borderRadius: 12, border: 'none', cursor: 'pointer',
                        background: 'linear-gradient(135deg, #FF3366, #C41A4A)', color: '#fff',
                        fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-body)' }}>
                      Criar rotina
                    </motion.button>
                  }
                />
              ) : (
                <>
                  <p style={{ margin: '0 0 10px', fontSize: 12, color: 'var(--foreground-muted)', textAlign: 'center' }}>
                    Segure e arraste para reordenar
                  </p>
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={rotinas.map(r => r.id)} strategy={verticalListSortingStrategy}>
                      {rotinas.map(r => (
                        <SortableRotinaCard
                          key={r.id}
                          rotina={r}
                          concluida={concluidas.has(r.id)}
                          onToggle={() => toggleCompletacao(r.id)}
                          onEdit={r => setSheetEditando(r)}
                          onDelete={handleDeleteRotina}
                        />
                      ))}
                    </SortableContext>
                  </DndContext>
                </>
              )}
            </motion.div>
          )}

          {/* ── ABA HISTÓRICO ─────────────────────────────────────────── */}
          {aba === 'historico' && (
            <motion.div
              key="historico"
              initial={{ opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -18 }}
              transition={{ duration: 0.2 }}
            >
              {carregando ? (
                <div className="skeleton-shimmer" style={{ height: 280, borderRadius: 16 }} />
              ) : (
                <>
                  {/* Resumo de streaks */}
                  {rotinas.filter(r => r.streak_maximo > 0).length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                      <p style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700, color: 'var(--foreground-muted)' }}>
                        🏆 Melhores streaks
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {rotinas
                          .filter(r => r.streak_maximo > 0)
                          .sort((a, b) => b.streak_maximo - a.streak_maximo)
                          .slice(0, 5)
                          .map(r => (
                            <div key={r.id} style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                              background: 'var(--surface)', borderRadius: 12, padding: '12px 14px',
                            }}>
                              <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--foreground)' }}>
                                {r.emoji} {r.nome}
                              </p>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Flame size={14} color="#FF8C00" fill="#FF8C00" />
                                <span style={{ fontSize: 13, fontWeight: 700, color: '#FF8C00' }}>
                                  {r.streak_maximo} dias
                                </span>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  <p style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700, color: 'var(--foreground-muted)' }}>
                    📅 Calendário de completações
                  </p>
                  <MiniCalendario completacoes={todasCompletacoes} />
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Espaço para FAB */}
        <div style={{ height: 88 }} />
      </PageContainer>

      {/* FAB */}
      <motion.button
        whileTap={{ scale: 0.93 }}
        onClick={() => setSheetAberto(true)}
        style={{
          position: 'fixed', bottom: 88, right: 20,
          width: 52, height: 52,
          background: 'linear-gradient(135deg, #FF3366, #C41A4A)',
          borderRadius: '50%', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 16px rgba(255,51,102,0.38)',
          zIndex: 30,
        }}
      >
        <Plus size={24} color="#fff" strokeWidth={2.5} />
      </motion.button>

      {/* BottomSheet nova rotina */}
      <BottomSheet
        isOpen={sheetAberto}
        onClose={() => setSheetAberto(false)}
        title="Nova rotina"
        maxHeight="92dvh"
      >
        <FormNovaRotina
          onSalvar={carregarDados}
          onClose={() => setSheetAberto(false)}
        />
      </BottomSheet>

      {/* BottomSheet editar rotina */}
      <BottomSheet
        isOpen={!!sheetEditando}
        onClose={() => setSheetEditando(null)}
        title="Editar rotina"
        maxHeight="92dvh"
      >
        {sheetEditando && (
          <FormNovaRotina
            rotinaParaEditar={sheetEditando}
            onSalvar={carregarDados}
            onClose={() => setSheetEditando(null)}
          />
        )}
      </BottomSheet>
    </>
  )
}

// ─── Shell ─────────────────────────────────────────────────────────────

export default function AutocuidadoPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)
    })()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (!userId) {
    return (
      <>
        <AppHeader />
        <PageContainer>
          <div style={{ padding: '16px 20px 0', marginBottom: 16 }}>
            <div className="skeleton-shimmer" style={{ height: 32, width: 180, borderRadius: 8 }} />
          </div>
          <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[1,2,3].map(i => (
              <div key={i} className="skeleton-shimmer" style={{ height: 66, borderRadius: 14 }} />
            ))}
          </div>
        </PageContainer>
      </>
    )
  }

  return <AutocuidadoContent userId={userId} />
}
