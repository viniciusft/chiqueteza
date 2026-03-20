import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LogoutButton from './LogoutButton'
import Link from 'next/link'

export default async function AppPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const nome = user.user_metadata?.nome ?? user.email?.split('@')[0] ?? 'usuária'

  return (
    <main className="min-h-screen bg-silver-platter flex flex-col px-6 py-8">

      {/* Header */}
      <header className="flex items-center justify-between mb-10">
        <span className="text-xl font-bold text-ever-green tracking-tight">Chiqueteza</span>
        <LogoutButton />
      </header>

      {/* Saudação */}
      <section className="flex flex-col gap-1 mb-10">
        <h1 className="text-2xl font-bold text-gray-800">
          Olá, {nome}!
        </h1>
        <p className="text-gray-500 text-sm">O que vamos fazer hoje?</p>
      </section>

      {/* Botões principais */}
      <div className="flex flex-col gap-4">

        <Link href="/app/try-on" className="w-full">
          <div className="bg-ever-green text-white rounded-3xl px-6 py-8 flex flex-col gap-2 shadow-sm active:scale-[0.98] transition-transform">
            <span className="text-4xl">✨</span>
            <span className="text-xl font-bold">Try-On</span>
            <span className="text-sm opacity-80">Experimente looks virtualmente</span>
          </div>
        </Link>

        <Link href="/app/rotina" className="w-full">
          <div className="bg-pink-peony text-white rounded-3xl px-6 py-8 flex flex-col gap-2 shadow-sm active:scale-[0.98] transition-transform">
            <span className="text-4xl">📅</span>
            <span className="text-xl font-bold">Minha Rotina</span>
            <span className="text-sm opacity-80">Organize seus procedimentos de beleza</span>
          </div>
        </Link>

      </div>

    </main>
  )
}
