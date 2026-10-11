'use client'

import { motion, useReducedMotion } from 'motion/react'
import { useLanguage } from '@/i18n/LanguageContext'
import { INSTAGRAM_HANDLE, INSTAGRAM_URL } from '@/data/social'
import InstagramIcon from './InstagramIcon'

// Sits directly above StickyWhatsApp, centered on the same axis: WhatsApp
// is 3.5rem wide at 1.25rem from the edge (center 3rem in), this is 3rem
// wide, so 1.5rem from the edge lines the two centers up. Bottom clears
// WhatsApp's 1.25rem offset + 3.5rem height + a 0.75rem gap.
//
// Deliberately one size down from WhatsApp, and without its ping pulse —
// ordering stays the primary action; Instagram is the quieter invitation.
// Its motion is a slow orbiting ring and an occasional glint instead, so
// the two buttons never pulse against each other.
export default function StickyInstagram() {
  const { t, lang } = useLanguage()
  const isRTL = lang === 'ar'
  const reduceMotion = useReducedMotion()

  return (
    <motion.a
      href={INSTAGRAM_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t.instagram.ariaLabel}
      className={`group fixed z-50 flex h-12 w-12 items-center justify-center rounded-full ${isRTL ? 'left-6' : 'right-6'}`}
      style={{ bottom: '5.5rem' }}
      // Arrives a beat after the page settles, spinning into place like a
      // seal being pressed — then holds still.
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.3, rotate: -35, y: 16 }}
      animate={{ opacity: 1, scale: 1, rotate: 0, y: 0 }}
      transition={reduceMotion ? { duration: 0.4, delay: 1 } : { type: 'spring', stiffness: 260, damping: 18, delay: 1.4 }}
      whileHover={reduceMotion ? undefined : { scale: 1.08, y: -2 }}
      whileTap={{ scale: 0.92 }}
    >
      {/* Orbiting ring — Nova gold chasing the Instagram gradient around
          the button. Rotating a conic gradient is compositor-only. */}
      <span aria-hidden="true" className="ig-orbit absolute -inset-[3px] rounded-full" />

      {/* Soft halo in the same palette, brightening on hover. */}
      <span
        aria-hidden="true"
        className="absolute -inset-2 rounded-full opacity-40 blur-md transition-opacity duration-300 group-hover:opacity-75"
        style={{ background: 'radial-gradient(circle, rgba(214,36,159,0.55), rgba(253,89,73,0.25) 55%, transparent 72%)' }}
      />

      <span
        className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-full text-white shadow-lg"
        style={{
          background:
            'radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285AEB 90%)',
        }}
      >
        <InstagramIcon size={24} className="relative transition-transform duration-500 ease-out group-hover:rotate-[-8deg] group-hover:scale-110" />
        {/* Glint — a narrow band of light crossing the face every few
            seconds, the same "gold leaf catching light" cue used on the
            hero headline. */}
        <span aria-hidden="true" className="ig-glint pointer-events-none absolute inset-0" />
      </span>

      {/* Handle label — slides out from behind the button on hover
          (desktop pointers only; touch goes straight to Instagram). */}
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute top-1/2 hidden -translate-y-1/2 whitespace-nowrap rounded-full bg-[#1A1410]/85 px-3.5 py-1.5 font-body text-xs tracking-wide text-[#F5F1EB] opacity-0 shadow-lg backdrop-blur-sm transition-all duration-300 ease-out md:block group-hover:opacity-100 ${
          isRTL
            ? 'left-full ml-2 -translate-x-2 group-hover:ml-3 group-hover:translate-x-0'
            : 'right-full mr-2 translate-x-2 group-hover:mr-3 group-hover:translate-x-0'
        }`}
      >
        <span dir="ltr">@{INSTAGRAM_HANDLE}</span>
      </span>
    </motion.a>
  )
}
