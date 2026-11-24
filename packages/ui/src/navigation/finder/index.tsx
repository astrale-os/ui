'use client'

import * as React from 'react'

import {
  useFinderController,
  type FinderController,
  type FinderDomainEntry,
  type FinderOptions,
  type FinderPreviewState,
  type FinderRow,
  type FinderTableColumn,
} from './controller.js'
import { formatFinderValue, type FinderValueLabels } from './format.js'
import { FINDER_INSTANT_PRESETS, FINDER_OPERATORS, type FinderRuleDraft } from './rules.js'
import {
  FINDER_ACCEPTED,
  type FinderChoice,
  type FinderClass,
  type FinderImage,
  type FinderOperator,
  type FinderProperty,
} from './source.js'

const FinderContext = React.createContext<FinderController | null>(null)

/** The Finder's state and actions, for parts a host composes itself. */
function useFinder(): FinderController {
  const finder = React.useContext(FinderContext)
  if (!finder) throw new Error('Finder parts must be rendered inside <Finder>.')
  return finder
}

type Placeholder = React.ReactNode | ((retry: () => void) => React.ReactNode)

function placeholder(content: Placeholder | undefined, retry: () => void): React.ReactNode {
  return typeof content === 'function' ? content(retry) : content
}

function Slot({ slot, children }: { slot: string; children: React.ReactNode }) {
  if (children === undefined || children === null || children === false) return null
  return (
    <div role="presentation" data-slot={slot}>
      {children}
    </div>
  )
}

// ── Root ──────────────────────────────────────────────────────────────────────────────────────

function Finder({
  source,
  accepts,
  maximum,
  defaultPlace,
  onPlaceChange,
  onConfirm,
  onCancel,
  theme,
  pageSize,
  countBound,
  ruleDelay,
  onKeyDown,
  children,
  ...props
}: FinderOptions & Omit<React.ComponentProps<'div'>, keyof FinderOptions>) {
  const finder = useFinderController({
    source,
    ...(accepts ? { accepts } : {}),
    ...(maximum === undefined ? {} : { maximum }),
    ...(defaultPlace ? { defaultPlace } : {}),
    ...(onPlaceChange ? { onPlaceChange } : {}),
    onConfirm,
    onCancel,
    ...(theme ? { theme } : {}),
    ...(pageSize === undefined ? {} : { pageSize }),
    ...(countBound === undefined ? {} : { countBound }),
    ...(ruleDelay === undefined ? {} : { ruleDelay }),
  })
  return (
    <FinderContext.Provider value={finder}>
      <div
        data-slot="finder"
        data-maximum-reached={finder.maximumReached ? '' : undefined}
        data-preview={finder.preview ? '' : undefined}
        onKeyDown={(event) => {
          onKeyDown?.(event)
          // A menu or popover a host opens from inside the Finder is portaled out of it: its keys are
          // its own, so Escape there closes the menu and never cancels the Finder.
          const inside = event.target instanceof Node && event.currentTarget.contains(event.target)
          if (!event.defaultPrevented && inside) finder.onRootKeyDown(event)
        }}
        {...props}
      >
        {children}
      </div>
    </FinderContext.Provider>
  )
}

// ── Icons ─────────────────────────────────────────────────────────────────────────────────────

/**
 * An icon as an image: never inlined, so its drawing cannot run script or restyle the page.
 * `fallback` shows when there is none (a Domain's initials, the neutral Class glyph).
 */
function FinderIcon({
  icon,
  fallback,
  ...props
}: Omit<React.ComponentProps<'span'>, 'children'> & {
  icon?: FinderImage
  fallback?: React.ReactNode
}) {
  const theme = React.useContext(FinderContext)?.theme
  if (!icon) {
    return (
      <span data-slot="finder-icon" data-fallback="" aria-hidden="true" {...props}>
        {fallback}
      </span>
    )
  }
  const image =
    theme !== undefined || icon.dark === undefined ? (
      <img
        data-slot="finder-icon-image"
        src={theme === 'dark' && icon.dark ? icon.dark : icon.src}
        alt=""
        draggable={false}
      />
    ) : (
      <picture>
        <source srcSet={icon.dark} media="(prefers-color-scheme: dark)" />
        <img data-slot="finder-icon-image" src={icon.src} alt="" draggable={false} />
      </picture>
    )
  return (
    <span data-slot="finder-icon" aria-hidden="true" {...props}>
      {image}
    </span>
  )
}

