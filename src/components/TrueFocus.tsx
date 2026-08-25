'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import './TrueFocus.css'

interface FocusRect {
  x: number
  y: number
  width: number
  height: number
}

interface TrueFocusProps {
  sentence?: string
  separator?: string
  manualMode?: boolean
  blurAmount?: number
  borderColor?: string
  glowColor?: string
  animationDuration?: number
  pauseBetweenAnimations?: number
  /** Stop after one full pass through the words instead of looping forever. */
  playOnce?: boolean
  /** Don't start the auto-cycle until the component scrolls into view. */
  startInView?: boolean
  className?: string
}

export default function TrueFocus({
  sentence = 'True Focus',
  separator = ' ',
  manualMode = false,
  blurAmount = 5,
  borderColor = 'green',
  glowColor = 'rgba(0, 255, 0, 0.6)',
  animationDuration = 0.5,
  pauseBetweenAnimations = 1,
  playOnce = false,
  startInView = false,
  className = '',
}: TrueFocusProps) {
  const words = sentence.split(separator)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [lastActiveIndex, setLastActiveIndex] = useState<number | null>(null)
  const [started, setStarted] = useState(!startInView)
  const [done, setDone] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([])
  const [focusRect, setFocusRect] = useState<FocusRect>({ x: 0, y: 0, width: 0, height: 0 })

  useEffect(() => {
    setReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  }, [])

  // Trigger the cycle only once the component scrolls into view.
  useEffect(() => {
    if (!startInView || started) return
    const el = containerRef.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStarted(true)
          io.disconnect()
        }
      },
      { threshold: 0.4 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [startInView, started])

  useEffect(() => {
    if (manualMode || !started || done || reducedMotion) return

    const interval = setInterval(
      () => {
        setCurrentIndex((prev) => {
          const next = prev + 1
          if (next >= words.length) {
            if (playOnce) {
              clearInterval(interval)
              setDone(true)
              return prev
            }
            return 0
          }
          return next
        })
      },
      (animationDuration + pauseBetweenAnimations) * 1000
    )

    return () => clearInterval(interval)
  }, [manualMode, started, done, reducedMotion, animationDuration, pauseBetweenAnimations, words.length, playOnce])

  useEffect(() => {
    if (currentIndex === null || currentIndex === -1) return
    if (!wordRefs.current[currentIndex] || !containerRef.current) return

    const parentRect = containerRef.current.getBoundingClientRect()
    const activeRect = wordRefs.current[currentIndex]!.getBoundingClientRect()

    setFocusRect({
      x: activeRect.left - parentRect.left,
      y: activeRect.top - parentRect.top,
      width: activeRect.width,
      height: activeRect.height,
    })
  }, [currentIndex, words.length])

  const handleMouseEnter = (index: number) => {
    if (manualMode) {
      setLastActiveIndex(index)
      setCurrentIndex(index)
    }
  }

  const handleMouseLeave = () => {
    if (manualMode && lastActiveIndex !== null) {
      setCurrentIndex(lastActiveIndex)
    }
  }

  if (reducedMotion) {
    return <span className={className}>{words.join(separator)}</span>
  }

  return (
    <div className={`focus-container ${className}`.trim()} ref={containerRef}>
      {words.map((word, index) => {
        const isActive = index === currentIndex
        return (
          <span
            key={index}
            ref={(el) => { wordRefs.current[index] = el }}
            className={`focus-word ${manualMode ? 'manual' : ''} ${isActive && !manualMode ? 'active' : ''}`}
            style={{
              filter: isActive ? 'blur(0px)' : `blur(${blurAmount}px)`,
              ['--border-color' as string]: borderColor,
              ['--glow-color' as string]: glowColor,
              transition: `filter ${animationDuration}s ease, opacity ${animationDuration}s ease`,
            }}
            onMouseEnter={() => handleMouseEnter(index)}
            onMouseLeave={handleMouseLeave}
          >
            {word}
          </span>
        )
      })}

      <motion.div
        className="focus-frame"
        animate={{
          x: focusRect.x,
          y: focusRect.y,
          width: focusRect.width,
          height: focusRect.height,
          opacity: currentIndex >= 0 ? 1 : 0,
        }}
        transition={{ duration: animationDuration }}
        style={{
          ['--border-color' as string]: borderColor,
          ['--glow-color' as string]: glowColor,
        }}
      >
        <span className="corner top-left" />
        <span className="corner top-right" />
        <span className="corner bottom-left" />
        <span className="corner bottom-right" />
      </motion.div>
    </div>
  )
}
