'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, Pencil, X, Star } from 'lucide-react'
import type { ArmarioProduto } from '../_types'

const STATUS_CONFIG = {
  em_uso:    { label: 'Em uso',    cor: '#1B5E5A', bg: 'rgba(27,94,90,0.10)' },
  acabando:  { label: 'Acabando',  cor: '#EF4444', bg: 'rgba(239,68,68,0.10)' },
  finalizado:{ label: 'Finalizado',cor: '#A3A3A3', bg: 'rgba(163,163,163,0.12)' },
  guardado:  { label: 'Guardado',  cor: '#D4A843', bg: 'rgba(212,168,67,0.10)' },
}

const CATEGORIAS_EMOJI: Record<string, string> = {
  skincare: '🧴', maquiagem: '💄', cabelo: '💆', corpo: '🛁',
  perfume: '🌸', unhas: '💅', ferramenta: '🔧',
}

function categoriaEmoji(cat: string | null): string {
  return (cat && CATEGORIAS_EMOJI[cat]) ?? '✨'
}

function hojeStr() {
  return new Date().toISOString().split('T')[0]
}

function NivelBar({ nivel, onChange }: { nivel: number; onChange?: (v: number) => void }) {
  const cor = nivel <= 15 ? '#EF4444' : nivel <= 40 ? '#F59E0B' : '#1B5E5A'
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <span style={{ fontSize: 11, color: '#A3A3A3', fontWeight: 600, fontFamily: 'var(--font-body)' }}>
          Nível restante
        </span>
        <span style={{ fontSize: 12, fontWeight: 700, color: cor, fontFamily: 'var(--font-body)' }}>{nivel}%</span>
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

function EstrelasDisplay({ valor }: { valor: number | null }) {
  if (!valor) return null
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={11} fill={i <= valor ? '#D4A843' : 'none'} color={i <= valor ? '#D4A843' : '#D0D0D0'} />
      ))}
    </div>
  )
}

interface Props {
  produto: ArmarioProduto
  onNivelChange: (id: string, nivel: number) => void
  onDelete: (id: string) => void
  onFinalizar: (id: string) => void
  onEditar: (produto: ArmarioProduto) => void
  onUsarHoje: (id: string) => void
  onDesvincularML: (id: string) => void
  onReativar?: (id: string) => void
  modoFinalizado?: boolean
}