// ── Columns ───────────────────────────────────────────────────────────────────────────────────

interface FinderOptionContextValue {
  readonly region: 'domains' | 'classes'
  readonly key: string
  readonly index: number
}

const FinderOptionContext = React.createContext<FinderOptionContextValue | null>(null)

interface FinderListProps<Item> extends Omit<React.ComponentProps<'div'>, 'children'> {
  children: (item: Item) => React.ReactNode
  /** Shown while the first answer is on its way. */
  loading?: React.ReactNode
  /** Shown when the answer is empty. */
  empty?: React.ReactNode
  /** Shown when the read failed; a function receives the retry. */
  error?: Placeholder
}

function useListRegion(region: 'domains' | 'classes') {
  const finder = useFinder()
  const items: readonly { readonly key: string }[] =
    region === 'domains' ? finder.domains.items : finder.classes.items
  const activeKey = finder.active[region]
  const activeIndex =
    activeKey === undefined ? -1 : items.findIndex((item) => item.key === activeKey)
  const selected =
    region === 'domains'
      ? finder.domain
      : finder.selectedClasses.find((key) => items.some((item) => item.key === key))
  return {
    finder,
    items,
    regionProps: {
      role: 'listbox' as const,
      tabIndex: 0,
      'aria-activedescendant': activeIndex >= 0 ? finder.elementId(region, activeIndex) : undefined,
      'aria-multiselectable': region === 'classes' ? true : undefined,
      ref: finder.registerRegion(region),
      onKeyDown: (event: React.KeyboardEvent) => finder.onRegionKeyDown(region, event),
      onFocus: (event: React.FocusEvent) => {
        if (event.target !== event.currentTarget || activeIndex >= 0) return
        const initial = selected ?? items[0]?.key
        if (initial !== undefined) finder.setActive(region, initial)
      },
    },
  }
}

/** The Domains column: a listbox of the Domains, and the accepted row first when there is one. */
function FinderDomains({
  children,
  loading,
  empty,
  error,
  ...props
}: FinderListProps<FinderDomainEntry>) {
  const { finder, regionProps } = useListRegion('domains')
  const { status, items, retry } = finder.domains
  const domains = items.filter((item) => item.kind === 'domain')
  return (
    <div
      data-slot="finder-domains"
      data-status={status}
      aria-busy={status === 'loading' || undefined}
      {...regionProps}
      {...props}
    >
      {items.map((entry, index) => (
        <FinderOptionContext.Provider
          key={entry.key}
          value={{ region: 'domains', key: entry.key, index }}
        >
          {children(entry)}
        </FinderOptionContext.Provider>
      ))}
      {status === 'loading' && domains.length === 0 ? (
        <Slot slot="finder-loading">{loading}</Slot>
      ) : null}
      {status === 'error' ? <Slot slot="finder-error">{placeholder(error, retry)}</Slot> : null}
      {status === 'ready' && items.length === 0 ? <Slot slot="finder-empty">{empty}</Slot> : null}
    </div>
  )
}

