'use client'

import { useEffect, useRef } from 'react'
import { presets } from './gsap'

/**
 * Hook para aplicar GSAP ScrollTrigger reveal em um elemento.
 * @example
 *   const ref = useScrollReveal<HTMLDivElement>()
 *   return <div ref={ref}>...</div>
 */
export function useScrollReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null)

  useEffect(() => {
    if (!ref.current) return
    presets.scrollReveal(ref.current)
  }, [])

  return ref
}

/**
 * Hook para stagger reveal de uma lista de filhos ao scroll.
 * @example
 *   const ref = useStaggerReveal<HTMLDivElement>()
 *   return <div ref={ref}>{items.map(...)}</div>
 */
export function useStaggerReveal<T extends HTMLElement>(stagger = 0.08) {
  const ref = useRef<T>(null)

  useEffect(() => {
    if (!ref.current) return
    const children = ref.current.children
    if (children.length === 0) return
    presets.staggerReveal(children as unknown as NodeListOf<Element>, stagger)
  }, [stagger])

  return ref
}
