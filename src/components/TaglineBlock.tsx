'use client'

import { motion } from 'motion/react'
import { useLanguage } from '@/i18n/LanguageContext'
import type { Tagline } from '@/data/taglines'

interface TaglineBlockProps extends Tagline {
  /** `large` is used once, as the collection lead-in — see TaglineSection. */
  size?: 'default' | 'large'
  showLabel?: boolean
  showBorder?: boolean
}

export default function TaglineBlock({
  label,
  fr,
  en,
  ar,
  size = 'default',
  showLabel = true,
  showBorder = true,
}: TaglineBlockProps) {
  const { lang } = useLanguage()
  const text = lang === 'fr' ? fr : lang === 'en' ? en : ar

  const fontSize =
    size === 'large'
      ? 'clamp(2.25rem, 5vw, 3.75rem)'
      : 'clamp(1.6rem, 3vw, 2.25rem)'

  return (
    <div
      className={`relative min-h-[65vh] md:min-h-0 flex flex-col items-center justify-center py-14 md:py-20 text-center overflow-hidden ${showBorder ? 'border-t border-[var(--color-nova-gold)]/20' : ''}`}
    >
      {/* A soft, stationary glow behind the text — reads as intentional
          cinematic staging rather than the flat, empty-feeling gap each
          block used to leave on a tall phone screen once the (usually
          short) line of text was centered in a viewport-height block.
          Pure CSS gradient, no canvas/WebGL — this section sits between
          two others that are already careful about how many concurrent
          GL contexts mobile carries, and a glow doesn't need one. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(60% 45% at 50% 50%, color-mix(in srgb, var(--color-nova-gold) 12%, transparent), transparent 70%)',
        }}
      />

      {showLabel && (
        <motion.p
          key={`${lang}-label`}
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="mb-5 text-[11px] font-body uppercase tracking-[0.32em] text-[var(--color-nova-gold)]/60"
        >
          {label}
        </motion.p>
      )}

      {/* key={lang} remounts on language switch, replaying the entrance —
          only the client's selected language is ever shown, matching the
          rest of the site's translation pattern (no FR/EN/AR stacked
          together). Italic is reserved for French, per the brand spec.
          Blur-to-focus + scale (not just a fade/slide) is the "cinematic"
          register this was asked for, and a lower viewport `amount`
          (0.35, was 0.5) means it starts revealing well before the block
          is half-scrolled-past — the previous threshold was itself part
          of why blocks could read as a dead, empty stretch of scroll. */}
      <motion.p
        key={lang}
        initial={{ opacity: 0, y: 22, scale: 0.94, filter: 'blur(10px)' }}
        whileInView={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
        viewport={{ once: true, amount: 0.35 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        className={`relative font-display font-normal text-[var(--color-nova-gold)] ${lang === 'fr' ? 'italic' : ''}`}
        style={{ fontSize, lineHeight: 1.25, whiteSpace: 'pre-line' }}
      >
        {text}
      </motion.p>
    </div>
  )
}
