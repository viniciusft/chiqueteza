'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import AppHeader from '@/components/ui/AppHeader'
import PageContainer from '@/components/ui/PageContainer'
import EmptyState from '@/components/ui/EmptyState'
import BottomSheet from '@/components/ui/BottomSheet'
import { ProdutoCard } from './_components/ProdutoCard'
import { FormAdicionarProduto } from './_components/FormAdicionarProduto'
import { AvaliacaoSheet } from './_components/AvaliacaoSheet'
import { AlertaRotatividade } from './_components/AlertaRotatividade'
import type { ArmarioProduto } from './_types'
import { FREQUENCIA_CONFIG } from './_types'

function hojeStr() {
  return new Date().toISOString().split('T')[0]
}

function ordenarPorUrgencia(lista: ArmarioProduto[]): ArmarioProduto[] {
  const hoje = hojeStr()
  return [...lista].sort((a, b) => {
    const aAcabando = a.status === 'acabando' ? 0 : 1
    const bAcabando = b.status === 'acabando' ? 0 : 1
    if (aAcabando !== bAcabando) return aAcabando - bAcabando
    const aUsouHoje = a.ultimo_uso_em === hoje ? 1 : 0
    const bUsouHoje = b.ultimo_uso_em === hoje ? 1 : 0
    if (aUsouHoje !== bUsouHoje) return aUsouHoje - bUsouHoje
    if (!a.ultimo_uso_em && b.ultimo_uso_em) return -1
    if (a.ultimo_uso_em && !b.ultimo_uso_em) return 1
    if (a.ultimo_uso_em && b.ultimo_uso_em && a.ultimo_uso_em !== b.ultimo_uso_em)
      return a.ultimo_uso_em.localeCompare(b.ultimo_uso_em)
    const freqOrdem: Record<string, number> = { diaria: 0, semanal: 1, mensal: 2, raramente: 3 }
    return freqOrdem[a.frequencia_uso] - freqOrdem[b.frequencia_uso]
  })
}

