'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import AppHeader from '@/components/ui/AppHeader'
import Button from '@/components/ui/Button'
import PageContainer from '@/components/ui/PageContainer'
import { createClient } from '@/lib/supabase/client'
import { playSuccess, playError } from '@/lib/sound'
import { ArrowLeft } from 'lucide-react'

interface Profissional {
  id: string
  nome: string
}

// ─── Tela de sucesso animada ────────────────────────────────────────

function SuccessScreen({ servico, dataHora }: { servico: string; dataHora: string }) {
  const data = new Date(dataHora)
  const dataFmt = data.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
  const horaFmt = data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center gap-6 px-6 py-16 text-center"
    >
      {/* Checkmark animado */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 18, delay: 0.1 }}
        className="relative flex items-center justify-center"
        style={{
          width: 96, height: 96, borderRadius: '50%',
          background: 'linear-gradient(135deg, #FF3366, #C41A4A)',
          boxShadow: '0 8px 32px rgba(255,51,102,0.35)',
        }}
      >
        <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
          <motion.path
            d="M10 22L18 30L34 14"
            stroke="white"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut', delay: 0.35 }}
          />
        </svg>

        {/* Partículas */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
            animate={{
              scale: [0, 1, 0],
              x: Math.cos((i / 6) * Math.PI * 2) * 56,
              y: Math.sin((i / 6) * Math.PI * 2) * 56,
              opacity: [1, 1, 0],
            }}
            transition={{ duration: 0.7, delay: 0.55 + i * 0.05, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              width: 8, height: 8, borderRadius: '50%',
              background: i % 2 === 0 ? '#FF3366' : '#F9D56E',
            }}
          />
        ))}
      </motion.div>

      {/* Texto */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1], delay: 0.5 }}
        className="flex flex-col gap-2"
      >
        <h2 style={{
          fontFamily: 'var(--font-display)', fontWeight: 700,
          fontSize: 26, color: 'var(--foreground)', lineHeight: 1.2,
        }}>
          Agendado! ✦
        </h2>
        <p className="text-section-title" style={{ color: 'var(--color-primary)' }}>
          {servico}
        </p>
        <p className="text-caption" style={{ lineHeight: 1.5 }}>
          {dataFmt}<br />às {horaFmt}
        </p>
      </motion.div>
    </motion.div>
  )
}

// ─── Estilo reutilizado para inputs ────────────────────────────────

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-card-title text-sm">{label}</label>
      {children}
    </div>
  )
}

const baseInput: React.CSSProperties = {
  borderRadius: 14,
  border: '1.5px solid var(--color-silver)',
  padding: '12px 16px',
  fontSize: 15,
  width: '100%',
  backgroundColor: '#fff',
  color: 'var(--foreground)',
  fontFamily: 'var(--font-body)',
  outline: 'none',
  transition: 'border-color 0.2s, box-shadow 0.2s',
}

function FocusInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const [focused, setFocused] = useState(false)
  return (
    <input
      {...props}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        ...baseInput,
        borderColor: focused ? 'var(--color-primary)' : 'var(--color-silver)',
        boxShadow: focused ? '0 0 0 3px rgba(255,51,102,0.08)' : 'none',
        ...props.style,
      }}
    />
  )
}

function FocusTextarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const [focused, setFocused] = useState(false)
  return (
    <textarea
      {...props}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        ...baseInput,
        resize: 'none',
        borderColor: focused ? 'var(--color-primary)' : 'var(--color-silver)',
        boxShadow: focused ? '0 0 0 3px rgba(255,51,102,0.08)' : 'none',
        ...props.style,
      }}
    />
  )
}

function FocusSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  const [focused, setFocused] = useState(false)
  return (
    <select
      {...props}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        ...baseInput,
        borderColor: focused ? 'var(--color-primary)' : 'var(--color-silver)',
        boxShadow: focused ? '0 0 0 3px rgba(255,51,102,0.08)' : 'none',
        ...props.style,
      }}
    />
  )
}

// ─── Page ──────────────────────────────────────────────────────────

