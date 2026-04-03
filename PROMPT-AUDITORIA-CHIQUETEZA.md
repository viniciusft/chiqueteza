# CHIQUETEZA — AUDITORIA BRUTAL + REDESIGN COMPLETO

## COMO USAR ESTE PROMPT

> **CONTEXTO:** Este prompt foi criado para funcionar com Claude Sonnet em sessoes com tokens limitados.
> Cada sessao, cole APENAS a fase que vai trabalhar + o arquivo PROGRESS.md atualizado.
> O sistema de tracking garante que nada se perde entre sessoes.

---

## PASSO ZERO — CRIAR O ARQUIVO DE TRACKING

Antes de QUALQUER coisa, crie o arquivo `PROGRESS.md` na raiz do projeto.
Este arquivo e sua FONTE DE VERDADE entre sessoes. NUNCA delete.

```markdown
# CHIQUETEZA — Progress Tracking

## Status Geral
- **Fase atual:** 0 (nao iniciado)
- **Nota atual:** 4.8/10
- **Nota alvo:** 9.5/10
- **Ultima sessao:** [DATA]
- **Proxima acao:** Criar design tokens (Fase 1.1)

## Fases Completas
(nenhuma ainda)

## Fase 1: Design System Foundation
- [ ] 1.1 — Design tokens no tailwind.config.ts
- [ ] 1.2 — globals.css reescrito (vars + utilities)
- [ ] 1.3 — Tipografia: classes utilitarias
- [ ] 1.4 — Instalar GSAP + configurar

## Fase 2: Componentes Core
- [ ] 2.1 — Button.tsx redesign (ripple + variants)
- [ ] 2.2 — TabBar.tsx redesign (pink active + badges)
- [ ] 2.3 — SkeletonCard.tsx (content-aware shapes)
- [ ] 2.4 — PageTransition.tsx (amplificar)
- [ ] 2.5 — StaggerList.tsx (scroll-triggered)
- [ ] 2.6 — EmptyState.tsx (ilustracoes + CTA)
- [ ] 2.7 — ActionSheet.tsx (blur backdrop + polish)
- [ ] 2.8 — Novo: ServiceCard.tsx
- [ ] 2.9 — Novo: ProfessionalCard.tsx (com foto)
- [ ] 2.10 — Novo: TimeSlotPicker.tsx

## Fase 3: Paginas Principais
- [ ] 3.1 — Landing page (hero visual + gradients)
- [ ] 3.2 — Login/Cadastro (visual upgrade)
- [ ] 3.3 — Home/Dashboard (hero + quick actions + look do dia)
- [ ] 3.4 — Visagismo (flow redesign + animations)
- [ ] 3.5 — Galeria (masonry polish + interactions)
- [ ] 3.6 — Looks (unificar com galeria, tabs internas)
- [ ] 3.7 — Rotina (calendario visual + cards ricos)
- [ ] 3.8 — Profissionais (fotos + portfolio + reviews)

## Fase 4: Animacoes & Micro-interactions
- [ ] 4.1 — GSAP ScrollTrigger em todas as secoes
- [ ] 4.2 — Like/Favorite animations (pulse + particles)
- [ ] 4.3 — Card hover/tap feedback (scale + shadow)
- [ ] 4.4 — Page transitions (shared layout)
- [ ] 4.5 — Booking confirmation (confetti + checkmark)
- [ ] 4.6 — Tab content slide transition
- [ ] 4.7 — Number counters (GSAP snap)
- [ ] 4.8 — Progress ring (proximo agendamento)
- [ ] 4.9 — Pull-to-refresh tematico (pincel/tesoura)
- [ ] 4.10 — Skeleton shimmer wave upgrade

## Fase 5: Polish Final
- [ ] 5.1 — Eliminar TODOS os inline styles restantes
- [ ] 5.2 — Eliminar TODOS os emojis-como-icone
- [ ] 5.3 — Onboarding flow (3 telas)
- [ ] 5.4 — Dark mode tokens (futuro)
- [ ] 5.5 — Audit WCAG AA contraste
- [ ] 5.6 — Performance (lazy load, code-split)
- [ ] 5.7 — Teste em dispositivos reais

## Log de Sessoes
| # | Data | Fase | Tasks completadas | Notas |
|---|------|------|-------------------|-------|
| 1 | — | — | — | — |
```

