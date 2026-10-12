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
  /** the piece of furniture that gives the scale, and its width */
  ref: 'sofa' | 'desk' | 'bed'
  refCm: number
  /** canvas centre x */
  hangX: number
  /** 'bottom': hangY is the canvas's bottom edge (20 cm above the furniture);
      'center': hangY is its centre — for walls with a moulded panel or a
      symmetrical composition the canvas belongs in the middle of */
  anchor: 'bottom' | 'center'
  hangY: number
  /** where the reference width label sits */
  labelX: number
  labelY: number
  /** laptop frame shape — the whole photo where it fits, a crop where it is very wide */
  deskAspect: number
  /** focal point and zoom of the stage crop, laptop / phone */
  focus: { desk: [number, number, number]; phone: [number, number, number] }
  /** cast shadow direction in cm (x, y), following the room's light */
  shadow: [number, number]
  /** light falling across the canvas face, matched to the photo */
  light: string
  /** picture light washing the wall around the canvas (a soft default otherwise) */
  glow?: string
  /** colour grade so the painting takes the room's light, white balance and contrast */
  grade: string
  ink: string
}

const ROOMS: Room[] = [
  {
    id: 'haussmann',
    grade: 'brightness(1.03) contrast(1.03) saturate(0.97)',
    src: '/rooms/haussmann.jpg',
    aspect: 2000 / 1500,
    wallCm: 366,
    ref: 'sofa',
    refCm: 250,
    // Centred on the middle one of the wall's three moulded panels, so the
    // canvas sits symmetrically in the panelling instead of straddling a
    // seam; 20 cm above the sofa back.
    hangX: 0.381,
    anchor: 'bottom',
    hangY: 0.477,
    labelX: 0.51,
    labelY: 0.915,
    deskAspect: 2000 / 1500,
    focus: { desk: [0.5, 0.5, 1], phone: [0.45, 0.5, 1] },
    shadow: [-1.6, 3.2],
    light: 'linear-gradient(255deg, rgba(255,255,255,0.16), transparent 55%, rgba(20,20,30,0.10))',
    ink: 'rgba(44,24,16,0.7)',
  },
  {
    id: 'doree',
    grade: 'sepia(0.1) saturate(1.06) brightness(1.01)',
    src: '/rooms/doree.jpg',
    aspect: 2000 / 1800,
    wallCm: 297,
    ref: 'sofa',
    refCm: 220,
    hangX: 0.525,
    anchor: 'bottom',
    hangY: 0.564,
    labelX: 0.525,
    labelY: 0.965,
    deskAspect: 2000 / 1800,
    focus: { desk: [0.5, 0.5, 1], phone: [0.525, 0.5, 1] },
    shadow: [2, 3],
    light: 'linear-gradient(110deg, rgba(255,214,150,0.18), transparent 50%, rgba(80,40,10,0.12)), linear-gradient(rgba(255,190,120,0.06), rgba(255,190,120,0.06))',
    ink: 'rgba(60,36,16,0.72)',
  },
  {
    id: 'emeraude',
    grade: 'brightness(0.94) contrast(1.08) saturate(1.04)',
    src: '/rooms/emeraude.jpg',
    aspect: 2000 / 1125,
    wallCm: 580,
    ref: 'sofa',
    refCm: 180,
    hangX: 0.5,
    anchor: 'bottom',
    hangY: 0.45,
    labelX: 0.5,
    labelY: 0.765,
    deskAspect: 16 / 10,
    focus: { desk: [0.5, 0.37, 1.3], phone: [0.5, 0.4, 1] },
    shadow: [0, 4],
    light: 'radial-gradient(120% 80% at 50% 0%, rgba(255,240,210,0.16), transparent 60%), linear-gradient(rgba(0,30,28,0.18), rgba(0,30,28,0.18))',
    glow: 'radial-gradient(closest-side, rgba(255,232,190,0.30), rgba(255,232,190,0.10) 55%, transparent)',
    ink: 'rgba(240,250,246,0.8)',
  },
  {
    id: 'bureau',
    grade: 'sepia(0.05) brightness(1.02) contrast(1.02)',
    src: '/rooms/bureau.jpg',
    aspect: 2000 / 1333,
    wallCm: 372,
    ref: 'desk',
    refCm: 136,
    // Dead centre between the two arched cabinets and their sconces; high
    // enough to clear the bouquet on the desk.
    hangX: 0.5,
    anchor: 'bottom',
    hangY: 0.6225,
    labelX: 0.5,
    labelY: 0.835,
    deskAspect: 2000 / 1333,
    focus: { desk: [0.5, 0.5, 1], phone: [0.5, 0.48, 1] },
    shadow: [0, 3],
    light: 'linear-gradient(90deg, rgba(255,226,180,0.14), transparent 30%, transparent 70%, rgba(255,226,180,0.14))',
    ink: 'rgba(44,24,16,0.7)',
  },
  {
    id: 'chambre',
    grade: 'brightness(1.05) contrast(0.98) saturate(0.95)',
    src: '/rooms/chambre.jpg',
    aspect: 2000 / 1333,
    wallCm: 448,
    ref: 'bed',
    refCm: 160,
    // Centred in the moulded frame above the headboard.
    hangX: 0.525,
    anchor: 'center',
    hangY: 0.375,
    labelX: 0.45,
    labelY: 0.86,
    deskAspect: 2000 / 1333,
    focus: { desk: [0.5, 0.5, 1], phone: [0.53, 0.45, 1] },
    shadow: [2.2, 3],
    light: 'linear-gradient(75deg, rgba(255,255,255,0.18), transparent 55%, rgba(30,20,10,0.08))',
    ink: 'rgba(44,24,16,0.7)',
  },
  {
    id: 'galerie',
    grade: 'saturate(0.9) contrast(1.05) brightness(1.02)',
    src: '/rooms/galerie.jpg',
    aspect: 2000 / 1469,
    wallCm: 519,
    ref: 'sofa',
    refCm: 184,
    // Under the middle spotlight, centred over the sofa.
    hangX: 0.498,
    anchor: 'bottom',
    hangY: 0.643,
    labelX: 0.498,
    labelY: 0.935,
    deskAspect: 2000 / 1469,
    focus: { desk: [0.5, 0.55, 1], phone: [0.5, 0.55, 1] },
    shadow: [0, 4.5],
    light: 'radial-gradient(120% 70% at 50% 0%, rgba(255,255,255,0.14), transparent 60%), linear-gradient(rgba(40,40,44,0.08), rgba(40,40,44,0.08))',
    ink: 'rgba(30,30,34,0.7)',
  },
]

