import { cn } from '#astrale-ui/class-name'

import { type LockupName, lockups } from './geometry.js'

/*
 * The Astrale logo, drawn in `currentColor` so it takes the text color of the surface it sits on, in
 * every preset and in dark mode. Its geometry and the generated files live in `geometry.ts`.
 *
 * The logo and the Astrale name are trademarks of Astrale. Unlike the rest of this package, they are
 * not licensed under the MIT License.
 */

type BrandProps = Omit<React.ComponentProps<'svg'>, 'children' | 'viewBox'>

function BrandImage({
  lockup,
  slot,
  className,
  ...props
}: BrandProps & { lockup: LockupName; slot: string }) {
  const { width, height, shapes } = lockups[lockup]
  return (
    <svg
      data-slot={slot}
      role="img"
      aria-label="Astrale"
      viewBox={`0 0 ${width} ${height}`}
      fill="currentColor"
      className={className}
      {...props}
    >
      {shapes.map((shape) => (
        <path
          key={shape.transform}
          fillRule={shape.evenOdd ? 'evenodd' : undefined}
          transform={shape.transform}
          d={shape.d}
        />
      ))}
    </svg>
  )
}

function AstraleMark({ className, ...props }: BrandProps) {
  return (
    <BrandImage
      lockup="symbol"
      slot="astrale-mark"
      className={cn('size-6 shrink-0', className)}
      {...props}
    />
  )
}

function AstraleWordmark({ className, ...props }: BrandProps) {
  return (
    <BrandImage
      lockup="wordmark"
      slot="astrale-wordmark"
      className={cn('h-5 w-auto shrink-0', className)}
      {...props}
    />
  )
}

const layoutClassName = { horizontal: 'h-6 w-auto', stacked: 'h-16 w-auto' } as const

/** The symbol with the name: beside it (`horizontal`, the primary lockup) or under it (`stacked`). */
function AstraleLogo({
  layout = 'horizontal',
  className,
  ...props
}: BrandProps & { layout?: keyof typeof layoutClassName }) {
  return (
    <BrandImage
      lockup={layout}
      slot="astrale-logo"
      data-layout={layout}
      className={cn(layoutClassName[layout], 'shrink-0', className)}
      {...props}
    />
  )
}

export { brandColors, type BrandColor } from './geometry.js'
export { AstraleLogo, AstraleMark, AstraleWordmark }
