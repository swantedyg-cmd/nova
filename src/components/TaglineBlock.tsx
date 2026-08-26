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
      ? 'clamp(2rem, 4vw, 3.25rem)'
      : 'clamp(1.4rem, 2.4vw, 2rem)'

  return (
    <div
      className={`py-14 md:py-16 text-center ${showBorder ? 'border-t border-[var(--color-nova-crimson)]/20' : ''}`}
    >
      {showLabel && (
        <p className="mb-4 text-[11px] font-body uppercase tracking-[0.32em] text-[var(--color-nova-crimson)]/60">
          {label}
        </p>
      )}

      {/* key={lang} remounts on language switch, replaying the entrance —
          only the client's selected language is ever shown, matching the
          rest of the site's translation pattern (no FR/EN/AR stacked
          together). Italic is reserved for French, per the brand spec. */}
      <motion.p
        key={lang}
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className={`font-display font-normal text-[var(--color-nova-crimson)] ${lang === 'fr' ? 'italic' : ''}`}
        style={{ fontSize, lineHeight: 1.25, whiteSpace: 'pre-line' }}
      >
        {text}
      </motion.p>
    </div>
  )
}