/** The Classes column: the open Domain's Classes; ⌘- or Ctrl-click and Space select several. */
function FinderClasses({
  children,
  loading,
  empty,
  error,
  idle,
  ...props
}: FinderListProps<FinderClass> & {
  /** Shown before a Domain is open. */
  idle?: React.ReactNode
}) {
  const { finder, regionProps } = useListRegion('classes')
  const { status, items, retry } = finder.classes
  const state = finder.classes.idle ? 'idle' : status
  return (
    <div
      data-slot="finder-classes"
      data-status={state}
      aria-busy={state === 'loading' || undefined}
      {...regionProps}
      {...props}
    >
      {state === 'idle' ? <Slot slot="finder-idle">{idle}</Slot> : null}
      {state !== 'idle'
        ? items.map((entry, index) => (
            <FinderOptionContext.Provider
              key={entry.key}
              value={{ region: 'classes', key: entry.key, index }}
            >
              {children(entry)}
            </FinderOptionContext.Provider>
          ))
        : null}
      {state === 'loading' && items.length === 0 ? (
        <Slot slot="finder-loading">{loading}</Slot>
      ) : null}
      {state === 'error' ? <Slot slot="finder-error">{placeholder(error, retry)}</Slot> : null}
      {state === 'ready' && items.length === 0 ? <Slot slot="finder-empty">{empty}</Slot> : null}
    </div>
  )
}

/** One row of the Domains or Classes column. */
function FinderOption({ onClick, ...props }: React.ComponentProps<'div'>) {
  const finder = useFinder()
  const option = React.useContext(FinderOptionContext)
  if (!option)
    throw new Error('<FinderOption> must be rendered by <FinderDomains> or <FinderClasses>.')
  const { region, key, index } = option
  const selected =
    region === 'domains' ? finder.domain === key : finder.selectedClasses.includes(key)
  const active = finder.active[region] === key
  return (
    <div
      role="option"
      id={finder.elementId(region, index)}
      aria-selected={selected}
      data-slot="finder-option"
      data-selected={selected ? 'true' : undefined}
      data-active={active ? '' : undefined}
      data-accepted={region === 'domains' && key === FINDER_ACCEPTED ? '' : undefined}
      onClick={(event) => {
        onClick?.(event)
        if (event.defaultPrevented) return
        if (region === 'domains') finder.openDomain(key)
        else finder.selectClass(key, { toggle: event.metaKey || event.ctrlKey || event.shiftKey })
      }}
      {...props}
    />
  )
}

// ── Nodes table ───────────────────────────────────────────────────────────────────────────────

const LOAD_AHEAD_PIXELS = 320

/** The Nodes table: a grid that scrolls, reading the next page near its end. */
function FinderTable({ onScroll, ...props }: React.ComponentProps<'div'>) {
  const finder = useFinder()
  const { table, maximum, count } = finder
  const activeRow = table.rows.find((row) => row.active)
  return (
    <div
      role="grid"
      tabIndex={0}
      data-slot="finder-table"
      data-status={table.status}
      data-stale={table.stale ? '' : undefined}
      aria-busy={table.status === 'loading' || table.loadingMore || undefined}
      aria-multiselectable={maximum > 1 || undefined}
      aria-rowcount={count.value && !count.value.more ? count.value.value + 1 : -1}
      aria-colcount={table.columns.length}
      aria-activedescendant={activeRow?.elementId}
      ref={finder.registerRegion('nodes')}
      onKeyDown={(event) => finder.onRegionKeyDown('nodes', event)}
      onFocus={(event) => {
        if (event.target !== event.currentTarget || activeRow) return
        const first = table.rows[0]
        if (first) finder.setActive('nodes', first.node.id)
      }}
      onScroll={(event) => {
        onScroll?.(event)
        const element = event.currentTarget
        if (element.scrollHeight - element.scrollTop - element.clientHeight < LOAD_AHEAD_PIXELS) {
          table.loadMore()
        }
      }}
      {...props}
    />
  )
}

/** The header row; `children` renders each visible column's header. */
function FinderHeader({
  children,
  ...props
}: Omit<React.ComponentProps<'div'>, 'children'> & {
  children: (column: FinderTableColumn) => React.ReactNode
}) {
  const { table } = useFinder()
  return (
    <div role="row" aria-rowindex={1} data-slot="finder-header" {...props}>
      {table.columns.map((column) => (
        <React.Fragment key={column.key}>{children(column)}</React.Fragment>
      ))}
    </div>
  )
}

