'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_KEY ?? ''

export function NotificationPermission() {
  const [mostrar, setMostrar] = useState(false)
  const [pedindo, setPedindo] = useState(false)

  useEffect(() => {
    if (
      !('Notification' in window) ||
      !('serviceWorker' in navigator) ||
      !('PushManager' in window) ||
      !VAPID_PUBLIC_KEY
    ) return

    // Só mostrar banner se ainda não decidiu
    if (Notification.permission === 'default') {
      // Delay para não irritar na primeira abertura
      const t = setTimeout(() => setMostrar(true), 4000)
      return () => clearTimeout(t)
    }
  }, [])

  async function handlePermitir() {
    if (!VAPID_PUBLIC_KEY) return
    setPedindo(true)
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') { setMostrar(false); return }

      const reg = await navigator.serviceWorker.ready
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: VAPID_PUBLIC_KEY,
      })

      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription.toJSON()),
      })
    } catch (err) {
      console.error('[NotificationPermission] erro:', err)
    } finally {
      setPedindo(false)
      setMostrar(false)
    }
  }

  return (
    <AnimatePresence>
      {mostrar && (
        <motion.div
          initial={{ opacity: 0, y: 80 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 80 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          style={{
            position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)',
            width: 'calc(100% - 32px)', maxWidth: 398,
            background: '#fff',
            borderRadius: 20,
            boxShadow: '0 8px 40px rgba(0,0,0,0.14)',
            border: '1.5px solid #F0F0F0',
            padding: '16px 18px',
            zIndex: 9990,
            display: 'flex', alignItems: 'center', gap: 14,
          }}
        >
          <div style={{ fontSize: 32, flexShrink: 0 }}>🔔</div>
          <div style={{ flex: 1 }}>
            <p style={{
              margin: '0 0 2px', fontSize: 13, fontWeight: 700,
              color: 'var(--foreground)', fontFamily: 'var(--font-body)',
            }}>
              Alertas de reposição
            </p>
            <p style={{ margin: 0, fontSize: 11, color: '#767676', fontFamily: 'var(--font-body)', lineHeight: 1.4 }}>
              Avise quando seus produtos estiverem acabando e preços caírem.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handlePermitir}
              disabled={pedindo}
              style={{
                padding: '7px 14px', borderRadius: 12,
                background: '#1B5E5A', color: '#fff',
                border: 'none', cursor: 'pointer',
                fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 700,
                whiteSpace: 'nowrap',
              }}
            >
              {pedindo ? '...' : 'Ativar'}
            </motion.button>
            <button
              onClick={() => setMostrar(false)}
              style={{
                padding: '5px 14px', borderRadius: 12,
                background: 'none', color: '#A3A3A3',
                border: 'none', cursor: 'pointer',
                fontFamily: 'var(--font-body)', fontSize: 11,
              }}
            >
              Agora não
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
