'use client'

import { useRef } from 'react'
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from 'motion/react'
import { useLanguage } from '@/i18n/LanguageContext'
import { caveat, pinyon } from '@/lib/handFonts'

/* ─── "Le carnet du curateur" — a handwritten notebook whose pages turn as
   you scroll. The section is tall; the notebook stays pinned (sticky) while
   scroll progress drives each page's turn around the spine, so the reader
   sets the pace. Three notes — the light, the gaze, the frame — in the
   house's own voice, in ink on lined paper. ──────────────────────────────── */

const INK = '#2A2E4A' // blue-black fountain-pen ink

const PAPER: React.CSSProperties = {
  backgroundColor: '#FBF6EC',
  backgroundImage:
    // faint ruled lines + a soft vignette, the way old paper darkens at the edges
    'repeating-linear-gradient(to bottom, transparent 0 31px, rgba(70,90,140,0.10) 31px 32px), radial-gradient(120% 90% at 50% 40%, transparent 60%, rgba(120,90,40,0.10))',
}

/** One page turn: 0 → -180° around the spine over [start, end] of the scroll. */
function useTurn(progress: MotionValue<number>, start: number, end: number) {
  const rotateY = useTransform(progress, [start, end], [0, -180], { clamp: true })
  // a crease of shadow that deepens as the page stands upright, then fades
  const shade = useTransform(progress, [start, (start + end) / 2, end], [0, 0.35, 0])
  return { rotateY, shade }
}

function PressedFlower({ className = '' }: { className?: string }) {
  // A little ink sketch for the backs of turned pages.
  return (
    <svg viewBox="0 0 120 160" className={className} fill="none" stroke={INK} strokeWidth="1.2" strokeLinecap="round" aria-hidden="true">
      <path d="M60 155 C58 120 62 95 60 60" opacity="0.7" />
      <path d="M60 110 C48 104 40 96 36 84 C48 86 56 94 60 104" opacity="0.6" />
      <path d="M60 92 C72 86 80 78 84 66 C72 68 64 76 60 86" opacity="0.6" />
      {[0, 72, 144, 216, 288].map((a) => (
        <ellipse key={a} cx="60" cy="38" rx="9" ry="20" transform={`rotate(${a} 60 50)`} opacity="0.75" />
      ))}
      <circle cx="60" cy="50" r="5" fill="#C89B3C" stroke="none" opacity="0.8" />
    </svg>
  )
}

function NotePage({
  note, index, total, rtl,
}: {
  note: { n: string; title: string; body: string; aside: string }
  index: number
  total: number
  rtl: boolean
}) {
  return (
    <div className="relative h-full w-full px-7 pb-8 pt-9 md:px-10 md:pt-11" dir={rtl ? 'rtl' : 'ltr'}>
      {/* gold margin rule */}
      <div aria-hidden="true" className="absolute inset-y-0 start-5 w-px bg-[#C89B3C]/35 md:start-7" />
      <div className="flex items-baseline gap-3 ps-3">
        <span className="font-display text-sm tracking-[0.3em] text-[#C89B3C]">{note.n}</span>
        <h4
          className="text-[2.1rem] leading-none text-[#8A6A1C] md:text-[2.6rem]"
          style={{ fontFamily: rtl ? undefined : 'var(--font-script)' }}
        >
          {note.title}
        </h4>
      </div>
      {/* hand-drawn underline */}
      <svg viewBox="0 0 220 12" className="ms-3 mt-1 h-3 w-40 md:w-52" aria-hidden="true">
        <path d="M2 8 C40 2 90 11 130 6 S200 4 218 7" fill="none" stroke="#C89B3C" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
      <p
        className="mt-4 ps-3 text-[1.32rem] leading-[32px] md:text-[1.5rem]"
        style={{ color: INK, fontFamily: rtl ? undefined : 'var(--font-hand)' }}
      >
        {note.body}
      </p>
      <p
        className="mt-5 ps-3 text-[1.08rem] text-[#8A6A1C] md:text-[1.2rem]"
        style={{ fontFamily: rtl ? undefined : 'var(--font-hand)', transform: `rotate(${rtl ? 2 : -2}deg)` }}
      >
        → {note.aside}
      </p>
      <p className="absolute bottom-4 end-6 font-display text-[11px] tracking-[0.3em] text-[#2A2E4A]/40">
        {index + 1} / {total}
      </p>
    </div>
  )
}

