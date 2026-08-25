'use client'

import { useId } from 'react'

/* ─── Nova seal — brand provenance mark, two dimensional states ──────────
   Reproduces the reference geometry (nova-seal-reference.html) exactly:
   same viewBox, same ring radii/stroke-widths, same arc paths (bottom arc
   keeps sweep-flag 0 — MARRAKECH · MAROC must read left-to-right, upright).

   Each dimensional state (raised "out" / embossed "in") is three stacked
   <use> copies of one <g id="sealArt"> at sub-pixel offsets — no SVG
   lighting filters (they wreck the 0.7px hairlines). The geometry itself
   carries fill="none"/stroke="none" only; every copy's color is applied
   on the <use> element, never baked into the shared <defs> art, so the
   three copies can each take a different token.

   Multiple instances render on one page (header + hero), so every id in
   <defs> is namespaced per-instance via useId() — the reference file's
   hardcoded ids (arcT/arcT2 etc.) only work because it never repeats the
   component; a reusable version can't assume that. ───────────────────── */

type Tier = 'full' | 'mid' | 'flat'

function tierFor(size: number): Tier {
  if (size >= 200) return 'full'
  if (size >= 88) return 'mid'
  return 'flat'
}

interface NovaSealProps {
  /** Rendered size in CSS px. Drives which tier renders — see DONE WHEN
   *  size ranges in the brief: 200–320 full (dimensional + plate tilt),
   *  88–160 dimensional only, 24–44 flat single-color. Default matches
   *  the spec's reference render size. */
  size?: number
  /** Pressable (hover tilt, press cross-fades to the embossed state).
   *  Ignored at the flat tier — nothing to cross-fade at icon size, so
   *  it always renders as a static, non-interactive mark there. */
  interactive?: boolean
  /** Renders the "NOVA" wordmark 34px below the seal, styled to match
   *  whichever resting state the seal is shown in. */
  wordmark?: boolean
  wordmarkVariant?: 'out' | 'in'
  ariaLabel?: string
  className?: string
}

