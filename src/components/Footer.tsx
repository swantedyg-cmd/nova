'use client'

import type { CSSProperties } from 'react'
import { useLanguage } from '@/i18n/LanguageContext'
import { INSTAGRAM_HANDLE, INSTAGRAM_URL } from '@/data/social'
import InstagramIcon from './InstagramIcon'

// Kept on the original ink palette by request — same scoped-override
// technique as Header/PhilosophySection: re-declare --color-charcoal/
// --color-canvas locally so bg-charcoal/text-canvas below resolve to the
// pre-rebrand values here only, without touching the global tokens the
// rest of the site still reads.
const ORIGINAL_INK_THEME = {
  '--color-charcoal': '#1A1410',
  '--color-canvas': '#F5F1EB',
} as CSSProperties

export default function Footer() {
  const { t } = useLanguage()
  const f = t.footer

  return (
    <footer
      style={ORIGINAL_INK_THEME}
      className="bg-charcoal/80 border-t border-canvas/8 py-10 px-6 md:px-12"
    >
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <p className="font-display text-2xl font-medium text-canvas/85">Nova</p>
          <p className="text-xs text-canvas/35 font-body mt-1 tracking-wide">{f.tagline}</p>
        </div>
        <a
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t.instagram.ariaLabel}
          className="group inline-flex items-center gap-2.5 text-sm text-canvas/60 font-body transition-colors duration-300 hover:text-canvas"
        >
          <span className="relative grid h-9 w-9 place-items-center rounded-full border border-canvas/15 transition-all duration-500 ease-out group-hover:border-transparent group-hover:rotate-[-8deg]">
            {/* Instagram gradient blooms in behind the glyph on hover */}
            <span
              aria-hidden="true"
              className="absolute inset-0 rounded-full opacity-0 scale-50 transition-all duration-500 ease-out group-hover:opacity-100 group-hover:scale-100"
              style={{ background: 'radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285AEB 90%)' }}
            />
            <InstagramIcon size={17} className="relative" />
          </span>
          <span dir="ltr" className="relative">
            @{INSTAGRAM_HANDLE}
            <span aria-hidden="true" className="absolute -bottom-0.5 left-0 h-px w-full origin-left scale-x-0 bg-gold transition-transform duration-500 ease-out group-hover:scale-x-100" />
          </span>
        </a>
        <p className="text-xs text-canvas/20 font-body">{f.copyright}</p>
      </div>
    </footer>
  )
}
