'use client'

import { useRef, useState, type CSSProperties } from 'react'
import Image from 'next/image'
import { AnimatePresence, motion, useInView } from 'motion/react'
import { ChevronLeft, ChevronRight, Check } from 'lucide-react'
import { PIECES, formatSize } from '@/data/catalogue'
import { useLanguage } from '@/i18n/LanguageContext'
import { useCart } from '@/context/CartContext'
import { formatDH } from './CartDrawer'

/* ─── "Sur votre mur" — a softly lit room drawn to real scale, so a client
   can see what 80 × 120 cm actually means above a sofa.

   Everything is measured in centimetres. The room is a CSS container and
   `--cm` is one centimetre in pixels (container width ÷ how many cm of
   wall are on show), so the canvas, its wooden frame, the sofa, the lamp
   and the plant all share one scale, at every screen size. ─────────────── */

const WALLS = [
  { hex: '#F2ECE1', ink: 'rgba(44,24,16,0.62)' }, // blanc cassé
  { hex: '#E2D0B4', ink: 'rgba(44,24,16,0.62)' }, // beige
  { hex: '#C47A5A', ink: 'rgba(255,248,236,0.85)' }, // terracotta
  { hex: '#A7B398', ink: 'rgba(44,24,16,0.66)' }, // vert sauge
]

const FLOOR_CM = 30      // depth of floor shown in front of the wall
const SOFA_W = 200
const SOFA_H = 85
const HANG_GAP = 20      // canvas hangs this far above the sofa back
const FRAME_CM = 2.5     // visible face of the decorative wooden frame
// The sofa stands a little in front of the wall, so its feet sit on the
// floor below the skirting line.
const SOFA_BOTTOM = FLOOR_CM - 12
// The sofa drawing's back cushion starts 12 cm below its box top.
const SOFA_BACK_TOP = SOFA_BOTTOM + SOFA_H - 12
const CANVAS_BOTTOM = SOFA_BACK_TOP + HANG_GAP

/** `n` centimetres, in pixels. */
const cm = (n: number) => `calc(var(--cm) * ${n})`

function Sofa() {
  return (
    <svg viewBox={`0 0 ${SOFA_W} ${SOFA_H}`} className="block h-full w-full" aria-hidden="true">
      <defs>
        <linearGradient id="svm-fabric" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#7A6D63" />
          <stop offset="1" stopColor="#564B43" />
        </linearGradient>
        <linearGradient id="svm-seat" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#857669" />
          <stop offset="1" stopColor="#5E5249" />
        </linearGradient>
      </defs>
      {/* back */}
      <rect x="10" y="12" width="180" height="42" rx="9" fill="url(#svm-fabric)" />
      <line x1="100" y1="16" x2="100" y2="50" stroke="#4A4039" strokeWidth="0.6" opacity="0.6" />
      {/* cushions — oat and gold, the house colours */}
      <g transform="rotate(-8 42 40)">
        <rect x="26" y="26" width="32" height="28" rx="7" fill="#D6C09A" />
      </g>
      <g transform="rotate(7 158 40)">
        <rect x="142" y="27" width="30" height="27" rx="7" fill="#C89B3C" />
      </g>
      <g transform="rotate(4 128 44)">
        <rect x="116" y="33" width="24" height="21" rx="6" fill="#EADCC0" />
      </g>
      {/* seat */}
      <rect x="14" y="50" width="172" height="20" rx="5" fill="url(#svm-seat)" />
      <line x1="100" y1="51" x2="100" y2="69" stroke="#4A4039" strokeWidth="0.6" opacity="0.5" />
      {/* arms */}
      <rect x="0" y="32" width="19" height="44" rx="8" fill="url(#svm-fabric)" />
      <rect x="181" y="32" width="19" height="44" rx="8" fill="url(#svm-fabric)" />
      {/* base + oak legs */}
      <rect x="4" y="70" width="192" height="8" rx="3" fill="#4F453E" />
      <rect x="16" y="78" width="4" height="7" rx="1" fill="#8C6A47" />
      <rect x="180" y="78" width="4" height="7" rx="1" fill="#8C6A47" />
    </svg>
  )
}

