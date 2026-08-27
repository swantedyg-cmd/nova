'use client'

import Image from 'next/image'
import { PIECES, COLLECTION_COLORS } from '@/data/catalogue'

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
        return (
          <div key={piece.id} className="mb-6 break-inside-avoid md:mb-8">
            <div className="hero-gallery-frame rounded-sm bg-gold p-[6px] shadow-[0_16px_40px_rgba(90,18,32,0.14)]">
              <div className="rounded-[2px] bg-canvas p-2">
                <div
                  className="relative w-full overflow-hidden rounded-[1px]"
                  style={{
                    paddingTop: `${(1 / piece.aspect) * 100}%`,
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
          </div>
        )
      })}
    </div>
  )
}
