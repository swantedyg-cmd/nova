'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { X } from 'lucide-react'
import { useLanguage } from '@/i18n/LanguageContext'
import { formatSize, type Piece } from '@/data/catalogue'
import { formatDH } from './CartDrawer'

export interface CertificateData {
  reference: string
  date: Date
  name: string
  pieces: (Piece & { index: number })[]
  total: number
  whatsappUrl: string
}

const EXPO_OUT = [0.16, 1, 0.3, 1] as const

// A ring of gold sparks bursting once from behind the seal.
const SPARKS = Array.from({ length: 14 }, (_, i) => {
  const a = (i / 14) * Math.PI * 2
  const r = 70 + (i % 3) * 22
  return { x: Math.cos(a) * r, y: Math.sin(a) * r, s: 3 + (i % 3), d: (i % 4) * 0.05 }
})

/** "NOVA-261011-K7Q2" — date stamp + 4 unambiguous characters. */
export function makeOrderReference(now = new Date()) {
  const yy = String(now.getFullYear()).slice(2)
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let tail = ''
  for (let i = 0; i < 4; i++) tail += alphabet[Math.floor(Math.random() * alphabet.length)]
  return `NOVA-${yy}${mm}${dd}-${tail}`
}

/* ─── The moment after "Envoyer sur WhatsApp": a certificate of curation,
   the keepsake a client remembers Nova by — their own reference, their
   pieces, and the house signature. ─────────────────────────────────────── */
