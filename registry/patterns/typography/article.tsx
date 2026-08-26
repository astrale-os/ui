import { cn } from '@astrale-os/ui/class-name'
export function TypographyArticle({
  className,
  style,
  title,
  byline,
  children,
}: {
  className?: string
  style?: React.CSSProperties

  title: string
  byline?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <article
      data-slot="pattern-typography-article"
      style={style}
      className={cn('mx-auto max-w-[68ch] text-base leading-7', className)}
    >
      <header data-slot="patterns-typography-article-header" className="mb-8 border-b pb-5">
        <h1
          data-slot="patterns-typography-article-h1"
          className="font-heading text-4xl leading-tight tracking-tight"
        >
          {title}
        </h1>
        {byline && (
          <div data-slot="patterns-typography-article-div" className="mt-2 text-muted-foreground">
            {byline}
          </div>
        )}
      </header>
      <div
        data-slot="patterns-typography-article-div"
        className="space-y-5 [&_h2]:font-heading [&_h2]:text-2xl [&_a]:underline"
      >
        {children}
      </div>
    </article>
  )
}
