'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, CalendarDays, Camera, Gem, ArrowRight, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const ONBOARDING_KEY = 'chiqueteza_onboarded_v1'

interface Screen {
  id: number
  icon: React.ReactNode
  title: string
  subtitle: string
  bg: string
  accentBg: string
  features?: { icon: React.ReactNode; label: string; desc: string; color: string }[]
}

const screens: Screen[] = [
  {
    id: 0,
    icon: <Sparkles size={40} color="#fff" />,
    title: 'Bem-vinda ao Chiqueteza',
    subtitle: 'Seu assistente pessoal de beleza, pensado para a mulher brasileira moderna.',
    bg: 'linear-gradient(160deg, #FF3366 0%, #C41A4A 100%)',
    accentBg: 'rgba(255,255,255,0.12)',
    features: undefined,
  },
  {
    id: 1,
    icon: <CalendarDays size={36} color="#FF3366" />,
    title: 'Tudo num só lugar',
    subtitle: 'Organize sua vida de beleza com ferramentas feitas para você.',
    bg: '#FFFBFC',
    accentBg: '#FFF0F3',
    features: [
      {
        icon: <CalendarDays size={22} color="#FF3366" />,
        label: 'Rotina',
        desc: 'Agendamentos e alertas de procedimentos',
        color: 'rgba(255,51,102,0.08)',
      },
      {
        icon: <Camera size={22} color="#1B5E5A" />,
        label: 'Diário de Looks',
        desc: 'Registre e compartilhe seus melhores looks',
        color: 'rgba(27,94,90,0.08)',
      },
      {
        icon: <Gem size={22} color="#D4A843" />,
        label: 'Visagismo',
        desc: 'Análise facial e colorimetria com IA',
        color: 'rgba(212,168,67,0.12)',
      },
    ],
  },
  {
    id: 2,
    icon: <Sparkles size={40} color="#fff" />,
    title: 'Você está pronta!',
    subtitle: 'Comece grátis e descubra o quanto seu estilo pode evoluir.',
    bg: 'linear-gradient(160deg, #FF3366 0%, #C41A4A 100%)',
    accentBg: 'rgba(255,255,255,0.12)',
    features: undefined,
  },
]

