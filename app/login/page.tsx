import Link from 'next/link'
import Button from '@/components/ui/Button'

export default function LoginPage() {
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
        <div className="bg-white rounded-3xl shadow-sm px-6 py-8 flex flex-col gap-5">

          <h2 className="text-xl font-semibold text-gray-800">Entrar</h2>

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
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-base text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-ever-green focus:border-transparent transition"
            />
          </div>

          {/* Botão entrar */}
          <Button variant="primary" fullWidth type="submit">
            Entrar
          </Button>

        </div>

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
