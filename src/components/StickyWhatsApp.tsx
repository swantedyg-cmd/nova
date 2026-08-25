'use client'

import { useLanguage } from '@/i18n/LanguageContext'

const PHONE_INTL = '212710260501'

export default function StickyWhatsApp() {
  const { t, lang } = useLanguage()
  const isRTL = lang === 'ar'

  return (
    <a
      href={`https://wa.me/${PHONE_INTL}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t.whatsapp.ariaLabel}
      className={`
        fixed bottom-5 z-50 flex h-14 w-14 items-center justify-center rounded-full
        shadow-lg transition-transform duration-200 ease-out
        hover:scale-105 active:scale-95
        ${isRTL ? 'left-5' : 'right-5'}
      `}
      style={{ backgroundColor: '#25D366' }}
    >
      <span
        className="absolute inset-0 rounded-full animate-ping"
        style={{ backgroundColor: '#25D366', opacity: 0.35 }}
        aria-hidden="true"
      />
      <svg viewBox="0 0 32 32" width="30" height="30" fill="#FFFFFF" aria-hidden="true" className="relative">
        <path d="M16.004 3C9.06 3 3.42 8.64 3.42 15.58c0 2.29.61 4.44 1.67 6.3L3 29l7.3-2.05a12.5 12.5 0 0 0 5.7 1.38h.005c6.94 0 12.58-5.64 12.58-12.58C28.585 8.81 22.945 3 16.004 3Zm0 22.9h-.004a10.4 10.4 0 0 1-5.3-1.45l-.38-.22-4.33 1.22 1.24-4.22-.25-.4a10.34 10.34 0 0 1-1.6-5.55C5.384 9.77 10.16 5 16.004 5c5.03 0 10.58 4.19 10.58 10.58 0 5.84-4.77 10.32-10.58 10.32Zm5.79-7.73c-.32-.16-1.87-.92-2.16-1.03-.29-.11-.5-.16-.71.16-.21.32-.81 1.03-1 1.24-.18.21-.37.24-.68.08-.32-.16-1.34-.49-2.55-1.57-.94-.84-1.58-1.87-1.76-2.19-.18-.32-.02-.49.14-.65.14-.14.32-.37.48-.55.16-.18.21-.32.32-.53.11-.21.05-.4-.03-.55-.08-.16-.71-1.71-.98-2.34-.26-.62-.52-.54-.71-.55-.18-.01-.4-.01-.61-.01-.21 0-.55.08-.84.4-.29.32-1.1 1.08-1.1 2.62 0 1.55 1.13 3.05 1.28 3.26.16.21 2.22 3.39 5.38 4.76.75.32 1.34.52 1.8.66.76.24 1.44.21 1.99.13.61-.09 1.87-.76 2.13-1.5.26-.74.26-1.37.18-1.5-.08-.13-.29-.21-.61-.37Z" />
      </svg>
    </a>
  )
}
