import type { AppStatusData } from './status-monitor.js'

const start = Date.UTC(2026, 4, 1)
const warnings = new Set([18, 41, 57, 76])
const errors = new Set([63, 84])

export const statusMonitorActivity: AppStatusData[] = Array.from({ length: 90 }, (_, index) => {
  const timestamp = new Date(start + index * 86_400_000)
  if (errors.has(index)) {
    return {
      status: 'error',
      timestamp,
      info: 'API requests failed while traffic shifted to the recovery pool.',
    }
  }
  if (warnings.has(index)) {
    return {
      status: 'warning',
      timestamp,
      info: 'Elevated latency affected a subset of requests.',
    }
  }
  return { status: 'normal', timestamp }
})