const variants = {
  enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir < 0 ? 60 : -60, opacity: 0 }),
}

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [dir, setDir] = useState(1)
  const [nome, setNome] = useState<string>('')

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem(ONBOARDING_KEY)) {
      router.replace('/app')
      return
    }
    void (async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/login'); return }
      const firstName = (user.user_metadata?.nome as string | undefined)?.split(' ')[0]
        ?? user.email?.split('@')[0]
        ?? ''
      setNome(firstName)
    })()
  }, [router])

  function advance() {
    if (step < screens.length - 1) {
      setDir(1)
      setStep((s) => s + 1)
    } else {
      finish()
    }
  }

  function finish() {
    if (typeof window !== 'undefined') localStorage.setItem(ONBOARDING_KEY, '1')
    router.replace('/app')
  }

  const screen = screens[step]
  const isLight = screen.bg === '#FFFBFC'

  return (
    <div
      style={{
        minHeight: '100dvh',
        maxWidth: 430,
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        background: screen.bg,
        transition: 'background 0.4s ease',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Decorative circles */}
      {!isLight && (
        <>
          <div style={{
            position: 'absolute', top: -80, right: -60, width: 240, height: 240,
            borderRadius: '50%', background: screen.accentBg, pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute', bottom: 60, left: -80, width: 200, height: 200,
            borderRadius: '50%', background: screen.accentBg, pointerEvents: 'none',
          }} />
        </>
      )}

      {/* Top bar: dots + skip */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '52px 24px 0',
        position: 'relative', zIndex: 10,
      }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {screens.map((_, i) => (
            <div
              key={i}
              style={{
                height: 4,
                width: i === step ? 24 : 8,
                borderRadius: 4,
                background: isLight
                  ? (i === step ? '#FF3366' : '#E8E8E8')
                  : (i === step ? '#fff' : 'rgba(255,255,255,0.35)'),
                transition: 'width 0.3s ease, background 0.3s ease',
              }}
            />
          ))}
        </div>
        <button
          onClick={finish}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px',
            fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600,
            color: isLight ? '#767676' : 'rgba(255,255,255,0.7)',
          }}
        >
          Pular
        </button>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 24px', position: 'relative', zIndex: 10 }}>
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={step}
            custom={dir}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Screen 0 & 2: hero layout */}
            {!screen.features && (
              <div style={{ textAlign: 'center' }}>
                <motion.div
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1, type: 'spring', stiffness: 260, damping: 20 }}
                  style={{
                    width: 96, height: 96, borderRadius: '50%',
                    background: 'rgba(255,255,255,0.18)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 32px',
                  }}
                >
                  {screen.icon}
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.18, duration: 0.4 }}
                  style={{
                    fontFamily: 'var(--font-display)', fontWeight: 700,
                    fontSize: 30, color: '#fff', lineHeight: 1.2,
                    margin: '0 0 16px',
                  }}
                >
                  {step === 0 && nome ? `Olá, ${nome}! 👋` : screen.title}
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.24, duration: 0.4 }}
                  style={{
                    fontFamily: 'var(--font-body)', fontSize: 16,
                    color: 'rgba(255,255,255,0.82)', lineHeight: 1.6, margin: 0,
                  }}
                >
                  {step === 0 && nome
                    ? 'Seu assistente pessoal de beleza chegou. Feito para a mulher que não para!'
                    : screen.subtitle}
                </motion.p>

                {step === 2 && (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.32, duration: 0.4 }}
                    style={{
                      marginTop: 24,
                      display: 'inline-flex', alignItems: 'center', gap: 8,
                      background: 'rgba(255,255,255,0.15)', borderRadius: 12,
                      padding: '10px 18px',
                    }}
                  >
                    <Sparkles size={16} color="#fff" />
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 700, color: '#fff' }}>
                      Plano Grátis — para sempre
                    </span>
                  </motion.div>
                )}
              </div>
            )}

            {/* Screen 1: features layout */}
            {screen.features && (
              <div>
                <motion.h1
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08, duration: 0.4 }}
                  style={{
                    fontFamily: 'var(--font-display)', fontWeight: 700,
                    fontSize: 28, color: '#171717', lineHeight: 1.2,
                    margin: '0 0 8px',
                  }}
                >
                  {screen.title}
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.14, duration: 0.4 }}
                  style={{
                    fontFamily: 'var(--font-body)', fontSize: 15,
                    color: '#767676', lineHeight: 1.5, margin: '0 0 32px',
                  }}
                >
                  {screen.subtitle}
                </motion.p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {screen.features.map((f, i) => (
                    <motion.div
                      key={f.label}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + i * 0.1, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 16,
                        background: '#fff', borderRadius: 18, padding: '16px 18px',
                        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                      }}
                    >
                      <div style={{
                        width: 48, height: 48, borderRadius: 14,
                        background: f.color, flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {f.icon}
                      </div>
                      <div>
                        <p style={{
                          fontFamily: 'var(--font-body)', fontWeight: 700,
                          fontSize: 15, color: '#171717', margin: '0 0 2px',
                        }}>
                          {f.label}
                        </p>
                        <p style={{
                          fontFamily: 'var(--font-body)', fontSize: 13,
                          color: '#767676', margin: 0, lineHeight: 1.4,
                        }}>
                          {f.desc}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom CTA */}
      <div style={{ padding: '0 24px 48px', position: 'relative', zIndex: 10 }}>
        <motion.button
          onClick={advance}
          whileTap={{ scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          style={{
            width: '100%', padding: '16px',
            borderRadius: 16, border: 'none', cursor: 'pointer',
            background: isLight
              ? 'linear-gradient(135deg, #FF3366, #C41A4A)'
              : '#fff',
            color: isLight ? '#fff' : '#FF3366',
            fontFamily: 'var(--font-body)', fontSize: 16, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            boxShadow: isLight
              ? '0 4px 18px rgba(255,51,102,0.3)'
              : '0 4px 18px rgba(0,0,0,0.12)',
          }}
        >
          {step === screens.length - 1 ? 'Começar agora' : 'Continuar'}
          {step === screens.length - 1
            ? <Sparkles size={18} />
            : <ChevronRight size={18} />}
        </motion.button>
      </div>
    </div>
  )
}
