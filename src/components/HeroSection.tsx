'use client'

import dynamic from 'next/dynamic'
import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { motion, useReducedMotion } from 'motion/react'
import ElectricBorder from './ElectricBorder'
import LazyStrands from './LazyStrands'
import HeroGallery from './HeroGallery'
import NovaSeal from './NovaSeal'
import { useLanguage } from '@/i18n/LanguageContext'
import { TAGLINES } from '@/data/taglines'

const TAGLINE_4A = TAGLINES.find((t) => t.id === '4a')!

const Strands = dynamic(() => import('./Strands'), { ssr: false })

// Expo-out — an editorial reveal curve, not a stock ease-out.
const EXPO_OUT = [0.16, 1, 0.3, 1] as const

// Stagger timing, shared with the setTimeout below that fires the italic
// line's gold-sweep finale — `motion`'s onAnimationComplete doesn't fire
// reliably for children that only receive `animate` via propagated variants
// (no local `animate` prop of their own), so the sweep is scheduled off
// these same constants instead of waiting on that callback.
const STAGGER_STEP_S = 0.15
const ITALIC_STAGGER_INDEX = 4 // seal(0), tagline 4A(1), eyebrow(2), heading line(3), italic line(4)
const ITALIC_DURATION_S = 1.3
const ITALIC_SWEEP_DELAY_MS = (STAGGER_STEP_S * ITALIC_STAGGER_INDEX + ITALIC_DURATION_S) * 1000

// Orchestrates the children below — no visual props of its own, just the
// stagger timing, so it never competes with the GSAP parallax transform
// also applied to this same element (see contentRef below).
const heroReveal = {
  hidden: {},
  show: { transition: { staggerChildren: STAGGER_STEP_S } },
}

