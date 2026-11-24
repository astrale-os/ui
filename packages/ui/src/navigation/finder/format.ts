import type { FinderValueKind } from './source.js'

/** Up to two initials of a name, for a Domain drawn without an icon. */
export function initialsOf(name: string): string {
  const words = name
    .trim()
    .split(/[\s._-]+/u)
    .filter((word) => word !== '')
  if (words.length === 0) return '?'
  if (words.length === 1) return Array.from(words[0]!).slice(0, 2).join('').toUpperCase()
  return words
    .slice(0, 2)
    .map((word) => Array.from(word)[0] ?? '')
    .join('')
    .toUpperCase()
}

export interface FinderValueLabels {
  readonly yes: string
  readonly no: string
}

const DEFAULT_LABELS: FinderValueLabels = { yes: 'Yes', no: 'No' }

/** One value as text, by its kind. An absent value is the empty string. */
export function formatFinderValue(
  value: unknown,
  kind: FinderValueKind | undefined,
  labels: FinderValueLabels = DEFAULT_LABELS,
): string {
  if (value === undefined || value === null) return ''
  if (Array.isArray(value)) {
    return value.map((item) => formatFinderValue(item, kind, labels)).join(', ')
  }
  if (typeof value === 'boolean') return value ? labels.yes : labels.no
  if (typeof value === 'number') return new Intl.NumberFormat().format(value)
  if (typeof value === 'string') {
    if (kind === 'instant') {
      const date = new Date(value)
      if (!Number.isNaN(date.getTime())) {
        return new Intl.DateTimeFormat(undefined, {
          dateStyle: 'medium',
          timeStyle: 'short',
        }).format(date)
      }
    }
    return value
  }
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

/** "15", or "1,000+" past the bound. */
export function formatFinderCount(count: {
  readonly value: number
  readonly more: boolean
}): string {
  return `${new Intl.NumberFormat().format(count.value)}${count.more ? '+' : ''}`
}
