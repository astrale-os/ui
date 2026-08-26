export type LineDatum = { label: string; value: number }
export function ChartLineBasic({
  className,
  style,
  data,
  label = 'Trend',
}: {
  className?: string
  style?: React.CSSProperties
  data: readonly LineDatum[]
  label?: string
}) {
  const max = Math.max(1, ...data.map((point) => point.value))
  const points = data
    .map(
      (point, index) =>
        `${(index / Math.max(1, data.length - 1)) * 100},${100 - (point.value / max) * 90}`,
    )
    .join(' ')
  return (
    <figure
      data-slot="pattern-chart-line-basic"
      style={style}
      aria-label={label}
      className={className}
    >
      <svg
        data-slot="patterns-chart-line-basic-svg"
        role="img"
        aria-label={label}
        viewBox="0 0 100 100"
        className="h-48 w-full"
      >
        <polyline
          data-slot="patterns-chart-line-basic-polyline"
          points={points}
          fill="none"
          stroke="var(--color-chart-1, var(--ui-chart-1))"
          strokeWidth="3"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <figcaption data-slot="patterns-chart-line-basic-figcaption">
        <table data-slot="patterns-chart-line-basic-table" className="sr-only">
          <caption data-slot="patterns-chart-line-basic-caption">{label} data</caption>
          <tbody data-slot="patterns-chart-line-basic-tbody">
            {data.map((point) => (
              <tr data-slot="patterns-chart-line-basic-tr" key={point.label}>
                <th data-slot="patterns-chart-line-basic-th">{point.label}</th>
                <td data-slot="patterns-chart-line-basic-td">{point.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </figcaption>
    </figure>
  )
}
