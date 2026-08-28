'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import styles from './NovaIntro.module.css'

// Nova's entrance: the brand video plays once, full quality, then the
// overlay wipes open to reveal the homepage.
//
// The homepage (Hero's WebGL background, GSAP listeners, the logo's several
// looping animations, everything under `children`) is NOT mounted at all
// while the video is playing — only visually hiding it behind the overlay
// still leaves React mounting and initializing all of that at the same
// moment the video is trying to autoplay and decode, and that contention is
// exactly what was freezing real laptops. Deferring the mount until the
// reveal starts means the video has the main thread to itself.

const SESSION_KEY = 'nova-intro'

const REVEAL_DURATION = 650 // ms — overlay wipe + homepage settle
const REDUCED_HOLD_MS = 900
const REDUCED_FADE_MS = 500
// Safety net in case the video never fires `ended` (slow network, decode
// error) — never leave a visitor stuck behind the overlay. Comfortably
// longer than the clip itself. Autoplay actually being BLOCKED is handled
// separately and immediately (see the `.play()` rejection handling below)
// rather than waiting out this whole timeout — this is only for a video
// that started but stalled or never fires `ended`.
const VIDEO_FALLBACK_MS = 9000

export default function NovaIntro({ children }: { children: React.ReactNode }) {
  const [shouldRenderOverlay, setShouldRenderOverlay] = useState(false)
  const [contentReady, setContentReady] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [reducedFadeOut, setReducedFadeOut] = useState(false)
  const [revealing, setRevealing] = useState(false)

  const contentRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const finishedRef = useRef(false)
  const revealingRef = useRef(false)

  // Decide once, synchronously before paint, whether to run at all — a
  // returning visitor (sessionStorage already set) never sees the overlay;
  // the homepage just mounts normally, immediately.
  useLayoutEffect(() => {
    let seen = false
    try {
      seen = sessionStorage.getItem(SESSION_KEY) === '1'
    } catch {}
    if (seen) {
      setContentReady(true)
      return
    }

    // Mobile now runs the same video/reduced-motion overlay as desktop —
    // the intro video's own CSS (object-fit: cover, absolute inset:0) is
    // already fully responsive, so it fills the phone's viewport the same
    // way it fills a laptop's. See the mobile-detection race fix in
    // useIsMobile.ts / HeroSection / GallerySection for why the homepage
    // mounting underneath it (once `startReveal` fires) is now safe.
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    setReducedMotion(reduced)
    setShouldRenderOverlay(true)
    document.documentElement.style.overflow = 'hidden'
  }, [])

  const finish = () => {
    if (finishedRef.current) return
    finishedRef.current = true
    document.documentElement.style.overflow = ''
    try {
      sessionStorage.setItem(SESSION_KEY, '1')
    } catch {}
    setShouldRenderOverlay(false)
  }

  const startReveal = () => {
    if (revealingRef.current) return
    revealingRef.current = true
    setRevealing(true)
    // The homepage starts mounting now — not any earlier — so it never
    // competes with the video for the main thread while it's playing.
    setContentReady(true)
    setTimeout(finish, REVEAL_DURATION)
  }

  // Reduced motion: skip the video entirely — a static mark, held, then a
  // plain cross-fade. The homepage mounts as soon as the fade begins.
  useEffect(() => {
    if (!shouldRenderOverlay || !reducedMotion) return
    const hold = setTimeout(() => {
      setReducedFadeOut(true)
      setContentReady(true)
    }, REDUCED_HOLD_MS)
    return () => clearTimeout(hold)
  }, [shouldRenderOverlay, reducedMotion])

  useEffect(() => {
    if (!reducedFadeOut) return
    const t = setTimeout(finish, REDUCED_FADE_MS)
    return () => clearTimeout(t)
  }, [reducedFadeOut])

  // Full run: play the intro video, reveal once it ends — or immediately
  // on any interaction (skip), or after the fallback timeout.
  useEffect(() => {
    if (!shouldRenderOverlay || reducedMotion) return

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
  }, [shouldRenderOverlay, reducedMotion])

  // `autoPlay` is a request, not a guarantee, and browsers only grant it
  // to a video that's actually muted at the moment `.play()` is called —
  // the React `muted` JSX prop sets the *attribute* on first render, but
  // doesn't reliably sync the `.muted` *property* the autoplay policy
  // check itself reads (a long-standing React/video quirk: since the
  // attribute's initial value never changes, React's diffing has no
  // reason to touch the property again after mount). On a browser that's
  // strict about this, the element was calling .play() against an
  // effectively unmuted video, autoplay was silently refused, and the
  // .catch() below immediately skipped straight to the homepage — so the
  // video was not just stuck, it was never even attempted. Setting both
  // `.muted` and `.defaultMuted` on the element directly, right before
  // .play(), guarantees the property the browser actually checks is true.
  useEffect(() => {
    if (!shouldRenderOverlay || reducedMotion) return
    const video = videoRef.current
    if (!video) return
    video.muted = true
    video.defaultMuted = true
    const playAttempt = video.play()
    if (playAttempt && typeof playAttempt.catch === 'function') {
      playAttempt.catch(() => startReveal())
    }
  }, [shouldRenderOverlay, reducedMotion])

  // The homepage settles in from a held-back scale/opacity exactly once —
  // the first frame it mounts after the video reveal (never for a returning
  // visitor, who sees it plainly, and never for reduced motion, which skips
  // the flourish entirely).
  useEffect(() => {
    if (!contentReady || !revealingRef.current) return
    const el = contentRef.current
    if (!el) return

    // A lingering inline `transform` — even a settled, visually-identity
    // scale(1) — makes this element a new containing block for any
    // `position: fixed` descendant (CSS spec: any transform other than
    // `none` does this, regardless of value). SiteBackground, and every
    // GSAP-pinned section on the page, lives inside this subtree and is
    // meant to stay pinned to the true viewport — left in place, they
    // instead become fixed to THIS div, which scrolls normally, so
    // backgrounds silently scroll away and pins release early. Clearing
    // the inline styles once the transition truly finishes restores the
    // real viewport as the containing block.
    const clearStyles = () => {
      el.style.transition = ''
      el.style.transform = ''
      el.style.opacity = ''
    }

    el.style.transform = 'scale(1.03)'
    el.style.opacity = '0.6'

    const raf = requestAnimationFrame(() => {
      el.style.transition = `transform ${REVEAL_DURATION}ms ease, opacity ${REVEAL_DURATION}ms ease`
      el.style.transform = 'scale(1)'
      el.style.opacity = '1'
    })

    // transitionend (not a fixed timer) is what actually clears the
    // style — a wall-clock setTimeout keyed to REVEAL_DURATION can fire
    // before the rAF-scheduled transition above has even started if the
    // tab was throttled in the meantime (backgrounded, low-power, etc.),
    // leaving the transform re-applied *after* the "clear" already ran.
    // The timeout below is only a safety net in case transitionend never
    // fires at all (interrupted transition, unexpected browser quirk).
    el.addEventListener('transitionend', clearStyles, { once: true })
    const fallback = setTimeout(clearStyles, REVEAL_DURATION + 1000)

    return () => {
      cancelAnimationFrame(raf)
      el.removeEventListener('transitionend', clearStyles)
      clearTimeout(fallback)
    }
  }, [contentReady])

  return (
    <>
      {shouldRenderOverlay && (
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
                ref={videoRef}
                className={styles.introVideo}
                src="/nova-intro.mp4"
                poster="/nova-logo.png"
                autoPlay
                muted
                playsInline
                preload="auto"
                onEnded={startReveal}
                onError={startReveal}
              />
            )}
          </div>
        </div>
      )}

      {contentReady && <div ref={contentRef}>{children}</div>}
    </>
  )
}