---

## REGRA DE OURO PARA CADA SESSAO

```
1. Leia PROGRESS.md primeiro
2. Identifique a proxima task [ ] nao completada
3. Execute APENAS 2-3 tasks por sessao (economizar tokens)
4. Apos cada task, marque [x] no PROGRESS.md
5. Atualize "Fase atual", "Ultima sessao", "Proxima acao"
6. Adicione linha no Log de Sessoes
7. Commit + push
```

**NUNCA pule uma fase. NUNCA faca mais de 3 tasks sem atualizar o tracking.**

---

# FASE 1 — DESIGN SYSTEM FOUNDATION

> **Cole na sessao:** "Leia PROGRESS.md. Execute a Fase 1 do PROMPT-AUDITORIA-CHIQUETEZA.md. Comece pela proxima task [ ] nao completada."

## 1.1 — Design Tokens (tailwind.config.ts)

Reescrever o tailwind.config.ts com a paleta COMPLETA. A paleta atual e pobre — 5 cores flat sem variacoes. O app precisa de escala completa de cada cor.

**REGRA: Pink e a cor PRIMARIA agora. Verde vira accent/trust.**

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Playfair Display', 'Georgia', 'serif'],
        body: ['DM Sans', 'system-ui', 'sans-serif'],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",

        // PRIMARIA — Pink Peony (a estrela do show)
        pink: {
          50:  '#FFF0F3',
          100: '#FFE0E8',
          200: '#FFC2D4',
          300: '#FF99B8',
          400: '#F472A0',  // original pink-peony
          500: '#FF3366',  // CTA principal
          600: '#E6004C',
          700: '#CC0044',
          800: '#990033',
          900: '#660022',
        },

        // SECONDARY — Ever Green (confianca, confirmacao)
        green: {
          50:  '#E8F5F4',
          100: '#D0EBE9',
          200: '#A3D6D2',
          300: '#5FAFA8',
          400: '#2D8A84',
          500: '#1B5E5A',  // original ever-green
          600: '#164D4A',
          700: '#103B39',
          800: '#0B2A28',
          900: '#071A19',
        },

        // ACCENT — Wedding Band Gold
        gold: {
          50:  '#FFF9ED',
          100: '#FFF0D4',
          200: '#FFE0A8',
          300: '#FFCC70',
          400: '#D4A843',  // original wedding-band
          500: '#C4922A',
          600: '#A37520',
          700: '#7D5918',
          800: '#5C4012',
          900: '#3D2A0C',
        },

        // NEUTRAL — Silver
        silver: {
          50:  '#FAFAFA',
          100: '#F5F5F5',
          200: '#E8E8E8',  // original silver-platter
          300: '#D4D4D4',
          400: '#A3A3A3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
        },

        // INFO — Something Blue
        blue: {
          50:  '#F0F7F9',
          100: '#DFF0F3',
          200: '#C0E0E6',
          300: '#A8C5CC',  // original something-blue
          400: '#7FADB8',
          500: '#5A95A3',
          600: '#457A87',
          700: '#335D68',
          800: '#234148',
          900: '#162A30',
        },
      },
      borderRadius: {
        'sm':  '8px',
        'md':  '12px',
        'lg':  '16px',
        'xl':  '20px',
        '2xl': '24px',
      },
      boxShadow: {
        'soft':   '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)',
        'card':   '0 4px 12px rgba(0,0,0,0.06), 0 2px 4px rgba(0,0,0,0.04)',
        'float':  '0 12px 32px rgba(0,0,0,0.08), 0 4px 8px rgba(0,0,0,0.04)',
        'pink':   '0 8px 24px rgba(255,51,102,0.20)',
        'pink-sm':'0 4px 12px rgba(255,51,102,0.15)',
      },
      spacing: {
        '4.5': '18px',
        '13':  '52px',
        '15':  '60px',
        '18':  '72px',
      },
      animation: {
        'shimmer': 'shimmer 1.5s ease-in-out infinite',
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-in': 'scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'pulse-pink': 'pulsePink 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.9)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
        pulsePink: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(255,51,102,0.3)' },
          '50%':      { boxShadow: '0 0 0 12px rgba(255,51,102,0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-8px)' },
        },
      },
    },
  },
  plugins: [],
};
export default config;
```

**Apos implementar:** Marque [x] 1.1 no PROGRESS.md.

---

## 1.2 — globals.css Reescrito

Reescrever globals.css COMPLETAMENTE. O atual mistura CSS vars soltas com classes arbitrarias. Precisa ser limpo, organizado, e usar os tokens do Tailwind.

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* ============================================
   DESIGN TOKENS — Chiqueteza
   ============================================ */

:root {
  /* Backgrounds */
  --background: #FFFBFC;          /* rosa-off-white quente, NAO o verde frio atual */
  --surface: #FFFFFF;
  --surface-raised: #FFF5F7;      /* cards em destaque */
  --surface-overlay: rgba(0,0,0,0.4);

  /* Foreground */
  --foreground: #171717;
  --foreground-secondary: #525252;
  --foreground-muted: #A3A3A3;
  --foreground-inverse: #FFFFFF;

  /* Brand */
  --color-primary: #FF3366;       /* pink CTA */
  --color-primary-light: #FFF0F3;
  --color-primary-hover: #E6004C;
  --color-secondary: #1B5E5A;     /* green trust */
  --color-secondary-light: #E8F5F4;
  --color-accent: #D4A843;        /* gold premium */
  --color-accent-light: #FFF9ED;

  /* Semantic */
  --color-success: #22C55E;
  --color-warning: #F59E0B;
  --color-error: #EF4444;
  --color-info: #A8C5CC;

  /* Typography */
  --font-display: 'Playfair Display', Georgia, serif;
  --font-body: 'DM Sans', system-ui, sans-serif;

  /* Transitions */
  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --duration-fast: 150ms;
  --duration-normal: 300ms;
  --duration-slow: 500ms;
}

/* ============================================
   BASE RESETS
   ============================================ */

* {
  -webkit-tap-highlight-color: transparent;
}

body {
  font-family: var(--font-body);
  background-color: var(--background);
  color: var(--foreground);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}

/* Touch targets minimos (44px) */
button, a, input, select, textarea {
  min-height: 44px;
}

/* Scrollbar invisivel */
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

/* ============================================
   TYPOGRAPHY UTILITIES
   ============================================ */

@layer utilities {
  .text-hero {
    font-family: var(--font-display);
    font-size: 2.25rem;   /* 36px */
    font-weight: 700;
    line-height: 1.1;
    letter-spacing: -0.02em;
    color: var(--foreground);
  }
  .text-page-title {
    font-family: var(--font-display);
    font-size: 1.5rem;    /* 24px */
    font-weight: 700;
    line-height: 1.2;
    letter-spacing: -0.01em;
    color: var(--foreground);
  }
  .text-section-title {
    font-family: var(--font-body);
    font-size: 1.125rem;  /* 18px */
    font-weight: 600;
    line-height: 1.3;
    color: var(--foreground);
  }
  .text-card-title {
    font-family: var(--font-body);
    font-size: 1rem;      /* 16px */
    font-weight: 600;
    line-height: 1.4;
    color: var(--foreground);
  }
  .text-body {
    font-family: var(--font-body);
    font-size: 0.9375rem; /* 15px */
    font-weight: 400;
    line-height: 1.5;
    color: var(--foreground-secondary);
  }
  .text-caption {
    font-family: var(--font-body);
    font-size: 0.8125rem; /* 13px */
    font-weight: 400;
    line-height: 1.4;
    color: var(--foreground-muted);
  }
  .text-label {
    font-family: var(--font-body);
    font-size: 0.6875rem; /* 11px */
    font-weight: 600;
    line-height: 1;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: var(--foreground-muted);
  }
}

/* ============================================
   COMPONENT UTILITIES
   ============================================ */

@layer utilities {
  /* Gradients */
  .gradient-pink {
    background: linear-gradient(135deg, #FF3366 0%, #F472A0 100%);
  }
  .gradient-pink-soft {
    background: linear-gradient(180deg, #FFF0F3 0%, #FFFBFC 100%);
  }
  .gradient-hero {
    background: linear-gradient(180deg, #FFF0F3 0%, var(--background) 60%);
  }
  .gradient-card-overlay {
    background: linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.6) 100%);
  }

  /* Glass morphism */
  .glass {
    background: rgba(255,255,255,0.8);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
  }
  .glass-dark {
    background: rgba(0,0,0,0.4);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
  }

  /* Shimmer skeleton */
  .skeleton-shimmer {
    background: linear-gradient(90deg, #F5F5F5 25%, #EBEBEB 50%, #F5F5F5 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s ease-in-out infinite;
  }
}
```

