'use client'

import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useLanguage } from '@/i18n/LanguageContext'
import Tilt from './Tilt'
import LazyStrands from './LazyStrands'
import { useIsMobile } from '@/hooks/useIsMobile'

gsap.registerPlugin(ScrollTrigger)

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" role="img" aria-label={`${rating} / 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          viewBox="0 0 20 20"
          width="15"
          height="15"
          aria-hidden="true"
          fill={i < rating ? 'var(--color-gold)' : 'none'}
          stroke={i < rating ? 'none' : 'currentColor'}
          strokeWidth={1.3}
          className={i < rating ? '' : 'text-charcoal/20'}
        >
          <path d="M10 1.3l2.55 5.78 6.22.58-4.72 4.15 1.4 6.1L10 14.9l-5.45 2.99 1.4-6.1L1.23 7.66l6.22-.58L10 1.3z" />
        </svg>
      ))}
    </div>
  )
}

export default function TestimonialsSection() {
  const isMobile = useIsMobile()
  const sectionRef = useRef<HTMLDivElement>(null)
  const headRef    = useRef<HTMLDivElement>(null)
  const gridRef     = useRef<HTMLDivElement>(null)
  const { t } = useLanguage()
  const c = t.testimonials

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        headRef.current,
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out',
          scrollTrigger: { trigger: headRef.current, start: 'top 88%', once: true } }
      )
      const cards = gridRef.current?.children
      if (cards?.length) {
        gsap.fromTo(
          cards,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', stagger: 0.1,
            scrollTrigger: { trigger: gridRef.current, start: 'top 88%', once: true } }
        )
      }
      setTimeout(() => ScrollTrigger.refresh(), 400)
    }, sectionRef)
    return () => ctx.revert()
  }, [c.items])

  return (
    <section
      id="avis"
      ref={sectionRef}
      className="bg-parchment/70 py-24 md:py-32 px-6 md:px-12 lg:px-24 scroll-mt-20"
    >
      <div ref={headRef} className="max-w-2xl mx-auto text-center mb-16">
        <div className="relative inline-block">
          {!isMobile && (
            <LazyStrands
              className="absolute -inset-x-10 -inset-y-4 pointer-events-none"
              colors={['#C89B3C', '#B85C38']}
              count={2}
              speed={0.35}
              amplitude={0.65}
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
          )}
          <p className="relative z-10 text-xs uppercase tracking-[0.38em] text-gold font-body mb-2">
            {c.eyebrow}
          </p>
        </div>
        <h2 className="font-display text-4xl md:text-5xl font-medium text-charcoal leading-snug">
          {c.headline1}<br />
          <em className="italic font-normal text-gold">{c.headlineItalic}</em>
        </h2>
        <p className="mt-4 text-charcoal/50 font-body font-light leading-relaxed text-sm md:text-base">
          {c.sub}
        </p>
      </div>

      <div
        ref={gridRef}
        className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-7"
      >
        {c.items.map((review) => (
          <Tilt key={`${review.name}-${review.city}`} max={4} scale={1.012} gloss={false} className="h-full">
            <div className="h-full flex flex-col rounded-2xl border border-charcoal/10 bg-canvas/70 p-6 md:p-7 shadow-sm">
              <span aria-hidden="true" className="font-display text-4xl text-gold/35 leading-none">&ldquo;</span>
              <div className="mt-2">
                <StarRow rating={review.rating} />
              </div>
              <p className="mt-4 text-sm md:text-[15px] leading-relaxed text-charcoal/70 font-body font-light flex-1">
                {review.quote}
              </p>
              <div className="mt-6 pt-4 border-t border-charcoal/10 flex items-center justify-between gap-3">
                <div>
                  <p className="font-display text-base text-charcoal font-medium">{review.name}</p>
                  <p className="mt-0.5 text-xs text-charcoal/45 font-body uppercase tracking-wide">{review.city}</p>
                </div>
                <span className="flex-shrink-0 inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-sage font-body">
                  <span aria-hidden="true">✓</span>
                  {c.verifiedBadge}
                </span>
              </div>
            </div>
          </Tilt>
        ))}
      </div>
    </section>
  )
}
