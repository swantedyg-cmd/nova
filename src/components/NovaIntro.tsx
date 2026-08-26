'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import styles from './NovaIntro.module.css'

// Nova's metal-seal entrance: the seal turns in from edge-on, holds while
// it catches the light, then turns back out through the viewer to reveal
// the homepage. One self-contained overlay, no animation library — every
// phase is driven by a single requestAnimationFrame clock (see `tick`)
// against one elapsed-time value, so phases can never drift apart the way
// three independent CSS animations could.

const SESSION_KEY = 'nova-intro'
// `.nova-page-content` wraps everything else in the body (see layout.tsx)
// — this is how the overlay reaches "the homepage beneath" it without
// needing to literally wrap the page's own component tree.
const CONTENT_SELECTOR = '.nova-page-content'

const PHASE1_END = 1600 // IN
const PHASE2_END = 3600 // HOLD
const TOTAL = 5000 // OUT ends here

const REVEAL_START = TOTAL - 650
const REVEAL_DURATION = 650

const WORDMARK_IN_START = 700
const WORDMARK_IN_END = 1600
const WORDMARK_OUT_START = PHASE2_END - 200

// Two glare passes — a bright almond glint gliding across the metal, once
// as the seal turns to face the viewer, once again mid-hold so it doesn't
// read as static. Each is its own short window; outside both, the glare is
// simply invisible.
const GLARE1_START = 300
const GLARE1_END = 1600
const GLARE2_START = 2300
const GLARE2_END = 3400

const FONT_WAIT_CAP_MS = 400
const REDUCED_HOLD_MS = 900
const REDUCED_FADE_MS = 500

// --- cubic-bezier(x1,y1,x2,y2) → t↦y, same algorithm as gre/bezier-easing —
// written out here rather than pulled in as a dependency, per "no new
// dependencies." Needed because the phases are driven by a JS clock, not
// CSS, so the easing curves have to be evaluable in JS too.
function cubicBezier(x1: number, y1: number, x2: number, y2: number) {
  const A = (a1: number, a2: number) => 1 - 3 * a2 + 3 * a1
  const B = (a1: number, a2: number) => 3 * a2 - 6 * a1
  const C = (a1: number) => 3 * a1
  const calc = (t: number, a1: number, a2: number) => ((A(a1, a2) * t + B(a1, a2)) * t + C(a1)) * t
  const slope = (t: number, a1: number, a2: number) => 3 * A(a1, a2) * t * t + 2 * B(a1, a2) * t + C(a1)

  const SAMPLES = 11
  const STEP = 1 / (SAMPLES - 1)
  const table = new Float32Array(SAMPLES)
  for (let i = 0; i < SAMPLES; i++) table[i] = calc(i * STEP, x1, x2)

  function tForX(x: number) {
    let intervalStart = 0
    let sample = 1
    for (; sample !== SAMPLES - 1 && table[sample] <= x; sample++) intervalStart += STEP
    sample--
    const dist = (x - table[sample]) / (table[sample + 1] - table[sample] || 1)
    let t = intervalStart + dist * STEP

    const initialSlope = slope(t, x1, x2)
    if (initialSlope >= 0.001) {
      for (let i = 0; i < 4; i++) {
        const s = slope(t, x1, x2)
        if (s === 0) break
        t -= (calc(t, x1, x2) - x) / s
      }
    } else if (initialSlope !== 0) {
      let lo = intervalStart
      let hi = intervalStart + STEP
      let i = 0
      let cur = t
      let curX: number
      do {
        curX = calc(cur, x1, x2) - x
        if (curX > 0) hi = cur
        else lo = cur
        cur = lo + (hi - lo) / 2
      } while (Math.abs(curX) > 1e-7 && ++i < 10)
      t = cur
    }
    return t
  }

  return (x: number) => {
    if (x <= 0) return 0
    if (x >= 1) return 1
    return calc(tForX(x), y1, y2)
  }
}

const easeIn = cubicBezier(0.16, 0.84, 0.28, 1)
const easeOut = cubicBezier(0.6, 0, 0.86, 0.24)

const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)

