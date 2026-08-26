'use client'

import { useRef, useEffect, useCallback } from 'react'
import gsap from 'gsap'

interface TiltProps {
  children: React.ReactNode
  className?: string
  max?: number
  scale?: number
  gloss?: boolean
}

/* Restrained tilt-on-hover: perspective + rotateX/rotateY driven by cursor
   position within the element, spring-eased via GSAP quickTo, plus an
   optional moving gloss highlight. No-ops on touch input and when the
   user prefers reduced motion. */
export default function Tilt({ children, className = '', max = 7, scale = 1.015, gloss = true }: TiltProps) {
  const elRef = useRef<HTMLDivElement>(null)
  const glossRef = useRef<HTMLDivElement>(null)
  const quick = useRef<{ x: (v: number) => void; y: (v: number) => void; s: (v: number) => void } | null>(null)
  const reduced = useRef(false)
  // rAF-throttles the pointermove handler: pointermove can fire faster than
  // the display refreshes, and each event was doing a synchronous
  // getBoundingClientRect() layout read — batching both that and the GSAP
  // update to once per frame is the actual win, not just the GSAP calls.
  const ticking = useRef(false)
  const lastPoint = useRef<{ x: number; y: number; target: HTMLDivElement } | null>(null)

  useEffect(() => {
    reduced.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const el = elRef.current
    if (!el || reduced.current) return
    gsap.set(el, { transformPerspective: 1000 })
    quick.current = {
      x: gsap.quickTo(el, 'rotationX', { duration: 0.5, ease: 'power3.out' }),
      y: gsap.quickTo(el, 'rotationY', { duration: 0.5, ease: 'power3.out' }),
      s: gsap.quickTo(el, 'scale', { duration: 0.5, ease: 'power3.out' }),
    }
  }, [])

  const handleMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (reduced.current || e.pointerType !== 'mouse' || !quick.current) return
    lastPoint.current = { x: e.clientX, y: e.clientY, target: e.currentTarget }
    if (ticking.current) return
    ticking.current = true
    requestAnimationFrame(() => {
      ticking.current = false
      const point = lastPoint.current
      if (!point || !quick.current) return
      const rect = point.target.getBoundingClientRect()
      const px = (point.x - rect.left) / rect.width
      const py = (point.y - rect.top) / rect.height
      quick.current.x(-(py - 0.5) * 2 * max)
      quick.current.y((px - 0.5) * 2 * max)
      quick.current.s(scale)
      if (gloss && glossRef.current) {
        glossRef.current.style.backgroundPosition = `${px * 100}% ${py * 100}%`
        glossRef.current.style.opacity = '0.22'
      }
    })
  }, [max, scale, gloss])

  const handleLeave = useCallback(() => {
    quick.current?.x(0)
    quick.current?.y(0)
    quick.current?.s(1)
    if (glossRef.current) glossRef.current.style.opacity = '0'
  }, [])

  return (
    <div
      ref={elRef}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      className={`relative ${className}`}
      style={{ willChange: 'transform' }}
    >
      {children}
      {gloss && (
        <div
          ref={glossRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-300"
          style={{
            opacity: 0,
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0) 55%)',
            backgroundSize: '180% 180%',
            backgroundRepeat: 'no-repeat',
            mixBlendMode: 'overlay',
          }}
        />
      )}
    </div>
  )
}