/** A column header; a sortable one sorts on click, and reverses on a second click. */
function FinderColumnHeader({
  column,
  children,
  ...props
}: React.ComponentProps<'div'> & { column: FinderTableColumn }) {
  const { table, sortBy } = useFinder()
  const sorted =
    column.property && table.order?.property === column.property.key
      ? table.order.direction
      : undefined
  const label = children ?? column.label
  return (
    <div
      role="columnheader"
      data-slot="finder-column-header"
      data-column={column.kind}
      data-sorted={sorted}
      aria-sort={sorted === 'asc' ? 'ascending' : sorted === 'desc' ? 'descending' : undefined}
      {...props}
    >
      {column.sortable ? (
        <button type="button" data-slot="finder-column-sort" onClick={() => sortBy(column.key)}>
          {label}
        </button>
      ) : (
        label
      )}
    </div>
  )
}

/** The body rows, with the table's loading, empty and error states. */
function FinderRows({
  children,
  idle,
  loading,
  empty,
  error,
  more,
  moreError,
  ...props
}: Omit<React.ComponentProps<'div'>, 'children'> & {
  children: (row: FinderRow) => React.ReactNode
  /** Shown before any Class is selected. */
  idle?: React.ReactNode
  loading?: React.ReactNode
  empty?: React.ReactNode
  error?: Placeholder
  /** Shown below the rows while the next page loads. */
  more?: React.ReactNode
  /** Shown below the rows when the next page failed; a function receives the retry. */
  moreError?: Placeholder
}) {
  const { table } = useFinder()
  const { status, rows } = table
  return (
    <div role="rowgroup" data-slot="finder-rows" {...props}>
      {rows.map((row) => (
        <React.Fragment key={row.node.id}>{children(row)}</React.Fragment>
      ))}
      {status === 'idle' ? <Slot slot="finder-idle">{idle}</Slot> : null}
      {status === 'loading' && rows.length === 0 ? (
        <Slot slot="finder-loading">{loading}</Slot>
      ) : null}
      {status === 'error' ? (
        <Slot slot="finder-error">{placeholder(error, table.retry)}</Slot>
      ) : null}
      {status === 'ready' && rows.length === 0 ? <Slot slot="finder-empty">{empty}</Slot> : null}
      {table.loadingMore ? <Slot slot="finder-more">{more}</Slot> : null}
      {table.moreError !== undefined && !table.loadingMore ? (
        <Slot slot="finder-more-error">{placeholder(moreError, table.loadMore)}</Slot>
      ) : null}
    </div>
  )
}

/** One Node. A click chooses it (or removes it); with a maximum of 1, a double click confirms. */
function FinderNodeRow({
  row,
  onClick,
  onDoubleClick,
  ...props
}: React.ComponentProps<'div'> & { row: FinderRow }) {
  const finder = useFinder()
  return (
    <div
      role="row"
      id={row.elementId}
      aria-rowindex={row.index + 2}
      aria-selected={row.chosen}
      aria-disabled={row.disabled || undefined}
      data-slot="finder-row"
      data-chosen={row.chosen ? '' : undefined}
      data-active={row.active ? '' : undefined}
      data-unnamed={row.unnamed ? '' : undefined}
      data-disabled={row.disabled ? '' : undefined}
      onClick={(event) => {
        onClick?.(event)
        if (event.defaultPrevented) return
        finder.setActive('nodes', row.node.id)
        if (event.detail > 1 || row.disabled) return
        finder.toggleChoice(row.node)
      }}
      onDoubleClick={(event) => {
        onDoubleClick?.(event)
        if (event.defaultPrevented || row.disabled || finder.maximum !== 1) return
        finder.toggleChoice(row.node, { confirmSingle: true })
      }}
      {...props}
    />
  )
}

