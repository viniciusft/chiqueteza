'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import AppHeader from '@/components/ui/AppHeader'
import PageContainer from '@/components/ui/PageContainer'
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
    <PageContainer>
      <AppHeader />

      <main className="flex flex-col px-5 py-8 gap-6">

        {/* Título */}
        <div className="flex flex-col gap-1">
          <h1 className="font-extrabold tracking-tight" style={{ fontSize: 24, color: '#171717' }}>
            Bem-vinda de volta
          </h1>
          <p className="text-gray-500" style={{ fontSize: 14 }}>
            Entre na sua conta
          </p>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

          {erro && (
            <p className="text-sm text-red-600 bg-red-50 px-4 py-3"
              style={{ borderRadius: 12, border: '1.5px solid #fecaca' }}>
              {erro}
            </p>
          )}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="font-semibold text-gray-700" style={{ fontSize: 14 }}>
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
              className="w-full text-gray-800 placeholder-gray-400 transition focus:outline-none"
              style={{
                borderRadius: 12,
                border: '1.5px solid #E8E8E8',
                padding: '12px 16px',
                fontSize: 15,
              }}
              onFocus={(e) => (e.target.style.borderColor = '#1B5E5A')}
              onBlur={(e) => (e.target.style.borderColor = '#E8E8E8')}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="senha" className="font-semibold text-gray-700" style={{ fontSize: 14 }}>
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
              className="w-full text-gray-800 placeholder-gray-400 transition focus:outline-none"
              style={{
                borderRadius: 12,
                border: '1.5px solid #E8E8E8',
                padding: '12px 16px',
                fontSize: 15,
              }}
              onFocus={(e) => (e.target.style.borderColor = '#1B5E5A')}
              onBlur={(e) => (e.target.style.borderColor = '#E8E8E8')}
            />
          </div>

          <Button variant="primary" fullWidth type="submit" loading={carregando}>
            Entrar
          </Button>

        </form>

        <p className="text-center text-sm text-gray-500">
          Não tem conta?{' '}
          <Link href="/cadastro" className="font-semibold hover:underline" style={{ color: '#F472A0' }}>
            Criar conta
          </Link>
        </p>

      </main>
    </PageContainer>
  )
}
