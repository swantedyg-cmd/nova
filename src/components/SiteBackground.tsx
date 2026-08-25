'use client'

import dynamic from 'next/dynamic'

const LiquidChrome = dynamic(() => import('./LiquidChrome'), { ssr: false })
const PixelTrail = dynamic(() => import('./PixelTrail'), { ssr: false })

export default function SiteBackground() {
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
