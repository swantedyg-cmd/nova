'use client'

import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import Image from 'next/image'
import { AnimatePresence, motion, useInView } from 'motion/react'
import { ChevronLeft, ChevronRight, Check } from 'lucide-react'
import { PIECES, formatSize } from '@/data/catalogue'
import { useLanguage } from '@/i18n/LanguageContext'
import { useCart } from '@/context/CartContext'
import { useIsMobile } from '@/hooks/useIsMobile'
import { formatDH } from './CartDrawer'

/* ─── "Sur votre mur" — the chosen canvas hung, at its real size, in a
   photographed interior (/public/rooms — Unsplash licence: Jason Wang,
   Zhang liven, Tokenstreet; the golden room's wall extended upward).

   Each room was measured once: the sofa's known width gives how many
   centimetres of wall the photo spans (`wallCm`), and the sofa back's
   height in the photo gives where a canvas hangs (20 cm above it, the
   decorators' rule). From there, `--cm` (one centimetre in pixels) sizes
   the canvas, its wooden frame and its shadow on every screen.

   All positions are fractions of the photo (0–1), so the stage can crop
   and zoom the photo per screen shape around `focus` without anything
   drifting off the sofa. ─────────────────────────────────────────────── */

interface Room {
  id: string
  src: string
  /** width / height of the photo */
  aspect: number
  /** centimetres of wall across the full photo width */
  wallCm: number
  sofaCm: number
  /** canvas centre x, and its bottom edge y (20 cm above the sofa back) */
  hangX: number
  hangY: number
  /** where the sofa's width label sits on the floor */
  labelY: number
  /** laptop frame shape — the whole photo where it fits, a crop where it is very wide */
  deskAspect: number
  /** focal point and zoom of the stage crop, laptop / phone */
  focus: { desk: [number, number, number]; phone: [number, number, number] }
  /** cast shadow direction in cm (x, y), following the room's light */
  shadow: [number, number]
  /** light falling across the canvas face, matched to the photo */
  light: string
  ink: string
}

const ROOMS: Room[] = [
  {
    id: 'haussmann',
    src: '/rooms/haussmann.jpg',
    aspect: 2000 / 1500,
    wallCm: 366,
    sofaCm: 250,
    hangX: 0.515,
    hangY: 0.477,
    labelY: 0.915,
    deskAspect: 2000 / 1500,
    focus: { desk: [0.5, 0.5, 1], phone: [0.515, 0.5, 1] },
    shadow: [-1.6, 3.2],
    light: 'linear-gradient(255deg, rgba(255,255,255,0.16), transparent 55%, rgba(20,20,30,0.10))',
    ink: 'rgba(44,24,16,0.7)',
  },
  {
    id: 'doree',
    src: '/rooms/doree.jpg',
    aspect: 2000 / 1800,
    wallCm: 297,
    sofaCm: 220,
    hangX: 0.525,
    hangY: 0.564,
    labelY: 0.965,
    deskAspect: 2000 / 1800,
    focus: { desk: [0.5, 0.5, 1], phone: [0.525, 0.5, 1] },
    shadow: [2, 3],
    light: 'linear-gradient(110deg, rgba(255,214,150,0.18), transparent 50%, rgba(80,40,10,0.12)), linear-gradient(rgba(255,190,120,0.06), rgba(255,190,120,0.06))',
    ink: 'rgba(60,36,16,0.72)',
  },
  {
    id: 'emeraude',
    src: '/rooms/emeraude.jpg',
    aspect: 2000 / 1125,
    wallCm: 580,
    sofaCm: 180,
    hangX: 0.5,
    hangY: 0.45,
    labelY: 0.765,
    deskAspect: 16 / 10,
    focus: { desk: [0.5, 0.42, 1.35], phone: [0.5, 0.42, 1] },
    shadow: [0, 4],
    light: 'radial-gradient(120% 80% at 50% 0%, rgba(255,240,210,0.16), transparent 60%), linear-gradient(rgba(0,30,28,0.18), rgba(0,30,28,0.18))',
    ink: 'rgba(240,250,246,0.8)',
  },
]

const FRAME_CM = 2.5 // visible face of the decorative wooden frame

/** `n` centimetres, in pixels (inside a stage that sets --cm). */
const cm = (n: number) => `calc(var(--cm) * ${n})`

/** Cover-crop the photo into the viewport around a focal point, zoomed. */
function stageBox(vw: number, vh: number, room: Room, phone: boolean) {
  const [fx, fy, zoom] = phone ? room.focus.phone : room.focus.desk
  const w = Math.max(vw, vh * room.aspect) * zoom
  const h = w / room.aspect
  const left = Math.min(0, Math.max(vw - w, vw / 2 - fx * w))
  const top = Math.min(0, Math.max(vh - h, vh / 2 - fy * h))
  return { w, h, left, top }
}

