'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AppHeader from '@/components/ui/AppHeader'
import Button from '@/components/ui/Button'
import PageContainer from '@/components/ui/PageContainer'
import { createClient } from '@/lib/supabase/client'

interface Profissional {
  id: string
  nome: string
}

const inputStyle = {
  borderRadius: 12,
  border: '1.5px solid #E8E8E8',
  padding: '12px 16px',
  fontSize: 15,
  width: '100%',
  backgroundColor: '#fff',
  color: '#171717',
}

export default function NovoAgendamentoPage() {
  const router = useRouter()
  const [profissionais, setProfissionais] = useState<Profissional[]>([])
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  const [servico, setServico] = useState('')
  const [data, setData] = useState('')
  const [hora, setHora] = useState('')
  const [profissionalId, setProfissionalId] = useState('')
  const [valor, setValor] = useState('')
  const [observacoes, setObservacoes] = useState('')

  useEffect(() => {
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
      setProfissionais(data ?? [])
    }
    carregarProfissionais()
  }, [])

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
      setErro('Erro ao salvar. Tente novamente.')
      setSalvando(false)
      return
    }
    router.push('/app/rotina')
  }

  return (
    <PageContainer>
      <AppHeader />
      <main className="flex flex-col px-5 py-6 gap-5">

        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-gray-400 text-xl">←</button>
          <h1 className="font-extrabold tracking-tight" style={{ fontSize: 22, color: '#171717' }}>
            Novo agendamento
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

          {erro && (
            <p className="text-sm text-red-600 bg-red-50 px-4 py-3"
              style={{ borderRadius: 12, border: '1.5px solid #fecaca' }}>
              {erro}
            </p>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-gray-700" style={{ fontSize: 14 }}>Serviço *</label>
            <input
              type="text"
              placeholder="Ex: Sobrancelha, Corte de cabelo..."
              required
              value={servico}
              onChange={(e) => setServico(e.target.value)}
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = '#1B5E5A')}
              onBlur={(e) => (e.target.style.borderColor = '#E8E8E8')}
            />
          </div>

          <div className="flex gap-3">
            <div className="flex flex-col gap-1.5 flex-1">
              <label className="font-semibold text-gray-700" style={{ fontSize: 14 }}>Data *</label>
              <input
                type="date"
                required
                value={data}
                onChange={(e) => setData(e.target.value)}
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = '#1B5E5A')}
                onBlur={(e) => (e.target.style.borderColor = '#E8E8E8')}
              />
            </div>
            <div className="flex flex-col gap-1.5 flex-1">
              <label className="font-semibold text-gray-700" style={{ fontSize: 14 }}>Horário *</label>
              <input
                type="time"
                required
                value={hora}
                onChange={(e) => setHora(e.target.value)}
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = '#1B5E5A')}
                onBlur={(e) => (e.target.style.borderColor = '#E8E8E8')}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-gray-700" style={{ fontSize: 14 }}>Profissional</label>
            <select
              value={profissionalId}
              onChange={(e) => setProfissionalId(e.target.value)}
              style={{ ...inputStyle, color: profissionalId ? '#171717' : '#9ca3af' }}
              onFocus={(e) => (e.target.style.borderColor = '#1B5E5A')}
              onBlur={(e) => (e.target.style.borderColor = '#E8E8E8')}
            >
              <option value="">Selecionar profissional (opcional)</option>
              {profissionais.map((p) => (
                <option key={p.id} value={p.id}>{p.nome}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-gray-700" style={{ fontSize: 14 }}>Valor (R$)</label>
            <input
              type="number"
              placeholder="0,00"
              min="0"
              step="0.01"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = '#1B5E5A')}
              onBlur={(e) => (e.target.style.borderColor = '#E8E8E8')}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-gray-700" style={{ fontSize: 14 }}>Observações</label>
            <textarea
              placeholder="Alguma observação sobre o agendamento..."
              rows={3}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              style={{ ...inputStyle, resize: 'none' }}
              onFocus={(e) => (e.target.style.borderColor = '#1B5E5A')}
              onBlur={(e) => (e.target.style.borderColor = '#E8E8E8')}
            />
          </div>

          <Button variant="primary" fullWidth type="submit" loading={salvando}>
            Salvar agendamento
          </Button>

        </form>
      </main>
    </PageContainer>
  )
}
