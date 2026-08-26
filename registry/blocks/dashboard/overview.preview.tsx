import { dashboardMetrics } from './dashboard.fixture.js'
import { DashboardOverview } from './overview.js'

export default function DashboardOverviewPreview() {
  return (
    <DashboardOverview
      metrics={dashboardMetrics}
      onRefresh={() => undefined}
      onMetric={() => undefined}
    />
  )
}
