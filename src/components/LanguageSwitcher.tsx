'use client'

import { useLanguage } from '@/i18n/LanguageContext'
import type { Lang } from '@/i18n/translations'

/* Windows/Chrome doesn't render regional-indicator flag emoji as flags
   (shows raw letter codes instead) — inline SVGs render identically
   on every platform. */

function starPoints(cx: number, cy: number, outerR: number, innerR: number) {
  const pts: string[] = []
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outerR : innerR
    const angle = (Math.PI / 5) * i - Math.PI / 2
    pts.push(`${(cx + r * Math.cos(angle)).toFixed(2)},${(cy + r * Math.sin(angle)).toFixed(2)}`)
  }
  return pts.join(' ')
}

function FlagFR() {
  return (
    <svg viewBox="0 0 30 20" width="18" height="12" aria-hidden="true">
      <rect width="30" height="20" fill="#F5F1EB" />
      <rect width="10" height="20" fill="#0055A4" />
      <rect x="20" width="10" height="20" fill="#EF4135" />
    </svg>
  )
}

function FlagGB() {
  return (
    <svg viewBox="0 0 60 40" width="18" height="12" aria-hidden="true">
      <rect width="60" height="40" fill="#012169" />
      <path d="M0,0 L60,40 M60,0 L0,40" stroke="#FFFFFF" strokeWidth="8" />
      <path d="M0,0 L60,40 M60,0 L0,40" stroke="#C8102E" strokeWidth="3" />
      <path d="M30,0 V40 M0,20 H60" stroke="#FFFFFF" strokeWidth="13" />
      <path d="M30,0 V40 M0,20 H60" stroke="#C8102E" strokeWidth="8" />
    </svg>
  )
}

function FlagMA() {
  const star = starPoints(30, 20, 8, 3.2)
  return (
    <svg viewBox="0 0 60 40" width="18" height="12" aria-hidden="true">
      <rect width="60" height="40" fill="#C1272D" />
      <polygon points={star} fill="none" stroke="#006233" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  )
}

const LANGS: { code: Lang; Flag: () => React.JSX.Element; label: string }[] = [
  { code: 'fr', Flag: FlagFR, label: 'FR' },
  { code: 'en', Flag: FlagGB, label: 'EN' },
  { code: 'ar', Flag: FlagMA, label: 'AR' },
]

export default function LanguageSwitcher() {
  const { lang, setLang } = useLanguage()

  return (
    <div
      className="fixed top-4 right-4 z-50 flex gap-0.5 rounded-full bg-canvas/85 backdrop-blur-md border border-charcoal/10 px-1 py-1 shadow-md"
      role="group"
      aria-label="Language selector"
    >
      {LANGS.map(({ code, Flag, label }) => (
        <button
          key={code}
          onClick={() => setLang(code)}
          aria-pressed={lang === code}
          className={`
            rounded-full px-2.5 py-1 text-[11px] font-body font-medium
            flex items-center gap-1.5 transition-all duration-200 select-none
            ${lang === code
              ? 'bg-charcoal text-canvas shadow-sm'
              : 'text-charcoal/55 hover:text-charcoal hover:bg-charcoal/8'
            }
          `}
        >
          <span className="inline-flex rounded-[2px] overflow-hidden ring-1 ring-black/10">
            <Flag />
          </span>
          <span>{label}</span>
        </button>
      ))}
    </div>
  )
}
