export type BarDatum = { label: string; value: number }
export function ChartBarBasic({
  className,
  style,
  data,
  label = 'Comparison',
  format = String,
}: {
  className?: string
  style?: React.CSSProperties

  data: readonly BarDatum[]
  label?: string
  format?(value: number): string
}) {
  const max = Math.max(1, ...data.map((point) => point.value))
  return (
    <figure
      data-slot="pattern-chart-bar-basic"
      style={style}
      aria-label={label}
      className={className}
    >
      <div data-slot="patterns-chart-bar-basic-div" className="grid gap-2">
        {data.map((point) => (
          <div
            data-slot="patterns-chart-bar-basic-div"
            key={point.label}
            className="grid grid-cols-[8rem_1fr_auto] items-center gap-2"
          >
            <span data-slot="patterns-chart-bar-basic-span">{point.label}</span>
            <span
              data-slot="patterns-chart-bar-basic-span"
              aria-hidden
              className="h-3 rounded-full bg-chart-2"
              style={{ width: `${(point.value / max) * 100}%` }}
            />
            <span data-slot="patterns-chart-bar-basic-span">{format(point.value)}</span>
          </div>
        ))}
      </div>
      <figcaption data-slot="patterns-chart-bar-basic-figcaption" className="sr-only">
        {label}; values are also written beside every bar.
      </figcaption>
    </figure>
  )
}