const FRAME_CM = 2.5 // visible face of the decorative wooden frame

/** `n` centimetres, in pixels (inside a stage that sets --cm). */
const cm = (n: number) => `calc(var(--cm) * ${n})`

/** A 3.5 cm deep frame's shadow on the wall: a tight contact line, a soft
    mid shadow and a wide ambient one, all cast away from the room's light.
    `k` scales the throw — small while the canvas is still being hung. */
function shadowLayers([x, y]: [number, number], k: number, px: number) {
  const p = (n: number) => `${(n * px).toFixed(2)}px`
  return [
    `${p(x * 0.15 * k)} ${p(y * 0.15 * k)} ${p(0.6)} rgba(20,12,4,${0.5 * k})`,
    `${p(x * 0.55 * k)} ${p(y * 0.55 * k)} ${p(3)} rgba(20,12,4,${0.3 * k})`,
    `${p(x * 1.2 * k)} ${p(y * 1.4 * k)} ${p(10)} rgba(20,12,4,${0.22 * k})`,
  ].join(', ')
}

/** Cover-crop the photo into the viewport around a focal point, zoomed. */
function stageBox(vw: number, vh: number, room: Room, phone: boolean) {
  const [fx, fy, zoom] = phone ? room.focus.phone : room.focus.desk
  const w = Math.max(vw, vh * room.aspect) * zoom
  const h = w / room.aspect
  const left = Math.min(0, Math.max(vw - w, vw / 2 - fx * w))
  const top = Math.min(0, Math.max(vh - h, vh / 2 - fy * h))
  return { w, h, left, top }
}

