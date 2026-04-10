'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, ExternalLink, ChevronRight, Sparkles } from 'lucide-react'
import AppHeader from '@/components/ui/AppHeader'
import PageContainer from '@/components/ui/PageContainer'
import { PageTransition } from '@/components/ui/PageTransition'
import { createClient } from '@/lib/supabase/client'
import { CATEGORIAS_BELEZA, CATEGORIA_ML_QUERY } from '@/lib/produtos/types'

interface Produto {
  id: string
  provider: string
  titulo: string
  preco: number
  thumbnail: string
  permalink: string
  deeplink: string
  disponivel: boolean
  vendedor: string | null
  condicao: string
}

// ─── Cartão de produto ────────────────────────────────────────────────

function ProdutoCard({ produto, onSalvarWishlist }: {
  produto: Produto
  onSalvarWishlist: (p: Produto) => void
}) {
  const [salvando, setSalvando] = useState(false)
  const [salvo, setSalvo] = useState(false)

  async function handleSalvar() {
    setSalvando(true)
    await onSalvarWishlist(produto)
    setSalvando(false)
    setSalvo(true)
    setTimeout(() => setSalvo(false), 2500)
  }

  const providerLabel: Record<string, { label: string; cor: string; bg: string }> = {
    mercadolivre: { label: 'ML', cor: '#C47F00', bg: 'rgba(244,165,38,0.12)' },
    shopee:       { label: 'Shopee', cor: '#EE4D2D', bg: 'rgba(238,77,45,0.10)' },
    magalu:       { label: 'Magalu', cor: '#0046C0', bg: 'rgba(0,70,192,0.08)' },
  }
  const badge = providerLabel[produto.provider] ?? { label: produto.provider, cor: '#767676', bg: '#F5F5F5' }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      style={{
        background: '#fff',
        borderRadius: 16,
        border: '1.5px solid #F0F0F0',
        boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Thumbnail */}
      <div style={{ position: 'relative', width: '100%', aspectRatio: '1 / 1', background: '#F9F9F9' }}>
        {produto.thumbnail ? (
          <img
            src={produto.thumbnail}
            alt={produto.titulo}
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>
            ✨
          </div>
        )}
        {/* Provider badge */}
        <span style={{
          position: 'absolute', top: 7, left: 7,
          fontSize: 9, fontWeight: 800, letterSpacing: '0.04em',
          padding: '2px 6px', borderRadius: 6,
          background: badge.bg, color: badge.cor,
        }}>
          {badge.label}
        </span>
        {/* Condição badge */}
        {produto.condicao === 'used' && (
          <span style={{
            position: 'absolute', top: 7, right: 7,
            fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 6,
            background: 'rgba(0,0,0,0.55)', color: '#fff',
          }}>
            Usado
          </span>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '10px 11px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <p style={{
          margin: 0, fontSize: 12, fontWeight: 600, lineHeight: 1.3,
          color: 'var(--foreground)', fontFamily: 'var(--font-body)',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {produto.titulo}
        </p>
        {produto.vendedor && (
          <p style={{ margin: 0, fontSize: 10, color: '#A3A3A3', fontFamily: 'var(--font-body)' }}>
            {produto.vendedor}
          </p>
        )}
        <p style={{
          margin: 0, fontSize: 16, fontWeight: 800, color: '#1B5E5A',
          fontFamily: 'var(--font-body)', marginTop: 2,
        }}>
          {produto.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </p>

        {/* Ações */}
        <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
          {/* Ver no ML */}
          <motion.a
            href={produto.deeplink}
            target="_blank"
            rel="noopener noreferrer"
            whileTap={{ scale: 0.9 }}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
              padding: '7px 0', borderRadius: 10,
              background: '#1B5E5A', color: '#fff',
              fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-body)',
              textDecoration: 'none',
            }}
          >
            <ExternalLink size={11} />
            Ver no ML
          </motion.a>
          {/* Salvar wishlist */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleSalvar}
            disabled={salvando || salvo}
            style={{
              width: 36, height: 36, borderRadius: 10, flexShrink: 0,
              border: salvo ? '1.5px solid #1B5E5A' : '1.5px solid #F0F0F0',
              background: salvo ? 'rgba(27,94,90,0.08)' : '#F9F9F9',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: salvando ? 'wait' : 'pointer',
              fontSize: 15,
            }}
          >
            {salvo ? '✓' : '🤍'}
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Skeleton card ────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div style={{
      background: '#fff', borderRadius: 16, border: '1.5px solid #F0F0F0',
      overflow: 'hidden',
    }}>
      <div style={{ width: '100%', aspectRatio: '1 / 1', background: '#F0F0F0' }} />
      <div style={{ padding: '10px 11px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ height: 12, background: '#F0F0F0', borderRadius: 4, width: '85%' }} />
        <div style={{ height: 12, background: '#F0F0F0', borderRadius: 4, width: '60%' }} />
        <div style={{ height: 18, background: '#E8F5E5', borderRadius: 4, width: '45%', marginTop: 2 }} />
        <div style={{ height: 32, background: '#F0F0F0', borderRadius: 10, marginTop: 4 }} />
      </div>
    </div>
  )
}

// ─── Tela vazia ───────────────────────────────────────────────────────

function EstadoVazio({ query, categoria }: { query: string; categoria: string }) {
  if (!query && !categoria) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 24px' }}>
        <div style={{ fontSize: 56, marginBottom: 12 }}>🔍</div>
        <p style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 16, color: 'var(--foreground)', margin: '0 0 8px' }}>
          Descubra produtos de beleza
        </p>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#A3A3A3', margin: 0 }}>
          Busque por nome, marca ou categoria.<br />
          Compare preços e salve na sua wishlist.
        </p>
      </div>
    )
  }
  return (
    <div style={{ textAlign: 'center', padding: '48px 24px' }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>🤷</div>
      <p style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 15, color: 'var(--foreground)', margin: '0 0 8px' }}>
        Nenhum produto encontrado
      </p>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#A3A3A3', margin: 0 }}>
        Tente outros termos ou categoria
      </p>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────

