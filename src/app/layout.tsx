import type { Metadata } from 'next'
import { Playfair_Display, DM_Sans, Cairo, Source_Serif_4 } from 'next/font/google'
import { LanguageProvider } from '@/i18n/LanguageContext'
import { OrderSelectionProvider } from '@/context/OrderSelectionContext'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import Header from '@/components/Header'
import SiteBackground from '@/components/SiteBackground'
import NovaIntro from '@/components/NovaIntro'
import StickyWhatsApp from '@/components/StickyWhatsApp'
import './globals.css'

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  weight: ['300', '400', '500'],
})

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  variable: '--font-cairo',
  weight: ['300', '400', '500', '600'],
})

// The Nova seal's own type voice — provenance-mark serif, kept separate
// from --font-display (Playfair) so the seal reads as a stamp, not a
// heading. Loads both romans and true italics (no synthesized oblique).
const sourceSerif = Source_Serif_4({
  subsets: ['latin'],
  variable: '--font-source-serif',
  weight: ['400'],
  style: ['normal', 'italic'],
})

export const metadata: Metadata = {
  title: 'Nova — Art, Chosen With Intention',
  description:
    'Curated canvas wall art for Moroccan homes. International pieces sourced with care, shipped across Morocco, cash on delivery.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="fr"
      dir="ltr"
      className={`${playfair.variable} ${dmSans.variable} ${cairo.variable} ${sourceSerif.variable}`}
    >
      <body className="bg-parchment text-charcoal">
        <LanguageProvider>
          <OrderSelectionProvider>
            {/* The homepage below isn't mounted at all until the intro video
                has actually played (or been skipped) — see NovaIntro.tsx. */}
            <NovaIntro>
              <SiteBackground />
              <Header />
              <LanguageSwitcher />
              <StickyWhatsApp />
              {children}
            </NovaIntro>
          </OrderSelectionProvider>
        </LanguageProvider>
      </body>
    </html>
  )
}
