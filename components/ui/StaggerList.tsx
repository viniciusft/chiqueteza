'use client'

import React, { useEffect, useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { staggerContainer, staggerItem } from '@/lib/animations/framer'

interface StaggerListProps {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
  /** 'mount' = anima ao montar (default) | 'scroll' = anima ao entrar no viewport */
  trigger?: 'mount' | 'scroll'
}

/**
 * Wrapper que anima os filhos diretos em cascata (stagger).
 * trigger="scroll" dispara quando o container entra no viewport.
 */
export function StaggerList({ children, className, style, trigger = 'mount' }: StaggerListProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-60px 0px' })

  const animate = trigger === 'scroll' ? (isInView ? 'show' : 'hidden') : 'show'

  return (
    <motion.div
      ref={ref}
      variants={staggerContainer}
      initial="hidden"
      animate={animate}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  )
}

/** Item individual para usar dentro de StaggerList. */
export function StaggerItem({ children, className, style }: Omit<StaggerListProps, 'trigger'>) {
  return (
    <motion.div variants={staggerItem} className={className} style={style}>
      {children}
    </motion.div>
  )
}
