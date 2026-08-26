'use client'

import dynamic from 'next/dynamic'

const NovaIntro = dynamic(() => import('./NovaIntro'), { ssr: false })

type NovaIntroProps = React.ComponentProps<typeof NovaIntro>

export default function LazyNovaIntro(props: NovaIntroProps) {
  return <NovaIntro {...props} />
}
