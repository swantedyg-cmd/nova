'use client'

import { AnimatePresence, motion } from 'motion/react'
import Image from 'next/image'
import { X } from 'lucide-react'
import { useCart } from '@/context/CartContext'
import { PIECES } from '@/data/catalogue'
import { useLanguage } from '@/i18n/LanguageContext'

export default function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { cartItems, removeFromCart } = useCart()
  const { t, lang } = useLanguage()
  const c = t.cart

  const items = cartItems
    .map((id) => {
      const index = PIECES.findIndex((p) => p.id === id)
      return index >= 0 ? { ...PIECES[index], index } : null
    })
    .filter((p): p is NonNullable<typeof p> => p !== null)

  const total = items.reduce((sum, p) => sum + p.price, 0)

  const handleCheckout = () => {
    onClose()
    requestAnimationFrame(() => {
      document.getElementById('commande')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  return (
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
            dir={lang === 'ar' ? 'rtl' : 'ltr'}
            className="fixed inset-y-0 end-0 z-[90] flex w-full max-w-sm flex-col bg-parchment shadow-2xl"
            initial={{ x: lang === 'ar' ? '-100%' : '100%' }}
            animate={{ x: 0 }}
            exit={{ x: lang === 'ar' ? '-100%' : '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 300 }}
          >
            <div className="flex items-center justify-between border-b border-charcoal/10 px-6 py-5">
              <p className="font-display text-lg font-medium text-charcoal">{c.title}</p>
              <button
                type="button"
                onClick={onClose}
                aria-label={c.closeAria}
                className="text-charcoal/50 transition-colors hover:text-charcoal"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              {items.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-2 py-16 text-center">
                  <p className="font-body text-sm text-charcoal/50">{c.empty}</p>
                  <p className="font-body text-xs text-charcoal/35">{c.emptyHint}</p>
                </div>
              ) : (
                <ul className="space-y-4">
                  {items.map((p) => (
                    <li key={p.id} className="flex items-center gap-3">
                      <div className="relative h-16 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-charcoal/5">
                        {p.image && (
                          <Image src={`/images/${p.image}`} alt={p.theme} fill sizes="56px" className="object-cover" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-body text-[10px] uppercase tracking-wider text-charcoal/40">
                          {String(p.index + 1).padStart(2, '0')}
                        </p>
                        <p className="truncate font-display text-sm text-charcoal">{p.theme}</p>
                        <p className="font-body text-xs text-gold">{p.price.toLocaleString('en-US')} DH</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFromCart(p.id)}
                        aria-label={c.remove}
                        className="p-1 text-charcoal/30 transition-colors hover:text-charcoal/70"
                      >
                        <X className="size-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {items.length > 0 && (
              <div className="border-t border-charcoal/10 px-6 py-5">
                <div className="mb-4 flex items-center justify-between">
                  <span className="font-body text-xs uppercase tracking-wider text-charcoal/45">{c.total}</span>
                  <span className="font-display text-lg text-gold">{total.toLocaleString('en-US')} DH</span>
                </div>
                <button
                  type="button"
                  onClick={handleCheckout}
                  className="w-full rounded-full bg-charcoal py-3 text-xs font-medium tracking-wide text-canvas transition-colors hover:bg-charcoal-mid active:scale-[0.98]"
                >
                  {c.checkout}
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