// Blur-to-focus, not just fade+rise — reads as a considered, editorial
// arrival rather than a stock CSS transition.
const revealItem = {
  hidden: { opacity: 0, y: 26, filter: 'blur(10px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.9, ease: EXPO_OUT } },
}

// The italic payoff line lands slower and softer than the rest of the
// stagger — the emotional beat, meant to linger rather than just arrive.
const revealItemSoft = {
  hidden: { opacity: 0, y: 22, filter: 'blur(14px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: ITALIC_DURATION_S, ease: EXPO_OUT } },
}

export default function HeroSection() {
  const contentRef  = useRef<HTMLDivElement>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [italicSwept, setItalicSwept] = useState(false)
  const { t, lang } = useLanguage()
  const shouldReduceMotion = useReducedMotion()

  useEffect(() => {
    setIsMobile(window.innerWidth < 768)
  }, [])

  // Schedules the italic line's one-shot gold sweep to land right as its
  // own entrance settles — see ITALIC_SWEEP_DELAY_MS above for why this
  // isn't just an onAnimationComplete callback.
  useEffect(() => {
    if (shouldReduceMotion) return
    const timer = setTimeout(() => setItalicSwept(true), ITALIC_SWEEP_DELAY_MS)
    return () => clearTimeout(timer)
  }, [shouldReduceMotion])

  // Light parallax between headline text and background artwork —
  // mouse position + scroll offset, capped to a small max travel.
  useEffect(() => {
    if (
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      window.innerWidth < 768
    ) return
    if (isMobile) return
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const el = contentRef.current
    if (reducedMotion || !el) return

    const MAX_TRAVEL = 18
    const qx = gsap.quickTo(el, 'x', { duration: 0.7, ease: 'power3.out' })
    const qy = gsap.quickTo(el, 'y', { duration: 0.7, ease: 'power3.out' })

    let mouseX = 0
    let mouseY = 0
    let scrollY = 0

    const apply = () => {
      qx(mouseX * MAX_TRAVEL * 0.5)
      qy(mouseY * MAX_TRAVEL * 0.35 + scrollY)
    }

    const onMove = (e: PointerEvent) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2
      apply()
    }
    const onScroll = () => {
      const y = Math.min(window.scrollY, 300)
      scrollY = -(y / 300) * MAX_TRAVEL * 0.5
      apply()
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('scroll', onScroll)
    }
  }, [isMobile])

  return (
    <section className="relative w-full overflow-hidden bg-parchment">
      {/* Ambient Strands layer — decorative backdrop behind text + gallery, desktop only */}
      {!isMobile && (
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
          <Strands
            colors={['#D4A574', '#C97B5C', '#6B7A94']}
            count={3}
            speed={0.28}
            amplitude={0.75}
            waviness={0.85}
            thickness={0.55}
            glow={1.6}
            taper={5}
            spread={1.3}
            intensity={0.32}
            saturation={0.7}
            opacity={0.20}
            scale={1.9}
          />
        </div>
      )}

      {/* flex-direction: row already flips to right-to-left under dir="rtl"
          (set in LanguageContext), so no manual row-reverse is needed here */}
      <div className="relative flex min-h-screen flex-col lg:flex-row lg:items-center">
        {/* Text content — staggered entrance: eyebrow, then heading, then
            the italic payoff line, then sub/CTA continue the cascade.
            `initial={false}` under reduced motion skips straight to the
            resting state for this element and everything it stages below.
            Padding is symmetric (lg:py-24, matching the gallery panel's own
            lg:py-24) so this block's visual center lands on the row's true
            center — which is the gallery masonry's center, first frame's
            top to last frame's bottom, since items-center vertically
            centers both columns against that same shared row height. */}
        <motion.div
          ref={contentRef}
          className="relative z-10 flex flex-col justify-center px-8 pt-24 pb-10 md:px-16 lg:px-24 lg:py-24 max-w-xl"
          variants={heroReveal}
          initial={shouldReduceMotion ? false : 'hidden'}
          animate="show"
        >
          <motion.div variants={revealItem} className="mb-8 self-center lg:self-start">
            {/* Its own textured ground, not the hero's — the seal is
                designed to sit on the almond+weave "certificate" surface
                (see NovaSeal token layer), not float directly over the
                hero's parchment background and ambient Strands. Sized at
                the top of the spec's 200-320px "full" tier: the shadow/
                highlight offsets are fixed viewBox units, so they only read
                as clearly dimensional (matching the reference render) at
                the larger end of that range. */}
            <div className="nova-weave inline-block rounded-2xl px-6 py-8 md:px-10 md:py-12" style={{ backgroundColor: 'var(--color-nova-almond)' }}>
              <NovaSeal size={280} wordmark />
            </div>
          </motion.div>

          {/* Tagline 4A — "The Hand". Shows only the client's currently
              selected site language (fr/en/ar), same as every other
              translated string here — the quiet signature line directly
              under the seal, distinct from the bigger "Art, chosen with
              intention" headline below it. */}
          <motion.div variants={revealItem} className="mb-8 self-center text-center lg:self-start lg:text-left">
            <p
              className={`font-display font-normal text-[var(--color-nova-crimson)] ${lang === 'fr' ? 'italic' : ''}`}
              style={{ fontSize: 'clamp(1.6rem, 3vw, 2.4rem)', lineHeight: 1.2, whiteSpace: 'pre-line' }}
            >
              {lang === 'fr' ? TAGLINE_4A.fr : lang === 'en' ? TAGLINE_4A.en : TAGLINE_4A.ar}
            </p>
          </motion.div>

          <motion.div variants={revealItem} className="relative self-start mb-4 inline-block">
            <LazyStrands
              className="absolute -inset-x-8 -inset-y-4 pointer-events-none"
              colors={['#C89B3C', '#B85C38']}
              count={2}
              speed={0.35}
              amplitude={0.6}
              waviness={0.9}
              thickness={0.5}
              glow={1.8}
              taper={4}
              spread={1.2}
              intensity={0.4}
              saturation={0.85}
              opacity={0.4}
              scale={2.2}
            />
            <p className="relative z-10 text-xs uppercase tracking-[0.38em] text-gold font-body font-medium">
              {t.hero.eyebrow}
            </p>
          </motion.div>

          <h1
            className="font-display font-medium text-charcoal"
            style={{ letterSpacing: '-0.02em', fontSize: 'clamp(3.25rem, 6vw + 1rem, 7.5rem)', lineHeight: 0.95 }}
          >
            <motion.span variants={revealItem} className="block">
              {t.hero.headline1}
            </motion.span>
            <span className="relative block">
              <motion.span
                variants={revealItemSoft}
                className="block italic font-normal text-terracotta"
              >
                {t.hero.headlineItalic}
              </motion.span>
              {/* One-shot gold-leaf sweep once the line settles — the same
                  finishing flourish as PhilosophyReveal's card-back text,
                  reused here for a consistent "luxe" signature rather than
                  a bespoke effect. Skipped entirely under reduced motion. */}
              {italicSwept && !shouldReduceMotion && (
                <span
                  aria-hidden="true"
                  className="philosophy-gold-sweep absolute inset-0 block italic font-normal"
                  onAnimationEnd={() => setItalicSwept(false)}
                >
                  {t.hero.headlineItalic}
                </span>
              )}
            </span>
          </h1>

          <motion.p
            variants={revealItem}
            className="mt-6 max-w-xs text-base md:text-[17px] leading-relaxed text-charcoal/60 font-body font-light"
          >
            {t.hero.sub}
          </motion.p>

          <motion.div variants={revealItem} className="mt-10 flex items-center gap-4 flex-wrap">
            <ElectricBorder
              color="var(--color-electric-gold)"
              chaos={0.05}
              speed={0.7}
              borderRadius={999}
              style={{ display: 'inline-flex' }}
            >
              <a
                href="#gallery"
                className="inline-flex items-center rounded-full bg-charcoal px-7 py-3.5 text-sm font-medium tracking-wide text-canvas transition-all duration-200 ease-out active:scale-[0.97] hover:bg-charcoal-mid"
              >
                {t.hero.cta1}
              </a>
            </ElectricBorder>
            <a
              href="#about"
              className="inline-flex items-center rounded-full border border-charcoal/25 px-7 py-3.5 text-sm font-medium tracking-wide text-charcoal/70 transition-all duration-200 ease-out hover:border-charcoal/50 hover:text-charcoal active:scale-[0.97]"
            >
              {t.hero.cta2}
            </a>
          </motion.div>
        </motion.div>

        {/* Gallery panel — masonry grid of framed pieces, stacked below the
            text on narrow viewports, filling the remaining row on lg+ */}
        <div className="relative z-10 flex-1 px-6 pb-16 lg:py-24 lg:px-0 lg:pe-16 lg:ps-4">
          <HeroGallery />
        </div>
      </div>

      {/* Scroll cue */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none select-none">
        <div className="w-px h-10 bg-charcoal/30" style={{ animation: 'scrollCue 2s ease-in-out infinite' }} />
        <span className="text-[10px] uppercase tracking-[0.28em] text-charcoal/40 font-body">{t.hero.scroll}</span>
      </div>

      <style>{`
        @keyframes scrollCue {
          0%, 100% { opacity: 0.3; transform: scaleY(0.4); transform-origin: top; }
          50%       { opacity: 0.7; transform: scaleY(1);   transform-origin: top; }
        }
      `}</style>
    </section>
  )
}
