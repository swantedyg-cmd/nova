'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useInView, useReducedMotion } from 'motion/react'
import { useLanguage } from '@/i18n/LanguageContext'
import { caveat, pinyon } from '@/lib/handFonts'

/* ─── "La lettre Nova" — a cream envelope closed with a burgundy wax seal.
   When it comes into view (or when the seal is tapped) the seal cracks in
   two, the gold-lined flap lifts, the letter rises out, and then unfolds in
   three panels into a short signed letter to the client.

   The full letter is laid out in the normal flow from the start (invisible)
   so the page never jumps; the envelope plays over it, then gives way. ─── */

const EASE = [0.22, 1, 0.36, 1] as const
const INK = '#2A2E4A'

type Phase = 'sealed' | 'opening' | 'letter'

// A jagged crack down the middle of the seal.
const CRACK_L = 'polygon(0 0, 53% 0, 47% 22%, 56% 41%, 46% 63%, 54% 81%, 49% 100%, 0 100%)'
const CRACK_R = 'polygon(53% 0, 100% 0, 100% 100%, 49% 100%, 54% 81%, 46% 63%, 56% 41%, 47% 22%)'

function SealFace() {
  return (
    <div
      className="absolute inset-0 rounded-full"
      style={{
        background: 'radial-gradient(circle at 35% 30%, #B23A48, #7A1F2B 55%, #4E1019 100%)',
        boxShadow: 'inset 0 2px 3px rgba(255,200,200,0.35), inset 0 -4px 8px rgba(0,0,0,0.45), 0 6px 14px rgba(60,10,16,0.45)',
      }}
    >
      {/* the pressed rim */}
      <div className="absolute inset-[14%] rounded-full" style={{ boxShadow: 'inset 0 0 0 2px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,190,190,0.2)' }} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/nova-logo-icon.png" alt="" className="absolute left-1/2 top-1/2 w-[52%] -translate-x-1/2 -translate-y-1/2 opacity-90 [filter:sepia(0.4)_saturate(1.3)_drop-shadow(0_1px_0_rgba(0,0,0,0.5))]" />
    </div>
  )
}

