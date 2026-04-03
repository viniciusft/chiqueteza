'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import AppHeader from '@/components/ui/AppHeader'
import PageContainer from '@/components/ui/PageContainer'

interface Geracao {
  id: string
  foto_original_url: string
  foto_gerada_url: string
  batom_nome: string | null
  batom_hex: string | null
  sombra_nome: string | null
  blush_nome: string | null
  delineado: string | null
  corte_cabelo: string | null
  estilo_roupa: string | null
  status: string
}

function SliderComparacao({ original, gerada }: { original: string; gerada: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState(50) // percentage
  const dragging = useRef(false)

  function calcPos(clientX: number) {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const p = ((clientX - rect.left) / rect.width) * 100
    setPos(Math.max(2, Math.min(98, p)))
  }

  function onMouseDown(e: React.MouseEvent) {
    dragging.current = true
    e.preventDefault()
  }
  function onMouseMove(e: React.MouseEvent) {
    if (dragging.current) calcPos(e.clientX)
  }
  function onMouseUp() { dragging.current = false }

  function onTouchStart() { dragging.current = true }
  function onTouchMove(e: React.TouchEvent) {
    if (dragging.current) calcPos(e.touches[0].clientX)
  }
  function onTouchEnd() { dragging.current = false }

  return (
    <div
      ref={containerRef}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      style={{
        position: 'relative', width: '100%', aspectRatio: '3/4',
        borderRadius: 20, overflow: 'hidden', userSelect: 'none',
        cursor: 'ew-resize',
      }}
    >
      {/* Imagem gerada (fundo) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={gerada}
        alt="Após"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        draggable={false}
      />

      {/* Imagem original (clip left) */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', width: `${pos}%` }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={original}
          alt="Antes"
          style={{ position: 'absolute', top: 0, left: 0, width: containerRef.current?.offsetWidth ?? '100%', height: '100%', objectFit: 'cover' }}
          draggable={false}
        />
      </div>

      {/* Labels */}
      <div style={{ position: 'absolute', top: 12, left: 12, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 6, padding: '3px 8px' }}>
        <span style={{ fontSize: 11, color: '#fff', fontWeight: 600 }}>ANTES</span>
      </div>
      <div style={{ position: 'absolute', top: 12, right: 12, backgroundColor: 'rgba(27,94,90,0.85)', borderRadius: 6, padding: '3px 8px' }}>
        <span style={{ fontSize: 11, color: '#fff', fontWeight: 600 }}>DEPOIS</span>
      </div>

      {/* Divisor */}
      <div
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
        style={{
          position: 'absolute', top: 0, bottom: 0,
          left: `${pos}%`, transform: 'translateX(-50%)',
          width: 3, backgroundColor: '#fff', cursor: 'ew-resize',
          boxShadow: '0 0 8px rgba(0,0,0,0.3)',
        }}
      >
        {/* Handle */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 36, height: 36, borderRadius: '50%',
          backgroundColor: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: 14, color: '#1B5E5A', fontWeight: 700, letterSpacing: -2 }}>‹›</span>
        </div>
      </div>
    </div>
  )
}

export default function ResultadoImagemPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string

  const [geracao, setGeracao] = useState<Geracao | null>(null)
  const [erro, setErro] = useState('')
  const [compartilhado, setCompartilhado] = useState(false)

  useEffect(() => {
    if (!id) return
    fetch(`/api/visagismo/geracao/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.geracao) setGeracao(data.geracao)
        else setErro('Geração não encontrada.')
      })
      .catch(() => setErro('Erro ao carregar resultado.'))
  }, [id])

  async function handleCompartilhar() {
    if (!geracao?.foto_gerada_url) return
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Meu look personalizado — Chiqueteza',
          url: geracao.foto_gerada_url,
        })
      } else {
        await navigator.clipboard.writeText(geracao.foto_gerada_url)
        setCompartilhado(true)
        setTimeout(() => setCompartilhado(false), 2500)
      }
    } catch { /* ignore cancel */ }
  }

  const aplicados: string[] = []
  if (geracao?.batom_nome) aplicados.push(`💄 Batom: ${geracao.batom_nome}`)
  if (geracao?.sombra_nome) aplicados.push(`👁️ Sombra: ${geracao.sombra_nome}`)
  if (geracao?.blush_nome) aplicados.push(`🌸 Blush: ${geracao.blush_nome}`)
  if (geracao?.delineado) aplicados.push(`✏️ Delineado: ${geracao.delineado}`)
  if (geracao?.corte_cabelo) aplicados.push(`✂️ Corte: ${geracao.corte_cabelo}`)
  if (geracao?.estilo_roupa) aplicados.push(`👗 Estilo: ${geracao.estilo_roupa}`)

  if (!geracao && !erro) {
    return (
      <PageContainer>
        <AppHeader />
        <main className="flex items-center justify-center" style={{ minHeight: 300 }}>
          <div style={{
            width: 36, height: 36, border: '3px solid #1B5E5A',
            borderTopColor: 'transparent', borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </main>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <AppHeader />
      <main className="flex flex-col px-5 py-6 gap-6 pb-10">

        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-gray-400 text-xl">←</button>
          <h1 className="font-extrabold tracking-tight" style={{ fontSize: 22, color: '#171717' }}>
            Seu look
          </h1>
        </div>

        {erro && (
          <div style={{ backgroundColor: '#fff5f5', borderRadius: 12, padding: '14px', border: '1.5px solid #fca5a5' }}>
            <p style={{ fontSize: 14, color: '#dc2626' }}>{erro}</p>
          </div>
        )}

        {geracao?.foto_original_url && geracao?.foto_gerada_url && (
          <SliderComparacao
            original={geracao.foto_original_url}
            gerada={geracao.foto_gerada_url}
          />
        )}

        <p style={{ fontSize: 12, color: '#767676', textAlign: 'center' }}>
          ← Arraste para comparar antes e depois →
        </p>

        {/* O que foi aplicado */}
        {aplicados.length > 0 && (
          <div style={{
            backgroundColor: '#fff', borderRadius: 16, padding: '16px',
            border: '1.5px solid #E8E8E8',
          }}>
            <p style={{ fontWeight: 700, fontSize: 13, color: '#1B5E5A', marginBottom: 10 }}>
              ✦ Look aplicado
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {aplicados.map((item) => (
                <p key={item} style={{ fontSize: 14, color: '#555' }}>{item}</p>
              ))}
            </div>
          </div>
        )}

        {/* Botão salvar visual */}
        <div style={{
          backgroundColor: '#E8F5F4', borderRadius: 14, padding: '14px 16px',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ fontSize: 20 }}>✅</span>
          <p style={{ fontSize: 14, color: '#1B5E5A', fontWeight: 600 }}>
            Salvo no seu histórico automaticamente
          </p>
        </div>

        {/* Ações */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Link
            href="/app/visagismo/gerar"
            style={{
              display: 'block', width: '100%', padding: '14px',
              borderRadius: 14, border: '1.5px solid #1B5E5A',
              color: '#1B5E5A', fontSize: 15, fontWeight: 700,
              textAlign: 'center', textDecoration: 'none', backgroundColor: '#fff',
            }}
          >
            Tentar outro look
          </Link>

          <button
            onClick={handleCompartilhar}
            style={{
              width: '100%', padding: '14px', borderRadius: 14, border: 'none',
              backgroundColor: '#1B5E5A', color: '#fff', fontSize: 15, fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {compartilhado ? '✓ Link copiado!' : 'Compartilhar'}
          </button>
        </div>

      </main>
    </PageContainer>
  )
}