export default function NovaSeal({
  size = 236,
  interactive = true,
  wordmark = false,
  wordmarkVariant = 'out',
  ariaLabel = 'Nova seal, press to strike',
  className = '',
}: NovaSealProps) {
  const uid = useId()
  const tier = tierFor(size)

  if (tier === 'flat') {
    return (
      <span aria-hidden="true" className={`inline-block ${className}`} style={{ lineHeight: 0 }}>
        <svg width={size} height={size} viewBox="-100 -100 200 200">
          <circle r="92" fill="none" stroke="var(--color-nova-crimson)" strokeWidth="1.8" />
          <g stroke="var(--color-nova-crimson)" strokeWidth="1.8" fill="none">
            <rect x="-31" y="-31" width="62" height="62" />
            <rect x="-31" y="-31" width="62" height="62" transform="rotate(45)" />
          </g>
          <text
            x="0" y="1"
            textAnchor="middle"
            dominantBaseline="central"
            stroke="none"
            fill="var(--color-nova-crimson)"
            fontFamily="var(--font-seal), serif"
            fontSize="46"
          >
            N
          </text>
        </svg>
      </span>
    )
  }

  const arcTId = `${uid}-arcT`
  const arcBId = `${uid}-arcB`
  const artId = `${uid}-art`
  const gradientId = `${uid}-face`

  // Supersampled: the plate's 3D transform (perspective + rotateX/rotateY)
  // forces the browser to rasterize this SVG into a compositing layer, and
  // that rasterization softens the 0.7px hairlines and text noticeably —
  // confirmed by A/B testing the deployed seal with/without the transform.
  // Rendering at a higher intrinsic resolution than the CSS-displayed size
  // gives that rasterization pass more source detail to sample from, so the
  // tilt stays (required by spec) without the blur. Cheap: it's vector
  // content, not a raster image, so there's no extra network cost.
  const SUPERSAMPLE = 3
  const seal = (
    <svg
      width={size * SUPERSAMPLE}
      height={size * SUPERSAMPLE}
      viewBox="-100 -100 200 200"
      style={{ width: size, height: size }}
    >
      <defs>
        <path id={arcTId} d="M -78,0 A 78,78 0 0 1 78,0" fill="none" />
        {/* Sweep-flag 0 is load-bearing — it runs left→right along the
            bottom so "MARRAKECH · MAROC" reads upright, glyphs pointing
            inward. Flip to 1, or start the path at 72,0, and every glyph
            inverts and the word order reverses. */}
        <path id={arcBId} d="M -72,0 A 72,72 0 0 0 72,0" fill="none" />
        <linearGradient id={gradientId} x1="0" y1="0" x2=".7" y2="1">
          <stop offset="0" stopColor="var(--color-nova-crimson-lit)" />
          <stop offset=".45" stopColor="var(--color-nova-crimson)" />
          <stop offset="1" stopColor="var(--color-nova-crimson-deep)" />
        </linearGradient>
        <g id={artId}>
          <circle r="92" fill="none" strokeWidth="1.8" />
          <circle r="86" fill="none" strokeWidth="0.7" />
          <circle r="58" fill="none" strokeWidth="0.7" />
          <g stroke="none" fontFamily="var(--font-seal), serif" fontSize="11.5" letterSpacing="3.4">
            <text>
              <textPath href={`#${arcTId}`} startOffset="50%" textAnchor="middle">
                OIL ON CANVAS · BY HAND
              </textPath>
            </text>
            <text>
              <textPath href={`#${arcBId}`} startOffset="50%" textAnchor="middle">
                MARRAKECH · MAROC
              </textPath>
            </text>
          </g>
          <g strokeWidth="1.8" fill="none">
            <rect x="-31" y="-31" width="62" height="62" />
            <rect x="-31" y="-31" width="62" height="62" transform="rotate(45)" />
          </g>
          <text
            x="0" y="1"
            textAnchor="middle"
            dominantBaseline="central"
            stroke="none"
            fontFamily="var(--font-seal), serif"
            fontSize="46"
          >
            N
          </text>
        </g>
      </defs>

      <g className="nova-seal-out">
        <use href={`#${artId}`} transform="translate(2.6,3)" fill="var(--color-nova-crimson-shadow)" stroke="var(--color-nova-crimson-shadow)" opacity=".38" />
        <use href={`#${artId}`} transform="translate(-1,-1.2)" fill="var(--color-nova-crimson-highlight)" stroke="var(--color-nova-crimson-highlight)" opacity=".7" />
        <use href={`#${artId}`} fill={`url(#${gradientId})`} stroke={`url(#${gradientId})`} />
      </g>

      <g className="nova-seal-in">
        <use href={`#${artId}`} transform="translate(-1.4,-1.4)" fill="var(--color-nova-emboss-shadow)" stroke="var(--color-nova-emboss-shadow)" opacity=".85" />
        <use href={`#${artId}`} transform="translate(1.6,1.6)" fill="var(--color-nova-emboss-light)" stroke="var(--color-nova-emboss-light)" opacity=".95" />
        <use href={`#${artId}`} fill="var(--color-nova-emboss-face)" stroke="var(--color-nova-emboss-face)" />
      </g>
    </svg>
  )

  const plateClass = [
    'nova-seal',
    tier === 'full' ? 'nova-seal--plate' : '',
    interactive ? 'nova-seal--interactive' : '',
    className,
  ].filter(Boolean).join(' ')

  const markup = interactive ? (
    <button type="button" aria-label={ariaLabel} className={plateClass}>
      {seal}
    </button>
  ) : (
    <div aria-hidden="true" className={plateClass}>
      {seal}
    </div>
  )

  if (!wordmark) return markup

  const wordmarkStyle =
    wordmarkVariant === 'in'
      ? {
          color: 'var(--color-nova-emboss-face)',
          textShadow: '-1.4px -1.4px 0 rgba(169,143,107,.85), 1.6px 1.6px 0 rgba(255,250,240,.95)',
        }
      : {
          color: 'var(--color-nova-crimson)',
          textShadow: '-1px -1px 0 rgba(201,115,111,.6), 2px 2.4px 3px rgba(58,10,17,.3)',
        }

  return (
    <div className="flex flex-col items-center">
      {markup}
      <div
        className="mt-[34px]"
        style={{
          fontFamily: 'var(--font-seal), serif',
          fontSize: 44,
          letterSpacing: '.38em',
          paddingLeft: '.38em',
          lineHeight: 1,
          ...wordmarkStyle,
        }}
      >
        NOVA
      </div>
    </div>
  )
}
