'use client'

import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useLanguage } from '@/i18n/LanguageContext'

gsap.registerPlugin(ScrollTrigger)

const PHONE_INTL = '212710260501'

interface Fleck {
  left: number
  bottom: number
  duration: number
  delay: number
  dx: number
}

function makeFlecks(count: number): Fleck[] {
  return Array.from({ length: count }, () => ({
    left: Math.random() * 100,
    bottom: -10 - Math.random() * 20,
    duration: 9 + Math.random() * 8,
    delay: Math.random() * 12,
    dx: (Math.random() - 0.5) * 60,
  }))
}

export default function CtaSection() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [flecks, setFlecks] = useState<Fleck[]>([])
  const { t } = useLanguage()
  const c = t.ctaFinal

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!reduced) setFlecks(makeFlecks(9))
  }, [])

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        contentRef.current,
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out',
          scrollTrigger: { trigger: contentRef.current, start: 'top 85%', once: true } }
      )
      setTimeout(() => ScrollTrigger.refresh(), 400)
    }, sectionRef)
    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden bg-charcoal py-28 md:py-36 px-6 text-center"
      style={{
        background: 'radial-gradient(ellipse 120% 80% at 50% 0%, #241d16 0%, #17140f 100%)',
        isolation: 'isolate',
      }}
    >
      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 60% 50% at 50% 40%, transparent 0%, #17140f 90%)',
          zIndex: 1,
        }}
      />

      {/* Drifting gold flecks */}
      <div className="absolute inset-0" style={{ zIndex: 0 }} aria-hidden="true">
        {flecks.map((f, i) => (
          <span
            key={i}
            className="absolute rounded-full"
            style={{
              width: 3,
              height: 3,
              left: `${f.left}%`,
              bottom: f.bottom,
              background: 'var(--color-gold)',
              boxShadow: '0 0 6px 1px rgba(200,155,60,0.35)',
              animationName: 'ctaFleckDrift',
              animationTimingFunction: 'ease-in-out',
              animationIterationCount: 'infinite',
              animationDuration: `${f.duration}s`,
              animationDelay: `${f.delay}s`,
              // @ts-expect-error -- custom property consumed by keyframes below
              '--dx': `${f.dx}px`,
            }}
          />
        ))}
      </div>

      <div ref={contentRef} className="relative max-w-xl mx-auto" style={{ zIndex: 3 }}>
        <span className="inline-flex items-center gap-3 text-xs uppercase tracking-[0.32em] text-gold font-body mb-6">
          <span className="w-7 h-px bg-gold/35" />
          {c.eyebrow}
          <span className="w-7 h-px bg-gold/35" />
        </span>

        <h2 className="font-display text-4xl md:text-5xl font-medium text-canvas leading-[1.15]">
          {c.headline1}<br />
          <em className="italic font-medium text-gold">{c.headlineItalic}</em>
        </h2>

        <p className="mt-6 text-base text-canvas/65 font-body font-light leading-relaxed max-w-sm mx-auto">
          {c.sub}
        </p>

        <a
          href={`https://wa.me/${PHONE_INTL}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-10 inline-flex items-center gap-2.5 rounded-sm border border-gold px-9 py-3.5 text-sm uppercase tracking-[0.08em] text-canvas transition-all duration-300 ease-out hover:bg-gold hover:text-charcoal-mid"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden="true">
            <path d="M17.6 6.32A7.85 7.85 0 0 0 12.05 4a7.94 7.94 0 0 0-6.9 11.9L4 20l4.2-1.1a7.9 7.9 0 0 0 3.85 1h.01a7.94 7.94 0 0 0 5.54-13.58zm-5.55 12.2h-.01a6.6 6.6 0 0 1-3.36-.92l-.24-.14-2.5.65.67-2.44-.16-.25a6.6 6.6 0 1 1 12.24-3.5 6.6 6.6 0 0 1-6.64 6.6zm3.62-4.94c-.2-.1-1.17-.58-1.35-.64s-.32-.1-.45.1-.5.64-.62.77-.23.15-.43.05a5.4 5.4 0 0 1-1.6-.98 6 6 0 0 1-1.1-1.38c-.12-.2 0-.3.09-.4.09-.1.2-.23.3-.35.1-.12.13-.2.2-.33a.36.36 0 0 0-.02-.35c-.05-.1-.45-1.08-.62-1.48s-.33-.33-.45-.34h-.38a.74.74 0 0 0-.53.25 2.24 2.24 0 0 0-.7 1.66c0 .98.71 1.93.81 2.06s1.4 2.14 3.4 3 2 .58 2.36.55c.36-.03 1.17-.48 1.34-.94s.17-.86.12-.94-.18-.14-.38-.24z" />
          </svg>
          {t.commande.whatsappCta}
        </a>

        <p className="mt-9 text-xs uppercase tracking-[0.15em] text-canvas/40 font-body">
          {c.foot}
        </p>
      </div>

      <style>{`
        @keyframes ctaFleckDrift {
          0%   { opacity: 0; transform: translateY(0) translateX(0); }
          10%  { opacity: 0.8; }
          50%  { opacity: 0.5; }
          90%  { opacity: 0.7; }
          100% { opacity: 0; transform: translateY(-90px) translateX(var(--dx, 20px)); }
        }
      `}</style>
    </section>
  )
}