**Apos implementar:** Marque [x] 1.2 no PROGRESS.md.

---

## 1.3 — Tipografia: Eliminar Inline Styles

Buscar em TODOS os arquivos `.tsx` por `style={{ fontSize` e `style={{ fontFamily` e substituir pelas classes utilitarias.

**Mapeamento de conversao:**

| Inline style atual | Classe nova |
|---|---|
| `fontSize: 28, fontFamily: display, fontWeight: 700` | `text-page-title` |
| `fontSize: 11, fontWeight: 700, uppercase, tracking` | `text-label` |
| `fontSize: 14, fontWeight: bold` | `text-card-title` |
| `fontSize: 13, color: muted` | `text-caption` |
| `fontSize: 12, color: green` | `text-caption text-green-500` |
| `fontSize: 15, fontWeight: extrabold` | `text-card-title` |
| `fontSize: 42` (emoji) | Substituir emoji por icone SVG, `w-10 h-10` |
| `fontSize: 9, fontWeight: 700` (badge) | `text-label text-[9px]` |

**REGRA: Apos esta task, ZERO arquivos devem conter `style={{ fontSize` ou `style={{ fontFamily`.**

Percorrer CADA arquivo:
- `app/app/page.tsx` — Home (PIOR ofensor, ~15 inline styles)
- `app/app/rotina/page.tsx`
- `app/app/visagismo/page.tsx`
- `app/app/galeria/page.tsx`
- `app/app/looks/page.tsx`
- `app/app/profissionais/page.tsx`
- `app/login/page.tsx`
- `app/cadastro/page.tsx`
- `components/ui/*.tsx` — todos

