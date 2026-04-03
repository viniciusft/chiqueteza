'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import Button from '@/components/ui/Button'
import PageContainer from '@/components/ui/PageContainer'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft } from 'lucide-react'

function InputField({
  id, label, type, placeholder, autoComplete, required, value, onChange,
}: {
  id: string; label: string; type: string; placeholder: string;
  autoComplete: string; required?: boolean;
  value: string; onChange: (v: string) => void;
}) {
  const [focused, setFocused] = useState(false)
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-card-title text-sm">{label}</label>
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="w-full font-body text-body placeholder:text-silver-400 transition-all focus:outline-none"
        style={{
          borderRadius: 14,
          border: `1.5px solid ${focused ? 'var(--color-primary)' : 'var(--color-silver)'}`,
          padding: '13px 16px',
          background: focused ? 'rgba(255,51,102,0.02)' : '#fff',
          boxShadow: focused ? '0 0 0 3px rgba(255,51,102,0.08)' : 'none',
          fontSize: 15,
          transition: 'border-color 0.2s, box-shadow 0.2s',
        }}
      />
    </div>
  )
}

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setCarregando(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha })

    if (error) {
      setErro('E-mail ou senha incorretos. Tente novamente.')
      setCarregando(false)
      return
    }

    router.push('/app')
  }

  return (
    <PageContainer>
      {/* Header pink gradient */}
      <div
        className="relative flex flex-col px-6 pt-12 pb-8 overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #FF3366 0%, #C41A4A 100%)' }}
      >
        {/* Círculo decorativo */}
        <div style={{
          position: 'absolute', top: -60, right: -50, width: 200, height: 200,
          borderRadius: '50%', background: 'rgba(255,255,255,0.06)',
        }} />

        {/* Voltar */}
        <Link href="/" className="flex items-center gap-1.5 mb-8 w-fit"
          style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: 14, fontFamily: 'var(--font-body)' }}>
          <ArrowLeft size={16} />
          Voltar
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        >
          <span style={{ fontSize: 36, display: 'block', marginBottom: 8 }}>✦</span>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontWeight: 700,
            fontSize: 28, color: '#fff', lineHeight: 1.2, margin: 0,
          }}>
            Bem-vinda<br />de volta
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'rgba(255,255,255,0.75)', marginTop: 6, marginBottom: 0 }}>
            Entre na sua conta
          </p>
        </motion.div>
      </div>

      {/* Formulário */}
      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
        className="flex flex-col px-6 py-8 gap-5"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

          {erro && (
            <motion.p
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-sm text-red-600 bg-red-50 px-4 py-3"
              style={{ borderRadius: 12, border: '1.5px solid #fecaca' }}
            >
              {erro}
            </motion.p>
          )}

          <InputField
            id="email" label="E-mail" type="email"
            placeholder="seu@email.com" autoComplete="email" required
            value={email} onChange={setEmail}
          />

          <InputField
            id="senha" label="Senha" type="password"
            placeholder="••••••••" autoComplete="current-password" required
            value={senha} onChange={setSenha}
          />

          <div className="pt-1">
            <Button variant="primary" fullWidth type="submit" loading={carregando} size="lg">
              Entrar
            </Button>
          </div>

        </form>

        <div className="flex items-center gap-3">
          <div style={{ flex: 1, height: 1, background: 'var(--color-silver)' }} />
          <span className="text-caption">ou</span>
          <div style={{ flex: 1, height: 1, background: 'var(--color-silver)' }} />
        </div>

        <p className="text-center text-sm" style={{ color: 'var(--foreground-muted)' }}>
          Não tem conta?{' '}
          <Link href="/cadastro" className="font-semibold hover:underline" style={{ color: 'var(--color-primary)' }}>
            Criar conta grátis
          </Link>
        </p>
      </motion.main>
    </PageContainer>
  )
}
