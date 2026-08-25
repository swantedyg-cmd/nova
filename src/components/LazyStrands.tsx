'use client'

import dynamic from 'next/dynamic'

const Strands = dynamic(() => import('./Strands'), { ssr: false })

type StrandsProps = React.ComponentProps<typeof Strands>

export default function LazyStrands(props: StrandsProps) {
  return <Strands {...props} />
}
