'use client'

import type { CSSProperties } from 'react'
import { useLanguage } from '@/i18n/LanguageContext'

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
        <p className="text-xs text-canvas/20 font-body">{f.copyright}</p>
      </div>
    </footer>
  )
}
