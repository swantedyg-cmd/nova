'use client'

import { useEffect, useRef, type RefObject } from 'react'

/* ─── Phone counterpart of the 3D silk currents (GalleryWaves). There's no
   WebGL corridor on mobile, so the corridor is suggested instead: a silk
   "ceiling" above the carousel and a silk "floor" below it, each band
   tilted back in CSS 3D perspective toward the cards, so the canvases sit
   in the middle of the waves — the same composition as the desktop
   flythrough, seen from inside.

   Each band is a braid of three twisting ribbons. A ribbon is a filled
   shape whose half-width follows |cos|, so it pinches to a gilded edge
   where it "turns" and widens where it faces you — oat silk on the face,
   gold selvedges, and a gold light sweeping along it.

   Cost stays low: geometry is static SVG; motion is CSS transforms
   (flow loop, sheen sweep, entrance) plus one transform per band for
   swipe parallax. Nothing renders under reduced motion (the parent
   doesn't mount this). */

const W = 600 // one wave period, in SVG units
// The SVG holds PERIODS waves; the plane shows WAVES_ON_SCREEN of them.
// Coverage needed: what's visible + one period of flow + one of swipe
// parallax (wrapped) — 1.6 + 1 + 1 < 6, so there is never an empty edge.
const PERIODS = 6
const WAVES_ON_SCREEN = 1.6
const H = 140
const DRIFT_STYLE = { width: `${(PERIODS / WAVES_ON_SCREEN) * 100}%` }
const STEPS = 240

/** Closed ribbon outline across PERIODS waves (a one-period shift loops). */
function ribbonPath(phase: number, amp: number, width: number) {
  const mid = H / 2
  const top: string[] = []
  const bottom: string[] = []
  for (let s = 0; s <= STEPS; s++) {
    const x = (s / STEPS) * W * PERIODS
    const t = (x / W) * Math.PI * 2
    const y = mid + Math.sin(t + phase) * amp
    // Twist: half-width breathes between a thin edge and the full face.
    const hw = width * (0.12 + 0.88 * Math.abs(Math.cos(t * 0.5 + phase * 0.7)))
    top.push(`${x.toFixed(1)} ${(y - hw).toFixed(1)}`)
    bottom.push(`${x.toFixed(1)} ${(y + hw).toFixed(1)}`)
  }
  return `M${top.join(' L')} L${bottom.reverse().join(' L')} Z`
}

/** Just the upper edge line — drawn in gold as the ribbon's selvedge. */
function edgePath(phase: number, amp: number, width: number, sign: 1 | -1) {
  const mid = H / 2
  const pts: string[] = []
  for (let s = 0; s <= STEPS; s++) {
    const x = (s / STEPS) * W * PERIODS
    const t = (x / W) * Math.PI * 2
    const y = mid + Math.sin(t + phase) * amp
    const hw = width * (0.12 + 0.88 * Math.abs(Math.cos(t * 0.5 + phase * 0.7)))
    pts.push(`${s === 0 ? 'M' : 'L'}${x.toFixed(1)} ${(y + sign * hw).toFixed(1)}`)
  }
  return pts.join(' ')
}

const THIRD = (Math.PI * 2) / 3
const BRAID = [
  { phase: 0,         amp: 36, width: 20, dur: 16 },
  { phase: THIRD,     amp: 32, width: 15, dur: 21 },
  { phase: THIRD * 2, amp: 40, width: 11, dur: 13 },
].map((r) => ({
  ...r,
  body: ribbonPath(r.phase, r.amp, r.width),
  edgeA: edgePath(r.phase, r.amp, r.width, -1),
  edgeB: edgePath(r.phase, r.amp, r.width, 1),
}))

function SilkBand({ id, place }: { id: string; place: 'top' | 'bottom' }) {
  return (
    <div className={`silk-band silk-band--${place}`}>
      {BRAID.map((r, i) => (
        <svg
          key={i}
          className="silk-ribbon absolute inset-y-0 left-0 h-full w-full"
          style={{ animationDuration: `${r.dur}s`, animationDirection: place === 'top' ? 'reverse' : 'normal' }}
          viewBox={`0 0 ${W * PERIODS} ${H}`}
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id={`${id}-oat-${i}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#EADCC0" />
              <stop offset="0.55" stopColor="#D6C09A" />
              <stop offset="1" stopColor="#C9AE80" />
            </linearGradient>
            <linearGradient id={`${id}-sheen-${i}`} x1="0" x2="1" y1="0" y2="0">
              <stop offset="0" stopColor="#F5D07A" stopOpacity="0" />
              <stop offset="0.5" stopColor="#FFF4D6" stopOpacity="0.95" />
              <stop offset="1" stopColor="#F5D07A" stopOpacity="0" />
            </linearGradient>
            <clipPath id={`${id}-clip-${i}`}>
              <path d={r.body} />
            </clipPath>
          </defs>

          {/* oat silk face */}
          <path d={r.body} fill={`url(#${id}-oat-${i})`} opacity={0.92} />
          {/* gilded selvedges */}
          <path d={r.edgeA} fill="none" stroke="#D4A42E" strokeWidth={1.6} vectorEffect="non-scaling-stroke" opacity={0.95} />
          <path d={r.edgeB} fill="none" stroke="#A67C00" strokeWidth={1.2} vectorEffect="non-scaling-stroke" opacity={0.8} />
          {/* gold light sweeping along the ribbon, clipped to its shape */}
          <g clipPath={`url(#${id}-clip-${i})`}>
            <rect
              className="silk-sheen"
              x={0}
              y={0}
              width={W * 0.5}
              height={H}
              fill={`url(#${id}-sheen-${i})`}
              style={{ animationDelay: `${i * 1.3}s` }}
            />
          </g>
        </svg>
      ))}
    </div>
  )
}

export default function MobileSilkWaves({ scrollerRef }: { scrollerRef: RefObject<HTMLDivElement | null> }) {
  const rootRef = useRef<HTMLDivElement>(null)
  const topRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Cinematic entrance: the ceiling and floor fold open and the silk
  // unrolls the first time the carousel comes into view.
  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          root.classList.add('is-in')
          io.disconnect()
        }
      },
      { threshold: 0.25 },
    )
    io.observe(root)
    return () => io.disconnect()
  }, [])

  // Swipe parallax — ceiling and floor drift at different depths.
  useEffect(() => {
    const scroller = scrollerRef.current
    const top = topRef.current
    const bottom = bottomRef.current
    if (!scroller || !top || !bottom) return
    let raf = 0
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const x = scroller.scrollLeft
        // One wave period in px; the silk is periodic, so wrapping the
        // shift by it is seamless — a long swipe never runs off the end.
        const period = top.offsetWidth / PERIODS
        top.style.transform = `translate3d(${-((x * 0.14) % period)}px, 0, 0)`
        bottom.style.transform = `translate3d(${-((x * 0.3) % period)}px, 0, 0)`
      })
    }
    scroller.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      scroller.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [scrollerRef])

  return (
    <div ref={rootRef} aria-hidden="true" className="silk-stage pointer-events-none absolute inset-0">
      <div className="silk-plane silk-plane--top">
        <div ref={topRef} className="silk-drift" style={DRIFT_STYLE}>
          <SilkBand id="silk-top" place="top" />
        </div>
      </div>
      <div className="silk-plane silk-plane--bottom">
        <div ref={bottomRef} className="silk-drift" style={DRIFT_STYLE}>
          <SilkBand id="silk-bottom" place="bottom" />
        </div>
      </div>
    </div>
  )
}