**Apos implementar:** Marque [x] 1.3 no PROGRESS.md.

---

## 1.4 — Instalar GSAP + Configurar

```bash
npm install gsap
```

Criar `lib/animations/gsap.ts`:

```typescript
'use client'

import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

// Registrar plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

// Defaults globais
gsap.defaults({
  ease: 'power3.out',
  duration: 0.8,
})

// Presets reutilizaveis
export const presets = {
  // Reveal ao scroll — usar em secoes
  scrollReveal: (element: string | Element) => {
    gsap.from(element, {
      opacity: 0,
      y: 40,
      duration: 0.8,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: element,
        start: 'top 85%',
        toggleActions: 'play none none none',
      },
    })
  },

  // Counter animado — usar em numeros/precos
  counter: (element: Element, target: number) => {
    gsap.to(element, {
      textContent: target,
      duration: 1.2,
      snap: { textContent: 1 },
      ease: 'power1.out',
    })
  },

  // Progress ring — usar no timer de agendamento
  progressRing: (circle: SVGCircleElement, progress: number) => {
    const circumference = 2 * Math.PI * circle.r.baseVal.value
    gsap.to(circle, {
      strokeDashoffset: circumference * (1 - progress),
      duration: 1.5,
      ease: 'power2.out',
    })
  },

  // Parallax sutil no scroll
  parallax: (element: string | Element, distance: number = -30) => {
    gsap.to(element, {
      y: distance,
      ease: 'none',
      scrollTrigger: {
        trigger: element,
        scrub: 1,
      },
    })
  },
}

export { gsap, ScrollTrigger }
```

