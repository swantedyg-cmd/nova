'use client'

import { useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import Image from 'next/image'
import { Banknote, Frame, Truck, X } from 'lucide-react'
import { useCart } from '@/context/CartContext'
import { PIECES, formatSize } from '@/data/catalogue'
import { useLanguage } from '@/i18n/LanguageContext'

const EXPO_OUT = [0.16, 1, 0.3, 1] as const
const REASSURE_ICONS = [Frame, Banknote, Truck]

const noop = () => () => {}
// True only on the client — the drawer is portalled to <body>, which
// doesn't exist during server rendering.
function useIsClient() {
  return useSyncExternalStore(noop, () => true, () => false)
}

export function formatDH(n: number) {
  // Thin-space thousands, the way prices read on a printed label.
  return `${n.toLocaleString('fr-FR').replace(/ | /g, ' ')} DH`
}

export default function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { cartItems, removeFromCart } = useCart()
  const { t, lang } = useLanguage()
  const c = t.cart
  const rtl = lang === 'ar'
  const isClient = useIsClient()

  const items = cartItems
    .map((id) => {
      const index = PIECES.findIndex((p) => p.id === id)
      return index >= 0 ? { ...PIECES[index], index } : null
    })
    .filter((p): p is NonNullable<typeof p> => p !== null)

  const total = items.reduce((sum, p) => sum + p.price, 0)
  const countLabel = items.length === 1 ? c.countOne : c.countMany.replace('{n}', String(items.length))

  const handleCheckout = () => {
    onClose()
    requestAnimationFrame(() => {
      document.getElementById('commande')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  if (!isClient) return null

  // Portalled to <body>: inside the header's fixed, z-indexed wrapper the
  // drawer couldn't rise above the floating WhatsApp/Instagram buttons.
  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[80] bg-charcoal/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={c.title}
            dir={rtl ? 'rtl' : 'ltr'}
            className="fixed inset-y-0 end-0 z-[90] flex w-full max-w-md flex-col bg-parchment shadow-2xl"
            initial={{ x: rtl ? '-100%' : '100%' }}
            animate={{ x: 0 }}
            exit={{ x: rtl ? '-100%' : '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 300 }}
          >
            {/* Header — title, piece count, and a gold hairline like a museum label */}
            <div className="relative px-6 pt-6 pb-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.32em] text-gold font-body">Nova</p>
                  <p className="mt-1 font-display text-2xl font-medium text-charcoal">{c.title}</p>
                  {items.length > 0 && (
                    <p className="mt-0.5 font-body text-xs text-charcoal/45">{countLabel}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label={c.closeAria}
                  className="grid size-9 place-items-center rounded-full border border-charcoal/12 text-charcoal/55 transition-colors hover:border-charcoal/30 hover:text-charcoal"
                >
                  <X className="size-4" />
                </button>
              </div>
              <div className="absolute inset-x-6 bottom-0 h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent" />
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              {items.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 py-16 text-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/nova-logo-icon.png" alt="" width={72} height={59} className="opacity-70" />
                  <p className="font-display text-lg text-charcoal/70">{c.empty}</p>
                  <p className="font-body text-xs text-charcoal/45">{c.emptyHint}</p>
                  <button
                    type="button"
                    onClick={() => {
                      onClose()
                      requestAnimationFrame(() => document.getElementById('gallery')?.scrollIntoView({ behavior: 'smooth' }))
                    }}
                    className="mt-3 rounded-full border border-charcoal/20 px-5 py-2 text-xs tracking-wide text-charcoal/70 transition-colors hover:border-charcoal/45 hover:text-charcoal"
                  >
                    {c.continue}
                  </button>
                </div>
              ) : (
                <ul className="space-y-3">
                  <AnimatePresence initial={false}>
                    {items.map((p, i) => (
                      <motion.li
                        key={p.id}
                        layout
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0, transition: { duration: 0.5, delay: i * 0.06, ease: EXPO_OUT } }}
                        exit={{ opacity: 0, x: rtl ? -40 : 40, transition: { duration: 0.25 } }}
                        className="flex gap-4 rounded-xl border border-charcoal/8 bg-canvas/70 p-3"
                      >
                        {/* Thumbnail in a small gilded frame, echoing the real piece */}
                        <div className="flex-shrink-0 rounded-[3px] bg-gold p-[3px] shadow-[0_6px_16px_rgba(90,18,32,0.14)]">
                          <div className="relative h-24 w-[4.25rem] overflow-hidden rounded-[1px] bg-charcoal/10">
                            {p.image && (
                              <Image src={`/images/${p.image}`} alt={p.theme} fill sizes="68px" className="object-cover" />
                            )}
                          </div>
                        </div>

                        <div className="flex min-w-0 flex-1 flex-col">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="font-body text-[10px] uppercase tracking-[0.22em] text-charcoal/40">
                                N° {String(p.index + 1).padStart(2, '0')}
                              </p>
                              <p lang="fr" className="truncate font-display text-base text-charcoal">{p.theme}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeFromCart(p.id)}
                              aria-label={`${c.remove} — ${p.theme}`}
                              className="-m-1 p-1 text-charcoal/30 transition-colors hover:text-charcoal/70"
                            >
                              <X className="size-4" />
                            </button>
                          </div>

                          <p className="mt-1 font-body text-xs text-charcoal/55" dir="ltr">{formatSize(p, lang)}</p>
                          <p className="mt-0.5 inline-flex items-center gap-1.5 font-body text-[11px] text-charcoal/50">
                            <Frame className="size-3 text-gold" aria-hidden="true" />
                            {c.frameTag}
                          </p>

                          <div className="mt-auto flex items-end justify-between pt-2">
                            <p className="font-body text-[10px] uppercase tracking-wider text-charcoal/35">
                              {c.left.replace('{n}', String(p.quantity))}
                            </p>
                            <p className="font-display text-base text-charcoal" dir="ltr">{formatDH(p.price)}</p>
                          </div>
                        </div>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              )}
            </div>

            {items.length > 0 && (
              <div className="border-t border-charcoal/10 bg-canvas/60 px-6 pt-5 pb-6">
                {/* Order summary */}
                <dl className="space-y-2 font-body text-sm">
                  <div className="flex justify-between text-charcoal/60">
                    <dt>{c.subtotal}</dt>
                    <dd dir="ltr">{formatDH(total)}</dd>
                  </div>
                  <div className="flex justify-between text-charcoal/60">
                    <dt>{c.delivery}</dt>
                    <dd>{c.deliveryValue}</dd>
                  </div>
                  <div className="flex justify-between text-charcoal/60">
                    <dt>{c.payment}</dt>
                    <dd>{c.paymentValue}</dd>
                  </div>
                  <div className="flex items-baseline justify-between border-t border-dashed border-charcoal/15 pt-3">
                    <dt className="text-xs uppercase tracking-[0.2em] text-charcoal/50">{c.total}</dt>
                    <dd className="font-display text-2xl text-charcoal" dir="ltr">{formatDH(total)}</dd>
                  </div>
                </dl>

                {/* Reassurance */}
                <ul className="mt-4 grid grid-cols-3 gap-2 [@media(max-height:720px)]:hidden">
                  {c.reassure.map((label, i) => {
                    const Icon = REASSURE_ICONS[i]
                    return (
                      <li key={label} className="flex flex-col items-center gap-1.5 rounded-lg bg-parchment/80 px-1.5 py-2.5 text-center">
                        <Icon className="size-4 text-gold" aria-hidden="true" />
                        <span className="font-body text-[10px] leading-tight text-charcoal/60">{label}</span>
                      </li>
                    )
                  })}
                </ul>

                <button
                  type="button"
                  onClick={handleCheckout}
                  className="cart-cta group relative mt-5 w-full overflow-hidden rounded-full bg-charcoal py-3.5 text-sm font-medium tracking-wide text-canvas transition-colors hover:bg-charcoal-mid active:scale-[0.98]"
                >
                  <span className="relative z-10">{c.checkout}</span>
                  <span aria-hidden="true" className="cart-cta-sheen pointer-events-none absolute inset-0" />
                </button>
                <p className="mt-2.5 text-center font-body text-[11px] text-charcoal/45">{c.checkoutNote}</p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  )
}
