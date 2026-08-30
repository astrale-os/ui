import type { ScheduleDefinition } from './schedule-editor/schedule-editor.js'

export const scheduleZones: readonly string[] = [
  'UTC',
  'America/New_York',
  'Europe/Paris',
  'Asia/Tokyo',
]

export const weeklyDigestSchedule: Partial<ScheduleDefinition> = {
  schedule_type: 'weekly',
  repeat_every: 1,
  days_of_week: ['Mon', 'Wed', 'Fri'],
  time_of_day: '09:00',
  timezone: 'Europe/Paris',
  end_condition: 'never',
}

export const incompleteWeeklySchedule: Partial<ScheduleDefinition> = {
  schedule_type: 'weekly',
  repeat_every: 2,
  days_of_week: [],
  time_of_day: '07:30',
  timezone: 'America/New_York',
  end_condition: 'after_occurrences',
  max_occurrences: 12,
}
