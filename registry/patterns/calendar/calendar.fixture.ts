export const calendarDays = Array.from({ length: 21 }, (_, index) => ({
  iso: `2026-09-${String(index + 1).padStart(2, '0')}`,
  label: String(index + 1),
}))
