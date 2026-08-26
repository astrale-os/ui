import { Button } from '@astrale-os/ui/button'
import { cn } from '@astrale-os/ui/class-name'

export type VerticalCarouselProps = {
  items: readonly { id: string; title: string; description?: string }[]
  active: number
  onActiveChange(index: number): void
}
export function VerticalCarousel({
  className,
  style,
  items,
  active,
  onActiveChange,
}: VerticalCarouselProps & { className?: string; style?: React.CSSProperties }) {
  return (
    <section
      data-slot="pattern-carousel-vertical-controlled"
      style={style}
      aria-label="Browse items"
      className={cn('grid gap-3 md:grid-cols-[12rem_1fr]', className)}
    >
      <div
        data-slot="patterns-carousel-vertical-controlled-div"
        role="tablist"
        aria-orientation="vertical"
      >
        {items.map((item, index) => (
          <Button
            key={item.id}
            role="tab"
            aria-selected={index === active}
            variant={index === active ? 'secondary' : 'ghost'}
            className="w-full justify-start"
            onClick={() => onActiveChange(index)}
          >
            {item.title}
          </Button>
        ))}
      </div>
      <article data-slot="patterns-carousel-vertical-controlled-article" role="tabpanel">
        <h3 data-slot="patterns-carousel-vertical-controlled-h3" className="font-semibold">
          {items[active]?.title}
        </h3>
        <p data-slot="patterns-carousel-vertical-controlled-p" className="text-muted-foreground">
          {items[active]?.description}
        </p>
      </article>
    </section>
  )
}