export default function NovaIntro() {
  const [shouldRender, setShouldRender] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [reducedFadeOut, setReducedFadeOut] = useState(false)

  const rootRef = useRef<HTMLDivElement>(null)
  const sealRef = useRef<HTMLDivElement>(null)
  const wordmarkRef = useRef<HTMLDivElement>(null)
  const gradientRef = useRef<SVGLinearGradientElement>(null)
  const glowRef = useRef<HTMLDivElement>(null)
  const glareRef = useRef<HTMLDivElement>(null)

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

  // Reduced motion: static resting seal, held, then a plain opacity
  // cross-fade — no 3D, no clock, just a timer and a CSS transition.
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

  // The full 3D run.
  useEffect(() => {
    if (!shouldRender || reducedMotion) return
    let cancelled = false

    function applyFrame(elapsed: number) {
      let rotateY: number
      let rotateX: number
      let scale: number
      let translateZ: number
      let opacity: number
      let blur: number
      let gradientAngle: number

      if (elapsed <= PHASE1_END) {
        const t = easeIn(elapsed / PHASE1_END)
        rotateY = lerp(-82, -6, t)
        rotateX = lerp(14, 11, t)
        scale = lerp(0.72, 1, t)
        translateZ = lerp(-260, 0, t)
        opacity = lerp(0, 1, t)
        blur = lerp(6, 0, t)
        gradientAngle = lerp(-24, 18, t)
      } else if (elapsed <= PHASE2_END) {
        // Linear — the metal keeps drifting under the light while
        // everything else holds still; this is the beat meant to be read.
        const t = (elapsed - PHASE1_END) / (PHASE2_END - PHASE1_END)
        rotateY = lerp(-6, 5, t)
        rotateX = 11
        scale = 1
        translateZ = 0
        opacity = 1
        blur = 0
        gradientAngle = 18
      } else {
        const rawT = (elapsed - PHASE2_END) / (TOTAL - PHASE2_END)
        const t = easeOut(rawT)
        rotateY = lerp(5, 96, t)
        rotateX = lerp(11, 6, t)
        scale = lerp(1, 1.28, t)
        translateZ = lerp(0, 180, t)
        // Opacity only starts fading 45% into phase 3, then eases out over
        // its own local window — it turns away and leaves, not shrinks.
        const opacityT = easeOut(clamp01((rawT - 0.45) / 0.55))
        opacity = lerp(1, 0, opacityT)
        blur = 0
        gradientAngle = 18
      }

      const seal = sealRef.current
      if (seal) {
        seal.style.transform = `rotateY(${rotateY}deg) rotateX(${rotateX}deg) scale(${scale}) translateZ(${translateZ}px)`
        seal.style.opacity = String(opacity)
        seal.style.filter = blur > 0.01 ? `blur(${blur}px)` : 'none'
      }
      gradientRef.current?.setAttribute('gradientTransform', `rotate(${gradientAngle})`)

      // Almond ambient glow — grows in with the seal, breathes gently
      // through the hold (one slow pulse, not a loop), fades with it on
      // the way out. All one formula so it never has to be reasoned about
      // as a separate timeline.
      let glowOpacity = opacity * 0.75
      if (elapsed > PHASE1_END && elapsed <= PHASE2_END) {
        const holdT = (elapsed - PHASE1_END) / (PHASE2_END - PHASE1_END)
        glowOpacity = 0.6 + 0.25 * Math.sin(holdT * Math.PI)
      }
      const glow = glowRef.current
      if (glow) glow.style.opacity = String(glowOpacity)

      // Glare: a bright band sweeping across the seal, envelope-shaped
      // (sin) so it fades in and out at each pass rather than snapping.
      let glareOpacity = 0
      let glareX = -160
      if (elapsed >= GLARE1_START && elapsed <= GLARE1_END) {
        const t = clamp01((elapsed - GLARE1_START) / (GLARE1_END - GLARE1_START))
        glareX = lerp(-160, 160, t)
        glareOpacity = Math.sin(t * Math.PI) * 0.7
      } else if (elapsed >= GLARE2_START && elapsed <= GLARE2_END) {
        const t = clamp01((elapsed - GLARE2_START) / (GLARE2_END - GLARE2_START))
        glareX = lerp(-160, 160, t)
        glareOpacity = Math.sin(t * Math.PI) * 0.55
      }
      const glare = glareRef.current
      if (glare) {
        glare.style.transform = `translateX(${glareX}%) rotate(18deg)`
        glare.style.opacity = String(glareOpacity)
      }

      // Wordmark: entrance 700–1600ms, exit starts 200ms before phase 3.
      let wmOpacity = 1
      let wmLetterSpacing = 0.38
      let wmTranslateY = 0
      if (elapsed <= WORDMARK_IN_END) {
        const t = easeIn(clamp01((elapsed - WORDMARK_IN_START) / (WORDMARK_IN_END - WORDMARK_IN_START)))
        wmOpacity = lerp(0, 1, t)
        wmLetterSpacing = lerp(0.62, 0.38, t)
        wmTranslateY = lerp(14, 0, t)
      }
      if (elapsed >= WORDMARK_OUT_START) {
        const t = easeOut(clamp01((elapsed - WORDMARK_OUT_START) / (TOTAL - WORDMARK_OUT_START)))
        wmOpacity = lerp(1, 0, t)
        wmTranslateY = lerp(0, -10, t)
      }
      const wordmark = wordmarkRef.current
      if (wordmark) {
        wordmark.style.opacity = String(wmOpacity)
        wordmark.style.letterSpacing = `${wmLetterSpacing}em`
        wordmark.style.transform = `translateY(${wmTranslateY}px)`
      }

      // Final 650ms: overlay wipes open (upward) while the homepage
      // settles from its held-back scale/opacity to identity.
      if (elapsed >= REVEAL_START) {
        const t = easeOut(clamp01((elapsed - REVEAL_START) / REVEAL_DURATION))
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
          ref={sealRef}
          className={reducedMotion ? `${styles.sealWrap} ${styles.sealRest}` : styles.sealWrap}
        >
          <svg
            className={styles.sealSvg}
            viewBox="-100 -100 200 200"
            aria-hidden="true"
          >
            <defs>
              <path id="novaArcT" d="M -78,0 A 78,78 0 0 1 78,0" fill="none" />
              <path id="novaArcB" d="M -72,0 A 72,72 0 0 0 72,0" fill="none" />
              <linearGradient ref={gradientRef} id="novaMetal" x1=".05" y1="0" x2=".9" y2="1">
                <stop offset="0" stopColor="#c9a874" />
                <stop offset=".3" stopColor="#fff8e8" />
                <stop offset=".55" stopColor="#e8d8be" />
                <stop offset=".8" stopColor="#b0905f" />
                <stop offset="1" stopColor="#f4ebdc" />
              </linearGradient>
            </defs>

            {/* cast shadow */}
            <g transform="translate(2.4,3)" opacity=".5">
              <circle r="92" fill="none" stroke="#2c060b" strokeWidth="1.8" />
              <circle r="86" fill="none" stroke="#2c060b" strokeWidth=".7" />
              <circle r="58" fill="none" stroke="#2c060b" strokeWidth=".7" />
              <g fill="#2c060b" fontFamily="var(--font-seal), serif" fontSize="11.5" letterSpacing="3.4">
                <text>
                  <textPath href="#novaArcT" startOffset="50%" textAnchor="middle">
                    OIL ON CANVAS &middot; BY HAND
                  </textPath>
                </text>
                <text>
                  <textPath href="#novaArcB" startOffset="50%" textAnchor="middle">
                    MARRAKECH &middot; MAROC
                  </textPath>
                </text>
              </g>
              <g fill="none" stroke="#2c060b" strokeWidth="1.8">
                <rect x="-31" y="-31" width="62" height="62" />
                <rect x="-31" y="-31" width="62" height="62" transform="rotate(45)" />
              </g>
              <text
                x="0"
                y="1"
                textAnchor="middle"
                dominantBaseline="central"
                fill="#2c060b"
                fontFamily="var(--font-seal), serif"
                fontSize="46"
              >
                N
              </text>
            </g>

            {/* metal */}
            <g>
              <circle r="92" fill="none" stroke="url(#novaMetal)" strokeWidth="1.8" />
              <circle r="86" fill="none" stroke="url(#novaMetal)" strokeWidth=".7" />
              <circle r="58" fill="none" stroke="url(#novaMetal)" strokeWidth=".7" />
              <g fill="url(#novaMetal)" fontFamily="var(--font-seal), serif" fontSize="11.5" letterSpacing="3.4">
                <text>
                  <textPath href="#novaArcT" startOffset="50%" textAnchor="middle">
                    OIL ON CANVAS &middot; BY HAND
                  </textPath>
                </text>
                <text>
                  <textPath href="#novaArcB" startOffset="50%" textAnchor="middle">
                    MARRAKECH &middot; MAROC
                  </textPath>
                </text>
              </g>
              <g fill="none" stroke="url(#novaMetal)" strokeWidth="1.8">
                <rect x="-31" y="-31" width="62" height="62" />
                <rect x="-31" y="-31" width="62" height="62" transform="rotate(45)" />
              </g>
              <text
                x="0"
                y="1"
                textAnchor="middle"
                dominantBaseline="central"
                fill="url(#novaMetal)"
                fontFamily="var(--font-seal), serif"
                fontSize="46"
              >
                N
              </text>
            </g>
          </svg>

          {!reducedMotion && (
            <div className={styles.glareClip} aria-hidden="true">
              <div ref={glareRef} className={styles.glareBand} />
            </div>
          )}
        </div>

        <div
          ref={wordmarkRef}
          className={reducedMotion ? `${styles.wordmark} ${styles.wordmarkRest}` : styles.wordmark}
        >
          NOVA
        </div>
      </div>
    </div>
  )
}
