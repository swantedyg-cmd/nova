'use client'

import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import Tilt from './Tilt'

/* ─── Nova Canvas Art logo — animated gold paintbrush mark ────────────────
   Static counterpart lives at public/nova-logo.svg (same gradient/glyph,
   no motion — used for favicons, OG images, anywhere a plain asset is
   needed). This component re-renders the same composition inline so each
   piece (stroke, sparkles, letters) can be animated independently.

   The brush stroke here is a STROKED open spine (not the static file's
   filled ribbon) — strokeDashoffset can only animate a stroked path, so
   the "draws itself" effect needs an open line with a thick round-capped
   stroke rather than a closed filled shape. Visually it reads the same
   gold ribbon once fully drawn. `pathLength={1}` normalizes the dash math
   so the draw-in doesn't depend on the curve's real geometric length. ── */

const STROKE_DURATION = 1.2
const LETTER_STAGGER = 0.08
const SPARKLE_STAGGER = 0.15
const TAGLINE_DELAY = 1.8
const SHIMMER_START = 2.3
const SHIMMER_SWEEP_DURATION = 1.2
const SHIMMER_CYCLE = 4

const SPINE_PATH =
  'M90,80 C130,55 170,60 195,95 C215,122 205,145 180,155 C165,161 168,172 180,185 C205,210 230,225 252,232'

const SPARKLE_PATH =
  'M12 0C12 0 12.6 6.2 15 8.6C17.4 11 24 12 24 12C24 12 17.4 13 15 15.4C12.6 17.8 12 24 12 24C12 24 11.4 17.8 9 15.4C6.6 13 0 12 0 12C0 12 6.6 11 9 8.6C11.4 6.2 12 0 12 0Z'

const SPARKLES = [
  { x: 278, y: 58, scale: 1.5 },
  { x: 78, y: 214, scale: 0.85 },
  { x: 246, y: 188, scale: 0.45 },
]

const LETTERS = ['N', 'O', 'V', 'A']

const PARTICLES = [
  { x: -70, y: -30, size: 3, dur: 7, delay: 0 },
  { x: 220, y: -10, size: 2, dur: 9, delay: 1 },
  { x: -40, y: 190, size: 4, dur: 8, delay: 2 },
  { x: 260, y: 150, size: 2, dur: 10, delay: 0.5 },
  { x: 40, y: -60, size: 3, dur: 6.5, delay: 1.5 },
  { x: -20, y: 100, size: 2, dur: 11, delay: 2.5 },
]

function Sparkle({ x, y, scale, delay, reducedMotion }: { x: number; y: number; scale: number; delay: number; reducedMotion: boolean }) {
  const [pulsing, setPulsing] = useState(reducedMotion)

  if (reducedMotion) {
    return (
      <g transform={`translate(${x},${y}) scale(${scale}) translate(-12,-12)`}>
        <path d={SPARKLE_PATH} fill="url(#novaGoldAnimated)" />
      </g>
    )
  }

  return (
    <motion.g
      style={{ transformOrigin: `${x}px ${y}px` }}
      transform={`translate(${x},${y}) scale(${scale}) translate(-12,-12)`}
      initial={{ scale: 0, opacity: 0 }}
      animate={
        pulsing
          ? { scale: [1, 1.08, 1], opacity: 1 }
          : { scale: [0, 1.2, 1], opacity: 1 }
      }
      transition={
        pulsing
          ? { duration: 3, repeat: Infinity, ease: 'easeInOut' }
          : { duration: 0.5, delay, ease: 'easeOut' }
      }
      onAnimationComplete={() => {
        if (!pulsing) setPulsing(true)
      }}
    >
      <path d={SPARKLE_PATH} fill="url(#novaGoldAnimated)" />
    </motion.g>
  )
}

interface NovaLogoAnimatedProps {
  /** Rendered icon size in CSS px. */
  size?: number
  /** "icon" — just the brush + sparkles mark, for compact contexts like the
   *  header (no text, no ambient loops — mirrors the old flat-tier seal).
   *  "full" — the complete lockup (mark + NOVA + tagline), all animations. */
  variant?: 'full' | 'icon'
  /** Wraps the full lockup in the 3D hover tilt. Ignored for variant="icon". */
  interactive?: boolean
  className?: string
  ariaLabel?: string
}