Criar `lib/animations/framer.ts`:

```typescript
import type { Variants, Transition } from 'framer-motion'

// Easing padrao — mais dramatico que o atual
const easeOutExpo = [0.16, 1, 0.3, 1] as const

// Page transition — AMPLIFICADO (era y:8, agora y:24)
export const pageVariants: Variants = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -12 },
}
export const pageTransition: Transition = {
  duration: 0.4,
  ease: easeOutExpo,
}

// Stagger container
export const staggerContainer: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.1,
    },
  },
}

// Stagger item
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 16 },
  show:   {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 24 },
  },
}

// Card tap feedback
export const cardTap = {
  whileTap: { scale: 0.96 },
  transition: { type: 'spring', stiffness: 400, damping: 20 },
}

// Bottom sheet
export const bottomSheet: Variants = {
  hidden: { y: '100%' },
  visible: { y: 0 },
  exit: { y: '100%' },
}
export const bottomSheetTransition: Transition = {
  type: 'spring',
  damping: 30,
  stiffness: 300,
}

// Like/Favorite pulse
export const likePulse: Variants = {
  idle:  { scale: 1 },
  pulse: {
    scale: [1, 1.3, 0.95, 1.1, 1],
    transition: { duration: 0.5, ease: 'easeOut' },
  },
}

// Tab underline slide
export const tabIndicator = {
  layoutId: 'tab-indicator',
  transition: { type: 'spring', stiffness: 400, damping: 30 },
}
```

**Apos implementar:** Marque [x] 1.4 no PROGRESS.md.

---

# FASE 2 — COMPONENTES CORE

> **Cole na sessao:** "Leia PROGRESS.md. Execute a Fase 2 do PROMPT-AUDITORIA-CHIQUETEZA.md. Comece pela proxima task [ ] nao completada."

## 2.1 — Button.tsx Redesign

O Button atual tem vibration API mas ZERO feedback visual. Precisa de:
- Ripple effect no click
- Variant `danger` (vermelho)
- Variant `ghost` (transparente)
- Variant `icon` (circular, so icone)
- Shadow-pink no CTA primario
- Scale animation via Framer Motion (NAO CSS)
- Loading spinner melhorado (nao o SVG generico atual)

**Especificacoes:**
```
primary:   bg-pink-500, text-white, shadow-pink, hover:bg-pink-600
secondary: bg-green-500, text-white, hover:bg-green-600
outline:   border-2 border-pink-200, text-pink-500, hover:bg-pink-50
ghost:     bg-transparent, text-pink-500, hover:bg-pink-50
danger:    bg-red-500, text-white, hover:bg-red-600
icon:      w-11 h-11, rounded-full, bg-pink-50, text-pink-500
```

---

## 2.2 — TabBar.tsx Redesign

Problemas atuais:
- Tab ativa usa verde. Deveria ser PINK
- Icones sao SVGs inline montonos
- Sem badges de notificacao
- Underline animada e fina demais

**Mudancas:**
- Icone ativo: fill pink-500, scale 1.1
- Icone inativo: stroke silver-400
- Label ativa: text-pink-500 font-semibold
- Underline: 4px height, rounded-full, bg-pink-500
- Badge: circulo vermelho com numero (para alertas na Home, agendamentos na Rotina)
- Background: glass morphism (white/80 + blur)
- Substituir SVGs inline por Lucide icons (instalar: `npm i lucide-react`)
  - Home, Heart, Scan, Calendar, Users

