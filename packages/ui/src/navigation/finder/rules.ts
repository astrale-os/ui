import type { FinderOperator, FinderProperty, FinderRule, FinderValueKind } from './source.js'

/** The operators each value kind offers, in menu order. */
export const FINDER_OPERATORS: Readonly<Record<FinderValueKind, readonly FinderOperator[]>> = {
  text: ['startsWith', 'is', 'isOneOf', 'between', 'isSet'],
  number: ['is', 'between', 'isSet'],
  instant: ['between', 'is', 'isSet'],
  boolean: ['is'],
  choice: ['isOneOf'],
}

/** Relative ranges an instant `between` rule offers, ending now. */
export type FinderInstantPreset = 'last24Hours' | 'last7Days' | 'last30Days'

const PRESET_MILLISECONDS: Readonly<Record<FinderInstantPreset, number>> = {
  last24Hours: 24 * 3_600_000,
  last7Days: 7 * 86_400_000,
  last30Days: 30 * 86_400_000,
}

export const FINDER_INSTANT_PRESETS = Object.keys(PRESET_MILLISECONDS) as FinderInstantPreset[]

/**
 * A rule as the user edits it: raw field text, read into a `FinderRule` once it is complete. For
 * an instant, `text`, `from` and `to` are calendar days (`YYYY-MM-DD`) in the user's time zone.
 */
export interface FinderRuleDraft {
  readonly id: string
  readonly property: string
  readonly operator: FinderOperator
  readonly text: string
  readonly values: readonly string[]
  readonly from: string
  readonly to: string
  readonly preset?: FinderInstantPreset
}

export function draftFor(id: string, property: FinderProperty): FinderRuleDraft {
  const operator = FINDER_OPERATORS[property.kind][0] ?? 'isSet'
  return { id, property: property.key, operator, text: '', values: [], from: '', to: '' }
}

function dayStart(day: string): string | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/u.exec(day)
  if (!match) return undefined
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString()
}

function dayEnd(day: string): string | undefined {
  const start = dayStart(day)
  if (start === undefined) return undefined
  const date = new Date(start)
  date.setDate(date.getDate() + 1)
  return new Date(date.getTime() - 1).toISOString()
}

function numberOf(text: string): number | undefined {
  const trimmed = text.trim()
  if (trimmed === '') return undefined
  const value = Number(trimmed)
  return Number.isFinite(value) ? value : undefined
}

function splitValues(text: string): string[] {
  return [
    ...new Set(
      text
        .split(',')
        .map((value) => value.trim())
        .filter((value) => value !== ''),
    ),
  ]
}

/** The rule a draft states, or `undefined` while it is incomplete. */
export function ruleOf(
  draft: FinderRuleDraft,
  property: FinderProperty,
  now: () => number = Date.now,
): FinderRule | undefined {
  const key = property.key
  const kind = property.kind
  switch (draft.operator) {
    case 'isSet':
      return { property: key, operator: 'isSet' }
    case 'startsWith':
      return draft.text === ''
        ? undefined
        : { property: key, operator: 'startsWith', value: draft.text }
    case 'isOneOf': {
      const values = kind === 'choice' ? [...new Set(draft.values)] : splitValues(draft.text)
      return values.length === 0 ? undefined : { property: key, operator: 'isOneOf', values }
    }
    case 'is': {
      if (kind === 'boolean') {
        if (draft.text !== 'true' && draft.text !== 'false') return undefined
        return { property: key, operator: 'is', value: draft.text === 'true' }
      }
      if (kind === 'number') {
        const value = numberOf(draft.text)
        return value === undefined ? undefined : { property: key, operator: 'is', value }
      }
      if (kind === 'instant') {
        // A day is a range of instants: "is 2026-11-24" keeps that whole day.
        const from = dayStart(draft.text)
        const to = dayEnd(draft.text)
        return from === undefined || to === undefined
          ? undefined
          : { property: key, operator: 'between', from, to }
      }
      return draft.text === '' ? undefined : { property: key, operator: 'is', value: draft.text }
    }
    case 'between': {
      if (kind === 'instant') {
        if (draft.preset !== undefined) {
          const end = now()
          return {
            property: key,
            operator: 'between',
            from: new Date(end - PRESET_MILLISECONDS[draft.preset]).toISOString(),
          }
        }
        const from = draft.from === '' ? undefined : dayStart(draft.from)
        const to = draft.to === '' ? undefined : dayEnd(draft.to)
        if ((draft.from !== '' && from === undefined) || (draft.to !== '' && to === undefined)) {
          return undefined
        }
        return bounded(key, from, to)
      }
      if (kind === 'number') {
        const from = numberOf(draft.from)
        const to = numberOf(draft.to)
        if (
          (draft.from.trim() !== '' && from === undefined) ||
          (draft.to.trim() !== '' && to === undefined)
        ) {
          return undefined
        }
        return bounded(key, from, to)
      }
      return bounded(
        key,
        draft.from === '' ? undefined : draft.from,
        draft.to === '' ? undefined : draft.to,
      )
    }
  }
}

function bounded(
  property: string,
  from: string | number | undefined,
  to: string | number | undefined,
): FinderRule | undefined {
  if (from === undefined && to === undefined) return undefined
  return {
    property,
    operator: 'between',
    ...(from === undefined ? {} : { from }),
    ...(to === undefined ? {} : { to }),
  }
}
