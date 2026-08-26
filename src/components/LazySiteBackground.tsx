'use client'

import dynamic from 'next/dynamic'

const SiteBackground = dynamic(() => import('./SiteBackground'), { ssr: false })

export default function LazySiteBackground() {
  return <SiteBackground />
}
