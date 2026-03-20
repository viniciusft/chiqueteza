'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

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
  const [concluindo, setConcluindo] = useState(false)
  const { dataFormatada, hora } = formatarDataHora(agendamento.data_hora)

  async function handleConcluir() {
    setConcluindo(true)
    const supabase = createClient()
    await supabase
      .from('agendamentos_rotina')
      .update({ status: 'concluido' })
      .eq('id', agendamento.id)
    router.refresh()
    setConcluindo(false)
  }

  return (
    <div
      className="flex flex-col gap-2 px-4 py-4 bg-white"
      style={{ borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <p className="font-extrabold text-gray-800" style={{ fontSize: 15 }}>
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
          onClick={handleConcluir}
          disabled={concluindo}
          className="font-bold text-white flex-shrink-0"
          style={{
            backgroundColor: '#1B5E5A',
            borderRadius: 10,
            padding: '6px 12px',
            fontSize: 12,
            opacity: concluindo ? 0.5 : 1,
          }}
        >
          {concluindo ? '...' : 'Concluído'}
        </button>
      </div>
      {agendamento.observacoes && (
        <p className="text-gray-400" style={{ fontSize: 12 }}>
          {agendamento.observacoes}
        </p>
      )}
    </div>
  )
}
