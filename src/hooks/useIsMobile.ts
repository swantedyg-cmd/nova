'use client'

import { useEffect, useState } from 'react'

// Decorative WebGL (Strands/OGL) instances are gated off on mobile with
// this — each one opens its own GL context + render target, and enough of
// them mounting at once (this page has one per section) is what crashes
// mobile Safari's content process ("This page couldn't load") even though
// the same page runs fine on desktop.
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    setIsMobile(window.innerWidth < 768)
  }, [])

  return isMobile
}
