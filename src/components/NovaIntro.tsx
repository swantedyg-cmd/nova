'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import styles from './NovaIntro.module.css'
import NovaLogoAnimated from './NovaLogoAnimated'

// Nova's entrance: the gold logo fades/scales in, holds while its own
// stroke-draw/sparkle/shimmer animations play (see NovaLogoAnimated), then
// scales up and fades out to reveal the homepage. One self-contained
// overlay, no animation library for the envelope itself — every phase is
// driven by a single requestAnimationFrame clock (see `tick`) against one
// elapsed-time value, so phases can never drift apart the way independent
// CSS animations could.

const SESSION_KEY = 'nova-intro'
// `.nova-page-content` wraps everything else in the body (see layout.tsx)
// — this is how the overlay reaches "the homepage beneath" it without
// needing to literally wrap the page's own component tree.
const CONTENT_SELECTOR = '.nova-page-content'

const PHASE1_END = 1600 // IN — scale 0.6 -> 1, opacity building
const PHASE2_END = 3600 // HOLD — full logo, all its animations playing
const TOTAL = 5000 // OUT ends here — scale 1 -> 1.15, opacity 1 -> 0

const REVEAL_START = TOTAL - 650
const REVEAL_DURATION = 650

const FONT_WAIT_CAP_MS = 400
const REDUCED_HOLD_MS = 900
const REDUCED_FADE_MS = 500

const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)