export default function NovaLogoAnimated({
  size = 260,
  variant = 'full',
  interactive = true,
  className = '',
  ariaLabel = 'Nova — Canvas Art',
}: NovaLogoAnimatedProps) {
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    setReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  }, [])

  const iconWidth = size
  const iconHeight = size * (260 / 400)

  const gradientDefs = (
    <defs>
      <linearGradient id="novaGoldAnimated" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#F5D07A" />
        <stop offset="50%" stopColor="#D4A42E" />
        <stop offset="100%" stopColor="#A67C00" />
      </linearGradient>
    </defs>
  )

  const glyph = (
    <svg viewBox="0 0 400 260" width={iconWidth} height={iconHeight} aria-hidden="true">
      {gradientDefs}

      {reducedMotion ? (
        <path
          d={SPINE_PATH}
          fill="none"
          stroke="url(#novaGoldAnimated)"
          strokeWidth={30}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <motion.path
          d={SPINE_PATH}
          fill="none"
          stroke="url(#novaGoldAnimated)"
          strokeWidth={30}
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
          strokeDasharray={1}
          initial={{ strokeDashoffset: 1 }}
          animate={{ strokeDashoffset: 0 }}
          transition={{ duration: STROKE_DURATION, ease: 'easeOut' }}
        />
      )}

      {SPARKLES.map((s, i) => (
        <Sparkle
          key={i}
          {...s}
          delay={STROKE_DURATION + i * SPARKLE_STAGGER}
          reducedMotion={reducedMotion}
        />
      ))}
    </svg>
  )

  if (variant === 'icon') {
    return (
      <span aria-label={ariaLabel} role="img" className={`inline-block ${className}`} style={{ lineHeight: 0 }}>
        {glyph}
      </span>
    )
  }

  const wordmark = (
    <div className="flex flex-col items-center select-none">
      <div
        className="flex"
        style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontSize: size * 0.22, letterSpacing: '0.15em', lineHeight: 1 }}
      >
        {LETTERS.map((letter, i) =>
          reducedMotion ? (
            <span key={i} style={goldTextStyle}>{letter}</span>
          ) : (
            <motion.span
              key={i}
              style={goldTextStyle}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, ease: 'easeOut', delay: STROKE_DURATION + i * LETTER_STAGGER }}
            >
              {letter}
            </motion.span>
          ),
        )}
      </div>

      {reducedMotion ? (
        <p
          className="mt-2 uppercase"
          style={{ ...goldTextStyle, fontSize: size * 0.045, letterSpacing: '0.32em' }}
        >
          — Canvas Art —
        </p>
      ) : (
        <motion.p
          className="mt-2 uppercase"
          style={{ ...goldTextStyle, fontSize: size * 0.045, letterSpacing: '0.32em' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: TAGLINE_DELAY }}
        >
          — Canvas Art —
        </motion.p>
      )}
    </div>
  )

  const content = (
    <div className={`relative inline-flex flex-col items-center ${className}`}>
      {glyph}
      {wordmark}

      {!reducedMotion && (
        <>
          {/* Gold shimmer sweep — white highlight overlay, loops every 4s */}
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              mixBlendMode: 'overlay',
              backgroundImage:
                'linear-gradient(100deg, transparent 30%, rgba(255,255,255,0.9) 50%, transparent 70%)',
              backgroundSize: '250% 100%',
            }}
            initial={{ opacity: 0, backgroundPosition: '-40% 0%' }}
            animate={{ opacity: [0, 0.6, 0], backgroundPosition: ['-40% 0%', '140% 0%'] }}
            transition={{
              duration: SHIMMER_SWEEP_DURATION,
              repeat: Infinity,
              repeatDelay: SHIMMER_CYCLE - SHIMMER_SWEEP_DURATION,
              delay: SHIMMER_START,
              ease: 'easeInOut',
            }}
          />

          {/* Floating gold sparkle dots, slow random-ish orbits */}
          {PARTICLES.map((p, i) => (
            <motion.div
              key={i}
              aria-hidden="true"
              className="pointer-events-none absolute rounded-full"
              style={{
                left: '50%',
                top: '50%',
                width: p.size,
                height: p.size,
                backgroundColor: '#D4A42E',
              }}
              initial={{ x: p.x, y: p.y, opacity: 0.4 }}
              animate={{
                x: [p.x, p.x + 14, p.x - 10, p.x],
                y: [p.y, p.y - 14, p.y + 10, p.y],
                opacity: [0.4, 0.8, 0.5, 0.4],
              }}
              transition={{ duration: p.dur, repeat: Infinity, ease: 'easeInOut', delay: p.delay }}
            />
          ))}
        </>
      )}
    </div>
  )

  if (!interactive) return content

  return (
    <Tilt max={8} scale={1} glossColor="#F5D07A" glossMaxOpacity={0.15}>
      {content}
    </Tilt>
  )
}

const goldTextStyle: React.CSSProperties = {
  backgroundImage: 'linear-gradient(135deg, #F5D07A 0%, #D4A42E 50%, #A67C00 100%)',
  backgroundClip: 'text',
  WebkitBackgroundClip: 'text',
  color: 'transparent',
  WebkitTextFillColor: 'transparent',
}