/** The text a cell shows by default: the name, the Class's name, or the formatted value. */
function finderCellText(
  row: FinderRow,
  column: FinderTableColumn,
  labels?: FinderValueLabels,
): string {
  if (column.kind === 'name') return row.node.name ?? ''
  if (column.kind === 'class') return row.nodeClass?.name ?? row.node.class
  const property = column.property
  return property ? formatFinderValue(row.node.values[property.key], property.kind, labels) : ''
}

function FinderCell({
  row,
  column,
  children,
  ...props
}: React.ComponentProps<'div'> & { row: FinderRow; column: FinderTableColumn }) {
  const text = finderCellText(row, column)
  return (
    <div
      role="gridcell"
      data-slot="finder-cell"
      data-column={column.kind}
      title={text || undefined}
      {...props}
    >
      {children ?? text}
    </div>
  )
}

// ── Rules ─────────────────────────────────────────────────────────────────────────────────────

/** The filter bar: one row per rule, shown once opened (⌘F) or while rules exist. */
function FinderRules({
  children,
  ...props
}: Omit<React.ComponentProps<'div'>, 'children'> & {
  children: (rule: FinderRuleDraft, property: FinderProperty | undefined) => React.ReactNode
}) {
  const finder = useFinder()
  if (!finder.filtersOpen) return null
  const properties = new Map(finder.sharedProperties.map((property) => [property.key, property]))
  return (
    <div role="group" data-slot="finder-rules" ref={finder.registerRegion('filters')} {...props}>
      {finder.rules.map((rule) => (
        <React.Fragment key={rule.id}>
          {children(rule, properties.get(rule.property))}
        </React.Fragment>
      ))}
    </div>
  )
}

function FinderRuleProperty({
  rule,
  ...props
}: Omit<React.ComponentProps<'select'>, 'value' | 'onChange'> & { rule: FinderRuleDraft }) {
  const finder = useFinder()
  return (
    <select
      data-slot="finder-rule-property"
      aria-label="Property"
      value={rule.property}
      onChange={(event) => finder.updateRule(rule.id, { property: event.target.value })}
      {...props}
    >
      {finder.sharedProperties.map((property) => (
        <option key={property.key} value={property.key}>
          {property.label}
        </option>
      ))}
    </select>
  )
}

const OPERATOR_LABELS: Readonly<Record<FinderOperator, string>> = {
  is: 'is',
  isOneOf: 'is one of',
  startsWith: 'starts with',
  between: 'between',
  isSet: 'is set',
}

function FinderRuleOperator({
  rule,
  labels = OPERATOR_LABELS,
  ...props
}: Omit<React.ComponentProps<'select'>, 'value' | 'onChange'> & {
  rule: FinderRuleDraft
  labels?: Readonly<Record<FinderOperator, string>>
}) {
  const finder = useFinder()
  const property = finder.sharedProperties.find((item) => item.key === rule.property)
  const operators = property ? FINDER_OPERATORS[property.kind] : [rule.operator]
  return (
    <select
      data-slot="finder-rule-operator"
      aria-label="Operator"
      value={rule.operator}
      onChange={(event) =>
        finder.updateRule(rule.id, { operator: event.target.value as FinderOperator })
      }
      {...props}
    >
      {operators.map((operator) => (
        <option key={operator} value={operator}>
          {labels[operator]}
        </option>
      ))}
    </select>
  )
}

export interface FinderRuleValueLabels extends FinderValueLabels {
  readonly value: string
  readonly from: string
  readonly to: string
  readonly choose: string
  readonly values: string
  readonly custom: string
  readonly last24Hours: string
  readonly last7Days: string
  readonly last30Days: string
}

const VALUE_LABELS: FinderRuleValueLabels = {
  yes: 'Yes',
  no: 'No',
  value: 'Value',
  from: 'From',
  to: 'To',
  choose: 'Choose…',
  values: 'Values, comma-separated',
  custom: 'Custom range',
  last24Hours: 'Last 24 hours',
  last7Days: 'Last 7 days',
  last30Days: 'Last 30 days',
}