---

## 2.3 — SkeletonCard.tsx (Content-Aware)

O skeleton atual e um retangulo cinza. Precisa ter a FORMA do conteudo real:

```tsx
// Skeleton para card de agendamento
export function SkeletonAppointment() {
  return (
    <div className="flex items-center gap-3 p-4 rounded-xl bg-white">
      <div className="w-11 h-11 rounded-lg skeleton-shimmer" />  {/* icone */}
      <div className="flex-1 flex flex-col gap-2">
        <div className="h-3 w-16 rounded skeleton-shimmer" />     {/* badge */}
        <div className="h-4 w-32 rounded skeleton-shimmer" />     {/* titulo */}
        <div className="h-3 w-24 rounded skeleton-shimmer" />     {/* subtitulo */}
      </div>
      <div className="w-7 h-7 rounded-lg skeleton-shimmer" />     {/* acao */}
    </div>
  )
}

// Skeleton para card de profissional
export function SkeletonProfessional() {
  return (
    <div className="flex items-center gap-3 p-4 rounded-xl bg-white">
      <div className="w-14 h-14 rounded-full skeleton-shimmer" /> {/* avatar */}
      <div className="flex-1 flex flex-col gap-2">
        <div className="h-4 w-28 rounded skeleton-shimmer" />     {/* nome */}
        <div className="h-3 w-20 rounded skeleton-shimmer" />     {/* especialidade */}
        <div className="flex gap-1">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="w-3 h-3 rounded-full skeleton-shimmer" />
          ))}
        </div>
      </div>
    </div>
  )
}
```

---

## 2.4 — PageTransition.tsx Amplificado

**De:**
```tsx
initial={{ opacity: 0, y: 8 }}
transition={{ duration: 0.25 }}
```

**Para:**
```tsx
import { pageVariants, pageTransition } from '@/lib/animations/framer'

export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={pageTransition}
    >
      {children}
    </motion.div>
  )
}
```

A diferenca: y vai de 8 para 24px, duracao de 250ms para 400ms, easing mais dramatico. O usuario VAI perceber agora.

---

## 2.5 a 2.10 — Demais Componentes

(Seguir o mesmo padrao: ler o componente atual, identificar problemas, reescrever com design tokens novos, marcar [x] no PROGRESS.md)

**2.5 StaggerList:** Adicionar opcao `trigger="scroll"` que usa GSAP ScrollTrigger em vez de animar no mount.

**2.6 EmptyState:** Substituir emojis por SVG illustrations minimalistas. Adicionar gradient-pink-soft como background. CTA com shadow-pink.

**2.7 ActionSheet:** Adicionar `backdrop-filter: blur(16px)` no overlay. Animacao do sheet com spring mais bouncy. Handle bar com gradiente pink.

**2.8 ServiceCard (NOVO):** Card com imagem (aspect 3:4), gradient overlay, nome + preco + rating. Hover: image scale 1.05.

**2.9 ProfessionalCard (NOVO):** Avatar circular 64px com ring pink. Nome, especialidade, rating, CTA "Agendar" pill.

**2.10 TimeSlotPicker (NOVO):** Grid de chips com estados: disponivel (border pink), selecionado (bg pink-500 + shadow-pink), indisponivel (gray + cursor disabled).

---

# FASE 3 — PAGINAS PRINCIPAIS

> **Cole na sessao:** "Leia PROGRESS.md. Execute a Fase 3 do PROMPT-AUDITORIA-CHIQUETEZA.md. Comece pela proxima task [ ] nao completada."

## 3.1 — Landing Page

A landing atual e: logo + estrela + texto + 2 botoes. Precisa de:
- Hero section com gradient-pink-soft
- Headline com text-hero: "Seu assistente pessoal de beleza"
- Subheadline: "Descubra seu visagismo, experimente looks, organize sua rotina"
- Mockup/preview visual do app (ou ilustracao)
- CTA gradient-pink com shadow-pink e animate-pulse-pink
- Features preview: 3 cards com icones (Visagismo, Looks, Rotina)
- Social proof: "Junte-se a X mulheres" (quando tiver usuarios)
- GSAP scroll reveals em cada secao

