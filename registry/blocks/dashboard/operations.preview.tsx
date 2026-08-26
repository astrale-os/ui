import { dashboardMetrics } from './dashboard.fixture.js'
import { DashboardOperations } from './operations.js'

export default function DashboardOperationsPreview() {
  return (
    <DashboardOperations
      metrics={dashboardMetrics}
      onRefresh={() => undefined}
      onMetric={() => undefined}
    />
  )
}