function FloorLamp() {
  // 160 cm tall arc-free linen lamp, lit.
  return (
    <svg viewBox="0 0 44 160" className="block h-full w-full overflow-visible" aria-hidden="true">
      <defs>
        <radialGradient id="svm-lamp-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#FFE9B8" stopOpacity="0.75" />
          <stop offset="1" stopColor="#FFE9B8" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="22" cy="22" rx="60" ry="55" fill="url(#svm-lamp-glow)" />
      <path d="M8 4 H36 L42 34 H2 Z" fill="#F4E9D2" stroke="#D9C7A4" strokeWidth="0.6" />
      <rect x="21" y="34" width="2" height="122" fill="#A67C00" />
      <ellipse cx="22" cy="157" rx="12" ry="3" fill="#7A5B1E" />
    </svg>
  )
}

function OliveTree() {
  // ~125 cm potted olive tree.
  return (
    <svg viewBox="0 0 60 125" className="block h-full w-full overflow-visible" aria-hidden="true">
      <path d="M30 88 C28 70 33 60 29 44 M30 70 C36 62 40 56 44 46 M29 60 C22 54 18 48 15 40" stroke="#6B5136" strokeWidth="2" fill="none" strokeLinecap="round" />
      <g fill="#7F8C64">
        <ellipse cx="29" cy="30" rx="17" ry="14" />
        <ellipse cx="15" cy="40" rx="12" ry="9" />
        <ellipse cx="45" cy="42" rx="13" ry="10" />
        <ellipse cx="38" cy="22" rx="11" ry="9" />
      </g>
      <g fill="#97A47A" opacity="0.85">
        <ellipse cx="24" cy="24" rx="9" ry="6" />
        <ellipse cx="44" cy="38" rx="7" ry="5" />
        <ellipse cx="12" cy="37" rx="6" ry="4" />
      </g>
      <path d="M14 88 H46 L42 125 H18 Z" fill="#EDE3D2" />
      <path d="M14 88 H46 L45.4 93 H14.6 Z" fill="#D8CBB4" />
    </svg>
  )
}

