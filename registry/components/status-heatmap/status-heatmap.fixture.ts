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

// Thirty days of API history (2026-08-01 through 2026-08-30): two separated incident intervals
// followed by an explicit recovered interval.
// First incident: 2026-08-07 through 2026-08-10 (days 6-9).
// Second incident: 2026-08-17 through 2026-08-20 (days 16-19), ending Critical on 2026-08-20.
// Recovered interval: 2026-08-21 through 2026-08-30 (days 20-29), leaving 22 healthy days.
const incidentDegradedDays = new Set([6, 9, 16, 17])
const incidentCriticalDays = new Set([7, 8, 18, 19])

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
