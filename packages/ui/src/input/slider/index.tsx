import { Slider as SliderPrimitive } from '@base-ui/react/slider'

import { cn } from '#astrale-ui/class-name'

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  controlProps,
  trackProps,
  indicatorProps,
  thumbProps,
  ...props
}: SliderPrimitive.Root.Props & {
  controlProps?: SliderPrimitive.Control.Props
  trackProps?: SliderPrimitive.Track.Props
  indicatorProps?: SliderPrimitive.Indicator.Props
  thumbProps?: SliderPrimitive.Thumb.Props | ((index: number) => SliderPrimitive.Thumb.Props)
}) {
  const _values = Array.isArray(value)
    ? value
    : Array.isArray(defaultValue)
      ? defaultValue
      : [min, max]
  const { className: controlClassName, ...controlRest } = controlProps ?? {}
  const { className: trackClassName, ...trackRest } = trackProps ?? {}
  const { className: indicatorClassName, ...indicatorRest } = indicatorProps ?? {}

  return (
    <SliderPrimitive.Root
      className={cn('data-horizontal:w-full data-vertical:h-full', className)}
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      thumbAlignment="edge"
      {...props}
    >
      <SliderPrimitive.Control
        data-slot="slider-control"
        className={cn(
          'relative flex w-full touch-none items-center select-none data-disabled:opacity-50 data-vertical:h-full data-vertical:min-h-40 data-vertical:w-auto data-vertical:flex-col',
          controlClassName,
        )}
        {...controlRest}
      >
        <SliderPrimitive.Track
          data-slot="slider-track"
          className={cn(
            'relative grow overflow-hidden rounded-full bg-muted select-none data-horizontal:h-1 data-horizontal:w-full data-vertical:h-full data-vertical:w-1',
            trackClassName,
          )}
          {...trackRest}
        >
          <SliderPrimitive.Indicator
            data-slot="slider-range"
            className={cn(
              'bg-primary select-none data-horizontal:h-full data-vertical:w-full',
              indicatorClassName,
            )}
            {...indicatorRest}
          />
        </SliderPrimitive.Track>
        {Array.from({ length: _values.length }, (_, index) => {
          const resolvedThumbProps =
            typeof thumbProps === 'function' ? thumbProps(index) : thumbProps
          const { className: thumbClassName, ...thumbRest } = resolvedThumbProps ?? {}
          return (
            <SliderPrimitive.Thumb
              data-slot="slider-thumb"
              key={index}
              className={cn(
                'relative block size-3 shrink-0 rounded-full border border-ring bg-white ring-ring/50 transition-[color,box-shadow] select-none after:absolute after:-inset-2 hover:ring-3 focus-visible:ring-3 focus-visible:outline-hidden active:ring-3 disabled:pointer-events-none disabled:opacity-50',
                thumbClassName,
              )}
              {...thumbRest}
            />
          )
        })}
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  )
}

export { Slider }
