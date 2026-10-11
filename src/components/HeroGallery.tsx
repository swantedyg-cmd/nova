'use client'

import Image from 'next/image'
import { Fragment, useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react'
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  type MotionValue,
  type PanInfo,
} from 'motion/react'
import { Pause, Play } from 'lucide-react'
import Tilt from './Tilt'
import { PIECES, type Piece } from '@/data/catalogue'
import { useIsMobile } from '@/hooks/useIsMobile'
import { useLanguage } from '@/i18n/LanguageContext'

// One frame, the whole collection — every piece takes the stage for
// SLIDE_MS, then hands over to the next, looping after the last.
const SLIDE_MS = 5000

// Timed against HeroSection's own stagger: the frame starts rising while
// the headline is still arriving and finishes its reveal alongside the
// italic payoff line, so text and artwork land as one beat. The slideshow
// clock only starts once the entrance has mostly settled.
const ENTRANCE_DELAY_S = 0.55
const ENTRANCE_S = 1.5
const CLOCK_START_MS = (ENTRANCE_DELAY_S + ENTRANCE_S * 0.7) * 1000

const EXPO_OUT = [0.16, 1, 0.3, 1] as const
// In-out for the wipe itself — a curtain that accelerates then eases to
// rest reads as a deliberate cut, where expo-out alone feels like a snap.
const WIPE_EASE = [0.77, 0, 0.175, 1] as const
const WIPE_S = 1.35

// Every crop in the collection sits between ~0.62 and ~0.74 (w/h); a
// fixed frame in the middle keeps the frame from jumping size between
// pieces, with object-cover absorbing the small difference.
const FRAME_ASPECT = 0.68
const SIZES = '(max-width: 767px) 92vw, 460px'

const pad = (n: number) => String(n).padStart(2, '0')

// `s` is the on-screen direction: +1 means the new piece comes in from
// the right edge, -1 from the left. Already flipped for RTL by the caller.
const layerVariants = {
  enter: (s: number) => ({
    clipPath: s > 0 ? 'inset(0% 0% 0% 100%)' : 'inset(0% 100% 0% 0%)',
    zIndex: 2,
  }),
  center: {
    clipPath: 'inset(0% 0% 0% 0%)',
    x: '0%',
    zIndex: 2,
    transition: { duration: WIPE_S, ease: WIPE_EASE },
  },
  // The outgoing piece is pushed back and dimmed under the incoming one,
  // a parallax handover rather than a flat crossfade.
  exit: (s: number) => ({
    x: s > 0 ? '-12%' : '12%',
    zIndex: 1,
    transition: { duration: WIPE_S, ease: WIPE_EASE },
  }),
}

const dimVariants = {
  enter: { opacity: 0 },
  center: { opacity: 0 },
  exit: { opacity: 0.6, transition: { duration: WIPE_S, ease: WIPE_EASE } },
}

const fadeVariants = {
  enter: { opacity: 0, zIndex: 2 },
  center: { opacity: 1, zIndex: 2, transition: { duration: 0.8 } },
  exit: { opacity: 0, zIndex: 1, transition: { duration: 0.8 } },
}

