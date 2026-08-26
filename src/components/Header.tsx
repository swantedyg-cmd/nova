'use client'

import { useState, type CSSProperties } from 'react'
import { useLanguage } from '@/i18n/LanguageContext'
import NovaLogoAnimated from './NovaLogoAnimated'

const LINKS = [
  { href: '#gallery', key: 'navCollection' },
  { href: '#why', key: 'navWhy' },
  { href: '#commande', key: 'navCommande' },
  { href: '#about', key: 'navCurator' },
  { href: '#carte', key: 'navContact' },
] as const

// Kept on the original ink palette by request, same scoped-override
// technique as PhilosophySection: re-declare --color-charcoal/--color-canvas
// locally so bg-canvas/text-charcoal below (desktop nav, mobile dropdown,
// and the fixed hamburger button — all DOM descendants of <header>, so CSS
// custom-property inheritance reaches them despite position:fixed) resolve
// to the pre-rebrand values, without touching the global tokens the rest
// of the site still reads.
const ORIGINAL_INK_THEME = {
  '--color-charcoal': '#1A1410',
  '--color-canvas': '#F5F1EB',
} as CSSProperties

export default function Header() {
  const { t } = useLanguage()
  const f = t.footer
  const [open, setOpen] = useState(false)

  return (
    <header
      style={ORIGINAL_INK_THEME}
      className="fixed top-0 inset-x-0 z-40 bg-canvas/85 backdrop-blur-md border-b border-charcoal/8"
    >
      <div className="max-w-6xl mx-auto grid grid-cols-[1fr_auto_1fr] items-center px-6 md:px-12 py-4">
        <a href="#" className="flex items-center gap-2 font-display text-lg font-medium text-charcoal">
          <NovaLogoAnimated size={28} variant="icon" />
          Nova
        </a>
        <nav
          className="hidden md:flex items-center gap-8 text-xs text-charcoal/60 font-body uppercase tracking-[0.15em]"
          aria-label="Primary"
        >
          {LINKS.map(({ href, key }) => (
            <a key={href} href={href} className="hover:text-charcoal transition-colors">{f[key]}</a>
          ))}
        </nav>
        <div />
      </div>

      {/* Menu toggle — floats independently, below the language switcher (top-4) so the two tap targets don't collide */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? 'Close menu' : 'Open menu'}
        className="md:hidden fixed top-16 right-4 z-40 flex h-9 w-9 flex-col items-center justify-center gap-1.5 rounded-full bg-canvas/85 backdrop-blur-md border border-charcoal/10 shadow-md"
      >
        <span className={`block h-px w-5 bg-charcoal transition-transform duration-200 ${open ? 'translate-y-[3.5px] rotate-45' : ''}`} />
        <span className={`block h-px w-5 bg-charcoal transition-transform duration-200 ${open ? '-translate-y-[3.5px] -rotate-45' : ''}`} />
      </button>

      {/* Mobile dropdown — all sections, one tap away */}
      {open && (
        <nav
          className="md:hidden border-t border-charcoal/8 bg-canvas/95 backdrop-blur-md px-6 py-4 flex flex-col gap-4 text-sm text-charcoal/70 font-body uppercase tracking-[0.12em]"
          aria-label="Primary"
        >
          {LINKS.map(({ href, key }) => (
            <a
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className="hover:text-charcoal transition-colors"
            >
              {f[key]}
            </a>
          ))}
        </nav>
      )}
    </header>
  )
}
