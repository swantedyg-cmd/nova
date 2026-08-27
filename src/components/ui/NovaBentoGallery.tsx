'use client'

import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import Image from 'next/image'
import { AnimatePresence, motion, useMotionValue, useSpring } from 'motion/react'
import { useIsMobile } from '@/hooks/useIsMobile'
import { useLanguage } from '@/i18n/LanguageContext'
import { PIECES, type Piece, type Collection } from '@/data/catalogue'

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

// index % 7 -> bento span, per spec. Assumes a 4-column base grid.
const SPAN_PATTERN = [
  'col-span-2 row-span-2', // 0 large
  'col-span-1 row-span-1', // 1 small
  'col-span-1 row-span-2', // 2 tall
  'col-span-2 row-span-1', // 3 wide
  'col-span-1 row-span-1', // 4 small
  'col-span-1 row-span-2', // 5 tall
  'col-span-2 row-span-1', // 6 wide
] as const

function formatPrice(n: number) {
  return n.toLocaleString('fr-FR').replace(/[  ]/g, ' ')
}

function buildWhatsAppText(piece: Piece, globalIndex: number, total: number) {
  return (
    `Bonjour, je suis intéressé(e) par « ${piece.theme} » — ` +
    `${piece.width} × ${piece.height} cm — ${formatPrice(piece.price)} DH ` +
    `(N° ${String(globalIndex).padStart(2, '0')} / ${total})`
  )
}

interface NovaBentoGalleryProps {
  pieces?: Piece[]
}

