'use client'

import * as React from 'react'

import { CollectionCoverflow } from '@/components/ui/collection-coverflow'
import { getCollectionPieces } from '@/lib/collection-data'
import { useLanguage } from '@/i18n/LanguageContext'

// TEMPORARY: swapped in for NovaBentoGallery so the redesigned coverflow can
// actually be previewed. Revert to NovaBentoGallery once reviewed/approved.
export default function CollectionShowcaseSection() {
  const { t, lang } = useLanguage()
  const collectionPieces = React.useMemo(() => getCollectionPieces(lang), [lang])

  return (
    <section id="showcase" className="relative overflow-hidden bg-[#F5EDD6] py-24 sm:py-28">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_60%_at_50%_0%,rgba(212,164,46,0.14),transparent_70%)]" />

      <div className="relative mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-xl text-center">
          <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-[#D4A42E]">
            {t.showcase.eyebrow}
          </p>
          <h2 className="mt-4 font-serif text-3xl italic leading-tight text-[#2C1810] sm:text-4xl">
            {t.showcase.heading}
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-[#2C1810]/60">{t.showcase.subheading}</p>
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
          />
        </div>
      </div>
    </section>
  )
}
