'use client'

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { translations, type Lang } from './translations'

type TranslationSet = (typeof translations)[Lang]

interface LanguageContextValue {
  lang: Lang
  setLang: (l: Lang) => void
  t: TranslationSet
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: 'fr',
  setLang: () => {},
  t: translations.fr,
})

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('fr')

  const setLang = (l: Lang) => {
    setLangState(l)
    try { localStorage.setItem('nova-lang', l) } catch {}
  }

  useEffect(() => {
    try {
      const saved = localStorage.getItem('nova-lang') as Lang | null
      if (saved && saved in translations) setLangState(saved)
    } catch {}
  }, [])

  useEffect(() => {
    const root = document.documentElement
    root.lang = lang
    root.dir  = lang === 'ar' ? 'rtl' : 'ltr'
  }, [lang])

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: translations[lang] }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}
