import { act, cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, test, vi } from 'vitest'

import {
  Finder,
  FinderAddRule,
  FinderCell,
  FinderChip,
  FinderChipRemove,
  FinderClasses,
  FinderColumnHeader,
  FinderConfirm,
  FinderDomains,
  FinderHeader,
  FinderIcon,
  FinderNodeRow,
  FinderOption,
  FinderPath,
  FinderPreview,
  FinderRuleOperator,
  FinderRuleProperty,
  FinderRuleValue,
  FinderRules,
  FinderRows,
  FinderTable,
  FinderTray,
  createMemoryFinderSource,
  formatFinderCount,
  initialsOf,
  ruleOf,
  useFinder,
  type FinderChoice,
  type FinderMemoryGraph,
  type FinderOptions,
  type FinderSource,
} from './index.js'

afterEach(cleanup)

const NAME = 'kernel:class.Named.property.name'
const STATUS = 'product:class.Area.property.status'
const nameProperty = { key: NAME, label: 'Name', kind: 'text' } as const
const statusProperty = {
  key: STATUS,
  label: 'Status',
  kind: 'choice',
  choices: ['open', 'closed'],
} as const

const graph: FinderMemoryGraph = {
  domains: [
    {
      id: 'd-product',
      name: 'Product',
      origin: 'product.astrale.ai',
      icon: { src: 'data:image/svg+xml,p', dark: 'data:image/svg+xml,pd' },
    },
    { id: 'd-issues', name: 'Issues', origin: 'issues.astrale.ai' },
  ],
  classes: {
    'd-kernel': [
      {
        key: 'kernel:class.Named',
        name: 'Named',
        abstract: true,
        properties: [nameProperty],
        nameProperty: NAME,
      },
    ],
    'd-product': [
      {
        key: 'product:class.Product',
        name: 'Product',
        icon: { src: 'data:image/svg+xml,product' },
        extends: ['kernel:class.Named'],
        properties: [nameProperty],
        nameProperty: NAME,
      },
      {
        key: 'product:class.Area',
        name: 'Area',
        description: 'A part of a Product',
        extends: ['kernel:class.Named'],
        properties: [nameProperty, statusProperty],
        nameProperty: NAME,
      },
      { key: 'product:class.Note', name: 'Note', properties: [] },
    ],
    'd-issues': [
      {
        key: 'issues:class.Issue',
        name: 'Issue',
        extends: ['kernel:class.Named'],
        properties: [nameProperty],
        nameProperty: NAME,
      },
    ],
  },
  nodes: [
    { id: 'p1', class: 'product:class.Product', name: 'Shell', values: {} },
    { id: 'p2', class: 'product:class.Product', name: 'Views', values: {} },
    { id: 'a1', class: 'product:class.Area', name: 'Intents', values: { [STATUS]: 'open' } },
    { id: 'a2', class: 'product:class.Area', name: 'Access', values: { [STATUS]: 'closed' } },
    { id: 'a3', class: 'product:class.Area', values: { [STATUS]: 'open' } },
    { id: 'n1', class: 'product:class.Note', values: {} },
    { id: 'i1', class: 'issues:class.Issue', name: 'PRD-87', values: {} },
  ],
}