/** The value fields a rule's kind and operator call for: text, number, date, choices, or none. */
function FinderRuleValue({
  rule,
  labels = VALUE_LABELS,
  fieldClassName,
  choiceClassName,
  ...props
}: Omit<React.ComponentProps<'div'>, 'children'> & {
  rule: FinderRuleDraft
  labels?: FinderRuleValueLabels
  /** The class of every input and select the rule shows. */
  fieldClassName?: string
  /** The class of each checkbox label of a `choice` rule. */
  choiceClassName?: string
}) {
  const finder = useFinder()
  const property = finder.sharedProperties.find((item) => item.key === rule.property)
  if (!property || rule.operator === 'isSet') return null
  const update = (patch: Partial<Omit<FinderRuleDraft, 'id'>>) => finder.updateRule(rule.id, patch)
  const inputType =
    property.kind === 'number' ? 'number' : property.kind === 'instant' ? 'date' : 'text'

  let fields: React.ReactNode
  if (property.kind === 'boolean') {
    fields = (
      <select
        data-slot="finder-rule-input"
        className={fieldClassName}
        aria-label={labels.value}
        value={rule.text}
        onChange={(event) => update({ text: event.target.value })}
      >
        <option value="">{labels.choose}</option>
        <option value="true">{labels.yes}</option>
        <option value="false">{labels.no}</option>
      </select>
    )
  } else if (property.kind === 'choice') {
    fields = (property.choices ?? []).map((choice) => (
      <label key={choice} data-slot="finder-rule-choice" className={choiceClassName}>
        <input
          type="checkbox"
          checked={rule.values.includes(choice)}
          onChange={(event) =>
            update({
              values: event.target.checked
                ? [...rule.values, choice]
                : rule.values.filter((value) => value !== choice),
            })
          }
        />
        <span data-slot="finder-rule-choice-label">{choice}</span>
      </label>
    ))
  } else if (rule.operator === 'between') {
    const custom = property.kind !== 'instant' || rule.preset === undefined
    fields = (
      <>
        {property.kind === 'instant' ? (
          <select
            data-slot="finder-rule-preset"
            className={fieldClassName}
            aria-label={labels.custom}
            value={rule.preset ?? ''}
            onChange={(event) => {
              const preset = event.target.value
              update(
                preset === ''
                  ? { preset: undefined }
                  : { preset: preset as (typeof FINDER_INSTANT_PRESETS)[number] },
              )
            }}
          >
            <option value="">{labels.custom}</option>
            {FINDER_INSTANT_PRESETS.map((preset) => (
              <option key={preset} value={preset}>
                {labels[preset]}
              </option>
            ))}
          </select>
        ) : null}
        {custom ? (
          <>
            <input
              data-slot="finder-rule-input"
              className={fieldClassName}
              type={inputType}
              aria-label={labels.from}
              placeholder={labels.from}
              value={rule.from}
              onChange={(event) => update({ from: event.target.value })}
            />
            <input
              data-slot="finder-rule-input"
              className={fieldClassName}
              type={inputType}
              aria-label={labels.to}
              placeholder={labels.to}
              value={rule.to}
              onChange={(event) => update({ to: event.target.value })}
            />
          </>
        ) : null}
      </>
    )
  } else {
    fields = (
      <input
        data-slot="finder-rule-input"
        className={fieldClassName}
        type={rule.operator === 'isOneOf' ? 'text' : inputType}
        aria-label={rule.operator === 'isOneOf' ? labels.values : labels.value}
        placeholder={rule.operator === 'isOneOf' ? labels.values : labels.value}
        value={rule.text}
        onChange={(event) => update({ text: event.target.value })}
      />
    )
  }
  return (
    <div
      data-slot="finder-rule-value"
      data-kind={property.kind}
      data-operator={rule.operator}
      {...props}
    >
      {fields}
    </div>
  )
}

function FinderRuleRemove({
  rule,
  onClick,
  ...props
}: React.ComponentProps<'button'> & { rule: FinderRuleDraft }) {
  const finder = useFinder()
  return (
    <button
      type="button"
      data-slot="finder-rule-remove"
      aria-label="Remove rule"
      onClick={(event) => {
        onClick?.(event)
        if (!event.defaultPrevented) finder.removeRule(rule.id)
      }}
      {...props}
    />
  )
}

