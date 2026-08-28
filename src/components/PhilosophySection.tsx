'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import dynamic from 'next/dynamic'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useLanguage } from '@/i18n/LanguageContext'
import LazyStrands from './LazyStrands'
import { useIsMobile } from '@/hooks/useIsMobile'

gsap.registerPlugin(ScrollTrigger)

const PhilosophyLogo3D = dynamic(() => import('./PhilosophyLogo3D'), { ssr: false })

const ACCENTS = ['#C89B3C', '#B85C38', '#5B7C6A', '#C89B3C', '#B0557A']

// Kept on the original dark-ink palette by request, unlike the rest of the
// site (which moved to the crimson/almond rebrand). Same scoping technique
// CollectionShowcaseSection uses for its own palette: re-declare the shared
// --color-charcoal(-mid)/--color-canvas tokens locally so bg-charcoal/
// text-canvas below resolve to the pre-rebrand values only inside this
// section, without touching the global tokens everything else still reads.
const ORIGINAL_INK_THEME = {
  '--color-charcoal': '#1A1410',
  '--color-charcoal-mid': '#2C2218',
  '--color-canvas': '#F5F1EB',
} as CSSProperties

function PhilosophyEyebrow({ text, className }: { text: string; className: string }) {
  const isMobile = useIsMobile()
  return (
    <div className="text-center">
      <div className="relative inline-block">
        {!isMobile && (
          <LazyStrands
            className="absolute -inset-x-10 -inset-y-4 pointer-events-none"
            colors={['#C89B3C', '#B85C38', '#5B7C6A']}
            count={3}
            speed={0.35}
            amplitude={0.7}
            waviness={0.9}
            thickness={0.5}
            glow={2}
            taper={4}
            spread={1.2}
            intensity={0.45}
            saturation={0.9}
            opacity={0.45}
            scale={2.2}
          />
        )}
        <p className={`relative z-10 ${className}`}>{text}</p>
      </div>
    </div>
  )
}