## 3.2 — Login/Cadastro

- Background gradient-pink-soft
- Card central glass morphism
- Logo maior, com animacao float
- Inputs com focus:ring-pink-300
- CTA pink-500 full-width com shadow-pink
- Divisor "ou" com linhas
- Link discreto para alternar entre login/cadastro
- Transicao entre login <-> cadastro com Framer Motion

## 3.3 — Home/Dashboard (MAIS CRITICA)

A home atual e: saudacao + alertas + proximo agendamento. Precisa virar:

```
[Gradient Hero Background]
  Ola, [Nome] ✦                    [Avatar]
  "Descubra seu melhor visual"

[Quick Actions — 4 icones circulares]
  Visagismo | Novo Look | Agendar | Galeria

[Proximo Agendamento — Card GRANDE]
  foto profissional | servico | data | CTA WhatsApp

[Alertas — se houver]
  Cards com icone SVG | servico | dias atraso

[Look do Dia — Card visual]
  Imagem de look sugerido | "Inspiracao do dia"

[Meus Profissionais — Carousel horizontal]
  Avatars circulares com nome embaixo
```

**Animacoes da Home:**
- Greeting: typewriter effect (GSAP)
- Quick actions: stagger scale-in
- Cards: stagger slide-up
- Carousel: scroll snap + drag gesture
- Tudo com GSAP ScrollTrigger

## 3.4 a 3.8 — Demais Paginas

**3.4 Visagismo:** Hero com preview do que vai acontecer. Stepper visual (1→2→3→4). Animacao de "escaneamento" durante analise (GSAP timeline). Resultado com cards flip para revelar recomendacoes.

**3.5 Galeria:** Masonry com hover zoom. Like com heart animation (Framer Motion likePulse). Filter chips com slide transition. Infinite scroll com skeleton placeholders.

**3.6 Looks:** Unificar com Galeria via tabs internas ("Meus" | "Favoritos" | "Comunidade"). Tab slide com layoutId. Card com aspect-ratio fixa.

**3.7 Rotina:** Calendario visual inline (nao texto). Timeline vertical com pontos coloridos. Card de agendamento com foto do profissional. Progress ring GSAP para "dias ate proximo".

**3.8 Profissionais:** Grid de cards com foto grande. Rating com estrelas douradas animadas. Portfolio preview (3 fotos). CTA WhatsApp prominente com icone verde.

---

# FASE 4 — ANIMACOES & MICRO-INTERACTIONS

> **Cole na sessao:** "Leia PROGRESS.md. Execute a Fase 4 do PROMPT-AUDITORIA-CHIQUETEZA.md. Comece pela proxima task [ ] nao completada."

## 4.1 — GSAP ScrollTrigger Global

Criar hook `useScrollReveal`:

```typescript
'use client'
import { useEffect, useRef } from 'react'
import { presets } from '@/lib/animations/gsap'

export function useScrollReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  useEffect(() => {
    if (ref.current) {
      presets.scrollReveal(ref.current)
    }
  }, [])
  return ref
}
```

Uso: `const ref = useScrollReveal<HTMLDivElement>()` em qualquer secao.

## 4.2 — Like/Favorite Animation

```typescript
// Componente de Like com animacao
function LikeButton({ liked, onToggle }: { liked: boolean; onToggle: () => void }) {
  return (
    <motion.button
      onClick={onToggle}
      variants={likePulse}
      animate={liked ? 'pulse' : 'idle'}
      whileTap={{ scale: 0.8 }}
      className={cn(
        'w-9 h-9 rounded-full flex items-center justify-center transition-colors',
        liked ? 'bg-pink-50 text-pink-500' : 'bg-silver-100 text-silver-400'
      )}
    >
      <Heart className="w-5 h-5" fill={liked ? 'currentColor' : 'none'} />
    </motion.button>
  )
}
```