export default function OrderCertificate({ data, onClose }: { data: CertificateData | null; onClose: () => void }) {
  const { t, lang } = useLanguage()
  const c = t.commande
  const reduce = useReducedMotion() ?? false
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!data) return
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [data, onClose])

  const firstName = data?.name.trim().split(/\s+/)[0] ?? ''
  const locale = lang === 'ar' ? 'ar-MA' : lang === 'en' ? 'en-GB' : 'fr-FR'

  return (
    <AnimatePresence>
      {data && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-charcoal/55 p-4 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="nova-cert-title"
            dir={lang === 'ar' ? 'rtl' : 'ltr'}
            onClick={(e) => e.stopPropagation()}
            className="relative my-auto w-full max-w-md rounded-[20px] p-[1.5px] shadow-[0_40px_90px_-20px_rgba(26,10,13,0.55)]"
            style={{ background: 'linear-gradient(135deg, #F5D07A, #A67C00 35%, #F5D07A 55%, #D4A42E)' }}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 40, scale: 0.92, filter: 'blur(12px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.9, ease: EXPO_OUT }}
          >
            <div
              className="relative overflow-hidden rounded-[18.5px] px-7 pt-8 pb-7 text-center"
              style={{ background: 'radial-gradient(120% 70% at 50% 0%, rgba(245,208,122,0.22), transparent 60%), #FAF7F2' }}
            >
              {/* inner hairline — the certificate's printed border */}
              <div aria-hidden="true" className="pointer-events-none absolute inset-2.5 rounded-[14px] border border-gold/35" />

              <button
                ref={closeRef}
                type="button"
                onClick={onClose}
                aria-label={c.thankClose}
                className="absolute end-4 top-4 z-10 grid size-8 place-items-center rounded-full text-charcoal/45 transition-colors hover:bg-charcoal/5 hover:text-charcoal"
              >
                <X className="size-4" />
              </button>

              {/* Seal + spark burst */}
              <div className="relative mx-auto h-[76px] w-[93px]">
                {!reduce && SPARKS.map((s, i) => (
                  <motion.span
                    key={i}
                    aria-hidden="true"
                    className="absolute left-1/2 top-1/2 rounded-full bg-[#F5D07A]"
                    style={{ width: s.s, height: s.s, marginLeft: -s.s / 2, marginTop: -s.s / 2 }}
                    initial={{ x: 0, y: 0, opacity: 0, scale: 0.4 }}
                    animate={{ x: s.x, y: s.y, opacity: [0, 1, 0], scale: [0.4, 1, 0.6] }}
                    transition={{ duration: 1.4, delay: 0.45 + s.d, ease: EXPO_OUT }}
                  />
                ))}
                <motion.div
                  initial={reduce ? false : { scale: 0.6, rotate: -12, opacity: 0 }}
                  animate={{ scale: 1, rotate: 0, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 220, damping: 15, delay: 0.3 }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/nova-logo-icon.png" alt="Nova" width={93} height={76} />
                </motion.div>
              </div>

              <motion.div
                initial={reduce ? false : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.55, ease: EXPO_OUT }}
              >
                <p className="mt-4 text-[10px] uppercase tracking-[0.34em] text-[var(--color-nova-gold-deep)] font-body font-semibold">
                  {c.thankEyebrow}
                </p>
                <h2 id="nova-cert-title" className="mt-2 font-display text-3xl italic text-charcoal">
                  {c.thankTitle}{firstName ? `, ${firstName}` : ''}
                </h2>
                <p className="mx-auto mt-3 max-w-xs font-body text-sm leading-relaxed text-charcoal/65">{c.thankBody}</p>
              </motion.div>

              {/* Reference + date */}
              <motion.dl
                className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-gold/30 bg-gold/25 text-start"
                initial={reduce ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.75, ease: EXPO_OUT }}
              >
                <div className="bg-[#FAF7F2] px-4 py-3">
                  <dt className="text-[10px] uppercase tracking-[0.2em] text-charcoal/45 font-body">{c.thankRef}</dt>
                  <dd className="mt-1 font-mono text-[13px] tracking-wide text-charcoal" dir="ltr">{data.reference}</dd>
                </div>
                <div className="bg-[#FAF7F2] px-4 py-3">
                  <dt className="text-[10px] uppercase tracking-[0.2em] text-charcoal/45 font-body">{c.thankDate}</dt>
                  <dd className="mt-1 font-body text-[13px] text-charcoal">
                    {data.date.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })}
                  </dd>
                </div>
              </motion.dl>

              {/* Pieces */}
              <motion.div
                className="mt-5 text-start"
                initial={reduce ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.9, ease: EXPO_OUT }}
              >
                <p className="text-[10px] uppercase tracking-[0.2em] text-charcoal/45 font-body">{c.thankPieces}</p>
                <ul className="mt-2 space-y-2">
                  {data.pieces.map((p) => (
                    <li key={p.id} className="flex items-center gap-3">
                      <div className="flex-shrink-0 rounded-[2px] bg-gold p-[2px]">
                        <div className="relative h-12 w-9 overflow-hidden rounded-[1px]">
                          {p.image && <Image src={`/images/${p.image}`} alt="" fill sizes="36px" className="object-cover" />}
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p lang="fr" className="truncate font-display text-sm text-charcoal">{p.theme}</p>
                        <p className="font-body text-[11px] text-charcoal/50" dir="ltr">{formatSize(p, lang)}</p>
                      </div>
                      <p className="font-body text-sm text-charcoal/80" dir="ltr">{formatDH(p.price)}</p>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 flex items-baseline justify-between border-t border-dashed border-charcoal/15 pt-3">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-charcoal/50 font-body">{c.formTotal}</span>
                  <span className="font-display text-xl text-charcoal" dir="ltr">{formatDH(data.total)}</span>
                </div>
              </motion.div>

              {/* Signature */}
              <motion.p
                className="relative mt-6 font-display text-lg italic text-[var(--color-nova-gold-deep)]"
                initial={reduce ? false : { opacity: 0, filter: 'blur(6px)' }}
                animate={{ opacity: 1, filter: 'blur(0px)' }}
                transition={{ duration: 1, delay: 1.15 }}
              >
                {c.thankSign}
              </motion.p>

              <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
                <a
                  href={data.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 rounded-full bg-charcoal py-3 text-xs font-medium tracking-wide text-canvas transition-colors hover:bg-charcoal-mid"
                >
                  {c.thankReopen}
                </a>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded-full border border-charcoal/20 py-3 text-xs font-medium tracking-wide text-charcoal/70 transition-colors hover:border-charcoal/45 hover:text-charcoal"
                >
                  {c.thankClose}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