function FinderAddRule({ onClick, ...props }: React.ComponentProps<'button'>) {
  const finder = useFinder()
  return (
    <button
      type="button"
      data-slot="finder-add-rule"
      disabled={finder.sharedProperties.length === 0}
      onClick={(event) => {
        onClick?.(event)
        if (!event.defaultPrevented) finder.addRule()
      }}
      {...props}
    />
  )
}

function FinderClearRules({ onClick, ...props }: React.ComponentProps<'button'>) {
  const finder = useFinder()
  return (
    <button
      type="button"
      data-slot="finder-clear-rules"
      onClick={(event) => {
        onClick?.(event)
        if (!event.defaultPrevented) finder.closeFilters()
      }}
      {...props}
    />
  )
}

// ── Preview ───────────────────────────────────────────────────────────────────────────────────

/** The focused Node's readable properties, while the preview is open (Space). */
function FinderPreview({
  children,
  ...props
}: Omit<React.ComponentProps<'div'>, 'children'> & {
  children: (preview: FinderPreviewState) => React.ReactNode
}) {
  const { preview } = useFinder()
  if (!preview) return null
  return (
    <div
      role="region"
      data-slot="finder-preview"
      data-status={preview.status}
      aria-live="polite"
      {...props}
    >
      {children(preview)}
    </div>
  )
}

// ── Path ──────────────────────────────────────────────────────────────────────────────────────

export type FinderPathSegment =
  | { readonly kind: 'accepted'; readonly classes: readonly FinderClass[]; readonly go: () => void }
  | {
      readonly kind: 'domain'
      readonly name: string
      readonly icon?: FinderImage
      readonly go: () => void
    }
  | { readonly kind: 'classes'; readonly classes: readonly FinderClass[]; readonly go: () => void }
  | { readonly kind: 'rules'; readonly count: number; readonly go: () => void }

/** Where the user stands: Domain › Classes › rules, each part a way back; nothing until a Domain opens. */
function FinderPath({
  children,
  ...props
}: Omit<React.ComponentProps<'nav'>, 'children'> & {
  children: (segment: FinderPathSegment, index: number) => React.ReactNode
}) {
  const finder = useFinder()
  const segments: FinderPathSegment[] = []
  const entry = finder.domains.items.find((item) => item.key === finder.domain)
  if (entry?.kind === 'accepted') {
    segments.push({
      kind: 'accepted',
      classes: entry.classes,
      go: () => finder.focusRegion('domains'),
    })
  } else if (entry?.kind === 'domain') {
    segments.push({
      kind: 'domain',
      name: entry.domain.name,
      ...(entry.domain.icon ? { icon: entry.domain.icon } : {}),
      go: () => finder.focusRegion('domains'),
    })
  }
  const classes = finder.selectedClasses
    .map((key) => finder.classOf(key))
    .filter((item) => item !== undefined)
  if (entry && classes.length > 0) {
    segments.push({ kind: 'classes', classes, go: () => finder.focusRegion('classes') })
  }
  if (finder.appliedRules.length > 0) {
    segments.push({
      kind: 'rules',
      count: finder.appliedRules.length,
      go: () => {
        finder.openFilters()
        setTimeout(() => finder.focusRegion('filters'), 0)
      },
    })
  }
  // Nothing is open yet: no empty landmark.
  if (segments.length === 0) return null
  return (
    <nav data-slot="finder-path" aria-label="Location" {...props}>
      {segments.map((segment, index) => (
        <React.Fragment key={segment.kind}>{children(segment, index)}</React.Fragment>
      ))}
    </nav>
  )
}

// ── Tray ──────────────────────────────────────────────────────────────────────────────────────

