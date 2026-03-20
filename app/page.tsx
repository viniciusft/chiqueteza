import Link from 'next/link'
import Button from '@/components/ui/Button'
import Logo from '@/components/ui/Logo'
import PageContainer from '@/components/ui/PageContainer'

export default function Home() {
  return (
    <PageContainer>
      <main className="flex flex-col items-center justify-between min-h-screen px-5 py-12">

        {/* Logo */}
        <div className="flex justify-center pt-4">
          <Logo />
        </div>

        {/* Centro */}
        <div className="flex flex-col items-center gap-6 text-center flex-1 justify-center">

          {/* Ícone decorativo dourado */}
          <span
            className="font-extrabold"
            style={{ fontSize: 64, color: '#D4A843', lineHeight: 1 }}
          >
            ✦
          </span>

          {/* Headline */}
          <div className="flex flex-col gap-2">
            <h1
              className="font-extrabold tracking-tight"
              style={{ fontSize: 28, color: '#1B5E5A' }}
            >
              Seu assistente pessoal de beleza
            </h1>
            <p className="text-gray-500" style={{ fontSize: 15 }}>
              Try-on virtual + organize sua rotina
            </p>
          </div>

        </div>

        {/* Botões */}
        <div className="w-full flex flex-col gap-3">
          <Link href="/cadastro" className="w-full">
            <Button variant="primary" fullWidth>
              Criar conta
            </Button>
          </Link>
          <Link href="/login" className="w-full">
            <Button variant="outline" fullWidth>
              Já tenho conta
            </Button>
          </Link>
        </div>

      </main>
    </PageContainer>
  )
}
