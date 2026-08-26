'use client'

import { useSyncExternalStore } from 'react'

const QUERY = '(max-width: 767px)'

// Decorative WebGL (Strands/OGL) instances are gated off on mobile with
// this — each one opens its own GL context + render target, and enough of
// them mounting at once (this page has one per section) is what crashes
// mobile Safari's content process ("This page couldn't load") even though
// the same page runs fine on desktop.
//
// This used to be `useState(false)` flipped by a `useEffect` — but that
// leaves a real window, between first render and that effect firing,
// where the component tree still includes the WebGL children and React
// can commit/mount them. Mounting a canvas is enough to open a GL context
// even if the very next render tears it back down, and that's enough on
// its own to crash Safari's content process — the later cleanup happens
// too late to matter. `useSyncExternalStore` reads `matchMedia` directly
// during render (not from an effect afterward), so on mobile the very
// first render already excludes these children — there's no frame where
// they exist to begin mounting.
function subscribe(callback: () => void) {
  const mql = window.matchMedia(QUERY)
  mql.addEventListener('change', callback)
  return () => mql.removeEventListener('change', callback)
}

function getSnapshot() {
  return window.matchMedia(QUERY).matches
}

function getServerSnapshot() {
  return false
}

export function useIsMobile() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
