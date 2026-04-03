import type { Variants, Transition } from 'framer-motion'

// ─── Easings ─────────────────────────────────────────────────────────

const easeOutExpo = [0.16, 1, 0.3, 1] as const

// ─── Page transitions ─────────────────────────────────────────────────

/** Transição de página — amplificada (y:24, 400ms) */
export const pageVariants: Variants = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -12 },
}

export const pageTransition: Transition = {
  duration: 0.4,
  ease: easeOutExpo,
}

// ─── Stagger lists ────────────────────────────────────────────────────

export const staggerContainer: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.05,
    },
  },
}

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 24 },
  },
}

// ─── Card interactions ────────────────────────────────────────────────

export const cardTap = {
  whileTap: { scale: 0.97 },
  transition: { type: 'spring', stiffness: 400, damping: 20 },
}

export const cardHover = {
  whileHover: { y: -2, boxShadow: '0 8px 24px rgba(0,0,0,0.10)' },
  transition: { type: 'spring', stiffness: 300, damping: 20 },
}

// ─── Bottom sheet ─────────────────────────────────────────────────────

export const bottomSheet: Variants = {
  hidden:  { y: '100%' },
  visible: { y: 0 },
  exit:    { y: '100%' },
}

export const bottomSheetTransition: Transition = {
  type: 'spring',
  damping: 30,
  stiffness: 300,
}

// ─── Like / Favorite ─────────────────────────────────────────────────

export const likePulse: Variants = {
  idle:  { scale: 1 },
  pulse: {
    scale: [1, 1.35, 0.92, 1.12, 1],
    transition: { duration: 0.5, ease: 'easeOut' },
  },
}

// ─── Tab indicator ───────────────────────────────────────────────────

export const tabIndicator = {
  layoutId: 'tab-indicator',
  transition: { type: 'spring', stiffness: 500, damping: 35 },
}

// ─── Fade in scale (para modais, tooltips) ───────────────────────────

export const fadeScale: Variants = {
  hidden:  { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 },
  exit:    { opacity: 0, scale: 0.95 },
}

export const fadeScaleTransition: Transition = {
  type: 'spring',
  stiffness: 350,
  damping: 28,
}

// ─── Reveal slide (para notificações, toasts) ────────────────────────

export const slideInRight: Variants = {
  hidden:  { opacity: 0, x: 40 },
  visible: { opacity: 1, x: 0 },
  exit:    { opacity: 0, x: 40 },
}

// ─── Hook helper — useScrollReveal ───────────────────────────────────
// Importar de @/lib/animations/hooks para usar em componentes
