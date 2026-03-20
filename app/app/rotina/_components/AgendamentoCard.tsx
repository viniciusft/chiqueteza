'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import ActionSheet from '@/components/ui/ActionSheet'

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

function IconWA() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="#25D366">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  )
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

          {/* Ações à direita */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            {waTelefone && (
              <a
                href={`https://wa.me/55${waTelefone}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  backgroundColor: '#E8F8F0',
                  padding: 6,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <IconWA />
              </a>
            )}
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