function Layout() {
  const finder = useFinder()
  return (
    <>
      <FinderDomains
        aria-label="Domains"
        loading="Loading Domains"
        error={(retry) => <button onClick={retry}>Retry Domains</button>}
      >
        {(entry) => (
          <FinderOption>
            {entry.kind === 'accepted' ? 'All accepted' : entry.domain.name}
          </FinderOption>
        )}
      </FinderDomains>
      <FinderClasses aria-label="Classes" empty="Nothing here you can read" idle="Pick a Domain">
        {(item) => <FinderOption>{item.name}</FinderOption>}
      </FinderClasses>
      <FinderAddRule>Add filter</FinderAddRule>
      <FinderRules aria-label="Filters">
        {(rule) => (
          <div>
            <FinderRuleProperty rule={rule} />
            <FinderRuleOperator rule={rule} />
            <FinderRuleValue rule={rule} />
          </div>
        )}
      </FinderRules>
      <output aria-label="Count">
        {finder.count.value ? formatFinderCount(finder.count.value) : ''}
      </output>
      <FinderTable aria-label="Nodes">
        <FinderHeader>{(column) => <FinderColumnHeader column={column} />}</FinderHeader>
        <FinderRows
          idle="Pick a Class"
          empty="No Nodes you can read match these filters"
          error={(retry) => <button onClick={retry}>Retry Nodes</button>}
        >
          {(row) => (
            <FinderNodeRow row={row}>
              {finder.table.columns.map((column) => (
                <FinderCell key={column.key} row={row} column={column}>
                  {column.kind === 'name' && row.unnamed ? 'No name' : undefined}
                </FinderCell>
              ))}
            </FinderNodeRow>
          )}
        </FinderRows>
      </FinderTable>
      <FinderPreview aria-label="Preview">
        {(preview) =>
          preview.detail ? (
            <p>
              {preview.detail.properties
                .map((item) => `${item.label}: ${String(item.value ?? '')}`)
                .join('; ')}
            </p>
          ) : (
            'Loading preview'
          )
        }
      </FinderPreview>
      <FinderPath>
        {(segment) => (
          <button onClick={segment.go}>
            {segment.kind === 'domain'
              ? segment.name
              : segment.kind === 'classes'
                ? segment.classes.map((item) => item.name).join(', ')
                : segment.kind === 'rules'
                  ? `${segment.count} filter`
                  : 'All accepted'}
          </button>
        )}
      </FinderPath>
      <FinderTray aria-label="Chosen">
        {(choice) => (
          <FinderChip choice={choice}>
            {choice.name}
            <FinderChipRemove choice={choice}>×</FinderChipRemove>
          </FinderChip>
        )}
      </FinderTray>
      <FinderConfirm>Select</FinderConfirm>
      <output aria-label="Confirmation">{finder.confirmation.status}</output>
    </>
  )
}

function renderFinder(options: Partial<FinderOptions> & { source?: FinderSource } = {}) {
  const onConfirm = vi.fn<(choices: readonly FinderChoice[]) => void>()
  const onCancel = vi.fn()
  const result = render(
    <Finder
      source={options.source ?? createMemoryFinderSource(graph)}
      onConfirm={onConfirm}
      onCancel={onCancel}
      ruleDelay={0}
      {...options}
    >
      <Layout />
    </Finder>,
  )
  return { ...result, onConfirm, onCancel, user: userEvent.setup() }
}

const domains = () => screen.getByRole('listbox', { name: 'Domains' })
const classes = () => screen.getByRole('listbox', { name: 'Classes' })
const table = () => screen.getByRole('grid', { name: 'Nodes' })
const rowNames = () =>
  within(table())
    .queryAllByRole('row')
    .slice(1)
    .map((row) => within(row).getAllByRole('gridcell')[0]!.textContent)

