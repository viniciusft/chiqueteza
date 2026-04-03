'use client'

import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

// Registrar plugins (apenas no cliente)
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

// Defaults globais
gsap.defaults({
  ease: 'power3.out',
  duration: 0.8,
})

// ─── Presets reutilizáveis ────────────────────────────────────────────

export const presets = {
  /**
   * Reveal ao scroll — usar em seções de página.
   * @example ref.current && presets.scrollReveal(ref.current)
   */
  scrollReveal: (element: string | Element) => {
    gsap.from(element, {
      opacity: 0,
      y: 40,
      duration: 0.8,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: element as Element,
        start: 'top 85%',
        toggleActions: 'play none none none',
      },
    })
  },

  /**
   * Stagger reveal de uma lista de elementos ao scroll.
   */
  staggerReveal: (elements: string | NodeListOf<Element> | Element[], stagger = 0.08) => {
    gsap.from(elements, {
      opacity: 0,
      y: 24,
      stagger,
      duration: 0.6,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: (elements as Element[])[0] ?? elements,
        start: 'top 85%',
        toggleActions: 'play none none none',
      },
    })
  },

  /**
   * Counter animado — usar em números/preços.
   */
  counter: (element: Element, target: number) => {
    const obj = { value: 0 }
    gsap.to(obj, {
      value: target,
      duration: 1.2,
      snap: { value: 1 },
      ease: 'power1.out',
      onUpdate: () => {
        element.textContent = String(Math.round(obj.value))
      },
    })
  },

  /**
   * Progress ring SVG — usar no timer de agendamento.
   */
  progressRing: (circle: SVGCircleElement, progress: number) => {
    const circumference = 2 * Math.PI * circle.r.baseVal.value
    circle.style.strokeDasharray = String(circumference)
    gsap.fromTo(
      circle,
      { strokeDashoffset: circumference },
      {
        strokeDashoffset: circumference * (1 - progress),
        duration: 1.5,
        ease: 'power2.out',
      }
    )
  },

  /**
   * Parallax sutil no scroll.
   */
  parallax: (element: string | Element, distance = -30) => {
    gsap.to(element, {
      y: distance,
      ease: 'none',
      scrollTrigger: {
        trigger: element as Element,
        scrub: 1,
      },
    })
  },

  /**
   * Hero entrance — para elementos principais no topo da página.
   */
  heroEntrance: (container: Element) => {
    const tl = gsap.timeline()
    tl.from(container.querySelectorAll('[data-hero-item]'), {
      opacity: 0,
      y: 32,
      stagger: 0.12,
      duration: 0.7,
      ease: 'power3.out',
    })
    return tl
  },
}

export { gsap, ScrollTrigger }
