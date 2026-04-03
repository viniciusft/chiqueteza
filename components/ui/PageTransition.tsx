'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { pageVariants, pageTransition } from '@/lib/animations/framer'

interface PageTransitionProps {
  children: React.ReactNode
  /** Chave única para forçar re-animação ao trocar de página */
  pageKey?: string
}

export function PageTransition({ children, pageKey }: PageTransitionProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pageKey}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={pageTransition}
        style={{ willChange: 'transform, opacity' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