export default function SurVotreMur({ className = '' }: { className?: string }) {
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
  const cmPx = box.w / room.wallCm
  const go = (by: number) => setIndex((i) => (i + by + PIECES.length) % PIECES.length)

  return (
    <div className={className}>
      <div className="text-center">
        <p className="text-xs uppercase tracking-[0.38em] text-gold font-body">{w.eyebrow}</p>
        <h2 className="mt-4 font-display text-4xl md:text-5xl font-medium text-charcoal leading-snug">
          {w.title} <em className="italic font-normal text-gold">{w.titleItalic}</em>
        </h2>
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
              ['--cm' as string]: `${cmPx}px`,
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

            {/* The canvas. A zero-size anchor sits at the hanging point;
                each piece is hung from it at its real size, so changing piece
                is a real re-hang — the old canvas lifts away and the new one
                is lowered onto the wall, its shadow settling as it touches. */}
            <div
              className="absolute"
              style={{ left: `${room.hangX * 100}%`, top: `${room.hangY * 100}%`, width: 0, height: 0 }}
            >
              <AnimatePresence initial={false}>
                <motion.div
                  key={piece.id}
                  className="absolute"
                  style={{
                    width: cm(piece.width),
                    height: cm(piece.height),
                    left: `calc(${cm(piece.width)} * -0.5)`,
                    top: `calc(${cm(piece.height)} * ${room.anchor === 'bottom' ? -1 : -0.5})`,
                  }}
                  initial={{ opacity: 0, y: -18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10, transition: { duration: 0.35, ease: 'easeIn' } }}
                  transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                >
                  {/* Picture light: a warm wash on the wall around the canvas */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute transition-opacity duration-[2200ms] ease-out"
                    style={{
                      inset: '-38% -55% -30%',
                      background: room.glow ?? 'radial-gradient(closest-side, rgba(255,240,214,0.20), rgba(255,240,214,0.06) 60%, transparent)',
                      mixBlendMode: 'screen',
                      opacity: lit ? 1 : 0,
                    }}
                  />

                  {/* Frame — 2.5 cm wooden face, lit from above, 3.5 cm deep */}
                  <motion.div
                    className="absolute inset-0"
                    style={{
                      padding: cm(FRAME_CM),
                      background: 'linear-gradient(135deg, #A8845A 0%, #7A5A38 30%, #B08D62 55%, #6E5033 80%, #94714A 100%)',
                    }}
                    // The shadow grows as the canvas meets the wall.
                    initial={{ boxShadow: shadowLayers(room.shadow, 0.35, cmPx) }}
                    animate={{ boxShadow: shadowLayers(room.shadow, 1, cmPx) }}
                    transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <div
                      className="relative h-full w-full overflow-hidden bg-[#2C1810]"
                      // The frame's inner lip shades the edge of the painting.
                      style={{ boxShadow: `inset 0 0 ${cm(1.4)} rgba(0,0,0,0.45)` }}
                    >
                      {piece.image && (
                        <Image
                          src={`/images/${piece.image}`}
                          alt={piece.theme}
                          fill
                          quality={90}
                          sizes="(max-width: 768px) 60vw, 420px"
                          className="object-cover"
                          style={{ filter: room.grade }}
                        />
                      )}
                      {/* linen weave — it reads as paint on canvas, not a screen */}
                      <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 opacity-60 mix-blend-soft-light"
                        style={{
                          backgroundImage:
                            'repeating-linear-gradient(0deg, rgba(255,255,255,0.10) 0 1px, transparent 1px 3px), repeating-linear-gradient(90deg, rgba(0,0,0,0.10) 0 1px, transparent 1px 3px)',
                        }}
                      />
                      {/* the room's own light across the canvas face */}
                      <div className="pointer-events-none absolute inset-0" style={{ background: room.light }} />
                      {/* one slow gallery sheen as the canvas settles */}
                      <motion.div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-y-0 w-1/2 mix-blend-soft-light"
                        style={{ background: 'linear-gradient(100deg, transparent, rgba(255,246,226,0.55), transparent)' }}
                        initial={{ left: '-60%' }}
                        animate={{ left: lit ? '120%' : '-60%' }}
                        transition={{ duration: 1.8, delay: 0.5, ease: [0.4, 0, 0.2, 1] }}
                      />
                    </div>
                    {/* bevel: light catching the frame's top edge, shade on its underside */}
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0"
                      style={{
                        boxShadow: `inset 0 ${cm(0.5)} 0 rgba(255,236,200,0.28), inset 0 calc(${cm(0.5)} * -1) 0 rgba(30,16,4,0.30), inset 0 0 0 1px rgba(255,240,210,0.16)`,
                      }}
                    />
                  </motion.div>

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
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Width of the room's reference furniture — the scale */}
            <p
              className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-white/55 px-3 py-1 font-body text-[9px] md:text-[10px] uppercase tracking-[0.22em] text-charcoal/75 backdrop-blur-sm transition-opacity duration-500"
              style={{ left: `${room.labelX * 100}%`, top: `${room.labelY * 100}%`, opacity: showMeasures && lit ? 1 : 0 }}
            >
              {w.refs[room.ref]} · {room.refCm} cm
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
          <div className="mt-3 mx-auto grid w-max grid-cols-3 gap-x-3 gap-y-3 md:mx-0">
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