describe('Finder', () => {
  test('browses Domains › Classes › Nodes, the name first and ascending', async () => {
    const { user } = renderFinder({ maximum: 8 })
    await user.click(await within(domains()).findByRole('option', { name: 'Product' }))
    const option = await within(classes()).findByRole('option', { name: 'Area' })
    expect(within(classes()).queryByRole('option', { name: 'Named' })).toBeNull()
    await user.click(option)
    await waitFor(() => expect(rowNames()).toEqual(['Access', 'Intents', 'No name']))
    expect(screen.getByLabelText('Count')).toHaveTextContent('3')
    const header = within(table()).getAllByRole('columnheader')
    expect(header.map((cell) => cell.textContent)).toEqual(['Name', 'Status'])
    expect(header[0]).toHaveAttribute('aria-sort', 'ascending')
  })

  test('several Classes share one table, with a Class column and only shared properties', async () => {
    const { user } = renderFinder({ maximum: 8 })
    await user.click(await within(domains()).findByRole('option', { name: 'Product' }))
    await user.click(await within(classes()).findByRole('option', { name: 'Product' }))
    await user.keyboard('{Control>}')
    await user.click(within(classes()).getByRole('option', { name: 'Area' }))
    await user.keyboard('{/Control}')
    await waitFor(() =>
      expect(rowNames()).toEqual(['Access', 'Intents', 'Shell', 'Views', 'No name']),
    )
    const header = within(table()).getAllByRole('columnheader')
    expect(header.map((cell) => cell.textContent)).toEqual(['Name', 'Class'])
  })

  test('a rule narrows the Nodes and the path counts it; sorting reverses on a second click', async () => {
    const { user } = renderFinder({ maximum: 8 })
    await user.click(await within(domains()).findByRole('option', { name: 'Product' }))
    await user.click(await within(classes()).findByRole('option', { name: 'Area' }))
    await waitFor(() => expect(rowNames()).toHaveLength(3))
    await user.click(screen.getByRole('button', { name: 'Name' }))
    await waitFor(() => expect(rowNames()).toEqual(['Intents', 'Access', 'No name']))
    await user.click(screen.getByRole('button', { name: 'Add filter' }))
    await user.type(
      within(screen.getByRole('group', { name: 'Filters' })).getByRole('textbox'),
      'Int',
    )
    await waitFor(() => expect(rowNames()).toEqual(['Intents']))
    expect(screen.getByRole('button', { name: '1 filter' })).toBeInTheDocument()
    expect(screen.getByLabelText('Count')).toHaveTextContent('1')
  })

  test('a choice property filters by its closed set', async () => {
    const { user } = renderFinder({ maximum: 8 })
    await user.click(await within(domains()).findByRole('option', { name: 'Product' }))
    await user.click(await within(classes()).findByRole('option', { name: 'Area' }))
    await user.click(screen.getByRole('button', { name: 'Add filter' }))
    const filters = screen.getByRole('group', { name: 'Filters' })
    await user.selectOptions(within(filters).getByRole('combobox', { name: 'Property' }), 'Status')
    expect(within(filters).getByRole('combobox', { name: 'Operator' })).toHaveValue('isOneOf')
    await user.click(within(filters).getByRole('checkbox', { name: 'closed' }))
    await waitFor(() => expect(rowNames()).toEqual(['Access']))
  })

  test('the tray keeps choices across Domains, honors the maximum, and confirms', async () => {
    const { user, onConfirm } = renderFinder({ maximum: 2 })
    await user.click(await within(domains()).findByRole('option', { name: 'Product' }))
    await user.click(await within(classes()).findByRole('option', { name: 'Product' }))
    await user.click(await within(table()).findByRole('row', { name: /Shell/ }))
    await user.click(within(domains()).getByRole('option', { name: 'Issues' }))
    await user.click(await within(table()).findByRole('row', { name: /PRD-87/ }))
    const tray = screen.getByRole('list', { name: 'Chosen' })
    expect(
      within(tray)
        .getAllByRole('listitem')
        .map((item) => item.title),
    ).toEqual(['Shell', 'PRD-87'])
    await user.click(within(domains()).getByRole('option', { name: 'Product' }))
    await user.click(await within(classes()).findByRole('option', { name: 'Product' }))
    const views = await within(table()).findByRole('row', { name: /Views/ })
    expect(views).toHaveAttribute('aria-disabled', 'true')
    await user.click(views)
    expect(within(tray).getAllByRole('listitem')).toHaveLength(2)
    await user.click(screen.getByRole('button', { name: 'Select' }))
    expect(onConfirm).toHaveBeenCalledWith([
      { id: 'p1', class: 'product:class.Product', name: 'Shell' },
      { id: 'i1', class: 'issues:class.Issue', name: 'PRD-87' },
    ])
  })

  test('a Node without a name is listed but cannot be chosen', async () => {
    const { user } = renderFinder({ maximum: 8 })
    await user.click(await within(domains()).findByRole('option', { name: 'Product' }))
    await user.click(await within(classes()).findByRole('option', { name: 'Area' }))
    const unnamed = await within(table()).findByRole('row', { name: /No name/ })
    expect(unnamed).toHaveAttribute('aria-disabled', 'true')
    await user.click(unnamed)
    expect(
      within(screen.getByRole('list', { name: 'Chosen' })).queryAllByRole('listitem'),
    ).toHaveLength(0)
    expect(screen.getByRole('button', { name: 'Select' })).toBeDisabled()
  })

  test('the keyboard browses, previews, chooses and confirms without a pointer', async () => {
    const { user, onConfirm, onCancel } = renderFinder({ maximum: 8 })
    await within(domains()).findByRole('option', { name: 'Product' })
    domains().focus()
    await user.keyboard('{ArrowDown}')
    expect(domains()).toHaveAttribute(
      'aria-activedescendant',
      within(domains()).getByRole('option', { name: 'Issues' }).id,
    )
    await user.keyboard('p{ArrowRight}')
    await waitFor(() => expect(classes()).toHaveFocus())
    await within(classes()).findByRole('option', { name: 'Area' })
    await user.keyboard('{ArrowDown}{ArrowDown}{Enter}')
    await waitFor(() => expect(table()).toHaveFocus())
    await waitFor(() => expect(rowNames()).toHaveLength(3))
    await user.keyboard('{ArrowDown}')
    await user.keyboard(' ')
    expect(await screen.findByRole('region', { name: 'Preview' })).toHaveTextContent(
      'Name: Access; Status: closed',
    )
    await user.keyboard('{ArrowDown}')
    await waitFor(() =>
      expect(screen.getByRole('region', { name: 'Preview' })).toHaveTextContent('Name: Intents'),
    )
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('region', { name: 'Preview' })).toBeNull()
    expect(onCancel).not.toHaveBeenCalled()
    await user.keyboard('{Enter}')
    await user.keyboard('{Control>}{Enter}{/Control}')
    expect(onConfirm).toHaveBeenCalledWith([
      { id: 'a1', class: 'product:class.Area', name: 'Intents' },
    ])
    await user.keyboard('{Escape}')
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  test('a confirm the host answers later waits; a refusal keeps the choices until they change', async () => {
    const answers: { resolve: () => void; reject: (error: unknown) => void }[] = []
    const onConfirm = vi.fn(
      () => new Promise<void>((resolve, reject) => void answers.push({ resolve, reject })),
    )
    const { user } = renderFinder({ maximum: 2, onConfirm })
    await user.click(await within(domains()).findByRole('option', { name: 'Issues' }))
    const issue = await within(table()).findByRole('row', { name: /PRD-87/ })
    await user.click(issue)
    const select = screen.getByRole('button', { name: 'Select' })
    const status = screen.getByRole('status', { name: 'Confirmation' })

    await user.click(select)
    expect(select).toBeDisabled()
    expect(select).toHaveAttribute('aria-busy', 'true')
    expect(status).toHaveTextContent('confirming')
    // While the host decides, the choices hold still.
    await user.click(issue)
    expect(
      within(screen.getByRole('list', { name: 'Chosen' })).getAllByRole('listitem'),
    ).toHaveLength(1)

    await act(async () => answers[0]!.reject(new Error('refused')))
    expect(status).toHaveTextContent('error')
    expect(select).toBeEnabled()
    expect(
      within(screen.getByRole('list', { name: 'Chosen' })).getAllByRole('listitem'),
    ).toHaveLength(1)
    await user.click(issue)
    expect(status).toHaveTextContent('idle')

    await user.click(issue)
    await user.click(select)
    await act(async () => answers[1]!.resolve())
    expect(status).toHaveTextContent('idle')
    expect(onConfirm).toHaveBeenCalledTimes(2)
  })

  test('with a maximum of 1, Return chooses and confirms', async () => {
    const { user, onConfirm } = renderFinder()
    await user.click(await within(domains()).findByRole('option', { name: 'Issues' }))
    await within(table()).findByRole('row', { name: /PRD-87/ })
    table().focus()
    await user.keyboard('{ArrowDown}{Enter}')
    expect(onConfirm).toHaveBeenCalledWith([
      { id: 'i1', class: 'issues:class.Issue', name: 'PRD-87' },
    ])
  })

  test('accepted Classes narrow the Domains and Classes, and open on every accepted Node', async () => {
    const { user } = renderFinder({ accepts: ['kernel:class.Named'], maximum: 8 })
    const options = await within(domains()).findAllByRole('option')
    await waitFor(() =>
      expect(
        within(domains())
          .getAllByRole('option')
          .map((item) => item.textContent),
      ).toEqual(['All accepted', 'Product', 'Issues']),
    )
    expect(options[0]).toHaveAttribute('aria-selected', 'true')
    await waitFor(() =>
      expect(rowNames()).toEqual(['Access', 'Intents', 'PRD-87', 'Shell', 'Views', 'No name']),
    )
    expect(within(classes()).getByRole('option', { name: 'Named' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    await user.click(within(domains()).getByRole('option', { name: 'Product' }))
    await waitFor(() =>
      expect(
        within(classes())
          .getAllByRole('option')
          .map((item) => item.textContent),
      ).toEqual(['Product', 'Area']),
    )
  })

  test('reopens on the remembered place, and reports where the user goes', async () => {
    const onPlaceChange = vi.fn()
    const { user } = renderFinder({
      maximum: 8,
      defaultPlace: { domain: 'd-product', classes: ['product:class.Area'] },
      onPlaceChange,
    })
    await waitFor(() => expect(rowNames()).toEqual(['Access', 'Intents', 'No name']))
    expect(onPlaceChange).not.toHaveBeenCalled()
    await user.click(within(domains()).getByRole('option', { name: 'Issues' }))
    await waitFor(() =>
      expect(onPlaceChange).toHaveBeenLastCalledWith({
        domain: 'd-issues',
        classes: ['issues:class.Issue'],
      }),
    )
  })

  test('a failed column shows its error with Retry while the others keep working', async () => {
    const memory = createMemoryFinderSource(graph)
    let fail = true
    const source: FinderSource = {
      ...memory,
      nodes: (input) => (fail ? Promise.reject(new Error('down')) : memory.nodes(input)),
    }
    const { user } = renderFinder({ source, maximum: 8 })
    await user.click(await within(domains()).findByRole('option', { name: 'Issues' }))
    const retry = await screen.findByRole('button', { name: 'Retry Nodes' })
    expect(within(domains()).getAllByRole('option')).toHaveLength(2)
    fail = false
    await user.click(retry)
    await waitFor(() => expect(rowNames()).toEqual(['PRD-87']))
  })

  test('a Domain with no readable Class says so', async () => {
    const source = createMemoryFinderSource({
      ...graph,
      domains: [...graph.domains, { id: 'd-empty', name: 'Empty' }],
    })
    const { user } = renderFinder({ source })
    await user.click(await within(domains()).findByRole('option', { name: 'Empty' }))
    expect(await within(classes()).findByText('Nothing here you can read')).toBeInTheDocument()
  })

  test('pages load as the table scrolls near its end', async () => {
    const many: FinderMemoryGraph = {
      ...graph,
      nodes: Array.from({ length: 150 }, (_, index) => ({
        id: `x${String(index).padStart(3, '0')}`,
        class: 'issues:class.Issue',
        name: `Issue ${String(index).padStart(3, '0')}`,
        values: {},
      })),
    }
    const memory = createMemoryFinderSource(many)
    const nodes = vi.fn(memory.nodes)
    const { user } = renderFinder({ source: { ...memory, nodes }, maximum: 8 })
    await user.click(await within(domains()).findByRole('option', { name: 'Issues' }))
    await waitFor(() => expect(rowNames()).toHaveLength(64))
    const grid = table()
    Object.defineProperties(grid, {
      scrollHeight: { configurable: true, value: 2000 },
      clientHeight: { configurable: true, value: 400 },
      scrollTop: { configurable: true, value: 1500 },
    })
    act(() => grid.dispatchEvent(new Event('scroll')))
    await waitFor(() => expect(rowNames()).toHaveLength(128))
    expect(nodes).toHaveBeenLastCalledWith(expect.objectContaining({ after: '64', size: 64 }))
  })

  test('icons are images, never inlined, with the dark drawing in a dark theme', async () => {
    render(
      <Finder
        source={createMemoryFinderSource(graph)}
        onConfirm={() => {}}
        onCancel={() => {}}
        theme="dark"
      >
        <FinderIcon
          data-testid="icon"
          icon={{ src: 'data:image/svg+xml,light', dark: 'data:image/svg+xml,dark' }}
        />
        <FinderIcon data-testid="fallback" fallback={initialsOf('Product Catalog')} />
      </Finder>,
    )
    const icon = screen.getByTestId('icon')
    expect(icon.querySelector('svg')).toBeNull()
    expect(icon.querySelector('img')).toHaveAttribute('src', 'data:image/svg+xml,dark')
    expect(screen.getByTestId('fallback')).toHaveTextContent('PC')
  })
})

describe('rules', () => {
  const text = { key: 'name', label: 'Name', kind: 'text' } as const
  const number = { key: 'size', label: 'Size', kind: 'number' } as const
  const instant = { key: 'at', label: 'At', kind: 'instant' } as const
  const draft = { id: 'r', property: 'name', text: '', values: [], from: '', to: '' }

  test('a draft becomes a rule only once complete', () => {
    expect(ruleOf({ ...draft, operator: 'startsWith' }, text)).toBeUndefined()
    expect(ruleOf({ ...draft, operator: 'startsWith', text: 'In' }, text)).toEqual({
      property: 'name',
      operator: 'startsWith',
      value: 'In',
    })
    expect(ruleOf({ ...draft, operator: 'isOneOf', text: 'a, b, a,' }, text)).toEqual({
      property: 'name',
      operator: 'isOneOf',
      values: ['a', 'b'],
    })
    expect(
      ruleOf({ ...draft, property: 'size', operator: 'between', from: '2', to: 'x' }, number),
    ).toBeUndefined()
    expect(ruleOf({ ...draft, property: 'size', operator: 'between', from: '2' }, number)).toEqual({
      property: 'size',
      operator: 'between',
      from: 2,
    })
  })

  test('an instant day covers the whole day, and a preset ends now', () => {
    const day = ruleOf({ ...draft, property: 'at', operator: 'is', text: '2026-11-24' }, instant)
    expect(day).toMatchObject({ operator: 'between' })
    if (day?.operator !== 'between') throw new Error('expected a range')
    expect(new Date(String(day.to)).getTime() - new Date(String(day.from)).getTime()).toBe(
      86_400_000 - 1,
    )
    const now = Date.parse('2026-11-24T12:00:00.000Z')
    expect(
      ruleOf(
        { ...draft, property: 'at', operator: 'between', preset: 'last7Days' },
        instant,
        () => now,
      ),
    ).toEqual({ property: 'at', operator: 'between', from: '2026-11-17T12:00:00.000Z' })
  })

  test('counts read as bounded', () => {
    expect(formatFinderCount({ value: 15, more: false })).toBe('15')
    expect(formatFinderCount({ value: 1000, more: true })).toBe('1,000+')
  })
})

describe('memory source', () => {
  test('a Class stands for every Class that extends it, and absent values sort last', async () => {
    const source = createMemoryFinderSource(graph)
    const signal = new AbortController().signal
    const page = await source.nodes({
      classes: ['kernel:class.Named'],
      rules: [],
      order: [{ property: NAME, direction: 'desc' }],
      size: 3,
      signal,
    })
    expect(page.nodes.map((node) => node.name)).toEqual(['Views', 'Shell', 'PRD-87'])
    expect(page.next).toBe('3')
    const rest = await source.nodes({
      classes: ['kernel:class.Named'],
      rules: [],
      order: [{ property: NAME, direction: 'desc' }],
      after: page.next,
      size: 10,
      signal,
    })
    expect(rest.nodes.map((node) => node.name ?? null)).toEqual(['Intents', 'Access', null])
    expect(
      await source.count({ classes: ['kernel:class.Named'], rules: [], upTo: 2, signal }),
    ).toEqual({
      value: 2,
      more: true,
    })
  })
})
