'use client'

import { useEffect, useRef, type RefObject } from 'react'

/* ─── Phone counterpart of the 3D silk currents (GalleryWaves) — there's no
   WebGL corridor on mobile, so the same idea is drawn as a braid of three
   SVG ribbons (oat between two golds) flowing behind the swipe carousel.

   Cheap by construction: each ribbon loops by translating a path drawn two
   periods wide (compositor-only CSS animation, no per-frame JS), and the
   carousel's swipe only nudges one wrapper's transform for parallax. The
   three ribbons share a period but are phase-shifted a third of a wave, so
   they cross and touch — braided, like the desktop currents. */

const W = 600 // one wave period, in SVG units
const H = 120

// A smooth sine-like ribbon centreline across two periods (so translating
// by exactly one period loops seamlessly).
function wavePath(phase: number, amp: number) {
  const mid = H / 2
  const pts: string[] = []
  const steps = 48
  for (let s = 0; s <= steps; s++) {
    const x = (s / steps) * W * 2
    const y = mid + Math.sin((x / W) * Math.PI * 2 + phase) * amp
    pts.push(`${s === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`)
  }
  return pts.join(' ')
}

const RIBBONS = [
  { d: wavePath(0, 34),                 stroke: 'url(#silk-gold)', width: 9,  opacity: 0.75, dur: 14 },
  { d: wavePath((Math.PI * 2) / 3, 30), stroke: 'url(#silk-oat)',  width: 13, opacity: 0.85, dur: 18 },
  { d: wavePath((Math.PI * 4) / 3, 36), stroke: 'url(#silk-gold)', width: 5,  opacity: 0.6,  dur: 11 },
]

export default function MobileSilkWaves({ scrollerRef }: { scrollerRef: RefObject<HTMLDivElement | null> }) {
  const driftRef = useRef<HTMLDivElement>(null)

  // Swipe parallax: the silk slides a quarter as fast as the cards.
  useEffect(() => {
    const scroller = scrollerRef.current
    const drift = driftRef.current
    if (!scroller || !drift) return
    let raf = 0
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        drift.style.transform = `translate3d(${-scroller.scrollLeft * 0.25}px, 0, 0)`
      })
    }
    scroller.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      scroller.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [scrollerRef])

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-4 h-40 overflow-hidden">
      <div ref={driftRef} className="absolute inset-y-0 left-0 w-[300%] will-change-transform">
        {RIBBONS.map((r, i) => (
          <svg
            key={i}
            className="silk-ribbon absolute inset-y-0 left-0 h-full"
            style={{ width: '100%', animationDuration: `${r.dur}s` }}
            viewBox={`0 0 ${W * 2} ${H}`}
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="silk-gold" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0" stopColor="#F5D07A" />
                <stop offset="0.5" stopColor="#D4A42E" />
                <stop offset="1" stopColor="#F5D07A" />
              </linearGradient>
              <linearGradient id="silk-oat" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0" stopColor="#E4D3B1" />
                <stop offset="0.5" stopColor="#D6C09A" />
                <stop offset="1" stopColor="#E4D3B1" />
              </linearGradient>
            </defs>
            <path d={r.d} fill="none" stroke={r.stroke} strokeWidth={r.width} strokeLinecap="round" opacity={r.opacity} vectorEffect="non-scaling-stroke" />
          </svg>
        ))}
      </div>
    </div>
  )
}