export default function HeroGallery() {
  const { t, lang } = useLanguage()
  const isMobile = useIsMobile()
  const reduceMotion = useReducedMotion() ?? false
  const rtl = lang === 'ar'

  // `n` counts changes since mount — 0 means the piece from page load is
  // still showing (no seam to play, high fetch priority still applies).
  const [slide, setSlide] = useState({ index: 0, dir: 1, n: 0 })
  const [playing, setPlaying] = useState(true)
  const [hovered, setHovered] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [inView, setInView] = useState(true)
  const [pageVisible, setPageVisible] = useState(true)
  const [started, setStarted] = useState(false)

  const rootRef = useRef<HTMLDivElement>(null)
  const progress = useMotionValue(0)

  const count = PIECES.length
  const { index, dir, n } = slide
  const piece = PIECES[index]
  const nextPiece = PIECES[(index + 1) % count]
  const screenDir = dir * (rtl ? -1 : 1)

  const step = useCallback(
    (delta: number) => {
      progress.set(0)
      setSlide((s) => ({ index: (s.index + delta + count) % count, dir: delta >= 0 ? 1 : -1, n: s.n + 1 }))
    },
    [count, progress],
  )
  const next = useCallback(() => step(1), [step])
  const prev = useCallback(() => step(-1), [step])
  const goTo = useCallback(
    (target: number) => {
      if (target === index) return
      progress.set(0)
      setSlide((s) => ({ index: target, dir: target > s.index ? 1 : -1, n: s.n + 1 }))
    },
    [index, progress],
  )

  useEffect(() => {
    const timer = setTimeout(() => setStarted(true), reduceMotion ? 0 : CLOCK_START_MS)
    return () => clearTimeout(timer)
  }, [reduceMotion])

  // Off-screen or in a background tab, the clock holds — nobody misses a
  // piece, and no work is done for a slideshow nobody is watching.
  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.25 })
    io.observe(el)
    const onVis = () => setPageVisible(document.visibilityState === 'visible')
    document.addEventListener('visibilitychange', onVis)
    return () => {
      io.disconnect()
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [])

  // Progress is a motion value advanced per frame — the bars read it
  // directly, so the 5s countdown never re-renders React. Pausing simply
  // stops advancing it, so a hover resumes exactly where it left off.
  const running = started && playing && !hovered && !dragging && inView && pageVisible
  useEffect(() => {
    if (!running) return
    let last = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const p = progress.get() + (now - last) / SLIDE_MS
      last = now
      if (p >= 1) next()
      else progress.set(p)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [running, next, progress])

  const onKeyDown = (e: KeyboardEvent) => {
    const forward = rtl ? 'ArrowLeft' : 'ArrowRight'
    const back = rtl ? 'ArrowRight' : 'ArrowLeft'
    if (e.key === forward) { e.preventDefault(); next() }
    else if (e.key === back) { e.preventDefault(); prev() }
  }

  const onDragEnd = (_: unknown, info: PanInfo) => {
    setDragging(false)
    const swipe = info.offset.x * (rtl ? -1 : 1)
    const flick = info.velocity.x * (rtl ? -1 : 1)
    if (swipe < -50 || flick < -450) next()
    else if (swipe > 50 || flick > 450) prev()
  }

  const keywords = piece.keywords[lang].slice(0, 3)

  const controls = (
    <ProgressBars
      count={count}
      index={index}
      progress={progress}
      onSelect={goTo}
      labelFor={(i) => `${t.hero.slideshow.goTo} ${PIECES[i].theme}`}
      tone={isMobile ? 'light' : 'dark'}
    />
  )

  const playToggle = (
    <button
      type="button"
      onClick={() => setPlaying((p) => !p)}
      aria-label={playing ? t.hero.slideshow.pause : t.hero.slideshow.play}
      className={
        isMobile
          ? 'grid h-8 w-8 place-items-center rounded-full bg-black/25 text-canvas backdrop-blur-sm transition-transform active:scale-90'
          : 'grid h-9 w-9 shrink-0 place-items-center rounded-full border border-charcoal/20 text-charcoal/70 transition-colors hover:border-charcoal/45 hover:text-charcoal active:scale-95'
      }
    >
      {playing ? <Pause size={14} strokeWidth={1.75} /> : <Play size={14} strokeWidth={1.75} className="translate-x-px" />}
    </button>
  )

  return (
    <motion.div
      ref={rootRef}
      role="region"
      aria-roledescription="carousel"
      aria-label={t.hero.slideshow.label}
      tabIndex={0}
      onKeyDown={onKeyDown}
      onPointerEnter={(e) => e.pointerType === 'mouse' && setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      className="relative mx-auto outline-none focus-visible:ring-2 focus-visible:ring-gold/60 focus-visible:ring-offset-8 focus-visible:ring-offset-ivory rounded-sm"
      style={{
        width: isMobile
          ? 'min(100%, 28rem)'
          : `min(100%, 460px, max(260px, calc((100svh - 20rem) * ${FRAME_ASPECT})))`,
      }}
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 48, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: reduceMotion ? 0.6 : ENTRANCE_S, delay: reduceMotion ? 0 : ENTRANCE_DELAY_S, ease: EXPO_OUT }}
    >
      {/* Ambient glow — the current piece's own colors, blurred and bled
          out behind the frame, so the hero's light shifts with the art. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-[12%] -z-10"
        style={{ maskImage: "radial-gradient(closest-side, black 55%, transparent)", WebkitMaskImage: "radial-gradient(closest-side, black 55%, transparent)" }}
      >
        <AnimatePresence initial={false}>
          <motion.div
            key={piece.id}
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: isMobile ? 0.35 : 0.42 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.6, ease: 'easeInOut' }}
          >
            <Image
              src={`/images/${piece.image}`}
              alt=""
              fill
              sizes="96px"
              className="object-cover"
              style={{ filter: 'blur(48px) saturate(1.35)' }}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      <Tilt max={5} scale={1.012} glossColor="#F5D07A" glossMaxOpacity={0.16}>
        <div className="rounded-sm bg-gold p-[6px] shadow-[0_30px_70px_-20px_rgba(90,18,32,0.35),0_12px_30px_rgba(90,18,32,0.12)]">
          <div className="rounded-[2px] bg-canvas p-2">
            {/* Image stage — the curtain reveal on entrance, then each piece
                wipes in over the last. */}
            <motion.div
              className="relative w-full overflow-hidden rounded-[1px] bg-charcoal"
              style={{ aspectRatio: FRAME_ASPECT, touchAction: 'pan-y' }}
              initial={reduceMotion ? false : { clipPath: 'inset(100% 0% 0% 0%)' }}
              animate={{ clipPath: 'inset(0% 0% 0% 0%)' }}
              transition={{ duration: ENTRANCE_S * 0.9, delay: ENTRANCE_DELAY_S + 0.15, ease: WIPE_EASE }}
              drag={isMobile ? 'x' : false}
              dragSnapToOrigin
              dragElastic={0.14}
              dragConstraints={{ left: 0, right: 0 }}
              onDragStart={() => setDragging(true)}
              onDragEnd={onDragEnd}
            >
              <AnimatePresence initial={false} custom={screenDir}>
                <motion.div
                  key={piece.id}
                  custom={screenDir}
                  variants={reduceMotion ? fadeVariants : layerVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className="absolute inset-0"
                >
                  {/* Slow settle from a close crop — the "camera" eases back
                      over the whole time the piece is on stage. */}
                  <motion.div
                    className="absolute inset-0"
                    initial={reduceMotion ? false : { scale: 1.18 }}
                    animate={{ scale: 1.02 }}
                    transition={{ duration: (SLIDE_MS + WIPE_S * 1000) / 1000, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <Image
                      src={`/images/${piece.image}`}
                      alt={altFor(piece, lang)}
                      fill
                      sizes={SIZES}
                      className="object-cover"
                      loading="eager"
                      fetchPriority={n === 0 ? 'high' : 'auto'}
                      draggable={false}
                    />
                  </motion.div>
                  {!reduceMotion && (
                    <motion.div variants={dimVariants} className="absolute inset-0 bg-[#1a0a0d]" />
                  )}
                </motion.div>
              </AnimatePresence>

              {/* The light edge riding the wipe — a thin gold seam with a
                  soft bloom, keyed so it plays once per change. */}
              {!reduceMotion && n > 0 && (
                <motion.div
                  key={`seam-${index}`}
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 z-[3]"
                  initial={{ x: screenDir > 0 ? '100%' : '-100%', opacity: 0 }}
                  animate={{ x: '0%', opacity: [0, 1, 1, 0] }}
                  transition={{
                    x: { duration: WIPE_S, ease: WIPE_EASE },
                    opacity: { duration: WIPE_S, times: [0, 0.08, 0.75, 1] },
                  }}
                >
                  <span
                    className={`absolute inset-y-0 w-[2px] ${screenDir > 0 ? 'left-0' : 'right-0'}`}
                    style={{
                      background: 'linear-gradient(to bottom, transparent, #F5D07A 20%, #fff8e1 50%, #F5D07A 80%, transparent)',
                      boxShadow: '0 0 18px 4px rgba(245,208,122,0.55), 0 0 60px 12px rgba(212,164,46,0.25)',
                    }}
                  />
                </motion.div>
              )}

              {/* Lens: soft vignette + a static diagonal sheen, the glass
                  over the print. */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 z-[4]"
                style={{
                  background:
                    'radial-gradient(120% 85% at 50% 42%, transparent 58%, rgba(26,10,13,0.38) 100%), linear-gradient(125deg, rgba(255,255,255,0.10) 0%, transparent 28%)',
                }}
              />

              {/* Mobile: the stage carries its own story-style chrome —
                  progress across the top, the caption on a scrim below. */}
              {isMobile && (
                <>
                  <div className="absolute inset-x-0 top-0 z-[5] h-24 bg-gradient-to-b from-black/45 to-transparent" />
                  <div className="absolute inset-x-3 top-3 z-[6] flex items-center gap-3">
                    <div className="flex-1">{controls}</div>
                    {playToggle}
                  </div>
                  <div className="absolute inset-x-0 bottom-0 z-[5] h-[48%] bg-gradient-to-t from-[#1f0a0e]/85 via-[#1f0a0e]/40 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 z-[6] px-5 pb-5">
                    <Caption piece={piece} keywords={keywords} index={index} count={count} dir={dir} tone="light" reduceMotion={reduceMotion} live={!playing} />
                  </div>
                </>
              )}
            </motion.div>
          </div>
        </div>
      </Tilt>

      {/* Desktop: caption and controls sit under the frame, like a museum
          label — the frame itself stays pure. */}
      {!isMobile && (
        <motion.div
          className="mt-7"
          initial={reduceMotion ? false : { opacity: 0, y: 14, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.9, delay: ENTRANCE_DELAY_S + ENTRANCE_S * 0.7, ease: EXPO_OUT }}
        >
          <Caption piece={piece} keywords={keywords} index={index} count={count} dir={dir} tone="dark" reduceMotion={reduceMotion} live={!playing} />
          <div className="mt-5 flex items-center gap-4">
            <div className="flex-1">{controls}</div>
            {playToggle}
          </div>
        </motion.div>
      )}

      {/* Warm the cache for the next piece so its wipe never reveals a
          half-loaded image. Waits for the clock, staying clear of the
          first paint. */}
      {started && (
        <div aria-hidden="true" className="pointer-events-none absolute h-px w-px overflow-hidden opacity-0">
          <Image src={`/images/${nextPiece.image}`} alt="" fill sizes={SIZES} loading="eager" />
        </div>
      )}
    </motion.div>
  )
}

function altFor(piece: Piece, lang: 'fr' | 'en' | 'ar') {
  const first = piece.philosophy[lang].split(/(?<=[.!?،؟])\s/)[0]
  return `${piece.theme} — ${first}`
}

function Caption({
  piece,
  keywords,
  index,
  count,
  dir,
  tone,
  reduceMotion,
  live,
}: {
  piece: Piece
  keywords: string[]
  index: number
  count: number
  dir: number
  tone: 'light' | 'dark'
  reduceMotion: boolean
  live: boolean
}) {
  const light = tone === 'light'
  return (
    // Announced only while paused — an auto-advancing region that speaks
    // every 5s is noise for screen-reader users.
    <div className={light ? 'flex items-end justify-between gap-5' : 'flex flex-col-reverse gap-2'} aria-live={live ? 'polite' : 'off'}>
      <div className="min-w-0">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={piece.id}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8, filter: 'blur(6px)' }}
            transition={{ duration: 0.3, ease: 'easeIn' }}
          >
            {/* Names stay in their Latin form in every language, so a
                per-letter reveal is safe even under Arabic. */}
            <p
              lang="fr"
              dir="ltr"
              className={`font-display italic leading-[1.05] ${light ? 'text-canvas' : 'text-charcoal'}`}
              style={{ fontSize: light ? 'clamp(1.75rem, 8vw, 2.25rem)' : 'clamp(1.6rem, 2.2vw, 2.15rem)', letterSpacing: '-0.01em' }}
            >
              <span className="sr-only">{piece.theme}</span>
              <span aria-hidden="true">
                {/* Letters grouped per word so a line can only break
                    between words, never mid-word. */}
                {piece.theme.split(' ').map((word, w, words) => {
                  const offset = words.slice(0, w).join(' ').length + (w > 0 ? 1 : 0)
                  // The space sits outside the inline-block word — inside,
                  // trailing whitespace collapses and the words run together.
                  return (
                    <Fragment key={w}>
                      {w > 0 && ' '}
                      <span className="inline-block whitespace-nowrap">
                        {Array.from(word).map((ch, i) => (
                          <motion.span
                            key={i}
                            className="inline-block"
                            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: '0.35em', filter: 'blur(8px)' }}
                            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                            transition={{ duration: 0.7, delay: 0.35 + (offset + i) * 0.032, ease: EXPO_OUT }}
                          >
                            {ch}
                          </motion.span>
                        ))}
                      </span>
                    </Fragment>
                  )
                })}
              </span>
            </p>
            <motion.p
              className={`mt-2 text-[10.5px] leading-[1.7] uppercase tracking-[0.28em] font-body font-medium ${light ? 'text-[#F5D07A]' : 'text-gold'}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.75 }}
            >
              {keywords.join(' · ')}
            </motion.p>
          </motion.div>
        </AnimatePresence>
      </div>

      <Counter index={index} count={count} dir={dir} light={light} reduceMotion={reduceMotion} />
    </div>
  )
}

function Counter({ index, count, dir, light, reduceMotion }: { index: number; count: number; dir: number; light: boolean; reduceMotion: boolean }) {
  return (
    <div dir="ltr" className={`flex shrink-0 items-baseline gap-1.5 font-display tabular-nums ${light ? 'text-canvas' : 'text-charcoal'}`}>
      <span className="relative inline-block overflow-hidden" style={{ height: '1.1em', fontSize: light ? '1.5rem' : '1.2rem', lineHeight: 1.1 }}>
        <AnimatePresence mode="popLayout" initial={false} custom={dir}>
          <motion.span
            key={index}
            custom={dir}
            className="block"
            initial={reduceMotion ? { opacity: 0 } : { y: dir > 0 ? '100%' : '-100%' }}
            animate={{ y: '0%', opacity: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { y: dir > 0 ? '-100%' : '100%' }}
            transition={{ duration: 0.8, ease: EXPO_OUT }}
          >
            {pad(index + 1)}
          </motion.span>
        </AnimatePresence>
      </span>
      <span className={`text-xs font-body tracking-[0.2em] ${light ? 'text-canvas/60' : 'text-charcoal/45'}`}>/ {pad(count)}</span>
    </div>
  )
}

function ProgressBars({
  count,
  index,
  progress,
  onSelect,
  labelFor,
  tone,
}: {
  count: number
  index: number
  progress: MotionValue<number>
  onSelect: (i: number) => void
  labelFor: (i: number) => string
  tone: 'light' | 'dark'
}) {
  const track = tone === 'light' ? 'bg-white/30' : 'bg-charcoal/12'
  const fill = tone === 'light' ? 'bg-white' : 'bg-gold'
  return (
    <div className="flex w-full gap-[5px]">
      {Array.from({ length: count }, (_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onSelect(i)}
          aria-label={labelFor(i)}
          aria-current={i === index ? 'true' : undefined}
          className="group relative flex-1 py-2.5"
        >
          <span className={`relative block h-[2px] overflow-hidden rounded-full ${track} transition-[height] duration-200 group-hover:h-[3px]`}>
            {i === index ? (
              <motion.span
                className={`absolute inset-0 origin-left rtl:origin-right ${fill}`}
                style={{ scaleX: progress }}
              />
            ) : (
              <span
                className={`absolute inset-0 origin-left rtl:origin-right ${fill} transition-transform duration-500`}
                style={{ transform: `scaleX(${i < index ? 1 : 0})` }}
              />
            )}
          </span>
        </button>
      ))}
    </div>
  )
}
