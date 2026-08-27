'use client'

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import Image from 'next/image'
import { AnimatePresence, motion } from 'motion/react'
import Tilt from '@/components/Tilt'
import { useIsMobile } from '@/hooks/useIsMobile'
import { useLanguage } from '@/i18n/LanguageContext'
import type { Piece, Collection } from '@/data/catalogue'

const PHONE_INTL = '212710260501'

const CATEGORIES: (Collection | 'Tout')[] = [
  'Tout',
  'Portraits Fleuris',
  'Bouquets',
  'Papillons',
  "Reines d'Or",
  'Éclat Floral',
  'Âme Nomade',
]

const CATEGORY_GLOW: Record<Collection, string> = {
  'Portraits Fleuris': 'rgba(180,120,120,0.08)',
  'Bouquets': 'rgba(180,150,120,0.08)',
  'Papillons': 'rgba(120,140,180,0.08)',
  "Reines d'Or": 'rgba(180,150,80,0.08)',
  'Éclat Floral': 'rgba(160,130,160,0.08)',
  'Âme Nomade': 'rgba(120,160,140,0.08)',
}

const WHEEL_DEBOUNCE_MS = 600
const SWIPE_MIN_PX = 50

function formatPrice(n: number) {
  return n.toLocaleString('fr-FR').replace(/[  ]/g, ' ')
}

interface CinematicGalleryProps {
  pieces: Piece[]
}

