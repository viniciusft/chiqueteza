import Link from 'next/link'
import Button from '@/components/ui/Button'

export default function Home() {
  return (
    <main className="min-h-screen bg-silver-platter flex flex-col items-center justify-between px-6 py-12">

      {/* Topo — decoração */}
      <div className="w-full flex justify-end">
        <div className="w-20 h-20 rounded-full bg-pink-peony opacity-20 -mr-4 -mt-4" />
      </div>

      {/* Centro — logo + tagline */}
      <div className="flex flex-col items-center gap-6 text-center flex-1 justify-center">

        {/* Ícone decorativo */}
        <div className="w-24 h-24 rounded-full bg-ever-green flex items-center justify-center shadow-lg">
          <span className="text-4xl">✨</span>
        </div>

        {/* Nome */}
        <div className="flex flex-col gap-2">
          <h1 className="text-5xl font-bold text-ever-green tracking-tight">
            Chiqueteza
          </h1>
          <p className="text-xl text-pink-peony font-medium">
            Seu assistente pessoal de beleza
          </p>
        </div>

        {/* Descrição */}
        <p className="text-gray-600 text-base max-w-xs leading-relaxed">
          Experimente looks virtualmente e organize sua rotina de beleza num só lugar.
        </p>

        {/* Badges de features */}
        <div className="flex flex-wrap gap-2 justify-center mt-2">
          <span className="bg-white border border-something-blue text-something-blue text-sm px-3 py-1 rounded-full font-medium">
            Virtual Try-On
          </span>
          <span className="bg-white border border-wedding-band text-wedding-band text-sm px-3 py-1 rounded-full font-medium">
            Rotina de beleza
          </span>
          <span className="bg-white border border-pink-peony text-pink-peony text-sm px-3 py-1 rounded-full font-medium">
            Lembretes inteligentes
          </span>
        </div>
      </div>

      {/* Botões de ação */}
      <div className="w-full max-w-sm flex flex-col gap-3 mt-8">
        <Link href="/login" className="w-full">
          <Button variant="primary" fullWidth>
            Entrar
          </Button>
        </Link>
        <Link href="/cadastro" className="w-full">
          <Button variant="secondary" fullWidth>
            Criar conta
          </Button>
        </Link>
      </div>

      {/* Rodapé */}
      <p className="text-gray-400 text-xs mt-6">
        © 2025 Chiqueteza
      </p>

    </main>
  )
}
