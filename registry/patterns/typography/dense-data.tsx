import { cn } from '@astrale-os/ui/class-name'
export function TypographyDenseData({
  className,
  style,
  title,
  summary,
  children,
}: {
  className?: string
  style?: React.CSSProperties

  title: string
  summary?: string
  children: React.ReactNode
}) {
  return (
    <section
      data-slot="pattern-typography-dense-data"
      style={style}
      className={cn('font-mono text-xs tabular-nums', className)}
    >
      <header
        data-slot="patterns-typography-dense-data-header"
        className="mb-3 flex items-end justify-between gap-4"
      >
        <h2
          data-slot="patterns-typography-dense-data-h2"
          className="font-sans text-lg font-semibold"
        >
          {title}
        </h2>
        {summary && (
          <p data-slot="patterns-typography-dense-data-p" className="text-muted-foreground">
            {summary}
          </p>
        )}
      </header>
      <div data-slot="patterns-typography-dense-data-div" className="overflow-auto leading-5">
        {children}
      </div>
    </section>
  )
}