export default function DescobrirPage() {
  const supabase = createClient()
  const [query, setQuery] = useState('')
  const [categoria, setCategoria] = useState('')
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [carregando, setCarregando] = useState(false)
  const [buscouUmaVez, setBuscouUmaVez] = useState(false)
  const [erroApi, setErroApi] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const buscar = useCallback(async (q: string, cat: string) => {
    if (!q.trim() && !cat) {
      setProdutos([])
      setBuscouUmaVez(false)
      setErroApi(null)
      return
    }
    setCarregando(true)
    setBuscouUmaVez(true)
    setErroApi(null)
    try {
      // Enriquece a query com termos da categoria (melhor relevância)
      const termoCat = cat ? CATEGORIA_ML_QUERY[cat] ?? cat : ''
      const queryFinal = [termoCat, q.trim()].filter(Boolean).join(' ')
      const res = await fetch(`/api/armario/buscar-ml?q=${encodeURIComponent(queryFinal)}&limit=12`)
      if (!res.ok) throw new Error(`status ${res.status}`)
      const data = await res.json()
      const resultados: Produto[] = (data.produtos ?? []).map((p: Produto) => ({
        ...p,
        provider: 'mercadolivre',
      }))
      setProdutos(resultados)
    } catch {
      setErroApi('Não foi possível buscar produtos. Tente novamente.')
      setProdutos([])
    } finally {
      setCarregando(false)
    }
  }, [])

  // Debounce query
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => buscar(query, categoria), 400)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [query, categoria, buscar])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  async function handleSalvarWishlist(produto: Produto) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { showToast('Faça login para salvar na wishlist'); return }

    const { error } = await supabase.from('wishlist_produtos').insert({
      usuario_id: user.id,
      nome: produto.titulo,
      marca: produto.vendedor ?? null,
      preco_estimado: produto.preco,
      link_compra: produto.permalink,
      foto_url: produto.thumbnail || null,
      status: 'quero',
      prioridade: 'media',
      ml_produto_id: produto.id,
      ml_deeplink: produto.deeplink,
    })

    if (error) {
      console.error('[descobrir] erro ao salvar wishlist:', error)
      showToast('Erro ao salvar. Tente novamente.')
    } else {
      showToast('💚 Salvo na wishlist!')
    }
  }

  return (
    <PageTransition>
      <AppHeader />
      <PageContainer>
        <div style={{ paddingTop: 8, paddingBottom: 80 }}>

          {/* Hero */}
          <div style={{ marginBottom: 16 }}>
            <p style={{
              fontFamily: 'var(--font-body)', fontSize: 22, fontWeight: 800,
              color: 'var(--foreground)', margin: '0 0 2px',
              letterSpacing: '-0.01em',
            }}>
              Descobrir ✨
            </p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#A3A3A3', margin: 0 }}>
              Explore produtos, compare preços e salve na wishlist
            </p>
          </div>

          {/* Barra de busca */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: '#fff',
            border: '1.5px solid #E8E8E8',
            borderRadius: 14, padding: '10px 14px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            marginBottom: 14,
          }}>
            <Search size={16} color="#A3A3A3" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Protetor solar, sérum vitamina C..."
              style={{
                flex: 1, border: 'none', outline: 'none', background: 'transparent',
                fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--foreground)',
              }}
            />
            {query && (
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={() => { setQuery(''); inputRef.current?.focus() }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex' }}
              >
                <X size={14} color="#A3A3A3" />
              </motion.button>
            )}
          </div>

          {/* Pills de categoria */}
          <div style={{
            display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4,
            scrollbarWidth: 'none', marginBottom: 18,
          }}>
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => setCategoria('')}
              style={{
                flexShrink: 0, padding: '6px 14px', borderRadius: 20,
                border: !categoria ? '1.5px solid #1B5E5A' : '1.5px solid #E8E8E8',
                background: !categoria ? 'rgba(27,94,90,0.08)' : '#fff',
                color: !categoria ? '#1B5E5A' : '#767676',
                fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600,
                cursor: 'pointer', whiteSpace: 'nowrap',
              }}
            >
              Todos
            </motion.button>
            {CATEGORIAS_BELEZA.map(cat => (
              <motion.button
                key={cat.value}
                whileTap={{ scale: 0.92 }}
                onClick={() => setCategoria(categoria === cat.value ? '' : cat.value)}
                style={{
                  flexShrink: 0, padding: '6px 14px', borderRadius: 20,
                  border: categoria === cat.value ? '1.5px solid #1B5E5A' : '1.5px solid #E8E8E8',
                  background: categoria === cat.value ? 'rgba(27,94,90,0.08)' : '#fff',
                  color: categoria === cat.value ? '#1B5E5A' : '#767676',
                  fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600,
                  cursor: 'pointer', whiteSpace: 'nowrap',
                }}
              >
                {cat.emoji} {cat.label}
              </motion.button>
            ))}
          </div>

          {/* Grid de produtos */}
          {carregando ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : erroApi ? (
            <div style={{
              background: 'rgba(239,68,68,0.06)', border: '1.5px solid rgba(239,68,68,0.18)',
              borderRadius: 16, padding: '20px 18px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>⚠️</div>
              <p style={{ margin: '0 0 6px', fontSize: 13, fontWeight: 700, color: '#EF4444', fontFamily: 'var(--font-body)' }}>
                Não foi possível buscar
              </p>
              <p style={{ margin: 0, fontSize: 12, color: '#767676', fontFamily: 'var(--font-body)', lineHeight: 1.5 }}>
                {erroApi}
              </p>
            </div>
          ) : produtos.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {produtos.map(p => (
                <ProdutoCard
                  key={`${p.provider}-${p.id}`}
                  produto={p}
                  onSalvarWishlist={handleSalvarWishlist}
                />
              ))}
            </div>
          ) : (
            <EstadoVazio query={query} categoria={categoria} />
          )}

          {/* Banner multi-provider (futuro) */}
          {!carregando && produtos.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              style={{
                marginTop: 20,
                background: 'linear-gradient(135deg, rgba(168,197,204,0.15), rgba(27,94,90,0.08))',
                borderRadius: 16, padding: '14px 16px',
                border: '1.5px solid rgba(27,94,90,0.10)',
                display: 'flex', alignItems: 'center', gap: 12,
              }}
            >
              <Sparkles size={20} color="#1B5E5A" />
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#1B5E5A', fontFamily: 'var(--font-body)' }}>
                  Em breve: mais plataformas
                </p>
                <p style={{ margin: '2px 0 0', fontSize: 11, color: '#5A95A3', fontFamily: 'var(--font-body)' }}>
                  Shopee, Magalu e Amazon · Compare o melhor preço
                </p>
              </div>
              <ChevronRight size={14} color="#5A95A3" />
            </motion.div>
          )}
        </div>
      </PageContainer>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 20, x: '-50%' }}
            style={{
              position: 'fixed', bottom: 90, left: '50%',
              background: '#1B5E5A', color: '#fff',
              padding: '10px 20px', borderRadius: 20,
              fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600,
              boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
              zIndex: 9999, whiteSpace: 'nowrap',
            }}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </PageTransition>
  )
}