export default function CinematicGallery({ pieces }: CinematicGalleryProps) {
  const isMobile = useIsMobile()
  const { lang } = useLanguage()
  const sectionRef = useRef<HTMLDivElement>(null)

  const [activeCategory, setActiveCategory] = useState<Collection | 'Tout'>('Tout')
  const [index, setIndex] = useState(0)
  const [inView, setInView] = useState(false)

  const lastWheelRef = useRef(0)
  const touchStartXRef = useRef<number | null>(null)

  const filtered = useMemo(
    () => (activeCategory === 'Tout' ? pieces : pieces.filter((p) => p.collection === activeCategory)),
    [pieces, activeCategory],
  )

  // Reset to the first piece whenever the filter changes so the shown
  // painting always exists in the newly-filtered set.
  useEffect(() => {
    setIndex(0)
  }, [activeCategory])

  const categoryCounts = useMemo(() => {
    const counts = {} as Record<Collection | 'Tout', number>
    counts['Tout'] = pieces.length
    for (const cat of CATEGORIES) {
      if (cat === 'Tout') continue
      counts[cat] = pieces.filter((p) => p.collection === cat).length
    }
    return counts
  }, [pieces])

  const current = filtered[index] ?? null
  const globalIndex = current ? pieces.findIndex((p) => p.id === current.id) + 1 : 0

  const goTo = useCallback(
    (next: number) => {
      if (!filtered.length) return
      setIndex(((next % filtered.length) + filtered.length) % filtered.length)
    },
    [filtered.length],
  )

  const next = useCallback(() => goTo(index + 1), [goTo, index])
  const prev = useCallback(() => goTo(index - 1), [goTo, index])

  const preloadNext = useCallback(() => {
    const upcoming = filtered[(index + 1) % filtered.length]
    if (upcoming?.image) {
      const img = new window.Image()
      img.src = `/images/${upcoming.image}`
    }
  }, [filtered, index])

  // Section entry — fade the dark ground in and animate children once,
  // the first time the section actually scrolls into view.
  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          observer.disconnect()
        }
      },
      { threshold: 0.2 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Keyboard navigation — only while the gallery is in view and focus
  // isn't inside a form control elsewhere on the page.
  useEffect(() => {
    if (!inView) return
    const onKey = (e: KeyboardEvent) => {
      const tag = (document.activeElement?.tagName ?? '').toLowerCase()
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return
      if (e.key === 'ArrowRight') next()
      else if (e.key === 'ArrowLeft') prev()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [inView, next, prev])

  // Desktop: mouse wheel steps through paintings one at a time instead of
  // scrolling the page — scoped to this section's element only.
  useEffect(() => {
    if (isMobile) return
    const el = sectionRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const now = Date.now()
      if (now - lastWheelRef.current < WHEEL_DEBOUNCE_MS) return
      lastWheelRef.current = now
      if (e.deltaY > 0) next()
      else if (e.deltaY < 0) prev()
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [isMobile, next, prev])

  // Mobile: swipe left/right steps through paintings.
  useEffect(() => {
    if (!isMobile) return
    const el = sectionRef.current
    if (!el) return
    const onTouchStart = (e: TouchEvent) => {
      touchStartXRef.current = e.touches[0]?.clientX ?? null
    }
    const onTouchEnd = (e: TouchEvent) => {
      const startX = touchStartXRef.current
      touchStartXRef.current = null
      if (startX === null) return
      const endX = e.changedTouches[0]?.clientX ?? startX
      const dx = endX - startX
      if (Math.abs(dx) < SWIPE_MIN_PX) return
      if (dx < 0) next()
      else prev()
    }
    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchend', onTouchEnd, { passive: true })
    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchend', onTouchEnd)
    }
  }, [isMobile, next, prev])

  const handleWhatsApp = () => {
    if (!current) return
    const text =
      `Bonjour, je suis intéressé(e) par « ${current.theme} » — ` +
      `${current.width} × ${current.height} cm — ${formatPrice(current.price)} DH ` +
      `(N° ${globalIndex} / ${pieces.length})`
    window.open(`https://wa.me/${PHONE_INTL}?text=${encodeURIComponent(text)}`, '_blank')
  }

  if (!current) return null

  const glow = CATEGORY_GLOW[current.collection]

  return (
    <div
      ref={sectionRef}
      className="relative w-full overflow-hidden"
      style={{ background: inView ? '#0D0A06' : 'transparent', transition: 'background 1.2s ease' }}
    >
      {/* Ambient glow, tinted per active piece's collection */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(60% 55% at 60% 50%, ${glow}, transparent 70%)`,
          transition: 'background 1.2s ease',
        }}
      />

      {/* Category pill bar */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={inView ? { y: 0, opacity: 1 } : {}}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative z-10 flex flex-wrap items-center justify-center gap-2 px-6 pt-10 md:pt-14"
      >
        {CATEGORIES.map((cat) => {
          const isActive = cat === activeCategory
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              aria-pressed={isActive}
              className="relative overflow-hidden rounded-full px-4 py-2 text-[11px] font-body uppercase tracking-[0.14em] transition-colors duration-200"
              style={{
                color: isActive ? '#0D0A06' : '#D6BD98',
                border: isActive ? '1px solid transparent' : '1px solid rgba(214,189,152,0.3)',
              }}
            >
              {isActive && (
                <motion.span
                  layoutId="cinematic-pill-bg"
                  className="absolute inset-0"
                  style={{ background: '#D4A42E' }}
                  transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                />
              )}
              <span className="relative z-10">
                {cat} ({categoryCounts[cat]})
              </span>
            </button>
          )
        })}
      </motion.div>

      {/* Painting + info split */}
      <div className="relative z-10 mx-auto flex max-w-7xl flex-col items-center gap-10 px-6 py-14 md:min-h-[85vh] md:flex-row md:items-center md:gap-6 md:py-20">
        {/* LEFT — painting */}
        <motion.div
          initial={{ x: 80, opacity: 0 }}
          animate={inView ? { x: 0, opacity: 1 } : {}}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="relative w-full md:w-[55%]"
        >
          <div className="relative mx-auto aspect-[4/5] w-full max-w-md md:max-w-lg">
            <AnimatePresence>
              <motion.div
                key={current.id}
                initial={{ opacity: 0, scale: 0.92, x: 40 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.92, x: -40 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="absolute inset-0"
              >
                {isMobile ? (
                  <PaintingFrame piece={current} priority={globalIndex === 1} />
                ) : (
                  <Tilt max={8} scale={1.02} glossColor="#F5D07A" glossMaxOpacity={0.15} className="h-full w-full">
                    <PaintingFrame piece={current} priority={globalIndex === 1} />
                  </Tilt>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          <p
            className="mt-4 text-center text-[10px] uppercase tracking-[0.3em] md:absolute md:bottom-4 md:left-0 md:mt-0 md:text-left"
            style={{ color: '#D4A42E' }}
          >
            N° {String(globalIndex).padStart(2, '0')} / {pieces.length}
          </p>
        </motion.div>

        {/* RIGHT — info */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={inView ? { y: 0, opacity: 1 } : {}}
          transition={{ duration: 0.7, ease: 'easeOut', delay: 0.3 }}
          className="w-full md:w-[45%] md:pl-10"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.2 } }}
            >
              <p className="text-[11px] uppercase tracking-[0.3em]" style={{ color: '#D6BD98' }}>
                {current.collection}
              </p>

              <h3
                className="mt-3 font-display italic"
                style={{ fontSize: 'clamp(1.8rem, 3vw, 3rem)', color: '#F5EDD6', lineHeight: 1.15 }}
              >
                {current.theme.split(' ').map((word, i) => (
                  <motion.span
                    key={`${current.id}-${i}`}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.5, delay: i * 0.06, ease: 'easeOut' }}
                    className="mr-[0.3em] inline-block"
                  >
                    {word}
                  </motion.span>
                ))}
              </h3>

              <motion.div
                initial={{ width: 0 }}
                animate={{ width: 60 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="mt-5 h-px"
                style={{ background: '#D4A42E' }}
              />

              <p className="mt-5 font-display" style={{ fontSize: '1.4rem', color: '#D4A42E' }}>
                {formatPrice(current.price)} DH
              </p>
              <p className="mt-1 text-sm" style={{ color: 'rgba(245,237,214,0.5)' }}>
                {current.width} × {current.height} cm
              </p>

              <p
                className="mt-4 text-sm italic leading-relaxed"
                style={{
                  color: 'rgba(245,237,214,0.6)',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {current.philosophy[lang]}
              </p>

              <button
                type="button"
                onClick={handleWhatsApp}
                className="mt-8 block w-full rounded-full text-center text-xs font-medium uppercase tracking-[0.2em] text-[#0D0A06] transition-transform duration-200 hover:scale-[1.02] hover:brightness-110 active:scale-[0.98]"
                style={{ background: 'linear-gradient(135deg, #D4A42E, #A67C00)', minHeight: 48, padding: '16px 0' }}
              >
                Commander sur WhatsApp
              </button>

              <div className="mt-5 flex items-center justify-center gap-8 md:justify-start">
                <button
                  type="button"
                  onClick={prev}
                  aria-label="Précédent"
                  className="text-xs uppercase tracking-[0.2em] transition-colors duration-200"
                  style={{ color: '#D6BD98' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#D4A42E')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#D6BD98')}
                >
                  ← Précédent
                </button>
                <button
                  type="button"
                  onClick={next}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#D4A42E'
                    preloadNext()
                  }}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#D6BD98')}
                  aria-label="Suivant"
                  className="text-xs uppercase tracking-[0.2em] transition-colors duration-200"
                  style={{ color: '#D6BD98' }}
                >
                  Suivant →
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
}

function PaintingFrame({ piece, priority }: { piece: Piece; priority: boolean }) {
  return (
    <div
      className="relative h-full w-full overflow-hidden rounded-sm"
      style={{
        border: '2px solid transparent',
        backgroundImage:
          'linear-gradient(#0D0A06, #0D0A06), linear-gradient(135deg, #F5D07A, #A67C00, #F5D07A)',
        backgroundOrigin: 'border-box',
        backgroundClip: 'padding-box, border-box',
        boxShadow: '0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(245,208,122,0.2)',
      }}
    >
      {piece.image ? (
        <Image
          src={`/images/${piece.image}`}
          alt={piece.theme}
          fill
          sizes="(max-width: 768px) 100vw, 55vw"
          priority={priority}
          loading={priority ? undefined : 'lazy'}
          className="object-cover"
        />
      ) : (
        <div className="h-full w-full" style={{ background: 'linear-gradient(160deg, #3A2C1A, #1F1810)' }} />
      )}

      {piece.quantity === 1 && (
        <span
          className="absolute left-3 top-3 rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.2em] backdrop-blur-sm"
          style={{ borderColor: '#D4A42E', color: '#F5D07A', background: 'rgba(13,10,6,0.4)' }}
        >
          Pièce unique
        </span>
      )}
    </div>
  )
}
