'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import styles from './NovaIntro.module.css'

// Nova's entrance: the brand video plays once, full quality, then the
// overlay wipes open to reveal the homepage. Much simpler than the old
// hand-timed logo choreography — the video itself carries all the motion,
// so this component only has to: hold the page behind an overlay, play
// the clip, and reveal on `ended` (or on skip / a safety timeout).

const SESSION_KEY = 'nova-intro'
// `.nova-page-content` wraps everything else in the body (see layout.tsx)
// — this is how the overlay reaches "the homepage beneath" it without
// needing to literally wrap the page's own component tree.
const CONTENT_SELECTOR = '.nova-page-content'

const REVEAL_DURATION = 650 // ms — overlay wipe + homepage settle
const REDUCED_HOLD_MS = 900
const REDUCED_FADE_MS = 500
// Safety net in case the video never fires `ended` (autoplay blocked,
// slow network, decode error) — never leave a visitor stuck behind the
// overlay. Comfortably longer than the clip itself.
const VIDEO_FALLBACK_MS = 9000

export default function NovaIntro() {
  const [shouldRender, setShouldRender] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [reducedFadeOut, setReducedFadeOut] = useState(false)
  const [revealing, setRevealing] = useState(false)

  const finishedRef = useRef(false)
  const revealingRef = useRef(false)

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
    document.documentElement.style.overflow = ''
    const content = document.querySelector<HTMLElement>(CONTENT_SELECTOR)
    if (content) {
      content.style.transition = ''
      content.style.transform = ''
      content.style.opacity = ''
    }
    try {
      sessionStorage.setItem(SESSION_KEY, '1')
    } catch {}
    setShouldRender(false)
  }

  const startReveal = () => {
    if (revealingRef.current) return
    revealingRef.current = true
    setRevealing(true)
    const content = document.querySelector<HTMLElement>(CONTENT_SELECTOR)
    if (content) {
      content.style.transition = `transform ${REVEAL_DURATION}ms ease, opacity ${REVEAL_DURATION}ms ease`
      content.style.transform = 'scale(1)'
      content.style.opacity = '1'
    }
    setTimeout(finish, REVEAL_DURATION)
  }

  // Reduced motion: skip the video entirely — a static mark, held, then a
  // plain opacity cross-fade.
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

  // Full run: play the intro video, reveal once it ends — or immediately
  // on any interaction (skip), or after the fallback timeout.
  useEffect(() => {
    if (!shouldRender || reducedMotion) return

    const fallback = setTimeout(startReveal, VIDEO_FALLBACK_MS)
    const onSkip = () => startReveal()
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onSkip()
    }

    window.addEventListener('pointerdown', onSkip)
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('wheel', onSkip, { passive: true })
    window.addEventListener('touchstart', onSkip, { passive: true })

    return () => {
      clearTimeout(fallback)
      window.removeEventListener('pointerdown', onSkip)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('wheel', onSkip)
      window.removeEventListener('touchstart', onSkip)
    }
  }, [shouldRender, reducedMotion])

  if (!shouldRender) return null

  return (
    <div
      className={styles.overlay}
      aria-hidden="true"
      role="presentation"
      dir="ltr"
      data-fade-out={reducedFadeOut || undefined}
      data-revealing={revealing || undefined}
    >
      <div className={styles.stage}>
        {reducedMotion ? (
          <div className={`${styles.reducedLogo} ${styles.reducedLogoRest}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/nova-logo.png" alt="Nova — Canvas Art" style={{ width: 200, height: 'auto' }} />
          </div>
        ) : (
          <video
            className={styles.introVideo}
            src="/nova-intro.mp4"
            poster="/nova-logo.png"
            autoPlay
            muted
            playsInline
            preload="auto"
            onEnded={startReveal}
          />
        )}
      </div>
    </div>
  )
}
