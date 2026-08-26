'use client'

import * as React from 'react'

import {
  CollectionCoverflow,
  type CollectionPiece,
} from '@/components/ui/collection-coverflow'
import { getCollectionPieces } from '@/lib/collection-data'
import { useLanguage } from '@/i18n/LanguageContext'

// Maps the coverflow's own --rq-* tokens onto this site's real palette
// (globals.css) and display font (Playfair, already loaded site-wide) —
// scoped to this section only, no changes to the global theme.
const THEME = {
  '--rq-ink': '#5A1220',
  '--rq-ink-soft': '#7B1B2C',
  '--rq-parchment': '#F1E3C8',
  '--rq-gold': '#C89B3C',
  '--rq-gold-deep': '#8C6B24',
  '--font-serif': 'var(--font-display)',
} as React.CSSProperties

export default function CollectionShowcaseSection() {
  const { t, lang } = useLanguage()
  const collectionPieces = React.useMemo(() => getCollectionPieces(lang), [lang])
  const [active, setActive] = React.useState<CollectionPiece | null>(
    collectionPieces[0] ?? null,
  )

  React.useEffect(() => {
    setActive(collectionPieces[0] ?? null)
  }, [collectionPieces])

  return (
    <section
      id="showcase"
      style={THEME}
      className="relative overflow-hidden bg-[var(--rq-ink)] py-24 sm:py-28"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_60%_at_50%_0%,rgba(255,232,200,0.16),rgba(113,0,20,0.4)_45%,transparent_75%)]" />

      <div className="relative mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-xl text-center">
          <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-[var(--rq-gold)]">
            {t.showcase.eyebrow}
          </p>
          <h2 className="mt-4 font-serif text-3xl italic leading-tight text-[var(--rq-parchment)] sm:text-4xl">
            {t.showcase.heading}
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-[var(--rq-parchment)]/60">
            {t.showcase.subheading}
          </p>
        </div>

        <div className="mt-14">
          <CollectionCoverflow
            pieces={collectionPieces}
            label={t.showcase.ariaLabel}
            labels={{
              uniquePiece: t.showcase.uniquePiece,
              soldOut: t.showcase.soldOut,
              availableSuffix: t.showcase.availableSuffix,
              price: t.showcase.price,
              edition: t.showcase.edition,
              prevAria: t.showcase.prevAria,
              nextAria: t.showcase.nextAria,
              goToPrefix: t.showcase.goToPrefix,
              numberPrefix: t.showcase.numberPrefix,
              revealAria: t.showcase.revealAria,
              hideAria: t.showcase.hideAria,
            }}
            onActiveChange={setActive}
          />
        </div>

        <div
          key={active?.id}
          className="mx-auto mt-10 flex max-w-md items-center justify-center gap-2 text-center duration-500 animate-in fade-in"
          aria-live="polite"
        >
          <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--rq-parchment)]/40">
            {active
              ? `${active.category} — ${t.showcase.numberPrefix} ${String(
                  collectionPieces.findIndex((p) => p.id === active.id) + 1,
                ).padStart(2, '0')} / ${collectionPieces.length}`
              : ''}
          </p>
        </div>
      </div>
    </section>
  )
}
