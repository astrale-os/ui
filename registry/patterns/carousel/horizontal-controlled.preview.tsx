import { useState } from 'react'

import { carouselItems } from './carousel.fixture.js'
import { HorizontalCarousel } from './horizontal-controlled.js'

export const preview = { canvas: 'wide' } as const

export default function HorizontalCarouselPreview() {
  const [active, setActive] = useState(0)
  return (
    <HorizontalCarousel
      items={carouselItems.map((item) => ({ id: item.id, content: item.description }))}
      active={active}
      onActiveChange={setActive}
    />
  )
}
