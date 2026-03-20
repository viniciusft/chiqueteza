'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import AppHeader from '@/components/ui/AppHeader'
import Button from '@/components/ui/Button'
import PageContainer from '@/components/ui/PageContainer'
import { createClient } from '@/lib/supabase/client'

const ESPECIALIDADES = ['Cabelo', 'Maquiagem', 'Unha', 'Sobrancelha', 'Depilação', 'Estética']

const inputStyle = {
  borderRadius: 12,
  border: '1.5px solid #E8E8E8',
  padding: '12px 16px',
  fontSize: 15,
  width: '100%',
  backgroundColor: '#fff',
  color: '#171717',
}

export default function NovaProfissionalPage() {
  const router = useRouter()
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  const [nome, setNome] = useState('')
  const [especialidadesSelecionadas, setEspecialidadesSelecionadas] = useState<string[]>([])
  const [especialidadeLivre, setEspecialidadeLivre] = useState('')
  const [telefone, setTelefone] = useState('')
  const [instagram, setInstagram] = useState('')
  const [avaliacao, setAvaliacao] = useState(0)
  const [valorMedio, setValorMedio] = useState('')
  const [observacoes, setObservacoes] = useState('')

  function toggleEspecialidade(esp: string) {
    setEspecialidadesSelecionadas((prev) =>
      prev.includes(esp) ? prev.filter((e) => e !== esp) : [...prev, esp]
    )
  }

  function todasEspecialidades(): string[] {
    const livre = especialidadeLivre.trim()
    return livre ? [...especialidadesSelecionadas, livre] : especialidadesSelecionadas
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    if (!nome.trim()) { setErro('Nome é obrigatório.'); return }
    setSalvando(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { error } = await supabase.from('profissionais').insert({
      usuario_id: user.id,
      nome: nome.trim(),
      especialidades: todasEspecialidades(),
      telefone: telefone.trim() || null,
      instagram: instagram.trim() || null,
      avaliacao: avaliacao > 0 ? avaliacao : null,
      valor_medio: valorMedio ? Number(valorMedio) : null,
      observacoes: observacoes.trim() || null,
      ativo: true,
    })

    if (error) {
      setErro('Erro ao salvar. Tente novamente.')
      setSalvando(false)
      return
    }
    router.push('/app/profissionais')
  }

  return (
    <PageContainer>
      <AppHeader />
      <main className="flex flex-col px-5 py-6 gap-5">

        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-gray-400 text-xl">←</button>
          <h1 className="font-extrabold tracking-tight" style={{ fontSize: 22, color: '#171717' }}>
            Nova profissional
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
            <label className="font-semibold text-gray-700" style={{ fontSize: 14 }}>Nome *</label>
            <input
              type="text"
              placeholder="Nome da profissional"
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = '#1B5E5A')}
              onBlur={(e) => (e.target.style.borderColor = '#E8E8E8')}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-semibold text-gray-700" style={{ fontSize: 14 }}>Especialidades</label>
            <div className="flex flex-wrap gap-2">
              {ESPECIALIDADES.map((esp) => {
                const selecionado = especialidadesSelecionadas.includes(esp)
                return (
                  <button
                    key={esp}
                    type="button"
                    onClick={() => toggleEspecialidade(esp)}
                    className="font-bold uppercase tracking-wide transition-all"
                    style={{
                      fontSize: 11,
                      borderRadius: 8,
                      padding: '6px 12px',
                      backgroundColor: selecionado ? '#1B5E5A' : '#F5F5F5',
                      color: selecionado ? '#fff' : '#1B5E5A',
                      border: `1.5px solid ${selecionado ? '#1B5E5A' : '#E8E8E8'}`,
                    }}
                  >
                    {esp}
                  </button>
                )
              })}
            </div>
            <input
              type="text"
              placeholder="Outra especialidade..."
              value={especialidadeLivre}
              onChange={(e) => setEspecialidadeLivre(e.target.value)}
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = '#1B5E5A')}
              onBlur={(e) => (e.target.style.borderColor = '#E8E8E8')}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-gray-700" style={{ fontSize: 14 }}>Avaliação</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setAvaliacao(n)}
                  style={{ fontSize: 28, color: n <= avaliacao ? '#D4A843' : '#E8E8E8', lineHeight: 1 }}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex flex-col gap-1.5 flex-1">
              <label className="font-semibold text-gray-700" style={{ fontSize: 14 }}>Telefone</label>
              <input
                type="tel"
                placeholder="(11) 99999-9999"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = '#1B5E5A')}
                onBlur={(e) => (e.target.style.borderColor = '#E8E8E8')}
              />
            </div>
            <div className="flex flex-col gap-1.5 flex-1">
              <label className="font-semibold text-gray-700" style={{ fontSize: 14 }}>Instagram</label>
              <input
                type="text"
                placeholder="@usuario"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = '#1B5E5A')}
                onBlur={(e) => (e.target.style.borderColor = '#E8E8E8')}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-gray-700" style={{ fontSize: 14 }}>Valor médio (R$)</label>
            <input
              type="number"
              placeholder="0,00"
              min="0"
              step="0.01"
              value={valorMedio}
              onChange={(e) => setValorMedio(e.target.value)}
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = '#1B5E5A')}
              onBlur={(e) => (e.target.style.borderColor = '#E8E8E8')}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-gray-700" style={{ fontSize: 14 }}>Observações</label>
            <textarea
              placeholder="Notas sobre a profissional..."
              rows={3}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              style={{ ...inputStyle, resize: 'none' }}
              onFocus={(e) => (e.target.style.borderColor = '#1B5E5A')}
              onBlur={(e) => (e.target.style.borderColor = '#E8E8E8')}
            />
          </div>

          <Button variant="secondary" fullWidth type="submit" loading={salvando}>
            Salvar profissional
          </Button>

        </form>
      </main>
    </PageContainer>
  )
}
