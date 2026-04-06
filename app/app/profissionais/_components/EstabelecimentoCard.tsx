'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, Phone, Star, Navigation, Globe, BookmarkPlus, X, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export interface Estabelecimento {
  id: string
  nome: string
  categoria: string | null
  endereco: string | null
  telefone: string | null
  avaliacao_google: number | null
  total_avaliacoes: number | null
  foto_url: string | null
  distancia_metros: number
  place_id: string | null
  website: string | null
  latitude: number | null
  longitude: number | null
}

const CATEGORIA_LABELS: Record<string, string> = {
  beauty_salon: 'Salão de beleza',
  hair_care: 'Cabeleireiro',
  nail_salon: 'Manicure',
  spa: 'Spa',
  hair_removal: 'Depilação',
  skin_care_clinic: 'Clínica de estética',
}

const ESPECIALIDADES_SUGERIDAS: Record<string, string[]> = {
  beauty_salon: ['Salão de beleza', 'Maquiagem', 'Design de sobrancelha'],
  hair_care: ['Cabelo', 'Coloração', 'Tratamento capilar'],
  nail_salon: ['Manicure', 'Pedicure', 'Unhas em gel'],
  spa: ['Spa', 'Massagem', 'Relaxamento'],
  hair_removal: ['Depilação', 'Laser'],
  skin_care_clinic: ['Estética', 'Skincare', 'Limpeza de pele'],
}

function formatarDistancia(metros: number): string {
  if (metros < 1000) return `${Math.round(metros)}m`
  return `${(metros / 1000).toFixed(1).replace('.', ',')}km`
}

function badgeDistancia(metros: number): { color: string; bg: string } {
  if (metros < 500) return { color: '#15803d', bg: 'rgba(21,128,61,0.09)' }
  if (metros < 2000) return { color: '#b45309', bg: 'rgba(180,83,9,0.09)' }
  return { color: '#b91c1c', bg: 'rgba(185,28,28,0.08)' }
}

function iniciais(nome: string): string {
  return nome
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()
}

function Estrelas({ valor, total }: { valor: number; total: number | null }) {
  const cheias = Math.floor(valor)
  const meia = valor - cheias >= 0.5
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          size={11}
          fill={i < cheias || (i === cheias && meia) ? '#D4A843' : 'none'}
          color={i < cheias || (i === cheias && meia) ? '#D4A843' : '#D4D4D4'}
          strokeWidth={1.5}
        />
      ))}
      <span style={{ fontSize: 11, fontWeight: 600, color: '#525252', marginLeft: 2 }}>
        {valor.toFixed(1)}
      </span>
      {total && (
        <span style={{ fontSize: 11, color: '#A3A3A3' }}>({total.toLocaleString('pt-BR')})</span>
      )}
    </div>
  )
}

// ─── Bottom Sheet "Salvar na caderneta" ──────────────────────────────

