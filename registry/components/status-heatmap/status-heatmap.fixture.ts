import type { StatusActivity } from './status-heatmap.js'

const degradedDays = new Set([12, 31, 32, 55, 78])
const criticalDays = new Set([33, 66])
const missingDays = new Set([5, 6])

export const statusHeatmapActivity: StatusActivity[] = Array.from({ length: 90 }, (_, day) => {
  const date = new Date(Date.UTC(2026, 4, 1))
  date.setUTCDate(date.getUTCDate() + day)
  return {
    date: date.toISOString().slice(0, 10),
    value: missingDays.has(day) ? 0 : criticalDays.has(day) ? 1 : degradedDays.has(day) ? 2 : 3,
  }
})

// Thirty days of API history: two separated incident intervals followed by a recovered interval.
// Days 6-9 and 17-19 are incidents; days 20-29 are the explicit recovered run.
const incidentDegradedDays = new Set([6, 9, 17, 19])
const incidentCriticalDays = new Set([7, 8, 18])

export const statusHeatmapIncidentRecoveryActivity: StatusActivity[] = Array.from(
  { length: 30 },
  (_, day) => {
    const date = new Date(Date.UTC(2026, 7, 1))
    date.setUTCDate(date.getUTCDate() + day)
    return {
      date: date.toISOString().slice(0, 10),
      value: incidentCriticalDays.has(day) ? 1 : incidentDegradedDays.has(day) ? 2 : 3,
    }
  },
)
