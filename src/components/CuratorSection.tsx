'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useLanguage } from '@/i18n/LanguageContext'
import Tilt from './Tilt'
import TrueFocus from './TrueFocus'
import LazyStrands from './LazyStrands'

gsap.registerPlugin(ScrollTrigger)

export default function CuratorSection() {
  const sectionRef  = useRef<HTMLDivElement>(null)
  const portraitRef = useRef<HTMLDivElement>(null)
  const textRef     = useRef<HTMLDivElement>(null)
  const { t } = useLanguage()

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        portraitRef.current,
        { opacity: 0, x: -28 },
        { opacity: 1, x: 0, duration: 0.9, ease: 'power3.out',
          scrollTrigger: { trigger: portraitRef.current, start: 'top 85%', once: true } }
      )
      gsap.fromTo(
        textRef.current,
        { opacity: 0, x: 28 },
        { opacity: 1, x: 0, duration: 0.9, ease: 'power3.out', delay: 0.1,
          scrollTrigger: { trigger: textRef.current, start: 'top 85%', once: true } }
      )
      setTimeout(() => ScrollTrigger.refresh(), 400)
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section
      id="about"
      ref={sectionRef}
      className="bg-parchment/80 py-24 md:py-36 px-6 md:px-12 lg:px-24 scroll-mt-20"
    >
      <div className="max-w-5xl mx-auto">
        <div className="text-center">
          <div className="relative inline-block">
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
            <p className="relative z-10 text-xs uppercase tracking-[0.38em] text-gold font-body mb-16">
              {t.curator.eyebrow}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 items-center">

          {/* Portrait */}
          <div ref={portraitRef}>
            <Tilt className="aspect-[3/4] max-w-[280px] mx-auto md:mx-0 rounded-2xl overflow-hidden shadow-md" max={7}>
              <Image
                src="/curator-portrait.jpg"
                alt={t.curator.eyebrow}
                fill
                sizes="280px"
                className="object-cover"
                priority
              />
              <div
                className="absolute inset-0 rounded-2xl"
                style={{ boxShadow: 'inset 0 0 0 1.5px rgba(200,155,60,0.25)' }}
              />
            </Tilt>
          </div>

          {/* Copy */}
          <div ref={textRef}>
            <h2 className="font-display text-3xl md:text-4xl font-medium text-charcoal leading-snug mb-6">
              {t.curator.headline1}<br />
              <em className="italic font-normal text-gold">{t.curator.headlineItalic}</em>
            </h2>

            <div className="space-y-4 text-[15px] md:text-base leading-relaxed text-charcoal/60 font-body font-light">
              <p>{t.curator.bio1}</p>
              <p>{t.curator.bio2}</p>
              <p>{t.curator.bio3}</p>
            </div>

            <div className="mt-8 font-display text-lg italic text-charcoal/40 font-light flex items-baseline gap-2">
              <span>—</span>
              <TrueFocus
                sentence={t.curator.sign.replace(/^—\s*/, '')}
                manualMode={false}
                playOnce
                startInView
                blurAmount={4}
                borderColor="var(--color-gold)"
                glowColor="rgba(212, 165, 116, 0.55)"
                animationDuration={0.6}
                pauseBetweenAnimations={0.5}
                className="curator-sign"
              />
            </div>

            {/* Stats */}
            <div className="mt-10 pt-8 border-t border-charcoal/10">
              <div className="grid grid-cols-3 gap-4 text-center">
                {t.curator.stats.map(({ val, label }) => (
                  <div key={label}>
                    <p className="font-display text-2xl font-medium text-charcoal">{val}</p>
                    <p className="mt-0.5 text-[11px] uppercase tracking-wider text-charcoal/40 font-body">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
