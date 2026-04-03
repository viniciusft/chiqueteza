'use client'

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import Button from '@/components/ui/Button'
import { Sparkles, CalendarDays, Users, Camera } from 'lucide-react'

// ─── Feature card inline ──────────────────────────────────────────────
function FeatureItem({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3">
      <div
        className="flex-shrink-0 flex items-center justify-center rounded-xl"
        style={{ width: 44, height: 44, background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)' }}
      >
        {icon}
      </div>
      <div>
        <p style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14, color: '#fff', margin: 0 }}>{title}</p>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(255,255,255,0.72)', margin: 0, lineHeight: 1.4 }}>{desc}</p>
      </div>
    </div>
  )
}

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen" style={{ background: '#FFFBFC', maxWidth: 430, margin: '0 auto' }}>

      {/* ─── Hero ──────────────────────────────────────────────────── */}
      <div
        className="relative flex flex-col px-6 pt-14 pb-10 overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, #FF3366 0%, #C41A4A 50%, #8B1035 100%)',
          minHeight: 480,
        }}
      >
        {/* Círculos decorativos de fundo */}
        <div style={{
          position: 'absolute', top: -80, right: -60, width: 260, height: 260,
          borderRadius: '50%', background: 'rgba(255,255,255,0.06)',
        }} />
        <div style={{
          position: 'absolute', bottom: -40, left: -40, width: 180, height: 180,
          borderRadius: '50%', background: 'rgba(255,255,255,0.04)',
        }} />
        <div style={{
          position: 'absolute', top: 120, right: 20, width: 100, height: 100,
          borderRadius: '50%', background: 'rgba(212,168,67,0.15)',
        }} />

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center gap-2 mb-12"
        >
          <div
            className="flex items-center justify-center text-white font-extrabold"
            style={{
              width: 36, height: 36, borderRadius: 11,
              background: 'rgba(255,255,255,0.22)',
              fontSize: 18, fontFamily: 'var(--font-display)',
              backdropFilter: 'blur(8px)',
            }}
          >
            C
          </div>
          <span style={{
            color: '#fff', fontSize: 20, fontFamily: 'var(--font-display)',
            fontWeight: 700, letterSpacing: '-0.01em',
          }}>
            Chiqueteza
          </span>
        </motion.div>

        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          className="flex flex-col gap-3 mb-8"
        >
          {/* Ícone dourado */}
          <motion.span
            animate={{ rotate: [0, 15, -10, 15, 0], scale: [1, 1.1, 1] }}
            transition={{ duration: 3, repeat: Infinity, repeatDelay: 4 }}
            style={{ fontSize: 48, lineHeight: 1, display: 'block' }}
          >
            ✦
          </motion.span>

          <h1 style={{
            fontFamily: 'var(--font-display)', fontWeight: 700,
            fontSize: 34, color: '#fff', lineHeight: 1.15, margin: 0,
          }}>
            Seu assistente<br />
            <span style={{ color: '#F9D56E' }}>pessoal de beleza</span>
          </h1>

          <p style={{
            fontFamily: 'var(--font-body)', fontSize: 15,
            color: 'rgba(255,255,255,0.80)', margin: 0, lineHeight: 1.5,
          }}>
            Try-on virtual, visagismo com IA e organize toda a sua rotina de beleza.
          </p>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.25 }}
          className="flex flex-col gap-4"
        >
          <FeatureItem
            icon={<Sparkles size={20} color="#F9D56E" />}
            title="Visagismo com IA"
            desc="Análise facial, colorimetria e paleta personalizada"
          />
          <FeatureItem
            icon={<Camera size={20} color="#fff" />}
            title="Try-On Virtual"
            desc="Experimente maquiagens antes de comprar"
          />
          <FeatureItem
            icon={<CalendarDays size={20} color="#fff" />}
            title="Rotina Organizada"
            desc="Agendamentos, alertas e histórico de serviços"
          />
          <FeatureItem
            icon={<Users size={20} color="#fff" />}
            title="Caderneta de Profissionais"
            desc="Salve suas favoritas com fotos e avaliações"
          />
        </motion.div>
      </div>

      {/* ─── Pill decorativo ──────────────────────────────────────── */}
      <div style={{
        height: 6, margin: '0 auto', width: 48,
        background: 'linear-gradient(90deg, #FF3366, #F472A0)',
        borderRadius: 3, marginTop: -3, position: 'relative', zIndex: 1,
      }} />

      {/* ─── CTA section ──────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1], delay: 0.35 }}
        className="flex flex-col gap-4 px-6 py-8 flex-1 justify-between"
      >
        <div className="flex flex-col gap-3">
          {/* Prova social */}
          <div className="flex items-center justify-center gap-2 py-3 rounded-2xl"
            style={{ background: 'rgba(255,51,102,0.06)', border: '1.5px solid rgba(255,51,102,0.12)' }}>
            <span style={{ fontSize: 18 }}>💄</span>
            <p style={{
              fontFamily: 'var(--font-body)', fontSize: 13,
              color: 'var(--foreground-muted)', margin: 0,
            }}>
              <strong style={{ color: 'var(--color-primary)' }}>Grátis para sempre</strong>
              {' '}— sem cartão de crédito
            </p>
          </div>

          <Link href="/cadastro" className="block">
            <Button variant="primary" fullWidth size="lg">
              Criar conta grátis
            </Button>
          </Link>

          <Link href="/login" className="block">
            <Button variant="outline" fullWidth size="lg">
              Já tenho conta
            </Button>
          </Link>
        </div>

        <p style={{
          fontFamily: 'var(--font-body)', fontSize: 12,
          color: 'var(--foreground-muted)', textAlign: 'center', margin: 0,
        }}>
          Ao criar sua conta você concorda com os{' '}
          <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Termos de Uso</span>
          {' '}e a{' '}
          <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Política de Privacidade</span>
        </p>
      </motion.div>

    </div>
  )
}