export default function SurVotreMur() {
  const { t, lang } = useLanguage()
  const w = t.wall
  const isMobile = useIsMobile()
  const { addToCart, removeFromCart, isInCart } = useCart()
  const [roomIndex, setRoomIndex] = useState(0)
  const [index, setIndex] = useState(0)
  const [showMeasures, setShowMeasures] = useState(true)
  const [size, setSize] = useState({ vw: 0, vh: 0 })
  const viewRef = useRef<HTMLDivElement>(null)
  const lit = useInView(viewRef, { once: true, amount: 0.4 })

  useLayoutEffect(() => {
    const el = viewRef.current
    if (!el) return
    const measure = () => setSize({ vw: el.clientWidth, vh: el.clientHeight })
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const room = ROOMS[roomIndex]
  const piece = PIECES[index]
  const inCart = isInCart(piece.id)
  const box = stageBox(size.vw, size.vh, room, isMobile)
  const go = (by: number) => setIndex((i) => (i + by + PIECES.length) % PIECES.length)

  return (
    <div className="mt-28 md:mt-36">
      <div className="text-center">
        <p className="text-xs uppercase tracking-[0.38em] text-gold font-body">{w.eyebrow}</p>
        <h3 className="mt-4 font-display text-3xl md:text-4xl font-medium text-charcoal leading-snug">
          {w.title} <em className="italic font-normal text-gold">{w.titleItalic}</em>
        </h3>
        <p className="mt-4 mx-auto max-w-lg text-sm md:text-base text-charcoal/55 font-body font-light leading-relaxed">
          {w.body}
        </p>
      </div>

      {/* ── The room ── */}
      <div
        ref={viewRef}
        dir="ltr"
        className="relative mx-auto mt-10 aspect-[4/5] w-full overflow-hidden rounded-2xl bg-[#1E1208] shadow-[0_40px_80px_-40px_rgba(44,24,16,0.5)] ring-1 ring-charcoal/10 md:transition-[width] md:duration-700 md:ease-[cubic-bezier(0.22,1,0.36,1)]"
        // On laptop the frame takes each room's own shape at a height that
        // fits the screen, so the photo is never cropped above the canvas.
        style={isMobile ? undefined : { aspectRatio: room.deskAspect, width: `min(100%, 900px, calc(min(560px, 100vh - 120px) * ${room.deskAspect}))` }}
      >
        <AnimatePresence initial={false}>
          <motion.div
            key={room.id}
            className="absolute"
            style={{
              left: box.left,
              top: box.top,
              width: box.w,
              height: box.h,
              ['--cm' as string]: `${box.w / room.wallCm}px`,
            } as CSSProperties}
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
          >
            <Image
              src={room.src}
              alt=""
              fill
              sizes="(max-width: 768px) 220vw, 1200px"
              quality={85}
              className="select-none object-cover"
              draggable={false}
            />

            {/* The canvas — real size, wooden frame, shadow cast by the room's light */}
            <div
              className="absolute -translate-x-1/2 transition-[width,height] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
              style={{
                left: `${room.hangX * 100}%`,
                bottom: `${(1 - room.hangY) * 100}%`,
                width: cm(piece.width),
                height: cm(piece.height),
              }}
            >
              <div
                className="absolute inset-0"
                style={{
                  padding: cm(FRAME_CM),
                  background: 'linear-gradient(135deg, #A8845A 0%, #7A5A38 30%, #B08D62 55%, #6E5033 80%, #94714A 100%)',
                  // The 3.5 cm depth throws a real shadow onto the wall.
                  boxShadow: `${cm(room.shadow[0])} ${cm(room.shadow[1])} ${cm(7)} rgba(20,12,4,0.42), ${cm(room.shadow[0] * 0.3)} ${cm(room.shadow[1] * 0.3)} ${cm(1.2)} rgba(20,12,4,0.35), inset 0 0 0 1px rgba(255,240,210,0.18)`,
                }}
              >
                <div className="relative h-full w-full overflow-hidden bg-[#2C1810] shadow-[inset_0_0_6px_rgba(0,0,0,0.45)]">
                  <AnimatePresence initial={false}>
                    <motion.div
                      key={piece.id}
                      className="absolute inset-0"
                      initial={{ opacity: 0, scale: 1.06, filter: 'blur(6px)' }}
                      animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    >
                      {piece.image && (
                        <Image
                          src={`/images/${piece.image}`}
                          alt={piece.theme}
                          fill
                          sizes="(max-width: 768px) 45vw, 280px"
                          className="object-cover"
                        />
                      )}
                    </motion.div>
                  </AnimatePresence>
                  {/* the room's own light across the canvas face */}
                  <div className="pointer-events-none absolute inset-0" style={{ background: room.light }} />
                </div>
              </div>

              {/* Measurements */}
              <div
                className="pointer-events-none transition-opacity duration-500"
                style={{ opacity: showMeasures && lit ? 1 : 0, color: room.ink }}
              >
                <div className="absolute inset-x-0 flex items-center" style={{ bottom: cm(-9) }}>
                  <span className="h-[7px] w-px bg-current" />
                  <span className="h-px flex-1 bg-current opacity-70" />
                  <span className="px-1.5 font-body text-[10px] md:text-[11px] tracking-[0.12em] tabular-nums whitespace-nowrap">
                    {piece.width} cm
                  </span>
                  <span className="h-px flex-1 bg-current opacity-70" />
                  <span className="h-[7px] w-px bg-current" />
                </div>
                <div className="absolute inset-y-0 flex flex-col items-center" style={{ right: cm(-10) }}>
                  <span className="h-px w-[7px] bg-current" />
                  <span className="w-px flex-1 bg-current opacity-70" />
                  <span className="py-1.5 font-body text-[10px] md:text-[11px] tracking-[0.12em] tabular-nums whitespace-nowrap [writing-mode:vertical-rl] rotate-180">
                    {piece.height} cm
                  </span>
                  <span className="w-px flex-1 bg-current opacity-70" />
                  <span className="h-px w-[7px] bg-current" />
                </div>
              </div>
            </div>

            {/* Sofa width — the scale reference */}
            <p
              className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-white/55 px-3 py-1 font-body text-[9px] md:text-[10px] uppercase tracking-[0.22em] text-charcoal/75 backdrop-blur-sm transition-opacity duration-500"
              style={{ left: `${room.hangX * 100}%`, top: `${room.labelY * 100}%`, opacity: showMeasures && lit ? 1 : 0 }}
            >
              {w.sofa} · {room.sofaCm} cm
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Lights coming on as the room scrolls into view */}
        <div
          className="pointer-events-none absolute inset-0 bg-[#140C05] transition-opacity duration-[1800ms] ease-out"
          style={{ opacity: lit ? 0 : 0.55 }}
        />
        {/* soft lens vignette */}
        <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_80px_rgba(20,12,4,0.25)]" />
      </div>

      {/* ── Controls ── */}
      <div className="mx-auto mt-8 grid max-w-[900px] gap-8 md:grid-cols-[1fr_auto_1fr] md:items-center" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        {/* Interior */}
        <div>
          <p className="text-[10px] uppercase tracking-[0.24em] text-charcoal/45 font-body text-center md:text-start">{w.wallLabel}</p>
          <div className="mt-3 flex justify-center md:justify-start gap-3">
            {ROOMS.map((r, i) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRoomIndex(i)}
                aria-pressed={roomIndex === i}
                className="group flex w-[4.75rem] flex-col items-center gap-1.5 outline-none"
              >
                <span
                  className={`relative block h-11 w-full overflow-hidden rounded-md transition-all duration-300 group-focus-visible:ring-2 group-focus-visible:ring-gold/60 ${
                    roomIndex === i ? 'ring-2 ring-gold ring-offset-2 ring-offset-parchment' : 'ring-1 ring-charcoal/15 opacity-75 group-hover:opacity-100'
                  }`}
                >
                  <Image src={r.src} alt="" fill sizes="80px" className="object-cover" />
                </span>
                <span className={`text-center text-[10px] leading-tight font-body transition-colors ${roomIndex === i ? 'text-charcoal' : 'text-charcoal/45'}`}>
                  {w.walls[i]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Piece */}
        <div className="flex flex-col items-center text-center">
          <p className="text-[10px] uppercase tracking-[0.24em] text-charcoal/45 font-body">
            {w.pieceLabel} · {String(index + 1).padStart(2, '0')} / {PIECES.length}
          </p>
          <div className="mt-2 flex items-center gap-4">
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label={w.prev}
              className="grid size-9 place-items-center rounded-full border border-gold/40 text-gold transition hover:bg-gold hover:text-canvas"
            >
              <ChevronLeft className="size-4 rtl:rotate-180" />
            </button>
            <div className="w-48">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={piece.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                >
                  <p lang="fr" className="font-display text-xl italic text-charcoal">{piece.theme}</p>
                  <p className="mt-0.5 font-body text-xs text-charcoal/50" dir="ltr">
                    {formatSize(piece, lang)} · {formatDH(piece.price)}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label={w.next}
              className="grid size-9 place-items-center rounded-full border border-gold/40 text-gold transition hover:bg-gold hover:text-canvas"
            >
              <ChevronRight className="size-4 rtl:rotate-180" />
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col items-center md:items-end gap-3">
          <button
            type="button"
            onClick={(e) =>
              inCart ? removeFromCart(piece.id) : addToCart(piece.id, `/images/${piece.image}`, e.currentTarget)
            }
            className={`inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-xs font-medium tracking-wide transition-colors ${
              inCart
                ? 'border border-gold/60 bg-gold/10 text-charcoal'
                : 'bg-charcoal text-canvas hover:bg-charcoal-mid'
            }`}
          >
            {inCart && <Check className="size-3.5" />}
            {inCart ? t.cart.inCart : t.cart.addToCart}
          </button>
          <label className="inline-flex cursor-pointer items-center gap-2 text-[11px] font-body text-charcoal/55">
            <input
              type="checkbox"
              checked={showMeasures}
              onChange={(e) => setShowMeasures(e.target.checked)}
              className="size-3.5 accent-[#C89B3C]"
            />
            {w.measures}
          </label>
        </div>
      </div>

      <p className="mt-6 text-center text-[11px] italic text-charcoal/40 font-body">{w.note}</p>
    </div>
  )
}
