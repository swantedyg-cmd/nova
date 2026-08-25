'use client'

import { useRef, useEffect, useId } from 'react'

export default function PixelTrail({
  gridSize = 50,
  trailSize = 0.1,
  maxAge = 250,
  interpolate = 5,
  color = '#ffffff',
  gooeyFilter,
  className = '',
}) {
  const containerRef = useRef(null)
  const canvasRef = useRef(null)
  const trailRef = useRef([])
  const lastPointRef = useRef(null)
  const reactId = useId()
  const filterId = gooeyFilter?.id ?? `pixel-trail-goo-${reactId}`

  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    if (!container || !canvas) return

    const ctx = canvas.getContext('2d')
    let width = container.offsetWidth
    let height = container.offsetHeight
    let cellSize = Math.max(1, Math.min(width, height) / gridSize)

    function resize() {
      width = container.offsetWidth
      height = container.offsetHeight
      cellSize = Math.max(1, Math.min(width, height) / gridSize)
      const dpr = window.devicePixelRatio || 1
      canvas.width = width * dpr
      canvas.height = height * dpr
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    function addPoint(x, y) {
      const col = Math.floor(x / cellSize)
      const row = Math.floor(y / cellSize)
      trailRef.current.push({ col, row, born: performance.now() })
    }

    function handlePointerMove(event) {
      const rect = container.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top
      const last = lastPointRef.current
      if (last) {
        const steps = Math.max(1, interpolate)
        for (let i = 1; i <= steps; i++) {
          const t = i / steps
          addPoint(last.x + (x - last.x) * t, last.y + (y - last.y) * t)
        }
      } else {
        addPoint(x, y)
      }
      lastPointRef.current = { x, y }
    }
    function handlePointerLeave() {
      lastPointRef.current = null
    }

    container.addEventListener('pointermove', handlePointerMove)
    container.addEventListener('pointerleave', handlePointerLeave)

    let animationId
    function render(now) {
      animationId = requestAnimationFrame(render)
      ctx.clearRect(0, 0, width, height)

      const alive = []
      for (const point of trailRef.current) {
        const age = now - point.born
        if (age >= maxAge) continue
        alive.push(point)

        const life = 1 - age / maxAge
        const size = cellSize * trailSize * (0.4 + life * 0.6)
        const cx = point.col * cellSize + cellSize / 2
        const cy = point.row * cellSize + cellSize / 2

        ctx.globalAlpha = life
        ctx.fillStyle = color
        ctx.beginPath()
        ctx.arc(cx, cy, size, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1
      trailRef.current = alive
    }
    animationId = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', resize)
      container.removeEventListener('pointermove', handlePointerMove)
      container.removeEventListener('pointerleave', handlePointerLeave)
    }
  }, [gridSize, trailSize, maxAge, interpolate, color])

  return (
    <div ref={containerRef} className={`relative w-full h-full ${className}`}>
      <svg className="absolute w-0 h-0">
        <defs>
          <filter id={filterId}>
            <feGaussianBlur in="SourceGraphic" stdDeviation={gooeyFilter?.strength ?? 4} result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -8" />
          </filter>
        </defs>
      </svg>
      <canvas ref={canvasRef} className="absolute inset-0" style={{ filter: `url(#${filterId})` }} />
    </div>
  )
}
