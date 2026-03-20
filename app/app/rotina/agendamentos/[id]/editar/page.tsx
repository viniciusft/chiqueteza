'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
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

function isoParaData(iso: string): string {
  const dt = new Date(iso)
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
}

function isoParaHora(iso: string): string {
  const dt = new Date(iso)
  return `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`
}

export default function EditarAgendamentoPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [excluindo, setExcluindo] = useState(false)
  const [confirmarExclusao, setConfirmarExclusao] = useState(false)
  const [erro, setErro] = useState('')
  const [profissionais, setProfissionais] = useState<Profissional[]>([])

  const [servico, setServico] = useState('')
  const [data, setData] = useState('')
  const [hora, setHora] = useState('')
  const [profissionalId, setProfissionalId] = useState('')
  const [valor, setValor] = useState('')
  const [observacoes, setObservacoes] = useState('')

  useEffect(() => {
    async function carregar() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const [{ data: ag }, { data: profs }] = await Promise.all([
        supabase
          .from('agendamentos_rotina')
          .select('*')
          .eq('id', id)
          .eq('usuario_id', user.id)
          .single(),
        supabase
          .from('profissionais')
          .select('id, nome')
          .eq('usuario_id', user.id)
          .eq('ativo', true)
          .order('nome'),
      ])

      if (!ag) { router.push('/app/rotina'); return }

      setServico(ag.servico_nome ?? '')
      setData(isoParaData(ag.data_hora))
      setHora(isoParaHora(ag.data_hora))
      setProfissionalId(ag.profissional_id ?? '')
      setValor(ag.valor != null ? String(ag.valor) : '')
      setObservacoes(ag.observacoes ?? '')
      setProfissionais(profs ?? [])
      setCarregando(false)
    }
    carregar()
  }, [id, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    if (!servico || !data || !hora) { setErro('Preencha serviço, data e horário.'); return }
    setSalvando(true)

    const supabase = createClient()
    const dataHora = new Date(`${data}T${hora}:00`).toISOString()

    const { error } = await supabase
      .from('agendamentos_rotina')
      .update({
        servico_nome: servico,
        data_hora: dataHora,
        profissional_id: profissionalId || null,
        valor: valor ? Number(valor) : null,
        observacoes: observacoes || null,
      })
      .eq('id', id)

    if (error) {
      setErro('Erro ao salvar. Tente novamente.')
      setSalvando(false)
      return
    }
    router.push('/app/rotina')
  }

  async function handleExcluir() {
    setExcluindo(true)
    const supabase = createClient()
    await supabase.from('agendamentos_rotina').delete().eq('id', id)
    router.push('/app/rotina')
  }

  if (carregando) {
    return (
      <PageContainer>
        <AppHeader />
        <div className="flex items-center justify-center py-20">
          <p className="text-gray-400">Carregando...</p>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <AppHeader />
      <main className="flex flex-col px-5 py-6 gap-5">

        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-gray-400 text-xl">←</button>
          <h1 className="font-extrabold tracking-tight" style={{ fontSize: 22, color: '#171717' }}>
            Editar agendamento
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
            Salvar
          </Button>

        </form>

        {/* Excluir */}
        <div className="flex flex-col gap-2 pb-4">
          {!confirmarExclusao ? (
            <button
              onClick={() => setConfirmarExclusao(true)}
              style={{
                width: '100%', padding: '12px', borderRadius: 12,
                border: '1.5px solid #fca5a5', backgroundColor: '#fff',
                color: '#dc2626', fontSize: 14, fontWeight: 600, cursor: 'pointer',
              }}
            >
              Excluir agendamento
            </button>
          ) : (
            <div
              className="flex flex-col gap-3 p-4"
              style={{ borderRadius: 12, border: '1.5px solid #fca5a5', backgroundColor: '#fff5f5' }}
            >
              <p className="font-semibold text-red-700 text-center" style={{ fontSize: 14 }}>
                Excluir este agendamento?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmarExclusao(false)}
                  style={{
                    flex: 1, padding: '10px', borderRadius: 10,
                    border: '1.5px solid #E8E8E8', backgroundColor: '#fff',
                    fontSize: 14, fontWeight: 600, color: '#666', cursor: 'pointer',
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleExcluir}
                  disabled={excluindo}
                  style={{
                    flex: 1, padding: '10px', borderRadius: 10,
                    border: 'none', backgroundColor: '#dc2626',
                    color: '#fff', fontSize: 14, fontWeight: 600,
                    cursor: excluindo ? 'not-allowed' : 'pointer',
                    opacity: excluindo ? 0.7 : 1,
                  }}
                >
                  {excluindo ? 'Excluindo...' : 'Confirmar'}
                </button>
              </div>
            </div>
          )}
        </div>

      </main>
    </PageContainer>
  )
}
