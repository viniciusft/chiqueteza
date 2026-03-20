'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import ActionSheet from '@/components/ui/ActionSheet'

interface Profissional {
  nome: string
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
      <div
        className="flex flex-col gap-2 px-4 py-4 bg-white"
        style={{ borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-0.5 flex-1 min-w-0">
            <p className="font-extrabold text-gray-800 truncate" style={{ fontSize: 15 }}>
              {agendamento.servico_nome}
            </p>
            <p className="text-gray-400" style={{ fontSize: 12 }}>
              {dataFormatada} · {hora}
            </p>
            {agendamento.profissional && (
              <p className="font-semibold" style={{ fontSize: 13, color: '#1B5E5A' }}>
                {agendamento.profissional.nome}
              </p>
            )}
            {agendamento.valor && (
              <p className="text-gray-500" style={{ fontSize: 13 }}>
                {Number(agendamento.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
            )}
          </div>
          <button
            onClick={() => setSheetAberto(true)}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              backgroundColor: '#F5F5F5',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              color: '#666',
              flexShrink: 0,
              letterSpacing: 1,
            }}
          >
            ···
          </button>
        </div>
        {agendamento.observacoes && (
          <p className="text-gray-400" style={{ fontSize: 12 }}>
            {agendamento.observacoes}
          </p>
        )}
      </div>

      <ActionSheet
        isOpen={sheetAberto}
        onClose={() => setSheetAberto(false)}
        title={agendamento.servico_nome}
        actions={acoes}
      />
    </>
  )
}