export default function LettreNova() {
  const { t, lang } = useLanguage()
  const l = t.lettre
  const rtl = lang === 'ar'
  const reduce = useReducedMotion() ?? false
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.55 })
  const [phase, setPhase] = useState<Phase>(reduce ? 'letter' : 'sealed')

  const open = () => setPhase((p) => (p === 'sealed' ? 'opening' : p))

  // The envelope opens by itself once it is well in view.
  useEffect(() => {
    if (!inView || reduce) return
    const t1 = window.setTimeout(() => setPhase((p) => (p === 'sealed' ? 'opening' : p)), 500)
    return () => window.clearTimeout(t1)
  }, [inView, reduce])

  useEffect(() => {
    if (phase !== 'opening') return
    const t2 = window.setTimeout(() => setPhase('letter'), 2300)
    return () => window.clearTimeout(t2)
  }, [phase])

  const opened = phase !== 'sealed'
  const fonts = `${caveat.variable} ${pinyon.variable}`
  const hand = rtl ? undefined : 'var(--font-hand)'

  const letterBody = (
    <div className="px-8 pb-10 pt-10 md:px-14 md:pb-12 md:pt-12" dir={rtl ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-between">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/nova-logo-icon.png" alt="" width={46} height={38} />
        <p className="font-display text-[10px] uppercase tracking-[0.35em] text-[#8A6A1C]">novagallery.world</p>
      </div>
      <p className="mt-8 text-[1.55rem] md:text-[1.75rem]" style={{ color: INK, fontFamily: hand }}>{l.greeting}</p>
      {l.body.map((para) => (
        <p key={para.slice(0, 16)} className="mt-4 text-[1.3rem] leading-[1.45] md:text-[1.45rem]" style={{ color: INK, fontFamily: hand }}>
          {para}
        </p>
      ))}
      <p className="mt-7 text-[1.3rem] md:text-[1.45rem]" style={{ color: INK, fontFamily: hand }}>{l.closing}</p>
      <p className="mt-1 text-[3.2rem] leading-none text-[#8A6A1C] md:text-[3.8rem]" style={{ fontFamily: 'var(--font-script)' }}>
        {l.signature}
      </p>
      <p className="mt-8 border-t border-dashed border-[#8A6A1C]/30 pt-4 text-[1.1rem] text-[#8A6A1C]" style={{ fontFamily: hand }}>
        {l.ps}
      </p>
    </div>
  )

  const paper: React.CSSProperties = {
    backgroundColor: '#FDF9F1',
    backgroundImage: 'radial-gradient(130% 90% at 50% 30%, transparent 62%, rgba(140,100,40,0.10))',
  }

  return (
    <div className={fonts}>
      <div className="text-center">
        <p className="text-xs uppercase tracking-[0.38em] text-gold font-body">{l.eyebrow}</p>
        <h2 className="mt-4 font-display text-3xl md:text-4xl font-medium text-charcoal leading-snug">
          {l.title} <em className="italic font-normal text-gold">{l.titleItalic}</em>
        </h2>
      </div>

      <div ref={ref} className="relative mx-auto mt-14 w-[min(92vw,620px)]" style={{ perspective: '1600px' }}>
        {/* ── The letter, in flow (reserves its height), unfolding in thirds ── */}
        <div className="relative" aria-hidden={phase !== 'letter'}>
          <div className="invisible">{letterBody}</div>
          {[0, 1, 2].map((i) => {
            // middle panel is already facing us; top folds down, bottom folds up
            const clip = ['inset(0 0 66.6% 0)', 'inset(33.3% 0 33.3% 0)', 'inset(66.6% 0 0 0)'][i]
            const origin = ['50% 33.33%', '50% 50%', '50% 66.66%'][i]
            const folded = [-178, 0, 178][i]
            return (
              <motion.div
                key={i}
                className="absolute inset-0 rounded-sm"
                style={{
                  ...paper,
                  clipPath: clip,
                  transformOrigin: origin,
                  backfaceVisibility: 'hidden',
                  boxShadow: '0 40px 80px -40px rgba(44,24,16,0.45)',
                }}
                initial={false}
                animate={
                  phase === 'letter'
                    ? { opacity: 1, rotateX: 0 }
                    : { opacity: 0, rotateX: folded }
                }
                transition={{
                  opacity: { duration: 0.5, delay: i === 1 ? 0 : 0.15 },
                  rotateX: { duration: 1.1, delay: i === 0 ? 0.25 : i === 2 ? 0.6 : 0, ease: EASE },
                }}
              >
                {letterBody}
                {/* crease shadow along the fold lines */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background:
                      'linear-gradient(to bottom, transparent 32.8%, rgba(120,90,40,0.10) 33.3%, transparent 34%, transparent 66.1%, rgba(120,90,40,0.10) 66.6%, transparent 67.3%)',
                  }}
                />
              </motion.div>
            )
          })}
        </div>

        {/* ── The envelope, played over the letter, then set aside ── */}
        <AnimatePresence>
          {phase !== 'letter' && (
            <motion.div
              className="absolute left-1/2 top-1/2 w-[min(88vw,520px)] -translate-x-1/2 -translate-y-1/2"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: inView ? 1 : 0, y: 0 }}
              exit={{ opacity: 0, y: 50, scale: 0.92, transition: { duration: 0.7, ease: 'easeIn' } }}
              transition={{ duration: 0.9, ease: EASE }}
            >
              <div className="relative aspect-[16/10]" style={{ perspective: '1200px' }}>
                {/* back of the envelope */}
                <div className="absolute inset-0 rounded-md" style={{ background: '#E9DCC4', boxShadow: '0 40px 70px -30px rgba(44,24,16,0.55)' }} />

                {/* the letter peeking out */}
                <motion.div
                  className="absolute inset-x-[7%] top-[8%] h-[84%] rounded-sm"
                  style={{ ...paper, zIndex: 2 }}
                  initial={false}
                  animate={{ y: opened ? '-48%' : '0%' }}
                  transition={{ duration: 1, delay: opened ? 1.05 : 0, ease: EASE }}
                >
                  <div className="space-y-2 px-[10%] pt-[9%]">
                    <div className="h-2 w-1/3 rounded bg-[#2A2E4A]/20" />
                    <div className="h-1.5 w-11/12 rounded bg-[#2A2E4A]/12" />
                    <div className="h-1.5 w-10/12 rounded bg-[#2A2E4A]/12" />
                    <div className="h-1.5 w-9/12 rounded bg-[#2A2E4A]/12" />
                  </div>
                </motion.div>

                {/* front pocket — the side and bottom folds */}
                <div
                  className="absolute inset-0 rounded-md"
                  style={{
                    zIndex: 3,
                    background: 'linear-gradient(170deg, #F6EDDD, #EFE3CC)',
                    clipPath: 'polygon(0 22%, 50% 64%, 100% 22%, 100% 100%, 0 100%)',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.6)',
                  }}
                />
                {/* fold lines */}
                <svg className="pointer-events-none absolute inset-0 h-full w-full" style={{ zIndex: 4 }} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                  <path d="M0 22 L50 64 L100 22" fill="none" stroke="rgba(120,90,40,0.18)" strokeWidth="0.4" />
                  <path d="M0 100 L42 58 M100 100 L58 58" fill="none" stroke="rgba(120,90,40,0.12)" strokeWidth="0.4" />
                </svg>

                {/* flap — cream outside, gold-lined inside */}
                <motion.div
                  className="absolute inset-x-0 top-0 h-[64%]"
                  style={{ transformOrigin: 'top center', transformStyle: 'preserve-3d' }}
                  initial={false}
                  animate={{ rotateX: opened ? 178 : 0, zIndex: opened ? 1 : 5 }}
                  transition={{
                    rotateX: { duration: 0.9, delay: opened ? 0.45 : 0, ease: EASE },
                    zIndex: { delay: opened ? 0.85 : 0 },
                  }}
                >
                  <div
                    className="absolute inset-0"
                    style={{
                      clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
                      background: 'linear-gradient(180deg, #EFE3CC, #E6D6B9)',
                      backfaceVisibility: 'hidden',
                      filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.12))',
                    }}
                  />
                  <div
                    className="absolute inset-0"
                    style={{
                      clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
                      background:
                        'repeating-linear-gradient(45deg, rgba(255,255,255,0.18) 0 2px, transparent 2px 7px), linear-gradient(180deg, #E8C46A, #A67C00)',
                      transform: 'rotateX(180deg)',
                      backfaceVisibility: 'hidden',
                    }}
                  />
                </motion.div>

                {/* wax seal — tap to open; cracks in two */}
                <button
                  type="button"
                  onClick={open}
                  aria-label={l.open}
                  disabled={opened}
                  className="absolute left-1/2 top-[64%] size-[17%] min-w-14 -translate-x-1/2 -translate-y-1/2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
                  style={{ zIndex: 6, aspectRatio: '1' }}
                >
                  {[CRACK_L, CRACK_R].map((clip, i) => (
                    <motion.span
                      key={i}
                      className="absolute inset-0 block"
                      style={{ clipPath: clip }}
                      initial={false}
                      animate={
                        opened
                          ? { x: i ? 18 : -18, y: 46, rotate: i ? 24 : -22, opacity: 0 }
                          : { x: 0, y: 0, rotate: 0, opacity: 1 }
                      }
                      transition={{ duration: 0.75, ease: [0.5, 0, 0.75, 0] }}
                    >
                      <SealFace />
                    </motion.span>
                  ))}
                  {!opened && (
                    <motion.span
                      aria-hidden="true"
                      className="absolute -inset-3 rounded-full border border-[#C89B3C]/50"
                      animate={{ scale: [1, 1.25], opacity: [0.6, 0] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
                    />
                  )}
                </button>
              </div>

              {!opened && (
                <p className="mt-6 text-center text-[11px] uppercase tracking-[0.3em] text-charcoal/45 font-body">{l.open}</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
