'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'

const ENV_GRUPOS = [
  {
    label: 'Supabase — Banco de Dados',
    vars: [
      { nome: 'SUPABASE_SERVICE_ROLE_KEY', desc: 'Acesso admin ao banco (notificações, jobs)' },
    ],
  },
  {
    label: 'Mercado Livre — Autenticação',
    vars: [
      { nome: 'ML_APP_ID', desc: 'ID do seu app no portal ML' },
      { nome: 'ML_APP_SECRET', desc: 'Senha secreta do app ML' },
      { nome: 'ML_REFRESH_TOKEN', desc: 'Token de acesso à busca — obtido via /api/ml/setup' },
      { nome: 'ML_AFFILIATE_TRACKING_ID', desc: 'ID de afiliado para rastrear comissões' },
      { nome: 'ML_AFFILIATE_WORD', desc: 'Palavra-chave de afiliado ML' },
    ],
  },
  {
    label: 'Inteligência Artificial',
    vars: [
      { nome: 'GEMINI_API_KEY', desc: 'Chave do Gemini (Google) para visagismo e OCR' },
      { nome: 'FAL_KEY', desc: 'Reservado para geração de imagens (V2)' },
    ],
  },
  {
    label: 'Notificações Push',
    vars: [
      { nome: 'VAPID_PRIVATE_KEY', desc: 'Chave privada para enviar notificações' },
    ],
  },
  {
    label: 'Tarefas Automáticas (Inngest)',
    vars: [
      { nome: 'INNGEST_EVENT_KEY', desc: 'Chave para disparar jobs agendados' },
      { nome: 'INNGEST_SIGNING_KEY', desc: 'Chave para validar webhooks do Inngest' },
    ],
  },
]

interface Props {
  env: Record<string, boolean>
  loading: boolean
}

export function EnvHealth({ env, loading }: Props) {
  const [aberto, setAberto] = useState(false)

  const total = Object.keys(env).length
  const ok = Object.values(env).filter(Boolean).length
  const allOk = ok === total

  return (
    <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #F0F0F0', overflow: 'hidden' }}>
      <button
        onClick={() => setAberto(a => !a)}
        style={{
          width: '100%', background: 'none', border: 'none',
          padding: '14px 16px', cursor: 'pointer', textAlign: 'left',
          display: 'flex', alignItems: 'center', gap: 12,
        }}
      >
        <span style={{ fontSize: 18 }}>🔑</span>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--foreground)', fontFamily: 'var(--font-body)' }}>
            Variáveis de Ambiente
          </p>
          <p style={{ margin: '2px 0 0', fontSize: 11, color: '#A3A3A3', fontFamily: 'var(--font-body)' }}>
            {loading ? '...' : allOk ? `Todas configuradas (${ok}/${total})` : `${ok} de ${total} configuradas`}
          </p>
        </div>
        <span style={{
          fontSize: 10, fontWeight: 700,
          color: allOk ? '#16A34A' : '#EF4444',
          background: allOk ? 'rgba(22,163,74,0.08)' : 'rgba(239,68,68,0.08)',
          border: `1px solid ${allOk ? 'rgba(22,163,74,0.2)' : 'rgba(239,68,68,0.2)'}`,
          padding: '2px 8px', borderRadius: 20,
        }}>
          {loading ? '...' : allOk ? '✓ OK' : `${total - ok} faltando`}
        </span>
        <ChevronDown
          size={14} color="#A3A3A3"
          style={{ transform: aberto ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}
        />
      </button>

      <AnimatePresence initial={false}>
        {aberto && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ borderTop: '1px solid #F5F5F5' }}>
              {ENV_GRUPOS.map((grupo, gi) => (
                <div key={grupo.label}>
                  {gi > 0 && <div style={{ height: 1, background: '#F8F8F8' }} />}
                  <p style={{ margin: 0, padding: '10px 16px 4px', fontSize: 10, fontWeight: 700, color: '#C0C0C0', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-body)' }}>
                    {grupo.label}
                  </p>
                  {grupo.vars.map(({ nome, desc }) => {
                    const ok = env[nome] ?? false
                    return (
                      <div key={nome} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 16px' }}>
                        <span style={{
                          width: 8, height: 8, borderRadius: '50%', flexShrink: 0, marginTop: 4,
                          background: loading ? '#E0E0E0' : ok ? '#22C55E' : '#EF4444',
                          boxShadow: !loading && ok ? '0 0 4px rgba(34,197,94,0.5)' : !loading ? '0 0 4px rgba(239,68,68,0.4)' : 'none',
                        }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: 0, fontSize: 12, fontFamily: 'monospace', color: loading ? '#D0D0D0' : ok ? '#2A2A2A' : '#EF4444', fontWeight: ok ? 400 : 700 }}>
                            {nome}
                          </p>
                          <p style={{ margin: '1px 0 0', fontSize: 10, color: '#B0B0B0', fontFamily: 'var(--font-body)' }}>
                            {desc}
                          </p>
                        </div>
                        <span style={{ fontSize: 10, fontWeight: 700, color: loading ? '#D0D0D0' : ok ? '#16A34A' : '#EF4444', flexShrink: 0 }}>
                          {loading ? '...' : ok ? 'OK' : 'FALTA'}
                        </span>
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
