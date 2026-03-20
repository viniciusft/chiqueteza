'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setCarregando(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha })

    if (error) {
      setErro('E-mail ou senha incorretos. Tente novamente.')
      setCarregando(false)
      return
    }

    router.push('/app')
  }

  return (
    <main className="min-h-screen bg-silver-platter flex flex-col items-center justify-center px-6 py-12">

      <div className="w-full max-w-sm flex flex-col gap-8">

        {/* Cabeçalho */}
        <div className="flex flex-col items-center gap-2 text-center">
          <Link href="/" className="text-3xl font-bold text-ever-green tracking-tight">
            Chiqueteza
          </Link>
          <p className="text-gray-500 text-sm">Bem-vinda de volta ✨</p>
        </div>

        {/* Card do formulário */}
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-sm px-6 py-8 flex flex-col gap-5">

          <h2 className="text-xl font-semibold text-gray-800">Entrar</h2>

          {/* Mensagem de erro */}
          {erro && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              {erro}
            </p>
          )}

          {/* Campo email */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-medium text-gray-700">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              placeholder="seu@email.com"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-base text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-ever-green focus:border-transparent transition"
            />
          </div>

          {/* Campo senha */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="senha" className="text-sm font-medium text-gray-700">
              Senha
            </label>
            <input
              id="senha"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              required
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-base text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-ever-green focus:border-transparent transition"
            />
          </div>

          {/* Botão entrar */}
          <Button variant="primary" fullWidth type="submit" disabled={carregando}>
            {carregando ? 'Entrando...' : 'Entrar'}
          </Button>

        </form>

        {/* Link criar conta */}
        <p className="text-center text-sm text-gray-500">
          Não tem conta?{' '}
          <Link href="/cadastro" className="text-pink-peony font-semibold hover:underline">
            Criar conta
          </Link>
        </p>

      </div>
    </main>
  )
}