export default function PhilosophySection() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const pinRef      = useRef<HTMLDivElement>(null)
  const itemsRef    = useRef<(HTMLDivElement | null)[]>([])
  const dotsRef     = useRef<(HTMLSpanElement | null)[]>([])
  const numRef      = useRef<(HTMLSpanElement | null)[]>([])
  const [reducedMotion, setReducedMotion] = useState(false)
  const [ready, setReady] = useState(false)
  const [show3D, setShow3D] = useState(false)
  const isMobile = useIsMobile()
  const { t } = useLanguage()
  const statements = t.philosophy.statements

  // Same defer-until-near-viewport pattern GalleryScene uses for its own
  // WebGL mount — this section renders on every page load regardless of
  // scroll position, so without this the 3D canvas would open a GL
  // context immediately, stacking on top of SiteBackground's own
  // always-on contexts from the very first paint.
  useEffect(() => {
    if (isMobile || !sectionRef.current) return
    const el = sectionRef.current
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShow3D(true)
          observer.disconnect()
        }
      },
      { rootMargin: '600px 0px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [isMobile])

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mq.matches)
    setReady(true)
  }, [])

  useEffect(() => {
    if (!ready || reducedMotion) return
    const items = itemsRef.current.filter(Boolean) as HTMLDivElement[]
    const dots  = dotsRef.current.filter(Boolean) as HTMLSpanElement[]
    if (items.length < 2) return

    const nums = numRef.current.filter(Boolean) as HTMLSpanElement[]

    const ctx = gsap.context(() => {
      gsap.set(items, { autoAlpha: 0, y: 28 })
      gsap.set(items[0], { autoAlpha: 1, y: 0 })
      gsap.set(dots, { opacity: 0.3, scale: 1 })
      gsap.set(dots[0], { opacity: 1, scale: 1.25 })

      // Numbers start pushed back in depth; the active one sits sharp and
      // forward, as if emerging from behind the heading. No `filter: blur`
      // here (there was originally) — animating CSS blur on several
      // elements every scrub tick, stacked on top of this section's live
      // WebGL canvas and preserve-3d transforms, was expensive enough to
      // visibly stall the pinned scroll on real hardware.
      if (nums.length) {
        gsap.set(nums, { z: -70, opacity: 0.35 })
        gsap.set(nums[0], { z: 0, opacity: 1 })
      }

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: () => `+=${(items.length - 1) * window.innerHeight * 0.9}`,
          scrub: 0.6,
          pin: pinRef.current,
          anticipatePin: 1,
        },
      })

      items.forEach((el, i) => {
        if (i === 0) return
        const step = `step${i}`
        tl.addLabel(step)
          .to(items[i - 1], { autoAlpha: 0, y: -28, duration: 1, ease: 'power2.inOut' }, step)
          .to(el, { autoAlpha: 1, y: 0, duration: 1, ease: 'power2.inOut' }, step)
          .to(dots[i - 1], { opacity: 0.3, scale: 1, duration: 1, ease: 'power2.inOut' }, step)
          .to(dots[i], { opacity: 1, scale: 1.25, duration: 1, ease: 'power2.inOut' }, step)
        if (nums[i - 1] && nums[i]) {
          tl.to(nums[i - 1], { z: -70, opacity: 0.35, duration: 1, ease: 'power2.inOut' }, step)
            .to(nums[i], { z: 0, opacity: 1, duration: 1, ease: 'power2.inOut' }, step)
        }
      })

      setTimeout(() => ScrollTrigger.refresh(), 400)
    }, sectionRef)

    return () => ctx.revert()
  }, [ready, reducedMotion, statements])

  return (
    <section
      id="why"
      ref={sectionRef}
      style={ORIGINAL_INK_THEME}
      className="bg-charcoal/80 scroll-mt-20"
    >
      {reducedMotion ? (
        <div className="py-24 md:py-36 px-6 md:px-12 lg:px-24">
          <div className="max-w-5xl mx-auto">
            <PhilosophyEyebrow
              text={t.philosophy.eyebrow}
              className="text-xs uppercase tracking-[0.38em] text-gold font-body mb-16 md:mb-20 text-center"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-14 lg:gap-20">
              {statements.map((s, i) => (
                <div
                  key={i}
                  className="relative ps-7"
                  style={{ borderInlineStart: `2px solid ${ACCENTS[i]}40` }}
                >
                  <span
                    className="font-body text-xs tracking-[0.22em] uppercase font-medium"
                    style={{ color: ACCENTS[i] }}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <h3 className="mt-2.5 font-display text-2xl md:text-[1.65rem] font-medium text-canvas leading-snug">
                    {s.headline}
                  </h3>
                  <p className="mt-3 text-sm md:text-base leading-relaxed text-canvas/48 font-body font-light">
                    {s.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div ref={pinRef} className="min-h-screen flex flex-col items-center justify-center px-6 md:px-12 lg:px-24">
          <PhilosophyEyebrow
            text={t.philosophy.eyebrow}
            className="text-xs uppercase tracking-[0.38em] text-gold font-body mb-6 text-center"
          />
          {/* Reserves the 3D object's final footprint from the very first
              render, whether or not it has actually mounted yet — the pin
              below measures this section's height once, up front, and
              swapping the canvas in later without changing that height
              means the pin never needs (and never risks) a re-measure
              while it may already be actively engaged mid-scroll. */}
          <div className="mb-8 md:mb-10" style={{ width: 340, height: 340 }}>
            {show3D && <PhilosophyLogo3D />}
          </div>

          <div
            className="relative w-full max-w-2xl"
            style={{ display: 'grid', perspective: 900 }}
          >
            {statements.map((s, i) => (
              <div
                key={i}
                ref={(el) => { itemsRef.current[i] = el }}
                className="text-center"
                style={{ gridRow: 1, gridColumn: 1, transformStyle: 'preserve-3d' }}
              >
                <span
                  ref={(el) => { numRef.current[i] = el }}
                  className="inline-block font-body text-xs tracking-[0.22em] uppercase font-medium"
                  style={{ color: ACCENTS[i], willChange: 'transform, opacity' }}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className="mt-3 font-display text-3xl md:text-4xl font-medium text-canvas leading-snug">
                  {s.headline}
                </h3>
                <p className="mt-4 text-sm md:text-base leading-relaxed text-canvas/48 font-body font-light max-w-lg mx-auto">
                  {s.body}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-14 md:mt-16 flex items-center gap-3" aria-hidden="true">
            {statements.map((_, i) => (
              <span
                key={i}
                ref={(el) => { dotsRef.current[i] = el }}
                className="block w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: ACCENTS[i] }}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