export default function SurVotreMur() {
  const { t, lang } = useLanguage()
  const w = t.wall
  const { addToCart, removeFromCart, isInCart } = useCart()
  const [wall, setWall] = useState(0)
  const [index, setIndex] = useState(0)
  const [showMeasures, setShowMeasures] = useState(true)
  const roomRef = useRef<HTMLDivElement>(null)
  const lit = useInView(roomRef, { once: true, amount: 0.4 })

  const piece = PIECES[index]
  const inCart = isInCart(piece.id)
  const ink = WALLS[wall].ink
  const go = (by: number) => {
    setIndex((i) => (i + by + PIECES.length) % PIECES.length)
  }

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
      <div className="mt-10 mx-auto max-w-[960px] [container-type:inline-size]" dir="ltr">
        <div
          ref={roomRef}
          className="relative overflow-hidden rounded-2xl shadow-[0_40px_80px_-40px_rgba(44,24,16,0.45)] ring-1 ring-charcoal/10 [--room-w:250] [--room-h:290] md:[--room-w:470] md:[--room-h:272]"
          style={{
            ['--cm' as string]: 'calc(100cqw / var(--room-w))',
            height: 'calc(var(--cm) * var(--room-h))',
          } as CSSProperties}
        >
          {/* Wall */}
          <div
            className="absolute inset-0 transition-colors duration-1000 ease-out"
            style={{ backgroundColor: WALLS[wall].hex }}
          />
          {/* Ambient light — darker toward the ceiling and the corners */}
          <div
            className="pointer-events-none absolute inset-0 transition-opacity duration-[1800ms]"
            style={{
              opacity: lit ? 1 : 0.25,
              background:
                'radial-gradient(120% 90% at 50% 100%, transparent 40%, rgba(30,18,8,0.18) 100%), linear-gradient(to bottom, rgba(30,18,8,0.07), transparent 35%)',
            }}
          />
          {/* Dim room before the light comes on */}
          <div
            className="pointer-events-none absolute inset-0 bg-[#1E1208] transition-opacity duration-[1800ms] ease-out"
            style={{ opacity: lit ? 0 : 0.42 }}
          />
          {/* Picture-light wash on the wall around the canvas */}
          <div
            className="pointer-events-none absolute left-1/2 -translate-x-1/2 transition-opacity duration-[2200ms] ease-out"
            style={{
              opacity: lit ? 1 : 0,
              transitionDelay: lit ? '500ms' : '0ms',
              width: cm(230),
              height: cm(190),
              bottom: cm(CANVAS_BOTTOM - 45),
              background: 'radial-gradient(50% 55% at 50% 30%, rgba(255,236,190,0.55), rgba(255,236,190,0.18) 55%, transparent 75%)',
              mixBlendMode: 'soft-light',
            }}
          />

          {/* Skirting board */}
          <div
            className="absolute inset-x-0"
            style={{ bottom: cm(FLOOR_CM), height: cm(9), background: 'linear-gradient(#F7F1E6, #E6DCCB)', boxShadow: '0 -1px 0 rgba(44,24,16,0.08)' }}
          />
          {/* Oak floor */}
          <div
            className="absolute inset-x-0 bottom-0"
            style={{
              height: cm(FLOOR_CM),
              background:
                `linear-gradient(to bottom, rgba(30,18,8,0.28), transparent 45%), repeating-linear-gradient(90deg, rgba(60,36,16,0.16) 0 1px, transparent 1px ${cm(22)}), linear-gradient(#B98F62, #9C7348)`,
            }}
          />

          {/* Floor lamp — left, laptop only (outside the phone's wall width) */}
          <div
            className="absolute hidden md:block transition-opacity duration-1000"
            style={{ left: `calc(50% - ${cm(178)})`, bottom: cm(FLOOR_CM - 8), width: cm(44), height: cm(160), opacity: lit ? 1 : 0.6 }}
          >
            <FloorLamp />
          </div>

          {/* Olive tree — right, laptop only */}
          <div
            className="absolute hidden md:block"
            style={{ left: `calc(50% + ${cm(122)})`, bottom: cm(FLOOR_CM - 10), width: cm(60), height: cm(125) }}
          >
            <OliveTree />
          </div>

          {/* Sofa — 200 cm, the scale reference */}
          <div
            className="absolute left-1/2 -translate-x-1/2"
            style={{ bottom: cm(SOFA_BOTTOM), width: cm(SOFA_W), height: cm(SOFA_H) }}
          >
            <div className="absolute inset-x-[4%] -bottom-[3%] h-[10%] rounded-[50%] bg-black/25 blur-md" />
            <div className="relative h-full w-full">
              <Sofa />
            </div>
          </div>

          {/* The canvas — wooden frame, real size, depth shadow */}
          <div
            className="absolute left-1/2 -translate-x-1/2 transition-[width,height] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={{
              bottom: cm(CANVAS_BOTTOM),
              width: cm(piece.width),
              height: cm(piece.height),
            }}
          >
            {/* Picture light — brass bar above the frame */}
            <div
              className="absolute left-1/2 -translate-x-1/2 rounded-full"
              style={{
                top: cm(-11),
                width: cm(Math.min(46, piece.width * 0.55)),
                height: cm(3),
                background: 'linear-gradient(#E8C46A, #A67C00)',
                boxShadow: lit ? '0 0 calc(var(--cm) * 6) rgba(255,226,150,0.8)' : 'none',
                transition: 'box-shadow 1.6s ease 0.4s',
              }}
            />
            <div
              className="absolute left-1/2 -translate-x-1/2 bg-[#8A6A1C]"
              style={{ top: cm(-8), width: cm(1), height: cm(8) }}
            />

            {/* Frame */}
            <div
              className="absolute inset-0"
              style={{
                padding: cm(FRAME_CM),
                background: 'linear-gradient(135deg, #A8845A 0%, #7A5A38 30%, #B08D62 55%, #6E5033 80%, #94714A 100%)',
                // The 3.5 cm depth throws a real shadow onto the wall.
                boxShadow: `${cm(1.2)} ${cm(3.5)} ${cm(7)} rgba(30,18,8,0.38), inset 0 0 0 1px rgba(255,240,210,0.18)`,
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
                        sizes="(max-width: 768px) 40vw, 260px"
                        className="object-cover"
                      />
                    )}
                  </motion.div>
                </AnimatePresence>
                {/* light falling from the brass bar */}
                <div
                  className="pointer-events-none absolute inset-0 transition-opacity duration-[1600ms]"
                  style={{
                    opacity: lit ? 1 : 0,
                    background: 'radial-gradient(90% 55% at 50% 0%, rgba(255,236,190,0.28), transparent 70%)',
                  }}
                />
              </div>
            </div>

            {/* Measurements */}
            <div
              className="pointer-events-none transition-opacity duration-500"
              style={{ opacity: showMeasures && lit ? 1 : 0, color: ink }}
            >
              {/* width — under the frame */}
              <div className="absolute inset-x-0 flex items-center" style={{ bottom: cm(-10) }}>
                <span className="h-[7px] w-px bg-current" />
                <span className="h-px flex-1 bg-current opacity-70" />
                <span className="px-1.5 font-body text-[10px] md:text-[11px] tracking-[0.12em] tabular-nums whitespace-nowrap">
                  {piece.width} cm
                </span>
                <span className="h-px flex-1 bg-current opacity-70" />
                <span className="h-[7px] w-px bg-current" />
              </div>
              {/* height — right of the frame */}
              <div className="absolute inset-y-0 flex flex-col items-center" style={{ right: cm(-11) }}>
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

          {/* Sofa label, on the floor */}
          <p
            className="pointer-events-none absolute left-1/2 -translate-x-1/2 font-body text-[9px] md:text-[10px] uppercase tracking-[0.22em] text-[#FFF8EC]/80 transition-opacity duration-500 whitespace-nowrap"
            style={{ bottom: cm(5), opacity: showMeasures && lit ? 1 : 0 }}
          >
            {w.sofa}
          </p>
        </div>
      </div>

      {/* ── Controls ── */}
      <div className="mx-auto mt-8 grid max-w-[960px] gap-8 md:grid-cols-[1fr_auto_1fr] md:items-center" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        {/* Wall colour */}
        <div>
          <p className="text-[10px] uppercase tracking-[0.24em] text-charcoal/45 font-body text-center md:text-start">{w.wallLabel}</p>
          <div className="mt-3 flex justify-center md:justify-start gap-3">
            {WALLS.map((wl, i) => (
              <button
                key={wl.hex}
                type="button"
                onClick={() => setWall(i)}
                aria-pressed={wall === i}
                aria-label={w.walls[i]}
                title={w.walls[i]}
                className="group flex flex-col items-center gap-1.5 outline-none"
              >
                <span
                  className={`block size-9 rounded-full transition-all duration-300 group-focus-visible:ring-2 group-focus-visible:ring-gold/60 ${
                    wall === i ? 'ring-2 ring-gold ring-offset-2 ring-offset-parchment scale-110' : 'ring-1 ring-charcoal/15 group-hover:scale-105'
                  }`}
                  style={{ backgroundColor: wl.hex, boxShadow: 'inset 0 -6px 10px rgba(0,0,0,0.08)' }}
                />
                <span className={`text-[10px] font-body transition-colors ${wall === i ? 'text-charcoal' : 'text-charcoal/45'}`}>
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
