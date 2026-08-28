'use client'

import Image from 'next/image'
import { motion } from 'motion/react'
import { PIECES, COLLECTION_COLORS } from '@/data/catalogue'

// A few of the catalogue's "PW" run pieces have an estimated `aspect`
// value far narrower than their own width/height implies (see the same
// clamp in GallerySection.tsx, where this was first tracked down) —
// PW-070, one of these seven hero pieces, is one of them: fed straight
// into `paddingTop: ${(1/aspect)*100}%` it renders over 3.5x taller than
// wide, which is barely noticeable buried in a 3-column desktop masonry
// but dominates and breaks the rhythm of the single mobile column, where
// it's the only thing in its row.
const MIN_FRAME_ASPECT = 0.5
function framePadding(aspect: number) {
  return `${(1 / Math.max(aspect, MIN_FRAME_ASPECT)) * 100}%`
}

// A slight, alternating tilt per frame — like prints actually hung on a
// wall rather than snapped to a grid — plus a staggered scroll-in reveal.
// Both are lost in the 3-column desktop masonry (enough frames on screen
// at once that the effect is subliminal at best) but on mobile's single
// full-width column, each frame arrives on its own: this is what turns
// that into a considered, gallery-wall moment instead of a flat list of
// stacked images.
const TILT_DEG = [-1.6, 1.4, -1.2, 1.8, -1.5, 1.3, -1.7]

// Same seven pieces the old floating 3D hero scene opened with — one per
// collection, plus one extra — kept here so the hero's first impression
// doesn't change, only how they're laid out (see HeroScene.tsx, now removed,
// for the original INITIAL_INDICES this mirrors). Referenced by id rather
// than array position — a fixed index into PIECES silently goes out of
// bounds (or points at the wrong piece) the moment the catalogue is edited,
// which is exactly what crashed this section in production. JYO37588-N was
// one of the original seven and was since removed from the catalogue for
// being out of focus; JYO37590-N is the only other Bouquets piece, so it
// stands in for it here.
const HERO_PIECE_IDS = ['JYO37608-NF', 'JYO37347-NF', 'PW-070', 'PW-073', 'JYO37590-N', 'JYO37320-NF', 'PW-010']

export default function HeroGallery() {
  const pieces = HERO_PIECE_IDS.map((id) => PIECES.find((p) => p.id === id)).filter((p) => p !== undefined)

  return (
    <div className="columns-1 gap-6 sm:columns-2 md:gap-8 lg:columns-3">
      {pieces.map((piece, i) => {
        const { from, to } = COLLECTION_COLORS[piece.collection]
        const tilt = TILT_DEG[i % TILT_DEG.length]
        return (
          <motion.div
            key={piece.id}
            className="mb-6 break-inside-avoid md:mb-8"
            initial={{ opacity: 0, y: 28, scale: 0.95, rotate: 0 }}
            whileInView={{ opacity: 1, y: 0, scale: 1, rotate: tilt }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1], delay: (i % 3) * 0.1 }}
          >
            <div className="hero-gallery-frame rounded-sm bg-gold p-[6px] shadow-[0_16px_40px_rgba(90,18,32,0.14)]">
              <div className="rounded-[2px] bg-canvas p-2">
                <div
                  className="relative w-full overflow-hidden rounded-[1px]"
                  style={{
                    paddingTop: framePadding(piece.aspect),
                    background: piece.image ? undefined : `linear-gradient(160deg, ${from} 0%, ${to} 100%)`,
                  }}
                >
                  {piece.image && (
                    <Image
                      src={`/images/${piece.image}`}
                      alt={piece.theme}
                      fill
                      sizes="(max-width: 640px) 92vw, (max-width: 1024px) 45vw, 340px"
                      className="object-cover"
                      loading={i === 0 ? 'eager' : 'lazy'}
                      preload={i === 0}
                    />
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
