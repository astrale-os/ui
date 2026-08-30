import { statusMonitorActivity } from './observability.fixture.js'
import StatusMonitor from './status-monitor.js'

export default function StatusMonitorPreview() {
  return (
    <StatusMonitor
      statuses={statusMonitorActivity}
      title="API availability"
      className="max-w-3xl"
    />
  )
}

export const preview = {
  canvas: 'wide' as const,
  source: 'https://ui.8starlabs.com/r/status-monitor.json',
}
