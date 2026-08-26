import { DashboardAnalytics } from './analytics.js'
import { dashboardMetrics } from './dashboard.fixture.js'

export default function DashboardAnalyticsPreview() {
  return (
    <DashboardAnalytics
      metrics={dashboardMetrics}
      onRefresh={() => undefined}
      onMetric={() => undefined}
    />
  )
}
