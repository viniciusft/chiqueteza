'use client'

import { ButtonHTMLAttributes, useCallback, useRef, useState } from 'react'
import { motion } from 'framer-motion'

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'icon'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  fullWidth?: boolean
  loading?: boolean
  size?: 'sm' | 'md' | 'lg'
}

interface Ripple {
  id: number
  x: number
  y: number
  size: number
}

// ─── Estilos por variante (Tailwind classes) ──────────────────────────

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-pink-500 text-white hover:bg-pink-600 focus:ring-pink-300 shadow-pink-sm active:bg-pink-700',
  secondary:
    'bg-green-500 text-white hover:bg-green-600 focus:ring-green-300 active:bg-green-700',
  outline:
    'border-2 border-pink-200 text-pink-500 bg-transparent hover:bg-pink-50 focus:ring-pink-200 active:bg-pink-100',
  ghost:
    'bg-transparent text-pink-500 hover:bg-pink-50 focus:ring-pink-200 active:bg-pink-100',
  danger:
    'bg-red-500 text-white hover:bg-red-600 focus:ring-red-300 active:bg-red-700',
  icon:
    'bg-pink-50 text-pink-500 hover:bg-pink-100 focus:ring-pink-200 active:bg-pink-200',
}

// ─── Cor do ripple por variante ───────────────────────────────────────

const rippleColor: Record<Variant, string> = {
  primary:   'rgba(255,255,255,0.30)',
  secondary: 'rgba(255,255,255,0.30)',
  outline:   'rgba(255,51,102,0.12)',
  ghost:     'rgba(255,51,102,0.12)',
  danger:    'rgba(255,255,255,0.30)',
  icon:      'rgba(255,51,102,0.15)',
}

// ─── Padding + size por variante ──────────────────────────────────────

function sizeStyle(variant: Variant, size: 'sm' | 'md' | 'lg'): React.CSSProperties {
  if (variant === 'icon') {
    const dim = size === 'sm' ? 36 : size === 'lg' ? 52 : 44
    return { width: dim, height: dim, padding: 0, borderRadius: '50%', minHeight: dim }
  }
  const map = {
    sm: { padding: '10px 16px', fontSize: 13, minHeight: 40 },
    md: { padding: '14px 20px', fontSize: 15, minHeight: 48 },
    lg: { padding: '16px 28px', fontSize: 17, minHeight: 56 },
  }
  return { ...map[size], borderRadius: 'var(--radius-md)' }
}

// ─── Spinner de loading ───────────────────────────────────────────────

function Spinner({ light = true }: { light?: boolean }) {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
      style={{
        width: 16, height: 16, flexShrink: 0,
        border: `2px solid ${light ? 'rgba(255,255,255,0.3)' : 'rgba(255,51,102,0.3)'}`,
        borderTopColor: light ? '#fff' : '#FF3366',
        borderRadius: '50%',
      }}
    />
  )
}

// ─── Componente principal ─────────────────────────────────────────────

export default function Button({
  variant = 'primary',
  fullWidth = false,
  loading = false,
  size = 'md',
  className = '',
  children,
  disabled,
  onClick,
  ...props
}: ButtonProps) {
  const btnRef = useRef<HTMLButtonElement>(null)
  const [ripples, setRipples] = useState<Ripple[]>([])
  const rippleId = useRef(0)

  // ── Ripple effect ──
  const addRipple = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    if (!btnRef.current) return
    const rect = btnRef.current.getBoundingClientRect()
    const size = Math.max(rect.width, rect.height) * 2
    const x = e.clientX - rect.left - size / 2
    const y = e.clientY - rect.top - size / 2
    const id = ++rippleId.current

    setRipples((prev) => [...prev, { id, x, y, size }])
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id))
    }, 600)
  }, [])

  function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    addRipple(e)
    if (navigator.vibrate) navigator.vibrate(8)
    onClick?.(e)
  }

  const isLight = variant === 'primary' || variant === 'secondary' || variant === 'danger'
  const width = fullWidth ? 'w-full' : ''

  return (
    <motion.button
      ref={btnRef}
      whileTap={{ scale: disabled || loading ? 1 : 0.96 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      className={[
        // Base
        'relative overflow-hidden inline-flex items-center justify-center gap-2',
        'font-body font-semibold select-none',
        'transition-colors duration-150',
        'focus:outline-none focus:ring-2 focus:ring-offset-1',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        // Variant
        variantClasses[variant],
        // Width
        width,
        className,
      ].join(' ')}
      style={sizeStyle(variant, size)}
      disabled={disabled || loading}
      onClick={handleClick}
      {...(props as object)}
    >
      {/* Ripple layer */}
      {ripples.map((r) => (
        <span
          key={r.id}
          style={{
            position: 'absolute',
            left: r.x,
            top: r.y,
            width: r.size,
            height: r.size,
            borderRadius: '50%',
            backgroundColor: rippleColor[variant],
            pointerEvents: 'none',
            animation: 'rippleExpand 0.6s ease-out forwards',
          }}
        />
      ))}

      {/* Content */}
      {loading ? (
        <>
          <Spinner light={isLight} />
          {variant !== 'icon' && children}
        </>
      ) : (
        children
      )}
    </motion.button>
  )
}