export default function NovaBentoGallery({ pieces = PIECES }: NovaBentoGalleryProps) {
  const isMobile = useIsMobile()
  const { lang } = useLanguage()
  const sectionRef = useRef<HTMLDivElement>(null)

  const [activeCategory, setActiveCategory] = useState<Collection | 'Tout'>('Tout')
  const [lightboxId, setLightboxId] = useState<string | null>(null)
  const [inView, setInView] = useState(false)

  const filtered = useMemo(
    () => (activeCategory === 'Tout' ? pieces : pieces.filter((p) => p.collection === activeCategory)),
    [pieces, activeCategory],
  )

  const categoryCounts = useMemo(() => {
    const counts = {} as Record<Collection | 'Tout', number>
    counts['Tout'] = pieces.length
    for (const cat of CATEGORIES) {
      if (cat === 'Tout') continue
      counts[cat] = pieces.filter((p) => p.collection === cat).length
    }
    return counts
  }, [pieces])

  const globalIndexOf = useCallback((id: string) => pieces.findIndex((p) => p.id === id) + 1, [pieces])

  const lightboxPiece = lightboxId ? pieces.find((p) => p.id === lightboxId) ?? null : null

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
      { threshold: 0.05 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Lock body scroll + Escape-to-close while the lightbox is open.
  useEffect(() => {
    if (!lightboxId) return
    document.documentElement.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxId(null)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.documentElement.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [lightboxId])

  return (
    <div ref={sectionRef} className="relative w-full" style={{ background: '#F5EDD6' }}>
      <FilterBar
        activeCategory={activeCategory}
        onChange={setActiveCategory}
        counts={categoryCounts}
      />

      {!isMobile && <FloatingParticles />}

      <div className="relative mx-auto max-w-6xl px-4 py-10 sm:px-6 md:py-14">
        <div
          className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 md:gap-5"
          style={{ gridAutoFlow: 'dense', gridAutoRows: '150px' }}
        >
          <AnimatePresence mode="popLayout">
            {filtered.map((piece, i) => (
              <BentoCard
                key={piece.id}
                piece={piece}
                span={SPAN_PATTERN[i % SPAN_PATTERN.length]}
                index={i}
                globalIndex={globalIndexOf(piece.id)}
                total={pieces.length}
                isMobile={isMobile}
                inView={inView}
                lang={lang}
                onOpen={() => setLightboxId(piece.id)}
              />
            ))}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {lightboxPiece && (
          <Lightbox
            piece={lightboxPiece}
            globalIndex={globalIndexOf(lightboxPiece.id)}
            total={pieces.length}
            lang={lang}
            onClose={() => setLightboxId(null)}
          />
        )}
      </AnimatePresence>

      <style>{`
        @keyframes nova-bento-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes nova-bento-shimmer {
          from { transform: translateX(-100%); }
          to { transform: translateX(200%); }
        }
        .nova-bento-shimmer-track {
          opacity: 0;
          transition: opacity 0.2s ease;
        }
        .nova-bento-card:hover .nova-bento-shimmer-track {
          opacity: 1;
        }
        .nova-bento-card:hover .nova-bento-shimmer-track > span {
          animation: nova-bento-shimmer 0.7s ease-out;
        }
        .nova-bento-overlay {
          opacity: 0;
          transform: translateY(8px);
          transition: opacity 0.35s ease, transform 0.35s ease;
        }
        .nova-bento-card:hover .nova-bento-overlay,
        .nova-bento-card:focus-within .nova-bento-overlay {
          opacity: 1;
          transform: translateY(0);
        }
        .nova-bento-frame {
          transition: box-shadow 0.4s ease, border-color 0.4s ease;
        }
        .nova-bento-card:hover .nova-bento-frame {
          box-shadow: 0 20px 60px rgba(44,24,16,0.2), 0 0 0 2px rgba(212,164,46,0.6), inset 0 0 0 1px rgba(245,208,122,0.3);
        }
      `}</style>
    </div>
  )
}

/* ─── Category filter bar ────────────────────────────────────────────── */
function FilterBar({
  activeCategory,
  onChange,
  counts,
}: {
  activeCategory: Collection | 'Tout'
  onChange: (c: Collection | 'Tout') => void
  counts: Record<Collection | 'Tout', number>
}) {
  return (
    <div
      className="sticky top-0 z-20 flex flex-wrap items-center justify-center gap-2 px-4 py-4 backdrop-blur-md"
      style={{ background: 'rgba(245,237,214,0.9)' }}
    >
      {CATEGORIES.map((cat) => {
        const isActive = cat === activeCategory
        return (
          <button
            key={cat}
            type="button"
            onClick={() => onChange(cat)}
            aria-pressed={isActive}
            className="relative overflow-hidden rounded-full px-3.5 py-1.5 text-[10px] font-body uppercase tracking-[0.14em] transition-colors duration-200 sm:text-[11px]"
            style={{
              color: isActive ? '#2C1810' : '#D6BD98',
              border: isActive ? '1px solid transparent' : '1px solid rgba(212,164,46,0.35)',
            }}
          >
            {isActive && (
              <motion.span
                layoutId="nova-bento-active-pill"
                className="absolute inset-0"
                style={{ background: '#D4A42E' }}
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
              />
            )}
            <span className="relative z-10">
              {cat} ({counts[cat] ?? 0})
            </span>
          </button>
        )
      })}
    </div>
  )
}

/* ─── One bento card ──────────────────────────────────────────────────── */
function BentoCard({
  piece,
  span,
  index,
  globalIndex,
  total,
  isMobile,
  inView,
  lang,
  onOpen,
}: {
  piece: Piece
  span: string
  index: number
  globalIndex: number
  total: number
  isMobile: boolean
  inView: boolean
  lang: 'fr' | 'en' | 'ar'
  onOpen: () => void
}) {
  const cardRef = useRef<HTMLDivElement>(null)

  // Magnetic pull toward the cursor — desktop only, active while hovering
  // this card. Kept on its own inner layer (see render below) so it never
  // fights the outer wrapper's whileInView entrance.
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const sx = useSpring(mx, { stiffness: 150, damping: 15, mass: 0.3 })
  const sy = useSpring(my, { stiffness: 150, damping: 15, mass: 0.3 })

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (isMobile || !cardRef.current) return
      const rect = cardRef.current.getBoundingClientRect()
      const px = (e.clientX - rect.left) / rect.width - 0.5
      const py = (e.clientY - rect.top) / rect.height - 0.5
      mx.set(px * 8)
      my.set(py * 8)
    },
    [isMobile, mx, my],
  )

  const handleMouseLeave = useCallback(() => {
    mx.set(0)
    my.set(0)
  }, [mx, my])

  // Stable per-card float timing so it doesn't re-randomize on re-render.
  const floatStyle = useMemo(() => {
    if (isMobile) return undefined
    const duration = 3 + Math.random() * 2
    const delay = Math.random() * 2
    return { animation: `nova-bento-float ${duration}s ease-in-out ${delay}s infinite` }
  }, [isMobile])

  const handleWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation()
    const text = buildWhatsAppText(piece, globalIndex, total)
    window.open(`https://wa.me/${PHONE_INTL}?text=${encodeURIComponent(text)}`, '_blank')
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 40, scale: 0.92 }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
      exit={{ opacity: 0, scale: 0.85, filter: 'blur(4px)', transition: { duration: 0.25 } }}
      transition={{ type: 'spring', stiffness: 80, damping: 20, delay: index * 0.06 }}
      className={span}
      style={floatStyle}
    >
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={onOpen}
        whileHover={{ scale: 1.03 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        style={{ x: sx, y: sy }}
        className="nova-bento-card group relative h-full w-full cursor-pointer"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') onOpen()
        }}
        aria-label={piece.theme}
      >
        <div
          className="nova-bento-frame relative h-full w-full overflow-hidden"
          style={{
            border: '1.5px solid rgba(212,164,46,0.25)',
            borderRadius: 3,
            boxShadow:
              '0 4px 24px rgba(44,24,16,0.08), 0 1px 3px rgba(212,164,46,0.15), inset 0 0 0 1px rgba(245,208,122,0.1)',
          }}
        >
          {piece.image ? (
            <Image
              src={`/images/${piece.image}`}
              alt={piece.theme}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              loading="lazy"
              priority={index < 4}
              className="object-cover"
            />
          ) : (
            <div className="h-full w-full" style={{ background: 'linear-gradient(160deg, #E4CFA0, #D6BD98)' }} />
          )}

          {/* Shimmer sweep */}
          <div className="nova-bento-shimmer-track pointer-events-none absolute inset-0 overflow-hidden">
            <span
              className="absolute inset-y-0 left-0 block w-1/3"
              style={{
                background:
                  'linear-gradient(105deg, transparent 40%, rgba(245,208,122,0.3) 50%, transparent 60%)',
              }}
            />
          </div>

          {/* Category pill, top-left, always visible */}
          <span
            className="absolute left-2 top-2 rounded-full border px-2 py-0.5 text-[8px] uppercase tracking-[0.16em] backdrop-blur-sm"
            style={{ borderColor: 'rgba(212,164,46,0.6)', color: '#D6BD98', background: 'rgba(44,24,16,0.35)' }}
          >
            {piece.collection}
          </span>

          {/* Hover overlay */}
          <div
            className="nova-bento-overlay pointer-events-none absolute inset-0 flex flex-col justify-end p-3"
            style={{
              background:
                'linear-gradient(to top, rgba(44,24,16,0.92) 0%, rgba(44,24,16,0.4) 40%, transparent 70%)',
            }}
          >
            <p className="text-[9px] uppercase tracking-[0.25em]" style={{ color: '#D4A42E' }}>
              N° {String(globalIndex).padStart(2, '0')}
            </p>
            <p className="mt-0.5 font-display italic" style={{ color: '#F5EDD6', fontSize: '1rem', lineHeight: 1.2 }}>
              {piece.theme}
            </p>
            <p className="mt-0.5 text-xs" style={{ color: '#D4A42E' }}>
              {formatPrice(piece.price)} DH
            </p>
            <p className="text-[10px]" style={{ color: '#D6BD98' }}>
              {piece.width} × {piece.height} cm
            </p>
            <button
              type="button"
              onClick={handleWhatsApp}
              className="pointer-events-auto mt-2 w-full rounded-full py-1.5 text-center text-[9px] uppercase tracking-[0.2em] transition-transform duration-150 active:scale-[0.97]"
              style={{ background: '#D4A42E', color: '#2C1810' }}
            >
              Commander
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ─── Floating ambient gold particles — desktop only ─────────────────── */
function FloatingParticles() {
  const particles = useMemo(
    () =>
      Array.from({ length: 8 }, (_, i) => ({
        id: i,
        size: 2 + Math.random() * 2,
        top: Math.random() * 100,
        left: Math.random() * 100,
        duration: 14 + Math.random() * 10,
        delay: Math.random() * 6,
        opacity: 0.3 + Math.random() * 0.3,
      })),
    [],
  )

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {particles.map((p) => (
        <motion.span
          key={p.id}
          className="absolute rounded-full"
          style={{
            width: p.size,
            height: p.size,
            top: `${p.top}%`,
            left: `${p.left}%`,
            background: '#D4A42E',
            opacity: p.opacity,
          }}
          animate={{
            x: [0, 20, -14, 0],
            y: [0, -24, 10, 0],
          }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  )
}

/* ─── Lightbox ────────────────────────────────────────────────────────── */
function Lightbox({
  piece,
  globalIndex,
  total,
  lang,
  onClose,
}: {
  piece: Piece
  globalIndex: number
  total: number
  lang: 'fr' | 'en' | 'ar'
  onClose: () => void
}) {
  const handleWhatsApp = () => {
    const text = buildWhatsAppText(piece, globalIndex, total)
    window.open(`https://wa.me/${PHONE_INTL}?text=${encodeURIComponent(text)}`, '_blank')
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 backdrop-blur-md md:p-10"
      style={{ background: 'rgba(44,24,16,0.96)' }}
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Fermer"
        className="fixed right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full text-lg"
        style={{ color: '#D6BD98', border: '1px solid rgba(214,189,152,0.35)' }}
      >
        ✕
      </button>

      <div
        className="flex w-full max-w-4xl flex-col items-center gap-8 md:flex-row md:items-center"
        onClick={(e) => e.stopPropagation()}
      >
        <motion.div
          initial={{ x: -60, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1, ease: 'easeOut' }}
          className="relative w-full md:w-[55%]"
        >
          <div
            className="relative mx-auto flex max-h-[85vh] w-full items-center justify-center overflow-hidden rounded-sm"
            style={{
              border: '2px solid transparent',
              backgroundImage:
                'linear-gradient(#2C1810, #2C1810), linear-gradient(135deg, #F5D07A, #A67C00, #F5D07A)',
              backgroundOrigin: 'border-box',
              backgroundClip: 'padding-box, border-box',
            }}
          >
            {piece.image ? (
              <Image
                src={`/images/${piece.image}`}
                alt={piece.theme}
                width={900}
                height={Math.round(900 / piece.aspect)}
                sizes="(max-width: 768px) 100vw, 55vw"
                className="h-auto max-h-[85vh] w-full object-contain"
              />
            ) : (
              <div className="aspect-[4/5] w-full" style={{ background: 'linear-gradient(160deg, #3A2C1A, #1F1810)' }} />
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ x: 60, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2, ease: 'easeOut' }}
          className="w-full md:w-[45%]"
        >
          <span
            className="inline-block rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.2em]"
            style={{ borderColor: '#D4A42E', color: '#D4A42E' }}
          >
            {piece.collection}
          </span>

          <h3
            className="mt-4 font-display italic"
            style={{ fontSize: 'clamp(1.6rem, 3vw, 2.6rem)', color: '#F5EDD6', lineHeight: 1.15 }}
          >
            {piece.theme}
          </h3>

          <p className="mt-2 text-[11px] uppercase tracking-[0.25em]" style={{ color: '#D6BD98' }}>
            N° {String(globalIndex).padStart(2, '0')} / {total}
          </p>

          <p className="mt-4 font-display" style={{ fontSize: '1.4rem', color: '#D4A42E' }}>
            {formatPrice(piece.price)} DH
          </p>
          <p className="mt-1 text-sm" style={{ color: '#D6BD98' }}>
            {piece.width} × {piece.height} cm
          </p>

          <div className="mt-5 h-px w-16" style={{ background: '#D4A42E' }} />

          <p className="mt-5 text-sm italic leading-relaxed" style={{ color: 'rgba(245,237,214,0.7)' }}>
            {piece.philosophy[lang]}
          </p>

          {piece.quantity === 1 && (
            <span
              className="mt-4 inline-block rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.2em]"
              style={{ borderColor: '#D4A42E', color: '#D4A42E' }}
            >
              Pièce unique
            </span>
          )}

          <button
            type="button"
            onClick={handleWhatsApp}
            className="mt-8 block w-full rounded-full text-center text-xs font-medium uppercase tracking-[0.2em] text-[#2C1810] transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg, #D4A42E, #A67C00)', minHeight: 48, padding: '16px 0' }}
          >
            Commander sur WhatsApp
          </button>
        </motion.div>
      </div>
    </motion.div>
  )
}