function ArmarioContent({
  userId,
  prefill,
}: {
  userId: string
  prefill?: { nome: string; marca: string; categoria: string; foto_url: string; wishlist_id: string }
}) {
  const supabase = createClient()
  const [aba, setAba] = useState<'em_uso' | 'acabando' | 'todos' | 'finalizados'>('em_uso')
  const [produtos, setProdutos] = useState<ArmarioProduto[]>([])
  const [carregando, setCarregando] = useState(true)
  const [sheetAberto, setSheetAberto] = useState(!!prefill)
  const [produtoEditando, setProdutoEditando] = useState<ArmarioProduto | null>(null)
  const [produtoFinalizando, setProdutoFinalizando] = useState<ArmarioProduto | null>(null)

  const carregar = useCallback(async () => {
    const { data } = await supabase
      .from('armario_produtos')
      .select('*')
      .eq('usuario_id', userId)
      .order('created_at', { ascending: false })
    setProdutos(data ?? [])
    setCarregando(false)
  }, [supabase, userId])

  useEffect(() => { carregar() }, [carregar])

  async function handleNivelChange(id: string, nivel: number) {
    setProdutos(prev => prev.map(p => p.id === id ? { ...p, nivel_atual: nivel } : p))
    await supabase.from('armario_produtos').update({ nivel_atual: nivel }).eq('id', id)
  }

  async function handleUsarHoje(id: string) {
    const produto = produtos.find(p => p.id === id)
    if (!produto) return
    const hoje = hojeStr()
    if (produto.ultimo_uso_em === hoje) return
    const dec = Math.max(1, Math.round(100 / FREQUENCIA_CONFIG[produto.frequencia_uso].diasEstimados))
    const novoNivel = Math.max(0, produto.nivel_atual - dec)
    setProdutos(prev => prev.map(p => p.id === id ? { ...p, nivel_atual: novoNivel, ultimo_uso_em: hoje } : p))
    await supabase.from('armario_produtos').update({ nivel_atual: novoNivel, ultimo_uso_em: hoje }).eq('id', id)
    if (novoNivel === 0) {
      setProdutoFinalizando({ ...produto, nivel_atual: 0, ultimo_uso_em: hoje })
    }
  }

  async function handleDelete(id: string) {
    const backup = produtos.find(p => p.id === id)
    setProdutos(prev => prev.filter(p => p.id !== id))
    const { error } = await supabase.from('armario_produtos').delete().eq('id', id)
    if (error) { if (backup) setProdutos(prev => [backup, ...prev]); toast.error('Erro ao remover') }
    else toast.success('Produto removido')
  }

  function handleAbrirAvaliacao(id: string) {
    const produto = produtos.find(p => p.id === id)
    if (produto) setProdutoFinalizando(produto)
  }

  async function handleConfirmarAvaliacao(produtoId: string, avaliacao: number, texto: string) {
    const produto = produtos.find(p => p.id === produtoId)
    if (!produto) return
    const hoje = hojeStr()
    const novosCiclos = produto.ciclos_finalizados + 1
    setProdutos(prev => prev.map(p => p.id === produtoId
      ? { ...p, nivel_atual: 0, status: 'finalizado', avaliacao, avaliacao_texto: texto, data_finalizacao: hoje, ciclos_finalizados: novosCiclos }
      : p
    ))
    await supabase.from('armario_produtos').update({
      nivel_atual: 0,
      status: 'finalizado',
      avaliacao,
      avaliacao_texto: texto || null,
      data_finalizacao: hoje,
      ciclos_finalizados: novosCiclos,
    }).eq('id', produtoId)
  }

  async function handleReativar(id: string) {
    const produto = produtos.find(p => p.id === id)
    if (!produto) return
    const hoje = hojeStr()
    const diasEst = FREQUENCIA_CONFIG[produto.frequencia_uso].diasEstimados
    const dataFim = new Date(Date.now() + diasEst * 86400000).toISOString().split('T')[0]
    setProdutos(prev => prev.map(p => p.id === id
      ? { ...p, nivel_atual: 100, status: 'em_uso', data_finalizacao: null, avaliacao: null, avaliacao_texto: null }
      : p
    ))
    await supabase.from('armario_produtos').update({
      nivel_atual: 100,
      status: 'em_uso',
      data_abertura: hoje,
      data_fim_estimada: dataFim,
      data_finalizacao: null,
      avaliacao: null,
      avaliacao_texto: null,
      ultimo_uso_em: null,
    }).eq('id', id)
    toast.success('Produto reativado! 🔄')
    setAba('em_uso')
  }

  async function handleDesvincularML(id: string) {
    setProdutos(prev => prev.map(p => p.id === id ? { ...p, ml_produto_id: null, ml_preco_atual: null, ml_deeplink: null } : p))
    await supabase.from('armario_produtos').update({ ml_produto_id: null, ml_preco_atual: null, ml_deeplink: null }).eq('id', id)
    toast('Link ML removido')
  }

  const ativos = produtos.filter(p => p.status !== 'finalizado')
  const finalizados = [...produtos.filter(p => p.status === 'finalizado')]
    .sort((a, b) => (b.data_finalizacao ?? '').localeCompare(a.data_finalizacao ?? ''))
  const emUso = ordenarPorUrgencia(ativos.filter(p => p.status === 'em_uso'))
  const acabando = [...ativos.filter(p => p.status === 'acabando')].sort((a, b) => a.nivel_atual - b.nivel_atual)
  const todos = ordenarPorUrgencia(ativos)

  const listaAba = aba === 'em_uso' ? emUso : aba === 'acabando' ? acabando : aba === 'finalizados' ? finalizados : todos

  const sharedCardProps = {
    onNivelChange: handleNivelChange,
    onDelete: handleDelete,
    onFinalizar: handleAbrirAvaliacao,
    onEditar: (p: ArmarioProduto) => setProdutoEditando(p),
    onUsarHoje: handleUsarHoje,
    onDesvincularML: handleDesvincularML,
  }

  return (
    <>
      <AppHeader />
      <PageContainer>
        <div style={{ padding: '16px 20px 0' }}>
          <h1 className="text-page-title">Armário 🪞</h1>
          <p style={{ margin: '4px 0 16px', fontSize: 13, color: 'var(--foreground-muted)', fontFamily: 'var(--font-body)' }}>
            Seus produtos de beleza
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, background: '#F5F5F5', borderRadius: 14, padding: 4, marginBottom: 16 }}>
          {([
            { id: 'em_uso',      label: 'Em uso' },
            { id: 'acabando',    label: `Acabando${acabando.length > 0 ? ` (${acabando.length})` : ''}` },
            { id: 'todos',       label: 'Todos' },
            { id: 'finalizados', label: `Hist.${finalizados.length > 0 ? ` (${finalizados.length})` : ''}` },
          ] as const).map(tab => (
            <motion.button key={tab.id} whileTap={{ scale: 0.96 }} onClick={() => setAba(tab.id)}
              style={{ flex: 1, padding: '9px 4px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-body)', background: aba === tab.id ? '#fff' : 'transparent', color: aba === tab.id ? (tab.id === 'acabando' ? '#EF4444' : tab.id === 'finalizados' ? '#A3A3A3' : '#1B5E5A') : '#A3A3A3', boxShadow: aba === tab.id ? '0 1px 6px rgba(0,0,0,0.08)' : 'none', transition: 'all 0.18s' }}>
              {tab.label}
            </motion.button>
          ))}
        </div>

        {/* Alerta rotatividade */}
        {(aba === 'em_uso' || aba === 'todos') && !carregando && (
          <AlertaRotatividade produtos={ativos} />
        )}

        {/* Alerta acabando */}
        <AnimatePresence>
          {aba === 'em_uso' && acabando.length > 0 && !carregando && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              onClick={() => setAba('acabando')}
              style={{ background: 'rgba(239,68,68,0.06)', border: '1.5px solid rgba(239,68,68,0.18)', borderRadius: 14, padding: '12px 16px', marginBottom: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#EF4444', fontFamily: 'var(--font-body)' }}>
                  🔴 {acabando.length} produto{acabando.length > 1 ? 's' : ''} acabando
                </p>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#A3A3A3', fontFamily: 'var(--font-body)' }}>Hora de reabastecer</p>
              </div>
              <ChevronDown size={16} color="#EF4444" style={{ transform: 'rotate(-90deg)' }} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Lista */}
        <AnimatePresence mode="wait">
          <motion.div key={aba} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
            {carregando ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[1, 2, 3].map(i => <div key={i} className="skeleton-shimmer" style={{ height: 120, borderRadius: 16 }} />)}
              </div>
            ) : listaAba.length === 0 ? (
              <EmptyState
                emoji={aba === 'acabando' ? '✅' : aba === 'finalizados' ? '📦' : '🪞'}
                titulo={
                  aba === 'acabando' ? 'Nada acabando!' :
                  aba === 'finalizados' ? 'Nenhum produto finalizado ainda' :
                  'Armário vazio'
                }
                descricao={
                  aba === 'acabando' ? 'Todos os produtos estão com estoque ok' :
                  aba === 'finalizados' ? 'Quando você finalizar um produto, ele aparece aqui com sua avaliação' :
                  'Adicione seus produtos de beleza para acompanhar o uso'
                }
                acao={aba === 'em_uso' || aba === 'todos' ? (
                  <motion.button whileTap={{ scale: 0.96 }} onClick={() => setSheetAberto(true)}
                    style={{ padding: '12px 28px', borderRadius: 14, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #1B5E5A, #0D3533)', color: '#fff', fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-body)' }}>
                    Adicionar produto
                  </motion.button>
                ) : undefined}
              />
            ) : (
              <div>
                {listaAba.map(p => (
                  <ProdutoCard
                    key={p.id}
                    produto={p}
                    {...sharedCardProps}
                    onReativar={aba === 'finalizados' ? handleReativar : undefined}
                    modoFinalizado={aba === 'finalizados'}
                  />
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div style={{ height: 96 }} />
      </PageContainer>

      {/* FAB */}
      <motion.button whileTap={{ scale: 0.93 }} onClick={() => setSheetAberto(true)}
        style={{ position: 'fixed', bottom: 88, right: 20, width: 52, height: 52, background: 'linear-gradient(135deg, #1B5E5A, #0D3533)', borderRadius: '50%', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(27,94,90,0.35)', zIndex: 30 }}>
        <Plus size={24} color="#fff" strokeWidth={2.5} />
      </motion.button>

      {/* Sheet: Adicionar */}
      <BottomSheet isOpen={sheetAberto} onClose={() => setSheetAberto(false)} title="Adicionar ao Armário" maxHeight="92dvh">
        <FormAdicionarProduto userId={userId} onSalvar={carregar} onClose={() => setSheetAberto(false)} prefill={prefill} />
      </BottomSheet>

      {/* Sheet: Editar */}
      <BottomSheet isOpen={!!produtoEditando} onClose={() => setProdutoEditando(null)} title="Editar produto" maxHeight="92dvh">
        {produtoEditando && (
          <FormAdicionarProduto userId={userId} onSalvar={carregar} onClose={() => setProdutoEditando(null)} produtoExistente={produtoEditando} />
        )}
      </BottomSheet>

      {/* Sheet: Avaliação */}
      <AvaliacaoSheet
        produto={produtoFinalizando}
        isOpen={!!produtoFinalizando}
        onClose={() => setProdutoFinalizando(null)}
        onConfirmar={handleConfirmarAvaliacao}
      />

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </>
  )
}

export default function ArmarioPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [userId, setUserId] = useState<string | null>(null)

  const prefill = {
    nome: searchParams.get('nome') ?? '',
    marca: searchParams.get('marca') ?? '',
    categoria: searchParams.get('categoria') ?? '',
    foto_url: searchParams.get('foto_url') ?? '',
    wishlist_id: searchParams.get('wishlist_id') ?? '',
  }
  const veioDaWishlist = !!prefill.nome

  useEffect(() => {
    void (async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)
    })()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (!userId) return (
    <>
      <AppHeader />
      <PageContainer>
        <div style={{ padding: '16px 20px 0', marginBottom: 16 }}>
          <div className="skeleton-shimmer" style={{ height: 32, width: 160, borderRadius: 8 }} />
        </div>
        <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1, 2, 3].map(i => <div key={i} className="skeleton-shimmer" style={{ height: 120, borderRadius: 16 }} />)}
        </div>
      </PageContainer>
    </>
  )

  return <ArmarioContent userId={userId} prefill={veioDaWishlist ? prefill : undefined} />
}
