// Shared scroll-to-camera-index math for the gallery flythrough — kept in a
// plain module (no 'use client' / three.js deps) so GallerySection can use it
// for its piece counter without pulling the WebGL-heavy GalleryScene module
// into a statically-imported path (that component is deliberately ssr:false).

export const SPACING = 2.85 // distance between consecutive pieces along the corridor (z)

// Scroll buffer (piece-units) before the first / after the last piece —
// see the fuller explanation next to these same values in GalleryScene.tsx.
export const ENTRY_LEAD = 2.2
export const EXIT_LEAD = 0.9

/** Maps scroll progress (0-1) to a fractional piece-index along the rail, with entry/exit buffer. */
export function progressToIndex(t: number, count: number) {
  const totalUnits = count - 1 + ENTRY_LEAD + EXIT_LEAD
  return t * totalUnits - ENTRY_LEAD
}
