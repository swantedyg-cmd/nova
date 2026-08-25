'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'

interface OrderSelectionContextValue {
  selectedPieceId: string | null
  selectPieceForOrder: (id: string) => void
}

const OrderSelectionContext = createContext<OrderSelectionContextValue>({
  selectedPieceId: null,
  selectPieceForOrder: () => {},
})

export function OrderSelectionProvider({ children }: { children: ReactNode }) {
  const [selectedPieceId, setSelectedPieceId] = useState<string | null>(null)

  const selectPieceForOrder = (id: string) => {
    setSelectedPieceId(id)
    requestAnimationFrame(() => {
      document.getElementById('commande')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  return (
    <OrderSelectionContext.Provider value={{ selectedPieceId, selectPieceForOrder }}>
      {children}
    </OrderSelectionContext.Provider>
  )
}

export function useOrderSelection() {
  return useContext(OrderSelectionContext)
}
