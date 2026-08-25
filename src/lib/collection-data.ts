// Adapts the real catalogue (src/data/catalogue.ts) into the shape
// CollectionCoverflow expects. No separate/duplicated dataset — this stays
// in sync with the live inventory automatically.

import { PIECES } from '@/data/catalogue'
import type { Lang } from '@/i18n/translations'
import type { CollectionPiece } from '@/components/ui/collection-coverflow'

export function getCollectionPieces(lang: Lang): CollectionPiece[] {
  return PIECES.map((piece) => ({
    id: piece.id,
    src: piece.image ? `/images/${piece.image}` : '',
    alt: piece.theme,
    title: piece.theme,
    category: piece.collection,
    size: `${piece.width} × ${piece.height} cm`,
    price: piece.price,
    quantity: piece.quantity,
    philosophy: piece.philosophy[lang],
  }))
}
