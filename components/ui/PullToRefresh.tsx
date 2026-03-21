'use client'

import { useRef, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function PullToRefresh({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)
  const startY = useRef(0)
  const pullDist = useRef(0)
  const [pulling, setPulling] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    function onTouchStart(e: TouchEvent) {
      if (window.scrollY === 0) {
        startY.current = e.touches[0].clientY
      }
    }

    function onTouchMove(e: TouchEvent) {
      if (window.scrollY !== 0) return
      const delta = e.touches[0].clientY - startY.current
      if (delta > 0 && delta < 80) {
        pullDist.current = delta
        setPulling(delta > 40)
      }
    }

    function onTouchEnd() {
      if (pullDist.current > 60) {
        if (navigator.vibrate) navigator.vibrate(20)
        setRefreshing(true)
        router.refresh()
        setTimeout(() => {
          setRefreshing(false)
          setPulling(false)
        }, 1000)
      } else {
        setPulling(false)
      }
      pullDist.current = 0
    }

    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: true })
    el.addEventListener('touchend', onTouchEnd)
    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
    }
  }, [router])

  return (
    <div ref={containerRef}>
      {(pulling || refreshing) && (
        <div
          style={{
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            height: 48,
          }}
        >
          <div
            style={{
              width: 24, height: 24, border: '3px solid #1B5E5A',
              borderTopColor: 'transparent', borderRadius: '50%',
              animation: refreshing ? 'spin 0.8s linear infinite' : 'none',
            }}
          />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}
      {children}
    </div>
  )
}
