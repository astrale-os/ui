import { useState } from 'react'

import { carouselItems } from './carousel.fixture.js'
import { VerticalCarousel } from './vertical-controlled.js'

export const preview = { canvas: 'wide' } as const

export default function VerticalCarouselPreview() {
  const [active, setActive] = useState(0)
  return <VerticalCarousel items={carouselItems} active={active} onActiveChange={setActive} />
}
