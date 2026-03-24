'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { playClick } from '@/lib/sound'

interface Tab {
  label: string
  href: string
  icon: React.ReactNode
}

function IconCasa() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
      <path d="M9 21V12h6v9" />
    </svg>
  )
}

function IconLooks() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="8" height="8" rx="2" />
      <rect x="13" y="3" width="8" height="8" rx="2" />
      <rect x="3" y="13" width="8" height="8" rx="2" />
      <rect x="13" y="13" width="8" height="8" rx="2" />
    </svg>
  )
}

function IconVisagismo() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l2 8 8 2-8 2-2 8-2-8-8-2 8-2 2-8z" />
    </svg>
  )
}

function IconCalendar() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  )
}

function IconPessoa() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="7" r="4" />
      <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
    </svg>
  )
}

const tabs: Tab[] = [
  { label: 'Início', href: '/app', icon: <IconCasa /> },
  { label: 'Looks', href: '/app/looks', icon: <IconLooks /> },
  { label: 'Visagismo', href: '/app/visagismo', icon: <IconVisagismo /> },
  { label: 'Rotina', href: '/app/rotina', icon: <IconCalendar /> },
  { label: 'Profissionais', href: '/app/profissionais', icon: <IconPessoa /> },
]

export default function TabBar() {
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === '/app') return pathname === '/app'
    return pathname.startsWith(href)
  }

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 30,
        backgroundColor: '#fff',
        borderTop: '1px solid #E8E8E8',
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
          return (
            <Link
              key={tab.href}
              href={tab.href}
              onClick={playClick}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 3,
                color: active ? '#1B5E5A' : '#999',
                textDecoration: 'none',
                fontWeight: active ? 700 : 400,
                position: 'relative',
                transition: 'color 0.2s ease',
              }}
            >
              {active && (
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: '25%',
                    right: '25%',
                    height: 3,
                    backgroundColor: '#1B5E5A',
                    borderRadius: '0 0 3px 3px',
                  }}
                />
              )}
              {tab.icon}
              <span style={{ fontSize: 9 }}>{tab.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
