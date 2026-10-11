'use client'

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'

const STORAGE_KEY = 'nova-cart-items'
const CART_ICON_ID = 'nova-cart-icon'

export interface CartFlight {
  id: number
  imageSrc: string
  from: { x: number; y: number; width: number; height: number }
  to: { x: number; y: number }
}

interface CartContextValue {
  cartItems: string[]
  addToCart: (id: string, imageSrc: string, fromEl: HTMLElement) => void
  removeFromCart: (id: string) => void
  isInCart: (id: string) => boolean
  flights: CartFlight[]
  completeFlight: (id: number) => void
  pulseToken: number
}

const CartContext = createContext<CartContextValue | null>(null)

let flightCounter = 0

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<string[]>([])
  const [flights, setFlights] = useState<CartFlight[]>([])
  const [pulseToken, setPulseToken] = useState(0)
  // Only persist once the initial localStorage read has happened — otherwise
  // the empty initial state would overwrite a saved cart before we've had a
  // chance to load it.
  const hydrated = useRef(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setCartItems(JSON.parse(raw))
    } catch {
      // Storage unavailable (private mode, etc.) — cart just won't persist.
    }
    hydrated.current = true
  }, [])

  useEffect(() => {
    if (!hydrated.current) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cartItems))
    } catch {
      // Storage unavailable — nothing to do.
    }
  }, [cartItems])

  const addToCart = (id: string, imageSrc: string, fromEl: HTMLElement) => {
    setCartItems((prev) => (prev.includes(id) ? prev : [...prev, id]))

    const target = document.getElementById(CART_ICON_ID)
    if (!target) {
      setPulseToken((t) => t + 1)
      return
    }

    const fromRect = fromEl.getBoundingClientRect()
    const toRect = target.getBoundingClientRect()
    const id_ = ++flightCounter
    setFlights((prev) => [...prev, {
      id: id_,
      imageSrc,
      from: { x: fromRect.left, y: fromRect.top, width: fromRect.width, height: fromRect.height },
      to: { x: toRect.left + toRect.width / 2, y: toRect.top + toRect.height / 2 },
    }])
  }

  const completeFlight = (id: number) => {
    setFlights((prev) => prev.filter((f) => f.id !== id))
    setPulseToken((t) => t + 1)
  }

  const removeFromCart = (id: string) => setCartItems((prev) => prev.filter((p) => p !== id))
  const isInCart = (id: string) => cartItems.includes(id)

  return (
    <CartContext.Provider
      value={{ cartItems, addToCart, removeFromCart, isInCart, flights, completeFlight, pulseToken }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}

export { CART_ICON_ID }
