import { Button } from '@astrale-os/ui/button'

export type CarouselItem = { id: string; content: React.ReactNode }
export type HorizontalCarouselProps = {
  items: readonly CarouselItem[]
  active: number
  onActiveChange(index: number): void
}
export function HorizontalCarousel({
  className,
  style,
  items,
  active,
  onActiveChange,
}: HorizontalCarouselProps & { className?: string; style?: React.CSSProperties }) {
  const select = (index: number) => onActiveChange(Math.max(0, Math.min(items.length - 1, index)))
  return (
    <section
      data-slot="pattern-carousel-horizontal-controlled"
      style={style}
      aria-roledescription="carousel"
      aria-label="Featured content"
      className={className}
    >
      <div data-slot="patterns-carousel-horizontal-controlled-div" aria-live="polite">
        {items.map((item, index) => (
          <article
            data-slot="patterns-carousel-horizontal-controlled-article"
            key={item.id}
            aria-roledescription="slide"
            aria-label={`${index + 1} of ${items.length}`}
            hidden={index !== active}
          >
            {item.content}
          </article>
        ))}
      </div>
      <div data-slot="patterns-carousel-horizontal-controlled-div" className="mt-3 flex gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={active === 0}
          onClick={() => select(active - 1)}
        >
          Previous
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={active >= items.length - 1}
          onClick={() => select(active + 1)}
        >
          Next
        </Button>
      </div>
    </section>
  )
}