export function ProdutoCard({
  produto, onNivelChange, onDelete, onFinalizar, onEditar,
  onUsarHoje, onDesvincularML, onReativar, modoFinalizado = false,
}: Props) {
  const [confirmando, setConfirmando] = useState(false)
  const st = STATUS_CONFIG[produto.status]
  const hoje = hojeStr()
  const jaUsouHoje = produto.ultimo_uso_em === hoje

  const cicloBadge = produto.ciclos_finalizados > 0
    ? `${produto.ciclos_finalizados + (modoFinalizado ? 0 : 0)}º frasco`
    : null

  return (
    <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 10 }}>
      <div style={{
        background: '#fff',
        borderRadius: confirmando ? '16px 16px 0 0' : 16,
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
          {/* Linha topo: nome + badge status + lápis */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2, gap: 6 }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--foreground)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, fontFamily: 'var(--font-body)' }}>
              {produto.nome}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
              {!modoFinalizado && (
                <motion.button whileTap={{ scale: 0.88 }} onClick={() => onEditar(produto)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex', alignItems: 'center' }}>
                  <Pencil size={13} color="#A3A3A3" />
                </motion.button>
              )}
              <span style={{ fontSize: 10, fontWeight: 700, color: st.cor, background: st.bg, borderRadius: 6, padding: '2px 7px' }}>
                {st.label}
              </span>
            </div>
          </div>

          {/* Marca + volume + ciclos */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            {produto.marca && (
              <p style={{ margin: 0, fontSize: 12, color: '#A3A3A3', fontFamily: 'var(--font-body)' }}>
                {produto.marca}{produto.volume_total ? ` · ${produto.volume_total}` : ''}
              </p>
            )}
            {cicloBadge && (
              <span style={{ fontSize: 10, fontWeight: 700, color: '#D4A843', background: 'rgba(212,168,67,0.12)', borderRadius: 6, padding: '1px 6px', fontFamily: 'var(--font-body)' }}>
                {cicloBadge}
              </span>
            )}
          </div>

          {/* Modo finalizado: avaliação + data */}
          {modoFinalizado ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <EstrelasDisplay valor={produto.avaliacao} />
              {produto.data_finalizacao && (
                <span style={{ fontSize: 11, color: '#A3A3A3', fontFamily: 'var(--font-body)' }}>
                  {new Date(produto.data_finalizacao + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                </span>
              )}
            </div>
          ) : (
            <NivelBar nivel={produto.nivel_atual} onChange={(v) => onNivelChange(produto.id, v)} />
          )}

          {/* Ações */}
          <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
            {modoFinalizado ? (
              <>
                {onReativar && (
                  <motion.button whileTap={{ scale: 0.95 }} onClick={() => onReativar(produto.id)}
                    style={{ flex: 1, padding: '7px 0', borderRadius: 10, border: '1.5px solid rgba(27,94,90,0.3)', background: 'rgba(27,94,90,0.06)', fontSize: 12, fontWeight: 700, cursor: 'pointer', color: '#1B5E5A', fontFamily: 'var(--font-body)' }}>
                    Reativar 🔄
                  </motion.button>
                )}
                {produto.ml_deeplink && (
                  <motion.button whileTap={{ scale: 0.95 }} onClick={() => window.open(produto.ml_deeplink!, '_blank', 'noopener,noreferrer')}
                    style={{ flex: 1, padding: '7px 0', borderRadius: 10, border: 'none', background: 'rgba(255,229,0,0.15)', fontSize: 12, fontWeight: 700, cursor: 'pointer', color: '#C8960C', fontFamily: 'var(--font-body)' }}>
                    Comprar de novo 🛍️
                  </motion.button>
                )}
              </>
            ) : (
              <>
                {/* Usar hoje */}
                <motion.button
                  whileTap={{ scale: 0.93 }}
                  onClick={() => !jaUsouHoje && onUsarHoje(produto.id)}
                  style={{
                    flex: 1, padding: '7px 0', borderRadius: 10,
                    border: jaUsouHoje ? 'none' : '1.5px solid rgba(27,94,90,0.3)',
                    background: jaUsouHoje ? 'rgba(27,94,90,0.08)' : '#fff',
                    fontSize: 12, fontWeight: 700, cursor: jaUsouHoje ? 'default' : 'pointer',
                    color: jaUsouHoje ? '#1B5E5A' : '#525252', fontFamily: 'var(--font-body)',
                    opacity: jaUsouHoje ? 0.8 : 1,
                  }}>
                  {jaUsouHoje ? '✓ Usado hoje' : 'Usar ✓'}
                </motion.button>

                {/* Acabou */}
                <motion.button whileTap={{ scale: 0.95 }} onClick={() => onFinalizar(produto.id)}
                  style={{ flex: 1, padding: '7px 0', borderRadius: 10, border: '1.5px solid #EDEDED', background: '#FAFAFA', fontSize: 12, fontWeight: 600, cursor: 'pointer', color: '#A3A3A3', fontFamily: 'var(--font-body)' }}>
                  Acabou 🪣
                </motion.button>

                {/* Ver no ML com preço */}
                {produto.ml_deeplink && (
                  <div style={{ position: 'relative', flex: 1 }}>
                    <motion.button whileTap={{ scale: 0.95 }}
                      onClick={() => window.open(produto.ml_deeplink!, '_blank', 'noopener,noreferrer')}
                      style={{ width: '100%', padding: '7px 0', borderRadius: 10, border: 'none', background: 'rgba(255,229,0,0.15)', fontSize: 11, fontWeight: 700, cursor: 'pointer', color: '#C8960C', fontFamily: 'var(--font-body)', lineHeight: 1.2 }}>
                      {produto.ml_preco_atual
                        ? `R$${produto.ml_preco_atual.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : 'Ver ML 🛍️'}
                    </motion.button>
                    <button
                      onClick={() => onDesvincularML(produto.id)}
                      title="Desvincular produto ML"
                      style={{ position: 'absolute', top: -6, right: -6, width: 16, height: 16, borderRadius: '50%', background: '#E8E8E8', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                      <X size={9} color="#767676" />
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Lixeira */}
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => setConfirmando(v => !v)}
              style={{ width: 34, height: 34, borderRadius: 10, border: 'none', background: 'rgba(239,68,68,0.07)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Trash2 size={14} color="#EF4444" />
            </motion.button>
          </div>

          {/* Review texto (modo finalizado) */}
          {modoFinalizado && produto.avaliacao_texto && (
            <p style={{ margin: '8px 0 0', fontSize: 12, color: '#5A5A5A', fontFamily: 'var(--font-body)', fontStyle: 'italic', lineHeight: 1.5 }}>
              "{produto.avaliacao_texto}"
            </p>
          )}
        </div>
      </div>

      {/* Confirmação delete */}
      <AnimatePresence>
        {confirmando && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.18 }} style={{ overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(239,68,68,0.06)', border: '1.5px solid rgba(239,68,68,0.18)', borderTop: 'none', borderRadius: '0 0 16px 16px', padding: '10px 14px' }}>
              <span style={{ fontSize: 13, color: '#EF4444', fontWeight: 600, fontFamily: 'var(--font-body)' }}>Remover "{produto.nome}"?</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setConfirmando(false)} style={{ padding: '6px 14px', borderRadius: 8, border: '1.5px solid #E8E8E8', background: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', color: 'var(--foreground)', fontFamily: 'var(--font-body)' }}>Cancelar</button>
                <button onClick={() => { setConfirmando(false); onDelete(produto.id) }} style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: '#EF4444', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Remover</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
