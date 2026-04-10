'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ExternalLink, CheckCircle2, XCircle, Clock, Wrench } from 'lucide-react'
import type { FeatureDef, FeatureStatus } from '../_data/features'
import Link from 'next/link'

const STATUS_CONFIG: Record<FeatureStatus, { label: string; cor: string; bg: string; border: string; icon: React.ReactNode }> = {
  ok:       { label: 'Funcionando',    cor: '#16A34A', bg: 'rgba(22,163,74,0.06)',   border: 'rgba(22,163,74,0.2)',   icon: <CheckCircle2 size={15} color="#16A34A" /> },
  bloqueado:{ label: 'Precisa de ação',cor: '#EF4444', bg: 'rgba(239,68,68,0.06)',   border: 'rgba(239,68,68,0.2)',   icon: <XCircle size={15} color="#EF4444" /> },
  parcial:  { label: 'Parcial',        cor: '#D97706', bg: 'rgba(217,119,6,0.06)',   border: 'rgba(217,119,6,0.2)',   icon: <Wrench size={15} color="#D97706" /> },
  dev:      { label: 'Em desenvolvimento', cor: '#5A95A3', bg: 'rgba(90,149,163,0.06)', border: 'rgba(90,149,163,0.2)', icon: <Clock size={15} color="#5A95A3" /> },
}

interface Props {
  feature: FeatureDef
  env: Record<string, boolean>
  loading: boolean
}

export function FeatureCard({ feature, env, loading }: Props) {
  const [aberto, setAberto] = useState(false)
  const status: FeatureStatus = loading ? 'ok' : feature.status(env)
  const cfg = STATUS_CONFIG[status]
  const problema = !loading && feature.problema ? feature.problema(env) : null
  const passos = !loading && feature.passosParaCorrigir ? feature.passosParaCorrigir(env) : []

  return (
    <motion.div
      layout
      style={{
        background: '#fff',
        borderRadius: 16,
        border: `1.5px solid ${aberto ? cfg.border : '#F0F0F0'}`,
        overflow: 'hidden',
        boxShadow: aberto ? '0 4px 16px rgba(0,0,0,0.07)' : 'none',
        transition: 'border-color 0.2s, box-shadow 0.2s',
      }}
    >
      {/* Cabeçalho — sempre visível */}
      <button
        onClick={() => setAberto(a => !a)}
        style={{
          width: '100%', background: 'none', border: 'none',
          padding: '14px 16px', cursor: 'pointer', textAlign: 'left',
          display: 'flex', alignItems: 'center', gap: 12,
        }}
      >
        <span style={{ fontSize: 24, flexShrink: 0 }}>{feature.emoji}</span>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--foreground)', fontFamily: 'var(--font-body)' }}>
            {feature.nome}
          </p>
          <p style={{ margin: '2px 0 0', fontSize: 11, color: '#A3A3A3', fontFamily: 'var(--font-body)', lineHeight: 1.4 }}>
            {feature.resumo}
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
          <span style={{
            display: 'flex', alignItems: 'center', gap: 4,
            fontSize: 10, fontWeight: 700, color: cfg.cor,
            background: cfg.bg, border: `1px solid ${cfg.border}`,
            padding: '2px 8px', borderRadius: 20,
          }}>
            {cfg.icon} {cfg.label}
          </span>
          <ChevronDown
            size={14}
            color="#A3A3A3"
            style={{ transform: aberto ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
          />
        </div>
      </button>

      {/* Conteúdo expandido */}
      <AnimatePresence initial={false}>
        {aberto && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '0 16px 16px', borderTop: '1px solid #F5F5F5' }}>

              {/* O que é */}
              <div style={{ marginTop: 14 }}>
                <p style={{ margin: '0 0 6px', fontSize: 10, fontWeight: 700, color: '#C0C0C0', textTransform: 'uppercase', letterSpacing: '0.07em', fontFamily: 'var(--font-body)' }}>
                  O que é
                </p>
                <p style={{ margin: 0, fontSize: 13, color: '#3A3A3A', fontFamily: 'var(--font-body)', lineHeight: 1.6 }}>
                  {feature.oQue}
                </p>
              </div>

              {/* Como a usuária vê */}
              <div style={{ marginTop: 14 }}>
                <p style={{ margin: '0 0 8px', fontSize: 10, fontWeight: 700, color: '#C0C0C0', textTransform: 'uppercase', letterSpacing: '0.07em', fontFamily: 'var(--font-body)' }}>
                  Como a usuária encontra
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {feature.comoUsuariaVe.map((passo, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                      <span style={{ fontSize: 11, color: '#1B5E5A', fontWeight: 800, flexShrink: 0, marginTop: 1 }}>›</span>
                      <span style={{ fontSize: 12, color: '#5A5A5A', fontFamily: 'var(--font-body)', lineHeight: 1.5 }}>{passo}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Problema + passos (se bloqueado) */}
              {problema && passos.length > 0 && (
                <div style={{
                  marginTop: 14,
                  background: 'rgba(239,68,68,0.05)',
                  border: '1.5px solid rgba(239,68,68,0.15)',
                  borderRadius: 12, padding: '12px 14px',
                }}>
                  <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 700, color: '#EF4444', fontFamily: 'var(--font-body)' }}>
                    ⚠ {problema}
                  </p>
                  <p style={{ margin: '0 0 8px', fontSize: 10, fontWeight: 700, color: '#C0C0C0', textTransform: 'uppercase', letterSpacing: '0.07em', fontFamily: 'var(--font-body)' }}>
                    Como corrigir
                  </p>
                  {passos.map((p, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                      <span style={{
                        flexShrink: 0, width: 18, height: 18, borderRadius: '50%',
                        background: '#EF4444', color: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 9, fontWeight: 800, fontFamily: 'var(--font-body)',
                      }}>{i + 1}</span>
                      <span style={{ fontSize: 12, color: '#3A3A3A', fontFamily: 'var(--font-body)', lineHeight: 1.5 }}>{p}</span>
                    </div>
                  ))}
                  {feature.setupUrl && (
                    <a
                      href={feature.setupUrl}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 8,
                        fontSize: 12, fontWeight: 700, color: '#fff',
                        background: '#EF4444', borderRadius: 10, padding: '7px 14px',
                        textDecoration: 'none',
                      }}
                    >
                      {feature.setupLabel ?? 'Configurar'} <ExternalLink size={11} />
                    </a>
                  )}
                </div>
              )}

              {/* Parcial (afiliado sem tracking) */}
              {status === 'parcial' && problema && (
                <div style={{
                  marginTop: 14,
                  background: 'rgba(217,119,6,0.05)',
                  border: '1.5px solid rgba(217,119,6,0.2)',
                  borderRadius: 12, padding: '10px 14px',
                }}>
                  <p style={{ margin: 0, fontSize: 12, color: '#D97706', fontFamily: 'var(--font-body)' }}>
                    ⚠ {problema}
                  </p>
                </div>
              )}

              {/* Rodapé com link para o app */}
              {feature.pageUrl && status !== 'bloqueado' && (
                <Link
                  href={feature.pageUrl}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 14,
                    fontSize: 12, fontWeight: 700, color: '#1B5E5A',
                    background: 'rgba(27,94,90,0.08)', borderRadius: 10, padding: '7px 14px',
                    textDecoration: 'none',
                  }}
                >
                  Ver no app <ExternalLink size={11} />
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