export default function NovoAgendamentoPage() {
  const router = useRouter()
  const [profissionais, setProfissionais] = useState<Profissional[]>([])
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState<{ servico: string; dataHora: string } | null>(null)

  const [servico, setServico] = useState('')
  const [data, setData] = useState('')
  const [hora, setHora] = useState('')
  const [profissionalId, setProfissionalId] = useState('')
  const [valor, setValor] = useState('')
  const [observacoes, setObservacoes] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    async function carregarProfissionais() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('profissionais')
        .select('id, nome')
        .eq('usuario_id', user.id)
        .eq('ativo', true)
        .order('nome')
        .limit(50)
        .abortSignal(controller.signal)
      setProfissionais(data ?? [])
    }
    carregarProfissionais()
    return () => controller.abort()
  }, [])

  // Redireciona 2s após o sucesso
  useEffect(() => {
    if (!sucesso) return
    const t = setTimeout(() => router.push('/app/rotina'), 2000)
    return () => clearTimeout(t)
  }, [sucesso, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    if (!servico || !data || !hora) {
      setErro('Preencha serviço, data e horário.')
      return
    }
    setSalvando(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const dataHora = new Date(`${data}T${hora}:00`).toISOString()

    const { error } = await supabase.from('agendamentos_rotina').insert({
      usuario_id: user.id,
      servico_nome: servico,
      data_hora: dataHora,
      profissional_id: profissionalId || null,
      valor: valor ? Number(valor) : null,
      observacoes: observacoes || null,
      status: 'agendado',
    })

    if (error) {
      playError()
      toast.error('Erro ao salvar. Tente novamente.')
      setErro('Erro ao salvar. Tente novamente.')
      setSalvando(false)
      return
    }

    playSuccess()
    setSucesso({ servico, dataHora })
  }

  return (
    <PageContainer>
      <AppHeader />

      <AnimatePresence mode="wait">
        {sucesso ? (
          <motion.div
            key="sucesso"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            <SuccessScreen servico={sucesso.servico} dataHora={sucesso.dataHora} />
          </motion.div>
        ) : (
          <motion.main
            key="form"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col px-5 py-6 gap-5"
          >
            {/* Header */}
            <div className="flex items-center gap-3">
              <motion.button
                whileTap={{ scale: 0.88 }}
                onClick={() => router.back()}
                className="flex items-center justify-center rounded-xl"
                style={{
                  width: 36, height: 36,
                  background: 'var(--background)',
                  border: '1.5px solid var(--color-silver)',
                  cursor: 'pointer',
                }}
              >
                <ArrowLeft size={18} color="var(--foreground-muted)" />
              </motion.button>
              <h1 className="text-page-title" style={{ fontSize: 22 }}>Novo agendamento</h1>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">

              {erro && (
                <motion.p
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-sm text-red-600 bg-red-50 px-4 py-3"
                  style={{ borderRadius: 12, border: '1.5px solid #fecaca' }}
                >
                  {erro}
                </motion.p>
              )}

              <FormField label="Serviço *">
                <FocusInput
                  type="text"
                  placeholder="Ex: Sobrancelha, Corte de cabelo..."
                  required
                  value={servico}
                  onChange={(e) => setServico(e.target.value)}
                />
              </FormField>

              <div className="flex gap-3">
                <FormField label="Data *">
                  <FocusInput
                    type="date"
                    required
                    value={data}
                    onChange={(e) => setData(e.target.value)}
                  />
                </FormField>
                <FormField label="Horário *">
                  <FocusInput
                    type="time"
                    required
                    value={hora}
                    onChange={(e) => setHora(e.target.value)}
                  />
                </FormField>
              </div>

              <FormField label="Profissional">
                <FocusSelect
                  value={profissionalId}
                  onChange={(e) => setProfissionalId(e.target.value)}
                  style={{ color: profissionalId ? 'var(--foreground)' : 'var(--foreground-muted)' }}
                >
                  <option value="">Selecionar profissional (opcional)</option>
                  {profissionais.map((p) => (
                    <option key={p.id} value={p.id}>{p.nome}</option>
                  ))}
                </FocusSelect>
              </FormField>

              <FormField label="Valor (R$)">
                <FocusInput
                  type="number"
                  placeholder="0,00"
                  min="0"
                  step="0.01"
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                />
              </FormField>

              <FormField label="Observações">
                <FocusTextarea
                  placeholder="Alguma observação sobre o agendamento..."
                  rows={3}
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                />
              </FormField>

              <Button variant="primary" fullWidth type="submit" loading={salvando} size="lg">
                Salvar agendamento
              </Button>

            </form>
          </motion.main>
        )}
      </AnimatePresence>
    </PageContainer>
  )
}
