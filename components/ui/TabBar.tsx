'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { Home, Heart, Leaf, CalendarDays, Users } from 'lucide-react'
import { playClick } from '@/lib/sound'

interface Tab {
  label: string
  href: string
  icon: React.ElementType
}

const tabs: Tab[] = [
  { label: 'Início',       href: '/app',               icon: Home },
  { label: 'Looks',        href: '/app/looks',          icon: Heart },
  { label: 'Autocuidado',  href: '/app/autocuidado',    icon: Leaf },
  { label: 'Agenda',       href: '/app/rotina',         icon: CalendarDays },
  { label: 'Profissionais',href: '/app/profissionais',  icon: Users },
]

export default function TabBar() {
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === '/app') return pathname === '/app'
    return pathname.startsWith(href)
  }

  return (
    <nav
      className="glass"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 30,
        borderTop: '1px solid rgba(255,255,255,0.6)',
        boxShadow: '0 -4px 20px rgba(255,51,102,0.06), 0 -1px 0 rgba(0,0,0,0.04)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          display: 'flex',
          width: '100%',
          maxWidth: 430,
          height: 64,
        }}
      >
        {tabs.map((tab) => {
          const active = isActive(tab.href)
          const Icon = tab.icon

          return (
            <Link
              key={tab.href}
              href={tab.href}
              onClick={playClick}
              className="font-body"
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 3,
                color: active ? 'var(--color-primary)' : 'var(--foreground-subtle)',
                textDecoration: 'none',
                fontWeight: active ? 600 : 400,
                position: 'relative',
                transition: 'color var(--transition-fast)',
                minHeight: 44,
              }}
            >
              {/* Indicador ativo — pill animada com layoutId */}
              {active && (
                <motion.div
                  layoutId="tab-indicator"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: '22%',
                    right: '22%',
                    height: 3,
                    background: 'linear-gradient(90deg, #FF3366, #F472A0)',
                    borderRadius: '0 0 4px 4px',
                  }}
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}

              {/* Ícone animado */}
              <motion.div
                animate={{
                  scale: active ? 1.12 : 1,
                  color: active ? 'var(--color-primary)' : 'var(--foreground-subtle)',
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              >
                <Icon
                  size={22}
                  strokeWidth={active ? 2.5 : 1.8}
                  fill={active && tab.href === '/app/looks' ? 'currentColor' : 'none'}
                />
              </motion.div>

              <span
                className="font-body text-[10px] tracking-wide"
                style={{
                  color: active ? 'var(--color-primary)' : 'var(--foreground-subtle)',
                  fontWeight: active ? 600 : 400,
                  transition: 'color var(--transition-fast)',
                }}
              >
                {tab.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