## 4.3 a 4.10 — Implementar conforme descrito no PROGRESS.md

Cada task e autonoma. Ler o componente alvo, adicionar a animacao, testar, marcar [x].

---

# FASE 5 — POLISH FINAL

> **Cole na sessao:** "Leia PROGRESS.md. Execute a Fase 5 do PROMPT-AUDITORIA-CHIQUETEZA.md. Comece pela proxima task [ ] nao completada."

## 5.1 — Eliminar Inline Styles

Rodar busca global: `style={{` em todos os .tsx. Cada ocorrencia deve virar classe Tailwind.

**Meta: ZERO inline styles no projeto inteiro** (exceto valores dinamicos calculados em runtime).

## 5.2 — Eliminar Emojis-como-Icone

Substituir TODOS os emojis usados como icones:

| Emoji atual | Substituir por |
|---|---|
| 📅 | `<Calendar className="w-5 h-5" />` (lucide) |
| ✨ | `<Sparkles className="w-5 h-5" />` (lucide) |
| 🔴 | `<AlertCircle className="w-5 h-5 text-red-500" />` (lucide) |
| ⚠️ | `<AlertTriangle className="w-5 h-5 text-gold-400" />` (lucide) |
| ✦ | Manter — este e decorativo/branding, nao icone funcional |

## 5.3 — Onboarding Flow

3 telas apos primeiro cadastro:
1. "Bem-vinda ao Chiqueteza" — o que o app faz (3 bullets com icones)
2. "Descubra seu Visagismo" — CTA para analise facial
3. "Adicione seus profissionais" — CTA para adicionar favoritos

Transicao: swipe horizontal com indicador de progresso (3 dots pink).
Skip button discreto no canto.

## 5.4 a 5.7 — Polish restante

Autonomo. Ler PROGRESS.md, executar, marcar [x].

---

# INSTRUCOES PARA O CLAUDE EM CADA SESSAO

```
REGRAS QUE VOCE DEVE SEGUIR EM TODAS AS SESSOES:

1. SEMPRE leia PROGRESS.md antes de qualquer acao
2. NUNCA faca mais de 3 tasks por sessao
3. SEMPRE atualize PROGRESS.md ao final de cada task
4. NUNCA use inline styles — SEMPRE Tailwind classes
5. NUNCA use emojis como icones — SEMPRE Lucide React
6. NUNCA hardcode cores — SEMPRE via Tailwind config ou CSS vars
7. SEMPRE commit + push apos cada sessao
8. Se nao terminar uma task, anote onde parou no PROGRESS.md
9. Pink (#FF3366) e a cor PRIMARIA. Verde (#1B5E5A) e SECONDARY.
10. Animacoes devem ser PERCETIVEIS. Se o usuario nao nota, nao conta.
```

---

# TEMPLATES DE PROMPT POR SESSAO

## Sessao generica:
```
Leia PROGRESS.md na raiz do projeto.
Execute a proxima task pendente [ ] do tracking.
Siga as regras do PROMPT-AUDITORIA-CHIQUETEZA.md.
Maximo 2-3 tasks por sessao.
Atualize PROGRESS.md ao completar cada task.
```

## Sessao de fase especifica:
```
Leia PROGRESS.md. Estou na Fase [X].
Execute as tasks [X.Y] e [X.Z] do PROMPT-AUDITORIA-CHIQUETEZA.md.
Atualize PROGRESS.md ao completar.
```

## Sessao de continuacao:
```
Leia PROGRESS.md. Na ultima sessao parei no meio da task [X.Y].
Continue de onde parou. Atualize PROGRESS.md ao completar.
```

## Sessao de review:
```
Leia PROGRESS.md. Revise todas as tasks marcadas [x] da Fase [X].
Verifique se foram implementadas corretamente.
Se encontrar problemas, corrija e anote no log.
```
