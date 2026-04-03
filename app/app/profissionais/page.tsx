'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
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
import { Plus } from 'lucide-react'

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

  const { data: profissionais, loading } = useCache<Profissional[]>(
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
              <h1 className="text-page-title">Profissionais</h1>
              {!showSkeleton && (profissionais ?? []).length > 0 && (
                <span className="text-caption">
                  {(profissionais ?? []).length} na caderneta
                </span>
              )}
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

          {/* FAB — pink gradient */}
          <Link
            href="/app/profissionais/novo"
            aria-label="Nova profissional"
          >
            <motion.div
              whileTap={{ scale: 0.90 }}
              transition={{ type: 'spring', stiffness: 500, damping: 25 }}
              style={{
                position: 'fixed',
                bottom: 88, right: 20,
                width: 54, height: 54,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #FF3366, #F472A0)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 20,
                boxShadow: '0 6px 20px rgba(255,51,102,0.4)',
              }}
            >
              <Plus size={24} strokeWidth={2.5} />
            </motion.div>
          </Link>

        </PageContainer>
      </PullToRefresh>
    </PageTransition>
  )
}

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
            <h1 className="text-page-title">Profissionais</h1>
            <SkeletonList count={3} height={88} />
          </main>
        </PageContainer>
      </PageTransition>
    )
  }

  return <ProfissionaisContent userId={userId} />
}
