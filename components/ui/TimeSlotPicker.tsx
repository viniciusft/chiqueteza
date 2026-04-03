'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock } from 'lucide-react'

interface TimeSlot {
  value: string  // ex: "09:00"
  disponivel?: boolean
}

interface TimeSlotPickerProps {
  slots: TimeSlot[]
  selected?: string
  onSelect: (value: string) => void
  label?: string
}

export function TimeSlotPicker({ slots, selected, onSelect, label = 'Escolha um horário' }: TimeSlotPickerProps) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Clock size={16} color="var(--foreground-muted)" />
        <span className="text-label">{label}</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {slots.map((slot) => {
          const isSelected = selected === slot.value
          const isDisabled = slot.disponivel === false

          return (
            <motion.button
              key={slot.value}
              whileTap={isDisabled ? {} : { scale: 0.92 }}
              transition={{ type: 'spring', stiffness: 500, damping: 28 }}
              onClick={() => !isDisabled && onSelect(slot.value)}
              disabled={isDisabled}
              style={{
                padding: '8px 14px',
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 600,
                fontFamily: 'var(--font-body)',
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                border: isSelected
                  ? '2px solid #FF3366'
                  : isDisabled
                    ? '1.5px solid #E5E7EB'
                    : '1.5px solid rgba(0,0,0,0.1)',
                backgroundColor: isSelected
                  ? '#FF3366'
                  : isDisabled
                    ? '#F9FAFB'
                    : '#fff',
                color: isSelected
                  ? '#fff'
                  : isDisabled
                    ? '#D1D5DB'
                    : 'var(--foreground)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Indicador de selecionado */}
              <AnimatePresence>
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 28 }}
                    style={{
                      position: 'absolute', inset: 0,
                      background: 'linear-gradient(135deg, #FF3366, #F472A0)',
                      borderRadius: 8,
                      zIndex: 0,
                    }}
                  />
                )}
              </AnimatePresence>

              <span style={{ position: 'relative', zIndex: 1 }}>
                {slot.value}
              </span>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
