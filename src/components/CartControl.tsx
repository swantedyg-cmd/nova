'use client'

import { useState } from 'react'
import { motion } from 'motion/react'
import { ShoppingBag } from 'lucide-react'
import { useCart, CART_ICON_ID } from '@/context/CartContext'
import { useLanguage } from '@/i18n/LanguageContext'
import CartDrawer from './CartDrawer'

export default function CartControl() {
  const { cartItems, pulseToken } = useCart()
  const { t } = useLanguage()
  const [open, setOpen] = useState(false)
  const count = cartItems.length

  return (
    <>
      <button
        id={CART_ICON_ID}
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t.cart.ariaLabel}
        className="relative flex h-9 w-9 items-center justify-center rounded-full bg-canvas/85 backdrop-blur-md border border-charcoal/10 shadow-md text-charcoal/70 transition-colors hover:text-charcoal"
      >
        <ShoppingBag className="size-5" />
        {count > 0 && (
          <motion.span
            key={pulseToken}
            initial={{ scale: 1.5 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-gold text-[9px] font-medium text-charcoal"
          >
            {count}
          </motion.span>
        )}
      </button>
      <CartDrawer open={open} onClose={() => setOpen(false)} />
    </>
  )
}
