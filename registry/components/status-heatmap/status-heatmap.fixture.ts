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
