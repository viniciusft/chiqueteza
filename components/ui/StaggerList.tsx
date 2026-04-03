'use client'

import { motion } from 'framer-motion'

const containerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.05,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show:   { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 360, damping: 28 } },
}

interface StaggerListProps {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

/** Wrapper que anima os filhos diretos em cascata (stagger). */
export function StaggerList({ children, className, style }: StaggerListProps) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  )
}

/** Item individual para usar dentro de StaggerList. */
export function StaggerItem({ children, className, style }: StaggerListProps) {
  return (
    <motion.div variants={itemVariants} className={className} style={style}>
      {children}
    </motion.div>
  )
}
