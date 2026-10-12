import { Caveat, Pinyon_Script } from 'next/font/google'

// Handwriting for the curator's notebook and the Nova letter only — loaded
// as CSS variables on those components, so no other page pays for them.
export const caveat = Caveat({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-hand',
  display: 'swap',
})

export const pinyon = Pinyon_Script({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-script',
  display: 'swap',
})
