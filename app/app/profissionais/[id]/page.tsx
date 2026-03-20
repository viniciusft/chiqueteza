import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import AppHeader from '@/components/ui/AppHeader'
import PageContainer from '@/components/ui/PageContainer'
import BotoesAcao from './_components/BotoesAcao'
import GaleriaFotos from './_components/GaleriaFotos'

function Estrelas({ avaliacao }: { avaliacao: number | null }) {
  const total = avaliacao ?? 0
  return (
    <span style={{ fontSize: 20, color: '#D4A843' }}>
      {'★'.repeat(total)}
      <span style={{ color: '#E8E8E8' }}>{'★'.repeat(5 - total)}</span>
    </span>
  )
}

export default async function ProfissionalPerfilPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profissional }, { data: agendamentos }] = await Promise.all([
    supabase
      .from('profissionais')
      .select('*')
      .eq('id', params.id)
      .eq('usuario_id', user.id)
      .single(),
    supabase
      .from('agendamentos_rotina')
      .select('*')
      .eq('profissional_id', params.id)
      .eq('usuario_id', user.id)
      .order('data_hora', { ascending: false }),
  ])

  if (!profissional) notFound()

  const totalGasto = (agendamentos ?? [])
    .filter((a) => a.status === 'concluido')
    .reduce((acc, a) => acc + (Number(a.valor) || 0), 0)

  return (
    <PageContainer>
      <AppHeader
        actions={
          <Link
            href={`/app/profissionais/${params.id}/editar`}
            className="text-gray-400 font-medium"
            style={{ fontSize: 14 }}
          >
            Editar
          </Link>
        }
      />

      <main className="flex flex-col gap-5 px-5 py-6 pb-10">

        {/* Cabeçalho */}
        <div className="flex flex-col gap-2">
          <Link href="/app/profissionais" className="text-gray-400 text-sm">← Voltar</Link>
          <h1 className="font-extrabold tracking-tight" style={{ fontSize: 24, color: '#171717' }}>
            {profissional.nome}
          </h1>
          {profissional.avaliacao && <Estrelas avaliacao={profissional.avaliacao} />}
          {profissional.valor_medio && (
            <p className="text-gray-500" style={{ fontSize: 14 }}>
              Valor médio:{' '}
              {Number(profissional.valor_medio).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          )}
          {(profissional.especialidades ?? []).length > 0 && (
            <div className="flex flex-wrap gap-1">
              {(profissional.especialidades as string[]).map((esp: string) => (
                <span
                  key={esp}
                  className="font-bold uppercase tracking-wide"
                  style={{
                    fontSize: 10,
                    backgroundColor: '#E8F5F4',
                    color: '#1B5E5A',
                    borderRadius: 6,
                    padding: '3px 8px',
                  }}
                >
                  {esp}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Botões de ação */}
        <BotoesAcao
          nome={profissional.nome}
          especialidades={profissional.especialidades}
          avaliacao={profissional.avaliacao}
          telefone={profissional.telefone}
          instagram={profissional.instagram}
        />

        {profissional.observacoes && (
          <div
            className="px-4 py-3"
            style={{ backgroundColor: '#fff', borderRadius: 14, border: '1.5px solid #E8E8E8' }}
          >
            <p className="text-gray-500" style={{ fontSize: 14 }}>{profissional.observacoes}</p>
          </div>
        )}

        {/* Galeria de fotos */}
        <section className="flex flex-col gap-3">
          <h2 className="font-bold text-gray-500 uppercase tracking-widest" style={{ fontSize: 11 }}>
            Fotos dos serviços
          </h2>
          <GaleriaFotos
            profissionalId={profissional.id}
            fotosIniciais={profissional.fotos_urls ?? []}
          />
        </section>

        {/* Histórico de agendamentos */}
        <section className="flex flex-col gap-2">
          <h2 className="font-bold text-gray-500 uppercase tracking-widest" style={{ fontSize: 11 }}>
            Histórico de agendamentos
          </h2>
          {(agendamentos ?? []).length === 0 ? (
            <p className="text-gray-400" style={{ fontSize: 14 }}>Nenhum agendamento com ela ainda.</p>
          ) : (
            (agendamentos ?? []).map((ag) => {
              const data = new Date(ag.data_hora).toLocaleDateString('pt-BR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })
              const statusColor =
                ag.status === 'concluido' ? '#1B5E5A' :
                ag.status === 'cancelado' ? '#9ca3af' : '#D4A843'
              return (
                <div
                  key={ag.id}
                  className="flex items-center justify-between px-4 py-3 bg-white"
                  style={{ borderRadius: 14, border: '1.5px solid #E8E8E8' }}
                >
                  <div>
                    <p className="font-bold text-gray-800" style={{ fontSize: 14 }}>{ag.servico_nome}</p>
                    <p className="text-gray-400" style={{ fontSize: 12 }}>{data}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span
                      className="font-bold uppercase tracking-wide"
                      style={{ fontSize: 10, color: statusColor }}
                    >
                      {ag.status}
                    </span>
                    {ag.valor && (
                      <span className="text-gray-500" style={{ fontSize: 12 }}>
                        {Number(ag.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </section>

        {totalGasto > 0 && (
          <div
            className="flex items-center justify-between px-4 py-4"
            style={{ borderRadius: 16, backgroundColor: '#fff', border: '1.5px solid #E8E8E8' }}
          >
            <span className="font-semibold text-gray-500" style={{ fontSize: 14 }}>
              Total gasto com {profissional.nome.split(' ')[0]}
            </span>
            <span className="font-extrabold" style={{ fontSize: 18, color: '#1B5E5A' }}>
              {totalGasto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
          </div>
        )}

      </main>
    </PageContainer>
  )
}
