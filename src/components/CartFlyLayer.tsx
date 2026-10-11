'use client'

import { AnimatePresence, motion } from 'motion/react'
import { useCart } from '@/context/CartContext'

// The visual size the thumbnail shrinks to as it lands on the cart icon.
const LANDING_SIZE = 20

// Mounted once near the app root. Renders each in-flight "added to cart"
// thumbnail as a fixed-position clone animated purely via transform/opacity
// (translate + scale, never left/top/width/height) so it never triggers a
// layout recalculation while it flies.
export default function CartFlyLayer() {
  const { flights, completeFlight } = useCart()

  return (
    <div className="pointer-events-none fixed inset-0 z-[70] overflow-hidden">
      <AnimatePresence>
        {flights.map((f) => {
          const originX = f.from.x + f.from.width / 2
          const originY = f.from.y + f.from.height / 2
          const deltaX = f.to.x - originX
          const deltaY = f.to.y - originY
          const targetScale = LANDING_SIZE / Math.max(f.from.width, f.from.height)

          return (
            <motion.img
              key={f.id}
              src={f.imageSrc}
              alt=""
              initial={{ x: 0, y: 0, scale: 1, opacity: 1, rotate: 0 }}
              animate={{
                x: [0, deltaX * 0.5, deltaX],
                y: [0, deltaY * 0.5 - 90, deltaY],
                scale: [1, 1.08, targetScale],
                opacity: [1, 1, 0.15],
                rotate: [0, -3, -10],
              }}
              transition={{ type: 'tween', duration: 0.85, ease: 'easeInOut', times: [0, 0.5, 1] }}
              onAnimationComplete={() => completeFlight(f.id)}
              className="fixed rounded-lg object-cover shadow-[0_18px_40px_rgba(0,0,0,0.35)] ring-2 ring-[#D4A42E]/60"
              style={{
                left: f.from.x,
                top: f.from.y,
                width: f.from.width,
                height: f.from.height,
              }}
            />
          )
        })}
      </AnimatePresence>
    </div>
  )
}
