import SurVotreMur from './SurVotreMur'

/* ─── "Sur votre mur" — the real-scale room preview, as its own section
   right after the hero: before browsing the collection, a visitor sees what
   a Nova canvas looks like at home. Same parchment ground as the hero's last
   stretch and the gallery below, so the three sections run seamlessly. ─── */
export default function SurVotreMurSection() {
  return (
    <section id="sur-votre-mur" className="relative bg-parchment/80 px-6 pt-20 pb-6 md:px-12 md:pt-28 md:pb-10 scroll-mt-20">
      {/* a gold hairline marks the start of the section */}
      <div aria-hidden="true" className="mx-auto mb-14 h-px w-24 bg-gradient-to-r from-transparent via-gold/60 to-transparent md:mb-16" />
      <SurVotreMur className="mx-auto max-w-5xl" />
    </section>
  )
}
