'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import AppHeader from '@/components/ui/AppHeader'
import PageContainer from '@/components/ui/PageContainer'
import ProfissionalCard from '../rotina/_components/ProfissionalCard'
import EstabelecimentoCard, { type Estabelecimento } from './_components/EstabelecimentoCard'
import { PageTransition } from '@/components/ui/PageTransition'
import { PullToRefresh } from '@/components/ui/PullToRefresh'
import { SkeletonList } from '@/components/ui/SkeletonCard'
import { useCache } from '@/lib/cache/useCache'
import { CACHE_KEYS } from '@/lib/cache/keys'
import EmptyState from '@/components/ui/EmptyState'
import { useLocalizacao } from '@/hooks/useLocalizacao'
import { Plus, MapPin, ChevronDown, ChevronUp } from 'lucide-react'

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

// ─── Filtros de categoria ─────────────────────────────────────────────

const FILTROS = [
  { label: 'Todos', value: null },
  { label: 'Salões', value: 'beauty_salon' },
  { label: 'Cabelo', value: 'hair_care' },
  { label: 'Manicure', value: 'nail_salon' },
  { label: 'Spa', value: 'spa' },
] as const

type FiltroValue = (typeof FILTROS)[number]['value']

// ─── Seção Perto de Mim ───────────────────────────────────────────────