export default function NovaIntro() {
  const [shouldRender, setShouldRender] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [reducedFadeOut, setReducedFadeOut] = useState(false)

  const rootRef = useRef<HTMLDivElement>(null)
  const logoWrapRef = useRef<HTMLDivElement>(null)
  const glowRef = useRef<HTMLDivElement>(null)

  const rafRef = useRef<number | null>(null)
  const startRef = useRef<number | null>(null)
  const skipRef = useRef(false)
  const finishedRef = useRef(false)

  // Decide once, synchronously before paint, whether to run at all — a
  // returning visitor (sessionStorage already set) never sees the overlay
  // and the homepage is never touched, so there's nothing to flash or undo.
  useLayoutEffect(() => {
    let seen = false
    try {
      seen = sessionStorage.getItem(SESSION_KEY) === '1'
    } catch {}
    if (seen) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    setReducedMotion(reduced)
    setShouldRender(true)

    document.documentElement.style.overflow = 'hidden'
    if (!reduced) {
      const content = document.querySelector<HTMLElement>(CONTENT_SELECTOR)
      if (content) {
        content.style.transform = 'scale(1.03)'
        content.style.opacity = '0.6'
      }
    }
  }, [])

  const finish = () => {
    if (finishedRef.current) return
    finishedRef.current = true
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    document.documentElement.style.overflow = ''
    const content = document.querySelector<HTMLElement>(CONTENT_SELECTOR)
    if (content) {
      content.style.transform = ''
      content.style.opacity = ''
    }
    try {
      sessionStorage.setItem(SESSION_KEY, '1')
    } catch {}
    setShouldRender(false)
  }

  // Reduced motion: static resting logo, held, then a plain opacity
  // cross-fade — no clock, just a timer and a CSS transition.
  useEffect(() => {
    if (!shouldRender || !reducedMotion) return
    const hold = setTimeout(() => setReducedFadeOut(true), REDUCED_HOLD_MS)
    return () => clearTimeout(hold)
  }, [shouldRender, reducedMotion])

  useEffect(() => {
    if (!reducedFadeOut) return
    const t = setTimeout(finish, REDUCED_FADE_MS)
    return () => clearTimeout(t)
  }, [reducedFadeOut])

  // The full run: scale/opacity envelope only — NovaLogoAnimated drives its
  // own stroke/sparkle/letter/shimmer timing independently once mounted.
  useEffect(() => {
    if (!shouldRender || reducedMotion) return
    let cancelled = false

    function applyFrame(elapsed: number) {
      let scale: number
      let opacity: number

      if (elapsed <= PHASE1_END) {
        const t = easeOutCubic(elapsed / PHASE1_END)
        scale = lerp(0.6, 1, t)
        opacity = lerp(0, 1, t)
      } else if (elapsed <= PHASE2_END) {
        scale = 1
        opacity = 1
      } else {
        const rawT = (elapsed - PHASE2_END) / (TOTAL - PHASE2_END)
        const t = easeOutCubic(rawT)
        scale = lerp(1, 1.15, t)
        opacity = lerp(1, 0, t)
      }

      const wrap = logoWrapRef.current
      if (wrap) {
        wrap.style.transform = `scale(${scale})`
        wrap.style.opacity = String(opacity)
      }

      // Ambient gold-almond glow — grows in with the logo, breathes gently
      // through the hold (one slow pulse, not a loop), fades with it on
      // the way out.
      let glowOpacity = opacity * 0.75
      if (elapsed > PHASE1_END && elapsed <= PHASE2_END) {
        const holdT = (elapsed - PHASE1_END) / (PHASE2_END - PHASE1_END)
        glowOpacity = 0.6 + 0.25 * Math.sin(holdT * Math.PI)
      }
      const glow = glowRef.current
      if (glow) glow.style.opacity = String(glowOpacity)

      // Final 650ms: overlay wipes open (upward) while the homepage
      // settles from its held-back scale/opacity to identity.
      if (elapsed >= REVEAL_START) {
        const t = easeOutCubic(clamp01((elapsed - REVEAL_START) / REVEAL_DURATION))
        const root = rootRef.current
        if (root) {
          root.style.opacity = String(lerp(1, 0, t))
          root.style.clipPath = `inset(0 0 ${lerp(0, 100, t)}% 0)`
        }
        const content = document.querySelector<HTMLElement>(CONTENT_SELECTOR)
        if (content) {
          content.style.transform = `scale(${lerp(1.03, 1, t)})`
          content.style.opacity = String(lerp(0.6, 1, t))
        }
      }
    }

    function tick(now: number) {
      if (startRef.current === null) startRef.current = now
      let elapsed = now - startRef.current
      // Skip: jump straight to the start of phase 3 — it still turns out,
      // just without the wait.
      if (skipRef.current && elapsed < PHASE2_END) {
        startRef.current = now - PHASE2_END
        elapsed = PHASE2_END
      }
      elapsed = Math.min(elapsed, TOTAL)

      applyFrame(elapsed)

      if (elapsed < TOTAL) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        finish()
      }
    }

    function start() {
      if (cancelled) return
      rafRef.current = requestAnimationFrame(tick)
    }

    const fontsReady =
      typeof document !== 'undefined' && document.fonts?.ready ? document.fonts.ready : Promise.resolve()
    Promise.race([fontsReady, new Promise((resolve) => setTimeout(resolve, FONT_WAIT_CAP_MS))]).then(start)

    const onSkip = () => {
      skipRef.current = true
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onSkip()
    }

    window.addEventListener('pointerdown', onSkip)
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('wheel', onSkip, { passive: true })
    window.addEventListener('touchstart', onSkip, { passive: true })

    return () => {
      cancelled = true
      window.removeEventListener('pointerdown', onSkip)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('wheel', onSkip)
      window.removeEventListener('touchstart', onSkip)
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [shouldRender, reducedMotion])

  if (!shouldRender) return null

  return (
    <div
      ref={rootRef}
      className={styles.overlay}
      aria-hidden="true"
      role="presentation"
      dir="ltr"
      data-fade-out={reducedFadeOut || undefined}
    >
      <div className={styles.stage}>
        <div
          ref={glowRef}
          className={reducedMotion ? `${styles.glow} ${styles.glowRest}` : styles.glow}
          aria-hidden="true"
        />

        <div
          ref={logoWrapRef}
          className={reducedMotion ? `${styles.logoWrap} ${styles.logoWrapRest}` : styles.logoWrap}
        >
          <NovaLogoAnimated size={200} interactive={false} />
        </div>
      </div>
    </div>
  )
}
