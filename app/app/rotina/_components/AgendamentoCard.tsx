'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import ActionSheet from '@/components/ui/ActionSheet'
import { MessageCircle, MoreHorizontal, CalendarDays } from 'lucide-react'

interface Profissional {
  nome: string
  telefone: string | null
}

interface Agendamento {
  id: string
  servico_nome: string
  data_hora: string
  valor: number | null
  observacoes: string | null
  profissional: Profissional | null
}

function formatarDataHora(dataHora: string) {
  const data = new Date(dataHora)
  const dataFormatada = data.toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
  })
  const hora = data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  return { dataFormatada, hora }
}

export default function AgendamentoCard({ agendamento }: { agendamento: Agendamento }) {
  const router = useRouter()
  const [sheetAberto, setSheetAberto] = useState(false)
  const { dataFormatada, hora } = formatarDataHora(agendamento.data_hora)

  const waTelefone = agendamento.profissional?.telefone
    ? agendamento.profissional.telefone.replace(/\D/g, '')
    : null

  async function handleConcluir() {
    const supabase = createClient()
    await supabase
      .from('agendamentos_rotina')
      .update({ status: 'concluido' })
      .eq('id', agendamento.id)
    router.refresh()
  }

  async function handleCancelar() {
    const supabase = createClient()
    await supabase
      .from('agendamentos_rotina')
      .update({ status: 'cancelado' })
      .eq('id', agendamento.id)
    router.refresh()
  }

  const acoes = [
    {
      label: 'Marcar como realizado',
      icon: '✅',
      onClick: async () => {
        setSheetAberto(false)
        await handleConcluir()
      },
    },
    {
      label: 'Editar agendamento',
      icon: '✏️',
      onClick: () => {
        setSheetAberto(false)
        router.push(`/app/rotina/agendamentos/${agendamento.id}/editar`)
      },
    },
    {
      label: 'Cancelar agendamento',
      icon: '❌',
      variant: 'danger' as const,
      onClick: async () => {
        setSheetAberto(false)
        if (confirm('Cancelar este agendamento?')) {
          await handleCancelar()
        }
      },
    },
  ]

  return (
    <>
      <motion.div
        whileTap={{ scale: 0.985 }}
        transition={{ type: 'spring', stiffness: 400, damping: 22 }}
        className="flex items-center gap-3 px-4 py-4 bg-white rounded-2xl"
        style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1.5px solid rgba(0,0,0,0.06)' }}
      >
        {/* Ícone calendário */}
        <div
          className="flex items-center justify-center rounded-xl flex-shrink-0"
          style={{ width: 46, height: 46, background: 'rgba(255,51,102,0.08)' }}
        >
          <CalendarDays size={20} color="var(--color-primary)" />
        </div>

        {/* Conteúdo */}
        <div className="flex flex-col gap-0.5 flex-1 min-w-0">
          <p className="text-card-title truncate">{agendamento.servico_nome}</p>
          <p className="text-caption">{dataFormatada} · {hora}</p>
          {agendamento.profissional && (
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-secondary)' }}>
              {agendamento.profissional.nome}
            </p>
          )}
          {agendamento.valor && (
            <p className="text-caption">
              {Number(agendamento.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          )}
          {agendamento.observacoes && (
            <p className="text-caption mt-0.5">{agendamento.observacoes}</p>
          )}
        </div>

        {/* Ações à direita */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {waTelefone && (
            <motion.a
              whileTap={{ scale: 0.88 }}
              href={`https://wa.me/55${waTelefone}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center rounded-xl"
              style={{ width: 34, height: 34, backgroundColor: '#25D366', textDecoration: 'none' }}
            >
              <MessageCircle size={16} color="#fff" />
            </motion.a>
          )}
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={() => setSheetAberto(true)}
            className="flex items-center justify-center rounded-xl"
            style={{
              width: 34, height: 34,
              backgroundColor: 'var(--background)',
              border: '1.5px solid var(--color-silver)',
              cursor: 'pointer',
            }}
          >
            <MoreHorizontal size={16} color="var(--foreground-muted)" />
          </motion.button>
        </div>
      </motion.div>

      <ActionSheet
        isOpen={sheetAberto}
        onClose={() => setSheetAberto(false)}
        title={agendamento.servico_nome}
        actions={acoes}
      />
    </>
  )
}
