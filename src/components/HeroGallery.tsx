'use client'

import Image from 'next/image'
import { motion } from 'motion/react'
import { PIECES, COLLECTION_COLORS } from '@/data/catalogue'

// A piece with an unusually narrow `aspect` value, fed straight into
// `paddingTop: ${(1/aspect)*100}%`, can render far taller than wide — barely
// noticeable buried in a 3-column desktop masonry, but it dominates and
// breaks the rhythm of the single mobile column, where it's the only thing
// in its row (see the same clamp in GallerySection.tsx, where this was
// first tracked down).
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

// A mood-varied sample of seven from the 12-piece "New Collection
// 2026-2027" — floral, golden-portrait, and sunlit pieces mixed together so
// the hero reads as one gallery wall, not a single theme. Referenced by id
// rather than array position — a fixed index into PIECES silently goes out
// of bounds (or points at the wrong piece) the moment the catalogue is
// edited, which is exactly what crashed this section in production once.
const HERO_PIECE_IDS = ['eclat-floral', 'serenite-doree', 'ame-nomade', 'wings-of-colors', 'ivory-blossom', 'reine-dor', 'riviera-muse']

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
