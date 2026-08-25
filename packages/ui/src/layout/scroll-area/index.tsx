import { ScrollArea as ScrollAreaPrimitive } from '@base-ui/react/scroll-area'

import { cn } from '#ui/class-name'

function ScrollArea({
  className,
  children,
  viewportProps,
  scrollbarProps,
  thumbProps,
  cornerProps,
  ...props
}: ScrollAreaPrimitive.Root.Props & {
  viewportProps?: ScrollAreaPrimitive.Viewport.Props
  scrollbarProps?: ScrollAreaPrimitive.Scrollbar.Props
  thumbProps?: ScrollAreaPrimitive.Thumb.Props
  cornerProps?: ScrollAreaPrimitive.Corner.Props
}) {
  const { className: viewportClassName, ...viewportRest } = viewportProps ?? {}
  return (
    <ScrollAreaPrimitive.Root
      data-slot="scroll-area"
      className={cn('relative', className)}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport
        data-slot="scroll-area-viewport"
        className={cn(
          'size-full rounded-[inherit] transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1',
          viewportClassName,
        )}
        {...viewportRest}
      >
        {children}
      </ScrollAreaPrimitive.Viewport>
      <ScrollBar thumbProps={thumbProps} {...scrollbarProps} />
      <ScrollAreaPrimitive.Corner data-slot="scroll-area-corner" {...cornerProps} />
    </ScrollAreaPrimitive.Root>
  )
}

function ScrollBar({
  className,
  orientation = 'vertical',
  thumbProps,
  ...props
}: ScrollAreaPrimitive.Scrollbar.Props & {
  thumbProps?: ScrollAreaPrimitive.Thumb.Props
}) {
  const { className: thumbClassName, ...thumbRest } = thumbProps ?? {}
  return (
    <ScrollAreaPrimitive.Scrollbar
      data-slot="scroll-area-scrollbar"
      data-orientation={orientation}
      orientation={orientation}
      className={cn(
        'flex touch-none p-px transition-colors select-none data-horizontal:h-2.5 data-horizontal:flex-col data-horizontal:border-t data-horizontal:border-t-transparent data-vertical:h-full data-vertical:w-2.5 data-vertical:border-l data-vertical:border-l-transparent',
        className,
      )}
      {...props}
    >
      <ScrollAreaPrimitive.Thumb
        data-slot="scroll-area-thumb"
        className={cn('relative flex-1 rounded-full bg-border', thumbClassName)}
        {...thumbRest}
      />
    </ScrollAreaPrimitive.Scrollbar>
  )
}

export { ScrollArea, ScrollBar }
