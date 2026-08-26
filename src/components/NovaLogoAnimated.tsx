'use client'

import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import Tilt from './Tilt'

/* ─── Nova Canvas Art logo — animated gold paintbrush mark ────────────────
   Built from the actual reference artwork (client-supplied
   NOVA_Canvas_Art_Logo.pdf), not a hand-drawn approximation: the PDF's
   embedded 1254×1254 render was extracted, background-keyed to
   transparent, and cropped into layers so each piece can be animated
   independently without ever redrawing the art itself —

     public/nova-logo.png        — full lockup, exact source (icon + word + tagline)
     public/nova-logo-icon.png   — brush stroke + both sparkles, exact crop
     public/nova-logo-sparkle-*  — the two sparkles, isolated, for the glow pulse
     public/nova-logo-word.png   — "NOVA"
     public/nova-logo-tagline.png — "— CANVAS ART —"

   The sparkle overlays are additive (mix-blend-mode: screen) rather than
   opaque duplicates sitting on top of the base icon — screen-blending
   only brightens, so a slightly-off crop boundary never shows a seam the
   way an opaque patch would. That's also why there's no true per-letter
   stagger on "NOVA" here: it's one photographic crop, and slicing a
   serif wordmark into per-letter fragments risks visible cut lines
   through kerning — the word animates in as one block instead. */

const STROKE_DURATION = 1.2
const TAGLINE_DELAY = 1.8
const SHIMMER_START = 2.3
const SHIMMER_SWEEP_DURATION = 1.2
const SHIMMER_CYCLE = 4

// Native crop dimensions (px) — every block's height is derived from this
// shared width so the whole lockup stays in its original proportions.
const ICON_W = 644
const ICON_H = 526
const WORD_H = 180
const TAGLINE_H = 62

// Sparkle positions as % of the icon crop — matches exactly where each
// sparkle sits in nova-logo-icon.png.
const SPARKLES = [
  { src: '/nova-logo-sparkle-lg.png', left: (345 / ICON_W) * 100, top: (0 / ICON_H) * 100, width: (275 / ICON_W) * 100, height: (195 / ICON_H) * 100, delay: 0 },
  { src: '/nova-logo-sparkle-sm.png', left: (98 / ICON_W) * 100, top: (298 / ICON_H) * 100, width: (172 / ICON_W) * 100, height: (150 / ICON_H) * 100, delay: 0.6 },
]

const PARTICLES = [
  { x: -70, y: -30, size: 3, dur: 7, delay: 0 },
  { x: 220, y: -10, size: 2, dur: 9, delay: 1 },
  { x: -40, y: 190, size: 4, dur: 8, delay: 2 },
  { x: 260, y: 150, size: 2, dur: 10, delay: 0.5 },
  { x: 40, y: -60, size: 3, dur: 6.5, delay: 1.5 },
  { x: -20, y: 100, size: 2, dur: 11, delay: 2.5 },
]

interface NovaLogoAnimatedProps {
  /** Rendered width in CSS px (height follows the art's own proportions). */
  size?: number
  /** "icon" — just the brush + sparkles mark, for compact contexts like the
   *  header (no text, no ambient loops, no wipe-reveal — a plain static
   *  crop, same spirit as the old flat-tier seal).
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

  const iconHeight = size * (ICON_H / ICON_W)
  const wordHeight = size * (WORD_H / ICON_W)
  const taglineHeight = size * (TAGLINE_H / ICON_W)

  if (variant === 'icon') {
    return (
      <span aria-label={ariaLabel} role="img" className={`inline-block ${className}`} style={{ lineHeight: 0 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/nova-logo-icon.png" alt="" width={size} height={iconHeight} style={{ width: size, height: iconHeight }} />
      </span>
    )
  }

  const iconBlock = (
    <div className="relative" style={{ width: size, height: iconHeight }}>
      {reducedMotion ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src="/nova-logo-icon.png" alt="" width={size} height={iconHeight} style={{ width: size, height: iconHeight }} />
      ) : (
        <motion.div
          initial={{ clipPath: 'inset(0 100% 0 0)' }}
          animate={{ clipPath: 'inset(0 0% 0 0)' }}
          transition={{ duration: STROKE_DURATION, ease: 'easeOut' }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/nova-logo-icon.png" alt="" width={size} height={iconHeight} style={{ width: size, height: iconHeight, display: 'block' }} />
        </motion.div>
      )}

      {!reducedMotion &&
        SPARKLES.map((s, i) => (
          <motion.div
            key={i}
            aria-hidden="true"
            className="absolute pointer-events-none"
            style={{ left: `${s.left}%`, top: `${s.top}%`, width: `${s.width}%`, height: `${s.height}%`, mixBlendMode: 'screen' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.9, 0.35, 0.9, 0.35] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: STROKE_DURATION + s.delay }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={s.src} alt="" style={{ width: '100%', height: '100%' }} />
          </motion.div>
        ))}
    </div>
  )

  const wordmark = (
    <div className="flex flex-col items-center select-none" style={{ width: size }}>
      {reducedMotion ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src="/nova-logo-word.png" alt="Nova" width={size} height={wordHeight} style={{ width: size, height: wordHeight }} />
      ) : (
        <motion.img
          src="/nova-logo-word.png"
          alt="Nova"
          width={size}
          height={wordHeight}
          style={{ width: size, height: wordHeight }}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: STROKE_DURATION }}
        />
      )}

      {reducedMotion ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src="/nova-logo-tagline.png"
          alt="Canvas Art"
          width={size * 0.6}
          height={taglineHeight * 0.6}
          style={{ width: size * 0.6, height: taglineHeight * 0.6, marginTop: size * 0.02 }}
        />
      ) : (
        <motion.img
          src="/nova-logo-tagline.png"
          alt="Canvas Art"
          width={size * 0.6}
          height={taglineHeight * 0.6}
          style={{ width: size * 0.6, height: taglineHeight * 0.6, marginTop: size * 0.02 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: TAGLINE_DELAY }}
        />
      )}
    </div>
  )

  const content = (
    <div className={`relative inline-flex flex-col items-center ${className}`}>
      {iconBlock}
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
