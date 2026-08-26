'use client'

import { useEffect, useRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useLanguage } from '@/i18n/LanguageContext'
import ElectricBorder from './ElectricBorder'
import Tilt from './Tilt'
import LazyStrands from './LazyStrands'
import { useIsMobile } from '@/hooks/useIsMobile'

gsap.registerPlugin(ScrollTrigger)

const PHONE_INTL = '212710260501'
const EMAIL = 'swantedyg@gmail.com'
const SITE_URL = 'https://nova.vercel.app'

function QRCard({
  value, label, sub, scanHint, floatDelay, featured = false,
}: {
  value: string
  label: string
  sub: string
  scanHint: string
  floatDelay: string
  featured?: boolean
}) {
  return (
    <div className="qr-float" style={{ animationDelay: floatDelay }}>
      <Tilt className="rounded-3xl" max={featured ? 11 : 9} scale={featured ? 1.03 : 1.02}>
        <ElectricBorder
          color="var(--color-electric-gold)"
          chaos={featured ? 0.18 : 0.1}
          speed={featured ? 0.75 : 0.55}
          borderRadius={24}
        >
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${label} — ${sub}`}
            className={`block rounded-3xl px-8 py-9 flex flex-col items-center text-center w-64 cursor-pointer active:scale-[0.97] transition-transform duration-150 ${
              featured ? 'bg-gradient-to-b from-gold/12 via-canvas to-canvas' : 'bg-canvas'
            }`}
          >
            {featured && (
              <span className="mb-4 text-[10px] uppercase tracking-[0.24em] text-gold font-body font-medium">
                {scanHint.split('—')[0].trim()}
              </span>
            )}
            <div className={`rounded-2xl bg-white shadow-inner pointer-events-none ${featured ? 'p-3.5' : 'p-3'}`}>
              <QRCodeSVG
                value={value}
                size={featured ? 184 : 168}
                level="Q"
                bgColor="#FFFFFF"
                fgColor="#5A1220"
                imageSettings={{
                  src: '/logo-mark.svg',
                  height: featured ? 38 : 34,
                  width: featured ? 38 : 34,
                  excavate: true,
                }}
              />
            </div>
            <p className={`mt-5 font-display font-medium text-charcoal ${featured ? 'text-xl' : 'text-lg'}`}>{label}</p>
            <p className="mt-1 text-sm text-charcoal/50 font-body italic">{sub}</p>
            {!featured && (
              <p className="mt-3 text-[10px] uppercase tracking-[0.2em] text-gold/80 font-body">{scanHint}</p>
            )}
          </a>
        </ElectricBorder>
      </Tilt>
    </div>
  )
}

export default function CarteSection() {
  const isMobile = useIsMobile()
  const sectionRef = useRef<HTMLDivElement>(null)
  const headRef    = useRef<HTMLDivElement>(null)
  const { t } = useLanguage()
  const c = t.carte

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        headRef.current,
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out',
          scrollTrigger: { trigger: headRef.current, start: 'top 88%', once: true } }
      )
      setTimeout(() => ScrollTrigger.refresh(), 400)
    }, sectionRef)
    return () => ctx.revert()
  }, [])

  return (
    <section
      id="carte"
      ref={sectionRef}
      className="relative bg-parchment/80 py-24 md:py-32 px-6 overflow-hidden scroll-mt-20"
    >
      <div ref={headRef} className="max-w-2xl mx-auto text-center mb-16">
        <div className="relative inline-block">
          {!isMobile && (
            <LazyStrands
              className="absolute -inset-x-10 -inset-y-4 pointer-events-none"
              colors={['#C89B3C', '#D4A574']}
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
          <p className="relative z-10 text-xs uppercase tracking-[0.38em] text-gold font-body mb-2">{c.eyebrow}</p>
        </div>
        <h2 className="font-display text-4xl md:text-5xl font-medium text-charcoal">{c.heading}</h2>
        <p className="mt-4 text-charcoal/50 font-body font-light leading-relaxed text-sm md:text-base">
          {c.subheading}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-10 md:gap-16" style={{ perspective: 1200 }}>
        <QRCard
          value={SITE_URL}
          label={c.cardWebsiteLabel}
          sub={c.cardWebsiteSub}
          scanHint={c.scanHint}
          floatDelay="0s"
          featured
        />
        <QRCard
          value={`https://wa.me/${PHONE_INTL}`}
          label={c.cardWhatsappLabel}
          sub={c.cardWhatsappSub}
          scanHint={c.scanHint}
          floatDelay="1.7s"
        />
        <QRCard
          value={`mailto:${EMAIL}`}
          label={c.cardEmailLabel}
          sub={c.cardEmailSub}
          scanHint={c.scanHint}
          floatDelay="3.4s"
        />
      </div>
    </section>
  )
}