export default function CarnetCurateur() {
  const { t, lang } = useLanguage()
  const c = t.carnet
  const rtl = lang === 'ar'
  const reduce = useReducedMotion() ?? false
  const trackRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: trackRef, offset: ['start start', 'end end'] })

  // Two turns: note I → II, then II → III. Each takes ~a third of the track,
  // with a dwell before, between and after so every note can be read.
  const turn1 = useTurn(scrollYProgress, 0.18, 0.42)
  const turn2 = useTurn(scrollYProgress, 0.58, 0.82)
  const turns = [turn1, turn2]
  const pageLabel = useTransform(scrollYProgress, (p): string => (p < 0.3 ? 'I' : p < 0.7 ? 'II' : 'III'))

  const notes = c.notes
  const fonts = `${caveat.variable} ${pinyon.variable}`

  return (
    <div className={`${fonts} mt-28 md:mt-36`}>
      <div className="text-center">
        <p className="text-xs uppercase tracking-[0.38em] text-gold font-body">{c.eyebrow}</p>
        <h3 className="mt-4 font-display text-3xl md:text-4xl font-medium text-charcoal leading-snug">
          {c.title} <em className="italic font-normal text-gold">{c.titleItalic}</em>
        </h3>
      </div>

      {/* The scroll track — tall, so the turns follow the reader's scroll */}
      <div ref={trackRef} className="relative" style={{ height: reduce ? 'auto' : '280vh' }}>
        <div className={`${reduce ? '' : 'sticky top-0 h-screen pt-20'} flex flex-col items-center justify-center py-10`}>
          <div
            dir="ltr"
            className="relative mx-auto aspect-[3/4.4] w-[min(88vw,420px)] md:aspect-[16/10.5] md:w-[min(92vw,900px,calc((100vh-190px)*16/10.5))]"
            style={{ perspective: '2200px' }}
          >
            {/* cover / left page (laptop) */}
            <div
              className="absolute inset-y-0 left-0 hidden w-1/2 overflow-hidden rounded-l-md shadow-[inset_-18px_0_30px_-20px_rgba(60,40,10,0.35)] md:block"
              style={PAPER}
            >
              <div className="flex h-full flex-col items-center justify-center px-10 text-center" dir={rtl ? 'rtl' : 'ltr'}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/nova-logo-icon.png" alt="" width={78} height={64} className="opacity-90" />
                <p className="mt-6 text-[2.6rem] leading-none text-[#8A6A1C]" style={{ fontFamily: rtl ? undefined : 'var(--font-script)' }}>
                  {c.cover}
                </p>
                <p className="mt-4 max-w-[16rem] text-[1.25rem] leading-snug" style={{ color: INK, fontFamily: rtl ? undefined : 'var(--font-hand)' }}>
                  {c.coverSub}
                </p>
                <p className="mt-8 text-3xl text-[#8A6A1C]" style={{ fontFamily: rtl ? undefined : 'var(--font-script)' }}>{c.sign}</p>
              </div>
            </div>

            {/* right-hand pages: the last note lies underneath, the others turn */}
            <div className="absolute inset-y-0 right-0 w-full md:w-1/2">
              {notes.map((note, i) => {
                const turn = turns[i]
                const isLast = i === notes.length - 1
                return (
                  <motion.div
                    key={note.n}
                    className="absolute inset-0"
                    style={{
                      zIndex: notes.length - i,
                      transformOrigin: 'left center',
                      transformStyle: 'preserve-3d',
                      rotateY: !isLast && turn && !reduce ? turn.rotateY : 0,
                    }}
                  >
                    {/* front — the note */}
                    <div
                      className="absolute inset-0 overflow-hidden rounded-r-md shadow-[0_30px_60px_-30px_rgba(44,24,16,0.45),inset_18px_0_30px_-20px_rgba(60,40,10,0.30)]"
                      style={{ ...PAPER, backfaceVisibility: 'hidden' }}
                    >
                      <NotePage note={note} index={i} total={notes.length} rtl={rtl} />
                      {!isLast && turn && (
                        <motion.div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[#2C1810]" style={{ opacity: turn.shade }} />
                      )}
                    </div>
                    {/* back — a pressed-flower sketch, seen once the page has turned */}
                    {!isLast && (
                      <div
                        className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-l-md"
                        style={{ ...PAPER, transform: 'rotateY(180deg)', backfaceVisibility: 'hidden' }}
                      >
                        <PressedFlower className="h-[45%] opacity-70" />
                      </div>
                    )}
                  </motion.div>
                )
              })}
            </div>

            {/* spine */}
            <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-1/2 hidden w-6 -translate-x-1/2 bg-gradient-to-r from-transparent via-[rgba(60,40,10,0.18)] to-transparent md:block" />
          </div>

          {!reduce && (
            <div className="mt-8 flex items-center gap-3 text-[11px] uppercase tracking-[0.28em] text-charcoal/45 font-body">
              <motion.span className="font-display text-gold">{pageLabel}</motion.span>
              <span className="h-px w-8 bg-gold/40" />
              <span>{c.hint}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
