import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AppHeader from '@/components/ui/AppHeader'
import FeatureCard from '@/components/ui/FeatureCard'
import PageContainer from '@/components/ui/PageContainer'
import LogoutButton from './LogoutButton'

export default async function AppPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const nome = user.user_metadata?.nome ?? user.email?.split('@')[0] ?? 'usuária'

  return (
    <PageContainer>
      <AppHeader actions={<LogoutButton />} />

      <main className="flex flex-col px-5 py-8 gap-6">

        {/* Saudação */}
        <div className="flex flex-col gap-0.5">
          <span className="text-gray-500" style={{ fontSize: 14 }}>Olá,</span>
          <span className="font-extrabold tracking-tight" style={{ fontSize: 26, color: '#171717' }}>
            {nome}
          </span>
        </div>

        {/* Feature Cards */}
        <div className="flex flex-col" style={{ gap: 12 }}>
          <FeatureCard
            badge="TRY-ON"
            icon="✦"
            title="Experimente looks"
            subtitle="Maquiagem virtual com IA"
            color="green"
            href="/app/tryon"
          />
          <FeatureCard
            badge="ROTINA"
            icon="📅"
            title="Minha Rotina"
            subtitle="Procedimentos e lembretes"
            color="pink"
            href="/app/rotina"
          />
        </div>

      </main>
    </PageContainer>
  )
}
