import { useEffect, useState } from 'react'

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

/** One turn step of `--animate-astrale-turn` (`tailwind.css`). */
const TURN_STEP_MS = 900

/** A wait this early in the page's life is not perceived as one: the loader stays transparent. */
const LOADER_HOLD_MS = 400

/**
 * Whether a loader shows yet. The hold runs on the page clock, not per mount, so a loader that
 * replaces another past it shows at once instead of fading in again.
 */
function useLoaderShown(): boolean {
  const [shown, setShown] = useState(() => performance.now() >= LOADER_HOLD_MS)
  useEffect(() => {
    if (shown) return
    const timer = setTimeout(() => setShown(true), LOADER_HOLD_MS - performance.now())
    return () => clearTimeout(timer)
  }, [shown])
  return shown
}

/**
 * The Astrale loader: the symbol turning a third at a time, in the muted text color. `label` names
 * the wait for screen readers only. It pivots about the symbol's centre, not its box, so each rest
 * of its threefold symmetry lands on the same pose; reduced motion pulses it instead.
 *
 * One wait often replaces another (a route, then its page, then a section). Every loader joins the
 * turn at the page clock's phase and shares one 400ms hold, transparent but still announced, so a
 * replacement carries on mid-step instead of snapping back to 0deg or fading in again.
 */
function AstraleLoader({
  label = 'Loading',
  className,
  ...props
}: Omit<React.ComponentProps<'span'>, 'children' | 'role'> & { label?: string }) {
  const [phase] = useState(() => performance.now() % TURN_STEP_MS)
  const shown = useLoaderShown()
  return (
    <span
      data-slot="astrale-loader"
      role="status"
      className={cn('inline-flex items-center justify-center', className)}
      {...props}
    >
      <span className={cn('inline-flex transition-opacity duration-200', !shown && 'opacity-0')}>
        <AstraleMark
          aria-hidden
          style={{ animationDelay: `-${Math.round(phase)}ms` }}
          className="size-8 origin-[50%_54.5%] text-muted-foreground motion-safe:animate-astrale-turn motion-reduce:animate-pulse"
        />
      </span>
      <span className="sr-only">{label}</span>
    </span>
  )
}

export { brandColors, type BrandColor } from './geometry.js'
export { AstraleLoader, AstraleLogo, AstraleMark, AstraleWordmark }
