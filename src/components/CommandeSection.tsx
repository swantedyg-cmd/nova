'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useLanguage } from '@/i18n/LanguageContext'
import { useCart } from '@/context/CartContext'
import { MOROCCO_CITIES } from '@/data/cities'
import { PIECES, formatSize } from '@/data/catalogue'
import { formatDH } from './CartDrawer'
import OrderCertificate, { makeOrderReference, type CertificateData } from './OrderCertificate'
import LazyStrands from './LazyStrands'
import { useIsMobile } from '@/hooks/useIsMobile'

gsap.registerPlugin(ScrollTrigger)

const PHONE_RAW = '0688873673'
const PHONE_INTL = '212' + PHONE_RAW.slice(1)
const PHONE_DISPLAY = PHONE_RAW.replace(/(\d{2})(?=\d)/g, '$1 ').trim()

export default function CommandeSection() {
  const isMobile = useIsMobile()
  const sectionRef = useRef<HTMLDivElement>(null)
  const headRef    = useRef<HTMLDivElement>(null)
  const { t, lang } = useLanguage()
  const c = t.commande
  const { cartItems, removeFromCart } = useCart()

  const [name, setName]       = useState('')
  const [phone, setPhone]     = useState('')
  const [city, setCity]       = useState('')
  const [zip, setZip]         = useState('')
  const [address, setAddress] = useState('')
  const [certificate, setCertificate] = useState<CertificateData | null>(null)
  const closeCertificate = useCallback(() => setCertificate(null), [])

  const cartPieces = cartItems
    .map((id) => {
      const index = PIECES.findIndex((p) => p.id === id)
      return index >= 0 ? { ...PIECES[index], index } : null
    })
    .filter((p): p is NonNullable<typeof p> => p !== null)

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

  const handleCityChange = (value: string) => {
    setCity(value)
    const match = MOROCCO_CITIES.find((ct) => ct.name === value)
    setZip(match ? match.zip : '')
  }

  const total = cartPieces.reduce((sum, p) => sum + p.price, 0)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const reference = makeOrderReference()
    const pieceLines = cartPieces
      .map((p) => `• ${String(p.index + 1).padStart(2, '0')} — ${p.theme} — ${formatSize(p, lang)} — ${formatDH(p.price)}`)
      .join('\n')
    const lines = [
      `Nova — ${c.formTitle}`,
      `${c.waRef} ${reference}\n`,
      name && `${c.formName}: ${name}`,
      phone && `${c.formPhone}: ${phone}`,
      city && `${c.formCity}: ${city} (${zip})`,
      address && `${c.formAddress}: ${address}`,
      pieceLines && `\n${c.formPiece}:\n${pieceLines}`,
      cartPieces.length > 0 && `${c.formTotal}: ${formatDH(total)}`,
    ].filter(Boolean).join('\n')
    const whatsappUrl = `https://wa.me/${PHONE_INTL}?text=${encodeURIComponent(lines)}`
    window.open(whatsappUrl, '_blank')
    setCertificate({ reference, date: new Date(), name, pieces: cartPieces, total, whatsappUrl })
  }

  return (
    <section
      id="commande"
      ref={sectionRef}
      className="relative bg-canvas py-24 md:py-32 px-6 md:px-12 lg:px-24 scroll-mt-20"
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
          <p className="relative z-10 text-xs uppercase tracking-[0.38em] text-gold font-body mb-2">{c.eyebrow}</p>
        </div>
        <h2 className="font-display text-4xl md:text-5xl font-medium text-charcoal">{c.heading}</h2>
        <p className="mt-4 text-charcoal/50 font-body font-light leading-relaxed text-sm md:text-base">
          {c.subheading}
        </p>
      </div>

      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-start">
        {/* Steps + direct contact */}
        <div>
          <ol className="space-y-8">
            {c.steps.map((step, i) => (
              <li key={step.title} className="flex gap-4">
                <span className="flex-shrink-0 w-9 h-9 rounded-full border border-gold/50 text-gold font-display flex items-center justify-center text-sm">
                  {i + 1}
                </span>
                <div>
                  <p className="font-display text-lg text-charcoal font-medium">{step.title}</p>
                  <p className="mt-1 text-sm text-charcoal/55 font-body font-light leading-relaxed">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-10 pt-8 border-t border-charcoal/10">
            <p className="text-xs uppercase tracking-[0.2em] text-charcoal/40 font-body mb-3">{c.phoneLabel}</p>
            <div className="flex flex-wrap gap-3">
              <a
                href={`https://wa.me/${PHONE_INTL}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-charcoal px-5 py-2.5 text-xs font-medium tracking-wide text-canvas hover:bg-charcoal-mid transition-colors"
              >
                {c.whatsappCta}
              </a>
              <a
                href={`tel:+${PHONE_INTL}`}
                className="rounded-full border border-charcoal/25 px-5 py-2.5 text-xs font-medium tracking-wide text-charcoal hover:border-charcoal/50 transition-colors"
              >
                {c.callCta} · {PHONE_DISPLAY}
              </a>
            </div>
          </div>

          {/* Cities */}
          <div className="mt-10 pt-8 border-t border-charcoal/10">
            <p className="text-xs uppercase tracking-[0.2em] text-charcoal/40 font-body mb-1.5">{c.citiesTitle}</p>
            <p className="text-xs text-charcoal/40 font-body font-light mb-4">{c.citiesNote}</p>
            <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto pr-2">
              {MOROCCO_CITIES.map((ct) => (
                <span
                  key={ct.name}
                  className="rounded-full border border-charcoal/12 px-2.5 py-1 text-[11px] text-charcoal/55 font-body"
                >
                  {ct.name}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Order form */}
        <form
          onSubmit={handleSubmit}
          dir={lang === 'ar' ? 'rtl' : 'ltr'}
          className="rounded-2xl border border-charcoal/10 bg-parchment/60 p-6 md:p-8 shadow-sm"
        >
          <p className="font-display text-xl text-charcoal font-medium mb-6">{c.formTitle}</p>

          <div className="space-y-4">
            <Field label={c.formName} value={name} onChange={setName} required />
            <Field label={c.formPhone} value={phone} onChange={setPhone} type="tel" required />

            <div>
              <label className="block text-xs uppercase tracking-wider text-charcoal/45 font-body mb-1.5">
                {c.formCity}
              </label>
              <select
                required
                value={city}
                onChange={(e) => handleCityChange(e.target.value)}
                className="w-full rounded-lg border border-charcoal/15 bg-canvas px-3.5 py-2.5 text-sm text-charcoal font-body focus:outline-none focus:border-gold/60"
              >
                <option value="">{c.formCitySelect}</option>
                {MOROCCO_CITIES.map((ct) => (
                  <option key={ct.name} value={ct.name}>{ct.name}</option>
                ))}
              </select>
            </div>

            <Field label={c.formZip} value={zip} onChange={setZip} />
            <Field label={c.formAddress} value={address} onChange={setAddress} />

            <div>
              <label className="block text-xs uppercase tracking-wider text-charcoal/45 font-body mb-1.5">
                {c.formPiece}
              </label>
              {cartPieces.length === 0 ? (
                <p className="rounded-lg border border-dashed border-charcoal/20 bg-canvas px-3.5 py-3 text-sm text-charcoal/40 font-body">
                  {c.formPiecePlaceholder}
                </p>
              ) : (
                <div className="rounded-lg border border-charcoal/15 bg-canvas overflow-hidden">
                  <ul className="divide-y divide-charcoal/10">
                    {cartPieces.map((p) => (
                      <li key={p.id} className="flex items-center gap-3 px-3.5 py-2.5 text-sm">
                        <div className="flex-shrink-0 rounded-[2px] bg-gold p-[2px]">
                          <div className="relative h-11 w-8 overflow-hidden rounded-[1px]">
                            {p.image && <Image src={`/images/${p.image}`} alt="" fill sizes="32px" className="object-cover" />}
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-charcoal font-body truncate">
                            <span className="text-charcoal/40">{String(p.index + 1).padStart(2, '0')} — </span>
                            <span lang="fr">{p.theme}</span>
                          </p>
                          <p className="text-[11px] text-charcoal/45 font-body" dir="ltr">{formatSize(p, lang)}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-xs text-charcoal/80 font-body" dir="ltr">{formatDH(p.price)}</span>
                          <button
                            type="button"
                            onClick={() => removeFromCart(p.id)}
                            aria-label={`${t.cart.remove} — ${p.theme}`}
                            className="text-charcoal/30 hover:text-charcoal/70 transition-colors"
                          >
                            ✕
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <div className="flex items-baseline justify-between border-t border-dashed border-charcoal/15 bg-parchment/40 px-3.5 py-3">
                    <span className="text-xs uppercase tracking-wider text-charcoal/50 font-body">{c.formTotal}</span>
                    <span className="font-display text-lg text-charcoal" dir="ltr">{formatDH(total)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            className="mt-6 w-full rounded-full bg-charcoal py-3 text-xs font-medium tracking-wide text-canvas hover:bg-charcoal-mid transition-colors active:scale-[0.98]"
          >
            {c.formSubmit}
          </button>
          <p className="mt-2.5 text-center text-[11px] text-charcoal/45 font-body">{c.formNote}</p>
        </form>
      </div>

      <OrderCertificate data={certificate} onClose={closeCertificate} />
    </section>
  )
}

function Field({
  label, value, onChange, type = 'text', required = false, placeholder = '',
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  required?: boolean
  placeholder?: string
}) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-wider text-charcoal/45 font-body mb-1.5">{label}</label>
      <input
        type={type}
        required={required}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-charcoal/15 bg-canvas px-3.5 py-2.5 text-sm text-charcoal font-body focus:outline-none focus:border-gold/60"
      />
    </div>
  )
}
