import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import AppHeader from '@/components/ui/AppHeader'
import PageContainer from '@/components/ui/PageContainer'
import ProfissionalCard from '../rotina/_components/ProfissionalCard'

export default async function ProfissionaisPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profissionais } = await supabase
    .from('profissionais')
    .select('*')
    .eq('usuario_id', user.id)
    .eq('ativo', true)
    .order('nome')

  return (
    <PageContainer>
      <AppHeader />

      <main className="flex flex-col gap-4 px-5 py-6">

        <h1 className="font-extrabold tracking-tight" style={{ fontSize: 24, color: '#171717' }}>
          Profissionais
        </h1>

        {(profissionais ?? []).length === 0 ? (
          <div
            className="flex flex-col items-center gap-3 py-16"
            style={{ borderRadius: 20, backgroundColor: '#fff', border: '1.5px solid #E8E8E8' }}
          >
            <span style={{ fontSize: 48 }}>💅</span>
            <p className="font-semibold text-gray-500 text-center" style={{ fontSize: 15 }}>
              Adicione suas profissionais favoritas
            </p>
            <p className="text-gray-400 text-center" style={{ fontSize: 13 }}>
              Salve contatos, especialidades e histórico de atendimentos
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {(profissionais ?? []).map((p) => (
              <ProfissionalCard key={p.id} profissional={p} baseHref="/app/profissionais" />
            ))}
          </div>
        )}

      </main>

      {/* FAB */}
      <Link
        href="/app/profissionais/novo"
        aria-label="Nova profissional"
        style={{
          position: 'fixed',
          bottom: 88,
          right: 24,
          width: 56,
          height: 56,
          borderRadius: '50%',
          backgroundColor: '#F472A0',
          color: '#fff',
          fontSize: 28,
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 20,
          boxShadow: '0 4px 16px rgba(244,114,160,0.35)',
          textDecoration: 'none',
          lineHeight: 1,
        }}
      >
        +
      </Link>
    </PageContainer>
  )
}