function SalvarSheet({
  est,
  userId,
  onClose,
}: {
  est: Estabelecimento
  userId: string
  onClose: () => void
}) {
  const supabase = createClient()
  const sugestoesIniciais = est.categoria
    ? (ESPECIALIDADES_SUGERIDAS[est.categoria] ?? []).slice(0, 2)
    : []

  const [nome, setNome] = useState(est.nome)
  const [telefone, setTelefone] = useState(est.telefone ?? '')
  const [especialidades, setEspecialidades] = useState<string[]>(sugestoesIniciais)
  const [salvando, setSalvando] = useState(false)

  const todasEspecialidades = est.categoria
    ? (ESPECIALIDADES_SUGERIDAS[est.categoria] ?? [])
    : []

  function toggleEspecialidade(esp: string) {
    setEspecialidades((prev) =>
      prev.includes(esp) ? prev.filter((e) => e !== esp) : [...prev, esp]
    )
  }

  async function salvar() {
    if (!nome.trim()) return
    setSalvando(true)
    try {
      const { error } = await supabase.from('profissionais').insert({
        usuario_id: userId,
        nome: nome.trim(),
        especialidades,
        telefone: telefone.trim() || null,
        observacoes: 'Encontrado via busca de salões próximos',
        ativo: true,
      })
      if (error) throw error
      toast.success(`${nome.trim()} adicionado à sua caderneta!`)
      onClose()
    } catch {
      toast.error('Não foi possível salvar. Tente novamente.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        key="overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 50,
          background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(2px)',
        }}
      />
      <motion.div
        key="sheet"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 380, damping: 38 }}
        style={{
          position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
          width: '100%', maxWidth: 430, zIndex: 51,
          background: '#fff', borderRadius: '22px 22px 0 0',
          padding: '20px 20px 40px',
          boxShadow: '0 -8px 32px rgba(0,0,0,0.12)',
        }}
      >
        {/* Handle */}
        <div style={{ width: 40, height: 4, borderRadius: 2, background: '#E8E8E8', margin: '0 auto 20px' }} />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <p style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#171717', fontFamily: 'var(--font-body)' }}>
              Salvar na caderneta
            </p>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: '#A3A3A3', fontFamily: 'var(--font-body)' }}>
              Confirme as informações antes de salvar
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ width: 32, height: 32, borderRadius: 10, border: 'none', background: '#F5F5F5', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <X size={16} color="#767676" />
          </button>
        </div>

        {/* Campo: Nome */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: '#525252', fontFamily: 'var(--font-body)', display: 'block', marginBottom: 6 }}>
            Nome
          </label>
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            style={{
              width: '100%', padding: '11px 14px', borderRadius: 12,
              border: '1.5px solid #E8E8E8', fontSize: 14, fontFamily: 'var(--font-body)',
              color: '#171717', background: '#FAFAFA', outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Campo: Telefone */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: '#525252', fontFamily: 'var(--font-body)', display: 'block', marginBottom: 6 }}>
            Telefone
          </label>
          <input
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
            placeholder="(11) 9 9999-9999"
            style={{
              width: '100%', padding: '11px 14px', borderRadius: 12,
              border: '1.5px solid #E8E8E8', fontSize: 14, fontFamily: 'var(--font-body)',
              color: '#171717', background: '#FAFAFA', outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Especialidades */}
        {todasEspecialidades.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#525252', fontFamily: 'var(--font-body)', display: 'block', marginBottom: 8 }}>
              Especialidades
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {todasEspecialidades.map((esp) => {
                const ativo = especialidades.includes(esp)
                return (
                  <button
                    key={esp}
                    onClick={() => toggleEspecialidade(esp)}
                    style={{
                      padding: '7px 14px', borderRadius: 20,
                      border: '1.5px solid',
                      borderColor: ativo ? 'var(--color-primary)' : '#E8E8E8',
                      background: ativo ? 'rgba(255,51,102,0.06)' : '#fff',
                      color: ativo ? 'var(--color-primary)' : '#666',
                      fontSize: 13, fontWeight: ativo ? 700 : 500,
                      cursor: 'pointer', fontFamily: 'var(--font-body)',
                      display: 'flex', alignItems: 'center', gap: 5,
                    }}
                  >
                    {ativo && <Check size={12} />}
                    {esp}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Botão salvar */}
        <button
          onClick={salvando ? undefined : salvar}
          disabled={salvando || !nome.trim()}
          style={{
            width: '100%', padding: '14px',
            borderRadius: 14, border: 'none',
            background: nome.trim() ? 'linear-gradient(135deg, #FF3366, #F472A0)' : '#E8E8E8',
            color: nome.trim() ? '#fff' : '#A3A3A3',
            fontSize: 15, fontWeight: 700, cursor: nome.trim() ? 'pointer' : 'default',
            fontFamily: 'var(--font-body)',
          }}
        >
          {salvando ? 'Salvando...' : 'Salvar na caderneta'}
        </button>
      </motion.div>
    </AnimatePresence>
  )
}

// ─── Card principal ───────────────────────────────────────────────────

export default function EstabelecimentoCard({
  est,
  userId,
}: {
  est: Estabelecimento
  userId: string | null
}) {
  const [sheetAberta, setSheetAberta] = useState(false)

  const dist = formatarDistancia(est.distancia_metros)
  const badge = badgeDistancia(est.distancia_metros)
  const categoriaLabel = est.categoria ? (CATEGORIA_LABELS[est.categoria] ?? est.categoria) : null

  const waNumero = est.telefone?.replace(/\D/g, '')
  const mapsUrl =
    est.latitude && est.longitude
      ? `https://www.google.com/maps/dir/?api=1&destination=${est.latitude},${est.longitude}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(est.nome + ' ' + (est.endereco ?? ''))}`

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 12,
          padding: '14px 16px',
          backgroundColor: '#fff',
          borderRadius: 16,
          border: '1.5px solid #F0F0F0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        }}
      >
        {/* Avatar */}
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            background: 'linear-gradient(135deg, rgba(255,51,102,0.12), rgba(255,51,102,0.06))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: 16,
            color: 'var(--color-primary)',
          }}
        >
          {iniciais(est.nome)}
        </div>

        {/* Conteúdo */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
            <p style={{
              fontFamily: 'var(--font-body)', fontWeight: 700,
              fontSize: 14, color: '#171717', margin: 0,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {est.nome}
            </p>
            {/* Badge distância */}
            <span style={{
              flexShrink: 0,
              display: 'inline-flex', alignItems: 'center', gap: 3,
              fontSize: 11, fontWeight: 700,
              color: badge.color, background: badge.bg,
              borderRadius: 20, padding: '2px 8px',
            }}>
              <MapPin size={9} />
              {dist}
            </span>
          </div>

          {categoriaLabel && (
            <p style={{ fontSize: 12, color: '#767676', margin: '2px 0 0', fontFamily: 'var(--font-body)' }}>
              {categoriaLabel}
            </p>
          )}

          {est.avaliacao_google !== null && (
            <div style={{ marginTop: 5 }}>
              <Estrelas valor={est.avaliacao_google} total={est.total_avaliacoes} />
            </div>
          )}

          {est.endereco && (
            <p style={{
              fontSize: 11, color: '#A3A3A3', margin: '4px 0 0',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {est.endereco}
            </p>
          )}

          {/* Ações */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10 }}>
            {/* Salvar na caderneta */}
            {userId && (
              <button
                onClick={() => setSheetAberta(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '5px 12px', borderRadius: 20,
                  border: '1.5px solid rgba(255,51,102,0.3)',
                  background: 'rgba(255,51,102,0.05)',
                  color: 'var(--color-primary)',
                  fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  fontFamily: 'var(--font-body)',
                }}
              >
                <BookmarkPlus size={13} />
                Salvar
              </button>
            )}

            <div style={{ flex: 1 }} />

            {/* Navegar */}
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                width: 32, height: 32, borderRadius: 10,
                background: 'rgba(27,94,90,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                textDecoration: 'none',
              }}
              title="Abrir no Maps"
            >
              <Navigation size={15} color="#1B5E5A" />
            </a>

            {/* WhatsApp */}
            {waNumero && (
              <a
                href={`https://wa.me/${waNumero}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  width: 32, height: 32, borderRadius: 10,
                  background: '#25D366',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  textDecoration: 'none',
                }}
                title="WhatsApp"
              >
                <Phone size={15} color="#fff" />
              </a>
            )}

            {/* Website */}
            {est.website && (
              <a
                href={est.website}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  width: 32, height: 32, borderRadius: 10,
                  background: 'rgba(255,51,102,0.08)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  textDecoration: 'none',
                }}
                title="Site"
              >
                <Globe size={15} color="var(--color-primary)" />
              </a>
            )}
          </div>
        </div>
      </motion.div>

      {/* Bottom sheet salvar */}
      {sheetAberta && userId && (
        <SalvarSheet
          est={est}
          userId={userId}
          onClose={() => setSheetAberta(false)}
        />
      )}
    </>
  )
}
