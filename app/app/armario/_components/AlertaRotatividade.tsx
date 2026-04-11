'use client'

import { motion } from 'framer-motion'
import { RefreshCw } from 'lucide-react'
import type { ArmarioProduto } from '../_types'

interface Props {
  produtos: ArmarioProduto[]
}

const CATEGORIAS_LABEL: Record<string, string> = {
  skincare: 'skincare', maquiagem: 'maquiagem', cabelo: 'cabelo',
  corpo: 'corpo', perfume: 'perfume', unhas: 'unhas', ferramenta: 'ferramenta',
}

export function AlertaRotatividade({ produtos }: Props) {
  // Filtra apenas ativos com rotatividade ligada
  const ativos = produtos.filter(p =>
    p.rotatividade_ativa && p.status !== 'finalizado'
  )

  if (ativos.length < 2) return null

  // Agrupa por categoria
  const porCategoria: Record<string, ArmarioProduto[]> = {}
  for (const p of ativos) {
    const cat = p.categoria ?? 'outro'
    if (!porCategoria[cat]) porCategoria[cat] = []
    porCategoria[cat].push(p)
  }

  // Encontra o primeiro grupo com 2+ produtos
  const grupoSugerido = Object.entries(porCategoria).find(([, lista]) => lista.length >= 2)
  if (!grupoSugerido) return null

  const [categoria, lista] = grupoSugerido

  // Produto mais parado: sem uso (null) ou com uso mais antigo
  const maisParado = lista.sort((a, b) => {
    if (!a.ultimo_uso_em && !b.ultimo_uso_em) return 0
    if (!a.ultimo_uso_em) return -1
    if (!b.ultimo_uso_em) return 1
    return a.ultimo_uso_em.localeCompare(b.ultimo_uso_em)
  })[0]

  const catLabel = CATEGORIAS_LABEL[categoria] ?? categoria
  const diasParado = maisParado.ultimo_uso_em
    ? Math.round((Date.now() - new Date(maisParado.ultimo_uso_em + 'T12:00:00').getTime()) / 86400000)
    : null

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: 'linear-gradient(135deg, rgba(168,197,204,0.18), rgba(27,94,90,0.08))',
        border: '1.5px solid rgba(27,94,90,0.15)',
        borderRadius: 14, padding: '12px 14px', marginBottom: 12,
        display: 'flex', alignItems: 'center', gap: 12,
      }}
    >
      <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(27,94,90,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <RefreshCw size={16} color="#1B5E5A" />
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#1B5E5A', fontFamily: 'var(--font-body)' }}>
          Que tal usar o {maisParado.nome}?
        </p>
        <p style={{ margin: '2px 0 0', fontSize: 11, color: '#5A95A3', fontFamily: 'var(--font-body)' }}>
          Você tem {lista.length} {catLabel}s com rotatividade ativa
          {diasParado ? ` · parado há ${diasParado}d` : ' · ainda não foi usado'}
        </p>
      </div>
    </motion.div>
  )
}
