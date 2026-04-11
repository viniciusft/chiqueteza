'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Star } from 'lucide-react'
import BottomSheet from '@/components/ui/BottomSheet'
import type { ArmarioProduto } from '../_types'

interface Props {
  produto: ArmarioProduto | null
  isOpen: boolean
  onClose: () => void
  onConfirmar: (produtoId: string, avaliacao: number, texto: string) => void
}

export function AvaliacaoSheet({ produto, isOpen, onClose, onConfirmar }: Props) {
  const [avaliacao, setAvaliacao] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [texto, setTexto] = useState('')
  const [etapa, setEtapa] = useState<'avaliar' | 'recomprar'>('avaliar')
  const [salvando, setSalvando] = useState(false)

  function reset() {
    setAvaliacao(0)
    setHovered(0)
    setTexto('')
    setEtapa('avaliar')
    setSalvando(false)
  }

  function handleClose() {
    reset()
    onClose()
  }

  async function handleConfirmar() {
    if (!produto) return
    setSalvando(true)
    await onConfirmar(produto.id, avaliacao || 1, texto)
    setEtapa('recomprar')
    setSalvando(false)
  }

  const estrelaExibida = hovered || avaliacao
  const LABELS = ['', 'Não gostei', 'Mais ou menos', 'Ok', 'Gostei', 'Amei! ✨']

  if (!produto) return null

  return (
    <BottomSheet isOpen={isOpen} onClose={handleClose} title="Como foi esse produto?">
      {etapa === 'avaliar' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, color: 'var(--foreground)', fontFamily: 'var(--font-body)' }}>
              {produto.nome}
            </p>
            {produto.marca && (
              <p style={{ margin: 0, fontSize: 13, color: '#A3A3A3', fontFamily: 'var(--font-body)' }}>{produto.marca}</p>
            )}
          </div>

          {/* Estrelinhas */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <div style={{ display: 'flex', gap: 10 }}>
              {[1,2,3,4,5].map(i => (
                <motion.button
                  key={i}
                  whileTap={{ scale: 0.85 }}
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(0)}
                  onClick={() => setAvaliacao(i)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                >
                  <Star
                    size={36}
                    fill={i <= estrelaExibida ? '#D4A843' : 'none'}
                    color={i <= estrelaExibida ? '#D4A843' : '#D0D0D0'}
                    style={{ transition: 'all 0.12s' }}
                  />
                </motion.button>
              ))}
            </div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: estrelaExibida ? '#D4A843' : '#C0C0C0', fontFamily: 'var(--font-body)', minHeight: 20 }}>
              {LABELS[estrelaExibida]}
            </p>
          </div>

          {/* Texto */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#525252', marginBottom: 6, display: 'block', fontFamily: 'var(--font-body)' }}>
              O que você achou? (opcional)
            </label>
            <textarea
              value={texto}
              onChange={e => setTexto(e.target.value.slice(0, 200))}
              placeholder="Boa fixação, durou bastante, pele oleosa…"
              rows={3}
              style={{
                width: '100%', padding: '11px 14px', borderRadius: 12, border: '1.5px solid #E8E8E8',
                fontSize: 14, fontFamily: 'var(--font-body)', color: 'var(--foreground)',
                outline: 'none', resize: 'none', boxSizing: 'border-box', background: '#fff',
              }}
            />
            <p style={{ textAlign: 'right', margin: '4px 0 0', fontSize: 11, color: '#A3A3A3', fontFamily: 'var(--font-body)' }}>
              {texto.length}/200
            </p>
          </div>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleConfirmar}
            disabled={salvando}
            style={{
              padding: '15px', borderRadius: 14, border: 'none',
              background: salvando ? 'rgba(27,94,90,0.4)' : 'linear-gradient(135deg, #1B5E5A, #0D3533)',
              color: '#fff', fontSize: 15, fontWeight: 700, cursor: salvando ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font-body)',
            }}
          >
            {salvando ? 'Salvando…' : 'Finalizar produto 🎉'}
          </motion.button>

          <button
            onClick={handleClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#A3A3A3', fontFamily: 'var(--font-body)', padding: '4px 0' }}>
            Pular avaliação
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center', paddingTop: 8 }}>
          <div style={{ fontSize: 52 }}>🎉</div>
          <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--foreground)', textAlign: 'center', fontFamily: 'var(--font-body)' }}>
            Produto finalizado!
          </p>
          <p style={{ margin: 0, fontSize: 14, color: '#A3A3A3', textAlign: 'center', fontFamily: 'var(--font-body)', lineHeight: 1.5 }}>
            Quer comprar de novo?
          </p>

          {produto.ml_deeplink ? (
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => { window.open(produto.ml_deeplink!, '_blank'); handleClose() }}
              style={{
                width: '100%', padding: '15px', borderRadius: 14, border: 'none',
                background: 'rgba(255,229,0,0.2)', color: '#C8960C',
                fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)',
              }}
            >
              Ver no Mercado Livre 🛍️
            </motion.button>
          ) : (
            <p style={{ margin: 0, fontSize: 13, color: '#A3A3A3', textAlign: 'center', fontFamily: 'var(--font-body)' }}>
              Configure o Mercado Livre para ver sugestões de recompra.
            </p>
          )}

          <button
            onClick={handleClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#A3A3A3', fontFamily: 'var(--font-body)', padding: '4px 0' }}>
            Fechar
          </button>
        </div>
      )}
    </BottomSheet>
  )
}
