import { Card, CardContent } from '@astrale-os/ui/card'

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from './carousel.js'

export const preview = { canvas: 'wide', source: '@shadcn/carousel' } as const

export default function CarouselPreview() {
  return (
    <Carousel aria-label="Component families">
      <CarouselContent>
        {['Components', 'Patterns', 'Blocks'].map((label) => (
          <CarouselItem key={label}>
            <Card size="sm">
              <CardContent>{label}</CardContent>
            </Card>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  )
}
