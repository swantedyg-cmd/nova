'use client'

import { TAGLINES } from '@/data/taglines'
import TaglineBlock from './TaglineBlock'
import { useLanguage } from '@/i18n/LanguageContext'

// "Words Under the Seal" — the six brand taglines. Each shows only the
// client's currently selected site language (see TaglineBlock), same as
// every other translated section — not all three languages at once.
export default function TaglineSection() {
  const { t } = useLanguage()
  const collectionLeadIn = TAGLINES.find((tag) => tag.id === '4d')!

  return (
    <section className="relative overflow-hidden bg-[var(--color-nova-almond)] px-6 py-6">
      {/* A slow ambient wash behind the whole run of taglines — moves on
          its own timeline (24s), independent of scroll, so the section
          never reads as visually inert between one block's reveal
          animation finishing and the next one starting. CSS-only
          (background-position + opacity keyframes): no canvas, no extra
          GL context on mobile. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 tagline-ambient-wash" />

      <div className="mx-auto max-w-2xl">
        <p className="pt-10 text-center text-[10px] font-body uppercase tracking-[0.36em] text-[var(--color-nova-gold)]/40">
          {t.taglines.eyebrow}
        </p>

        {TAGLINES.map((tagline) => (
          <TaglineBlock key={tagline.id} {...tagline} />
        ))}
      </div>

      {/* Emotional frame before the product grid — reprises 4D larger and
          on its own, as the last word before the collection. */}
      <div className="mx-auto max-w-3xl">
        <TaglineBlock
          {...collectionLeadIn}
          size="large"
          showLabel={false}
        />
      </div>
    </section>
  )
}
