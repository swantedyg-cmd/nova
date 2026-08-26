'use client'

import dynamic from 'next/dynamic'
import { useIsMobile } from '@/hooks/useIsMobile'

const LiquidChrome = dynamic(() => import('./LiquidChrome'), { ssr: false })
const PixelTrail = dynamic(() => import('./PixelTrail'), { ssr: false })

// Desktop-only, like every other ambient decoration in this codebase —
// unlike those, though, this one was never gated: it runs from the moment
// <NovaIntro> mounts its children, two continuous full-viewport
// requestAnimationFrame loops (an OGL fragment shader computing 81 trig
// evaluations per pixel every frame, plus a full-retina-resolution 2D
// canvas re-running a live SVG Gaussian-blur filter every frame), forever,
// regardless of intro/video/gallery state. A prime suspect for sustained
// mobile GPU pressure that none of the intro-focused fixes could touch.
export default function SiteBackground() {
  const isMobile = useIsMobile()
  if (isMobile) return null

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden="true">
      <div className="absolute inset-0">
        <LiquidChrome
          baseColor={[0.34, 0.24, 0.08]}
          speed={0.22}
          amplitude={0.22}
          frequencyX={2}
          frequencyY={2}
          interactive={false}
        />
      </div>
      <div className="absolute inset-0">
        <PixelTrail
          gridSize={70}
          trailSize={0.07}
          maxAge={400}
          interpolate={7}
          color="#C89B3C"
          gooeyFilter={{ id: 'site-goo', strength: 3 }}
        />
      </div>
    </div>
  )
}
