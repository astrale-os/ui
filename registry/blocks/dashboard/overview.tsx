import { Button } from '@astrale-os/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@astrale-os/ui/card'
export function DashboardOverview({
  className,
  style,
  metrics,
  loading,
  error,
  onRefresh,
  onMetric,
}: {
  className?: string
  style?: React.CSSProperties

  metrics: readonly { id: string; label: string; value: React.ReactNode; detail?: string }[]
  loading?: boolean
  error?: string
  onRefresh(): void
  onMetric(id: string): void
}) {
  return (
    <section
      data-slot="block-dashboard-overview"
      style={style}
      aria-busy={loading}
      className={className}
    >
      <header
        data-slot="blocks-dashboard-overview-header"
        className="flex items-center justify-between"
      >
        <h1 data-slot="blocks-dashboard-overview-h1" className="font-heading text-3xl">
          Overview
        </h1>
        <Button variant="outline" onClick={onRefresh} disabled={loading}>
          Refresh
        </Button>
      </header>
      {error && (
        <p data-slot="blocks-dashboard-overview-p" role="alert">
          {error}
        </p>
      )}
      <div data-slot="blocks-dashboard-overview-div" className="mt-5 grid gap-4 md:grid-cols-3">
        {metrics.map((metric) => (
          <Card key={metric.id}>
            <CardHeader>
              <CardTitle className="text-sm">{metric.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                variant="ghost"
                className="h-auto p-0 text-3xl"
                onClick={() => onMetric(metric.id)}
              >
                {metric.value}
              </Button>
              {metric.detail && (
                <p data-slot="blocks-dashboard-overview-p" className="text-muted-foreground">
                  {metric.detail}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
