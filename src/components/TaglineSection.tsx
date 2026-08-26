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
    <section className="relative bg-[var(--color-nova-almond)] px-6 py-6">
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