function SecaoPorProximidade() {
  const { coordenadas, carregando: carregandoGPS, erro: erroGPS, solicitar } = useLocalizacao()
  const [estabelecimentos, setEstabelecimentos] = useState<Estabelecimento[]>([])
  const [buscando, setBuscando] = useState(false)
  const [erroBusca, setErroBusca] = useState<string | null>(null)
  const [filtro, setFiltro] = useState<FiltroValue>(null)
  const [expandido, setExpandido] = useState(true)
  const [jaAbriu, setJaAbriu] = useState(false)

  const buscarEstabelecimentos = useCallback(async (lat: number, lng: number) => {
    setBuscando(true)
    setErroBusca(null)
    try {
      const res = await fetch('/api/profissionais/buscar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat, lng, raio_km: 5 }),
      })
      if (!res.ok) throw new Error('Falha na busca')
      const data = (await res.json()) as { estabelecimentos: Estabelecimento[] }
      setEstabelecimentos(data.estabelecimentos)
    } catch {
      setErroBusca('Não foi possível buscar os estabelecimentos. Tente novamente.')
    } finally {
      setBuscando(false)
    }
  }, [])

  async function handleBuscar() {
    setJaAbriu(true)
    const coords = await solicitar()
    if (coords) {
      await buscarEstabelecimentos(coords.lat, coords.lng)
    }
  }

  // Se GPS já estava em cache, buscar automaticamente na primeira vez
  useEffect(() => {
    if (coordenadas && !jaAbriu && estabelecimentos.length === 0) {
      setJaAbriu(true)
      void buscarEstabelecimentos(coordenadas.lat, coordenadas.lng)
    }
  }, [coordenadas, jaAbriu, estabelecimentos.length, buscarEstabelecimentos])

  const carregando = carregandoGPS || buscando
  const erro = erroGPS ?? erroBusca

  const listaFiltrada = filtro
    ? estabelecimentos.filter((e) => e.categoria === filtro)
    : estabelecimentos

  const mostrarResultados = !carregando && estabelecimentos.length > 0
  const mostrarVazio = !carregando && jaAbriu && estabelecimentos.length === 0 && !erro

  return (
    <section className="flex flex-col gap-3">
      {/* Header da seção */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            style={{
              width: 28, height: 28, borderRadius: 8,
              background: 'rgba(255,51,102,0.09)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <MapPin size={14} color="var(--color-primary)" />
          </div>
          <h2 className="text-section-title">Perto de mim</h2>
          {coordenadas && (
            <span style={{
              fontSize: 10, fontWeight: 700, letterSpacing: '0.04em',
              color: coordenadas.precisao === 'gps' ? '#15803d' : '#b45309',
              background: coordenadas.precisao === 'gps' ? 'rgba(21,128,61,0.09)' : 'rgba(180,83,9,0.09)',
              borderRadius: 6, padding: '2px 7px',
            }}>
              {coordenadas.precisao === 'gps' ? 'GPS' : 'Rede'}
            </span>
          )}
        </div>
        {mostrarResultados && (
          <button
            onClick={() => setExpandido((v) => !v)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#767676', display: 'flex', alignItems: 'center', gap: 3 }}
          >
            <span style={{ fontSize: 12, fontFamily: 'var(--font-body)' }}>
              {listaFiltrada.length}
            </span>
            {expandido ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        )}
      </div>

      {/* Botão de busca (estado inicial) */}
      {!jaAbriu && !carregando && (
        <motion.button
          onClick={handleBuscar}
          whileTap={{ scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          style={{
            width: '100%', padding: '14px',
            borderRadius: 14, border: '1.5px dashed rgba(255,51,102,0.35)',
            background: 'rgba(255,51,102,0.04)',
            cursor: 'pointer', display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: 8,
            fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 700,
            color: 'var(--color-primary)',
          }}
        >
          <MapPin size={16} />
          Buscar salões perto de mim
        </motion.button>
      )}

      {/* Loading */}
      {carregando && (
        <div className="flex flex-col gap-3">
          <p style={{
            fontSize: 13, color: '#767676', fontFamily: 'var(--font-body)',
            textAlign: 'center', fontStyle: 'italic',
          }}>
            {carregandoGPS ? 'Obtendo sua localização...' : 'Buscando salões próximos...'}
          </p>
          <SkeletonList count={3} height={88} />
        </div>
      )}

      {/* Erro */}
      {erro && !carregando && (
        <div style={{
          padding: '14px 16px', borderRadius: 14,
          background: 'rgba(239,68,68,0.06)', border: '1.5px solid rgba(239,68,68,0.2)',
        }}>
          <p style={{ fontSize: 13, color: '#b91c1c', margin: 0, fontFamily: 'var(--font-body)' }}>
            {erro}
          </p>
          <button
            onClick={handleBuscar}
            style={{
              marginTop: 10, fontSize: 13, fontWeight: 700,
              color: 'var(--color-primary)', background: 'none',
              border: 'none', cursor: 'pointer', padding: 0,
              fontFamily: 'var(--font-body)',
            }}
          >
            Tentar novamente →
          </button>
        </div>
      )}

      {/* Resultados */}
      <AnimatePresence>
        {mostrarResultados && expandido && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            style={{ overflow: 'hidden' }}
          >
            {/* Filtros */}
            <div style={{
              display: 'flex', gap: 6, overflowX: 'auto',
              scrollbarWidth: 'none', paddingBottom: 2, marginBottom: 12,
            }}>
              {FILTROS.map((f) => {
                const ativo = filtro === f.value
                return (
                  <button
                    key={String(f.value)}
                    onClick={() => setFiltro(f.value)}
                    style={{
                      flexShrink: 0, padding: '6px 14px',
                      borderRadius: 20, border: '1.5px solid',
                      borderColor: ativo ? 'var(--color-primary)' : '#E8E8E8',
                      background: ativo ? 'rgba(255,51,102,0.06)' : '#fff',
                      color: ativo ? 'var(--color-primary)' : '#666',
                      fontSize: 13, fontWeight: ativo ? 700 : 500,
                      cursor: 'pointer', fontFamily: 'var(--font-body)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {f.label}
                  </button>
                )
              })}
            </div>

            {/* Cards */}
            <div className="flex flex-col gap-3">
              {listaFiltrada.length > 0 ? (
                listaFiltrada.map((est) => (
                  <EstabelecimentoCard key={est.id} est={est} />
                ))
              ) : (
                <p style={{
                  fontSize: 13, color: '#767676', textAlign: 'center',
                  padding: '16px 0', fontFamily: 'var(--font-body)',
                }}>
                  Nenhum resultado nesta categoria.
                </p>
              )}
            </div>

            {/* Buscar raio maior */}
            <button
              onClick={handleBuscar}
              style={{
                marginTop: 12, width: '100%', padding: '10px',
                borderRadius: 12, border: '1.5px solid #E8E8E8',
                background: 'transparent', cursor: 'pointer',
                fontSize: 13, fontWeight: 600, color: '#767676',
                fontFamily: 'var(--font-body)',
              }}
            >
              Atualizar resultados
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Vazio */}
      {mostrarVazio && (
        <div style={{
          padding: '20px 16px', borderRadius: 14, textAlign: 'center',
          background: 'rgba(255,51,102,0.03)', border: '1.5px solid rgba(255,51,102,0.1)',
        }}>
          <MapPin size={28} color="rgba(255,51,102,0.3)" style={{ margin: '0 auto 8px' }} />
          <p style={{ fontSize: 14, fontWeight: 700, color: '#525252', margin: '0 0 4px' }}>
            Nenhum salão encontrado
          </p>
          <p style={{ fontSize: 13, color: '#767676', margin: 0 }}>
            Não encontramos estabelecimentos num raio de 5km.
          </p>
        </div>
      )}
    </section>
  )
}

// ─── Conteúdo principal ───────────────────────────────────────────────

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

          <main className="flex flex-col gap-6 px-5 py-6">

            <div className="flex items-center justify-between">
              <h1 className="text-page-title">Profissionais</h1>
              {!showSkeleton && (profissionais ?? []).length > 0 && (
                <span className="text-caption">
                  {(profissionais ?? []).length} na caderneta
                </span>
              )}
            </div>

            {/* Busca por proximidade */}
            <SecaoPorProximidade />

            {/* Divisor */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ flex: 1, height: 1, background: '#F0F0F0' }} />
              <span style={{ fontSize: 12, color: '#A3A3A3', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>
                Minha caderneta
              </span>
              <div style={{ flex: 1, height: 1, background: '#F0F0F0' }} />
            </div>

            {/* Caderneta pessoal */}
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
          <Link href="/app/profissionais/novo" aria-label="Nova profissional">
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

// ─── Page ─────────────────────────────────────────────────────────────

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
