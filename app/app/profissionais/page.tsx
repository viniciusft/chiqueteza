'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import AppHeader from '@/components/ui/AppHeader'
import PageContainer from '@/components/ui/PageContainer'
import ProfissionalCard from '../rotina/_components/ProfissionalCard'
import { PageTransition } from '@/components/ui/PageTransition'
import { PullToRefresh } from '@/components/ui/PullToRefresh'
import { SkeletonList } from '@/components/ui/SkeletonCard'
import { useCache } from '@/lib/cache/useCache'
import { CACHE_KEYS } from '@/lib/cache/keys'
import EmptyState from '@/components/ui/EmptyState'

interface Profissional {
  id: string
  usuario_id: string
  nome: string
  especialidades: string[]
  telefone: string | null
  instagram: string | null
  avaliacao: number | null
  valor_medio: number | null
  fotos_urls: string[]
  observacoes: string | null
  ativo: boolean
}

function RevalidatingSpinner() {
  return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div
        style={{
          width: 16, height: 16,
          border: '2px solid #1B5E5A',
          borderTopColor: 'transparent',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
          opacity: 0.5,
        }}
      />
    </>
  )
}

// Componente interno: recebe userId já resolvido e usa useCache
function ProfissionaisContent({ userId }: { userId: string }) {
  const supabase = createClient()

  const profissionaisFetcher = useCallback(async (): Promise<Profissional[]> => {
    const { data } = await supabase
      .from('profissionais')
      .select('*')
      .eq('usuario_id', userId)
      .eq('ativo', true)
      .order('nome')
    return (data ?? []) as Profissional[]
  }, [userId]) // eslint-disable-line react-hooks/exhaustive-deps

  const {
    data: profissionais,
    loading,
  } = useCache<Profissional[]>(
    CACHE_KEYS.profissionais(userId),
    profissionaisFetcher,
    CACHE_KEYS.PROFISSIONAIS_TTL
  )

  const showSkeleton = loading && profissionais === null

  return (
    <PageTransition>
    <PullToRefresh>
    <PageContainer>
      <AppHeader />

      <main className="flex flex-col gap-4 px-5 py-6">

        <div className="flex items-center justify-between">
          <h1 className="font-extrabold tracking-tight" style={{ fontSize: 24, color: '#171717' }}>
            Profissionais
          </h1>
          {loading && profissionais !== null && <RevalidatingSpinner />}
        </div>

        {showSkeleton ? (
          <SkeletonList count={3} height={88} />
        ) : (profissionais ?? []).length === 0 ? (
          <EmptyState
            emoji="💅"
            titulo="Sua caderneta está vazia"
            descricao="Adicione as profissionais que cuida de você — cabeleireira, manicure, esteticista..."
          />
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
    </PullToRefresh>
    </PageTransition>
  )
}

// Componente principal: resolve userId antes de renderizar o conteúdo
export default function ProfissionaisPage() {
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user?.id ?? null)
    })()
  }, [])

  if (!userId) {
    return (
      <PageTransition>
      <PageContainer>
        <AppHeader />
        <main className="flex flex-col gap-4 px-5 py-6">
          <h1 className="font-extrabold tracking-tight" style={{ fontSize: 24, color: '#171717' }}>
            Profissionais
          </h1>
          <SkeletonList count={3} height={88} />
        </main>
      </PageContainer>
      </PageTransition>
    )
  }

  return <ProfissionaisContent userId={userId} />
}