/** The chosen Nodes, kept across Domains, in the order they were chosen. */
function FinderTray({
  children,
  ...props
}: Omit<React.ComponentProps<'div'>, 'children'> & {
  children: (choice: FinderChoice, nodeClass: FinderClass | undefined) => React.ReactNode
}) {
  const finder = useFinder()
  return (
    <div
      role="list"
      data-slot="finder-tray"
      data-empty={finder.chosen.length === 0 ? '' : undefined}
      {...props}
    >
      {finder.chosen.map((choice) => (
        <React.Fragment key={choice.id}>
          {children(choice, finder.classOf(choice.class))}
        </React.Fragment>
      ))}
    </div>
  )
}

function FinderChip({ choice, ...props }: React.ComponentProps<'div'> & { choice: FinderChoice }) {
  return <div role="listitem" data-slot="finder-chip" title={choice.name} {...props} />
}

function FinderChipRemove({
  choice,
  onClick,
  ...props
}: React.ComponentProps<'button'> & { choice: FinderChoice }) {
  const finder = useFinder()
  return (
    <button
      type="button"
      data-slot="finder-chip-remove"
      aria-label={`Remove ${choice.name}`}
      onClick={(event) => {
        onClick?.(event)
        if (!event.defaultPrevented) finder.remove(choice.id)
      }}
      {...props}
    />
  )
}

function FinderConfirm({ onClick, disabled, ...props }: React.ComponentProps<'button'>) {
  const finder = useFinder()
  const confirming = finder.confirmation.status === 'confirming'
  return (
    <button
      type="button"
      data-slot="finder-confirm"
      data-confirming={confirming ? '' : undefined}
      aria-busy={confirming || undefined}
      disabled={disabled || confirming || finder.chosen.length === 0}
      onClick={(event) => {
        onClick?.(event)
        if (!event.defaultPrevented) finder.confirm()
      }}
      {...props}
    />
  )
}

function FinderCancel({ onClick, ...props }: React.ComponentProps<'button'>) {
  const finder = useFinder()
  return (
    <button
      type="button"
      data-slot="finder-cancel"
      onClick={(event) => {
        onClick?.(event)
        if (!event.defaultPrevented) finder.cancel()
      }}
      {...props}
    />
  )
}

export {
  Finder,
  FinderAddRule,
  FinderCancel,
  FinderCell,
  FinderChip,
  FinderChipRemove,
  FinderClasses,
  FinderClearRules,
  FinderColumnHeader,
  FinderConfirm,
  FinderDomains,
  FinderHeader,
  FinderIcon,
  FinderNodeRow,
  FinderOption,
  FinderPath,
  FinderPreview,
  FinderRows,
  FinderRuleOperator,
  FinderRuleProperty,
  FinderRuleRemove,
  FinderRuleValue,
  FinderRules,
  FinderTable,
  FinderTray,
  finderCellText,
  useFinder,
}
export { FINDER_ACCEPTED } from './source.js'
export type {
  FinderChoice,
  FinderClass,
  FinderCount,
  FinderDomain,
  FinderImage,
  FinderNode,
  FinderNodeDetail,
  FinderOperator,
  FinderOrder,
  FinderPage,
  FinderPlace,
  FinderProperty,
  FinderRange,
  FinderRule,
  FinderSource,
  FinderValueKind,
} from './source.js'
export type {
  FinderConfirmation,
  FinderController,
  FinderCountState,
  FinderDomainEntry,
  FinderList,
  FinderOptions,
  FinderPreviewState,
  FinderReadStatus,
  FinderRegion,
  FinderRow,
  FinderTable as FinderTableState,
  FinderTableColumn,
} from './controller.js'
export { FINDER_INSTANT_PRESETS, FINDER_OPERATORS, ruleOf } from './rules.js'
export type { FinderInstantPreset, FinderRuleDraft } from './rules.js'
export { formatFinderCount, formatFinderValue, initialsOf } from './format.js'
export type { FinderValueLabels } from './format.js'
export { createMemoryFinderSource } from './memory.js'
export type { FinderMemoryClass, FinderMemoryGraph } from './memory.js'
