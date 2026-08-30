import { act, cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, test, vi } from 'vitest'

import { SignInCard } from '../blocks/authentication/sign-in-card.js'
import StatusMonitor from '../blocks/observability/status-monitor.js'
import { type EnvVar, EnvVariables } from '../blocks/secrets/env-variables.js'
import { secretManagerRejectedActions } from '../blocks/secrets/secrets.fixture.js'
import {
  StatusHeatmap,
  StatusHeatmapBlock,
  StatusHeatmapBody,
  StatusHeatmapFooter,
  StatusHeatmapLegend,
  StatusHeatmapStat,
} from '../components/status-heatmap/status-heatmap.js'
import { HorizontalCarousel } from '../patterns/carousel/horizontal-controlled.js'
import { ComboboxSingleBasic } from '../patterns/combobox/single-basic.js'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('owned registry compositions', () => {
  test('combobox instances keep unique relationships and inject query and selection state', async () => {
    const user = userEvent.setup()
    const changes: string[] = []
    const selections: string[] = []
    const options = [
      { id: 'alpha', label: 'Alpha' },
      { id: 'beta', label: 'Beta' },
    ]
    const { rerender } = render(
      <>
        <ComboboxSingleBasic
          options={options}
          query=""
          open
          onQueryChange={(value) => changes.push(value)}
          onValueChange={(value) => selections.push(value)}
        />
        <ComboboxSingleBasic
          options={options}
          query="beta"
          open
          onQueryChange={() => undefined}
          onValueChange={() => undefined}
        />
      </>,
    )

    const inputs = screen.getAllByRole('combobox')
    expect(inputs[0]).not.toHaveAttribute('aria-controls', inputs[1]!.getAttribute('aria-controls'))
    expect(screen.getAllByRole('listbox')).toHaveLength(2)
    expect(within(screen.getAllByRole('listbox')[1]!).queryByText('Alpha')).not.toBeInTheDocument()

    await user.type(inputs[0]!, 'b')
    expect(changes).toEqual(['b'])
    await user.click(within(screen.getAllByRole('listbox')[0]!).getByText('Beta'))
    expect(selections).toEqual(['beta'])
    const firstOption = within(screen.getAllByRole('listbox')[0]!).getByText('Alpha')
    firstOption.focus()
    await user.keyboard('{Enter}')
    expect(selections).toEqual(['beta', 'alpha'])

    rerender(
      <ComboboxSingleBasic
        className="host-combobox"
        style={{ maxWidth: 320 }}
        options={options}
        query="beta"
        value="beta"
        open
        onQueryChange={() => undefined}
        onValueChange={() => undefined}
      />,
    )
    const root = document.querySelector('[data-slot="pattern-combobox-single-basic"]')
    expect(root).toHaveClass('host-combobox')
    expect(root).toHaveStyle({ maxWidth: '320px' })
    expect(screen.getByRole('option', { name: 'Beta' })).toHaveAttribute('aria-selected', 'true')
  })

  test('carousel clamps injected navigation and exposes the active slide', async () => {
    const user = userEvent.setup()
    const selected: number[] = []
    const { rerender } = render(
      <HorizontalCarousel
        className="host-carousel"
        style={{ minHeight: 120 }}
        items={[
          { id: 'one', content: 'First' },
          { id: 'two', content: 'Second' },
        ]}
        active={0}
        onActiveChange={(index) => selected.push(index)}
      />,
    )
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled()
    expect(screen.getByText('First')).toBeVisible()
    expect(screen.getByText('Second')).not.toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Next' }))
    expect(selected).toEqual([1])

    rerender(
      <HorizontalCarousel
        items={[
          { id: 'one', content: 'First' },
          { id: 'two', content: 'Second' },
        ]}
        active={1}
        onActiveChange={(index) => selected.push(index)}
      />,
    )
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled()
    expect(screen.getByText('Second')).toBeVisible()
  })

  test('authentication blocks keep instance-local forms and inject all application effects', async () => {
    const user = userEvent.setup()
    const changes: Array<[string, string]> = []
    let submits = 0
    render(
      <>
        <SignInCard
          className="host-sign-in"
          style={{ maxWidth: 480 }}
          values={{ email: 'first@example.test', password: 'secret' }}
          error="Credentials rejected"
          onChange={(field, value) => changes.push([field, value])}
          onSubmit={() => submits++}
        />
        <SignInCard
          values={{ email: 'second@example.test', password: 'secret' }}
          onChange={() => undefined}
          onSubmit={() => undefined}
        />
      </>,
    )
    const forms = document.querySelectorAll('form')
    const submitters = screen.getAllByRole('button', { name: 'Sign in' })
    expect(forms[0]!.id).not.toBe(forms[1]!.id)
    expect(submitters[0]).toHaveAttribute('form', forms[0]!.id)
    expect(submitters[1]).toHaveAttribute('form', forms[1]!.id)
    expect(document.querySelector('[data-slot="block-authentication-sign-in-card"]')).toHaveClass(
      'host-sign-in',
    )
    expect(screen.getByRole('alert')).toHaveTextContent('Credentials rejected')
    expect(screen.getAllByLabelText('Email')[0]).toHaveAccessibleDescription('Credentials rejected')

    await user.type(screen.getAllByLabelText('Email')[0]!, 'a')
    expect(changes).toEqual([['email', 'first@example.testa']])
    await user.click(submitters[0]!)
    expect(submits).toBe(1)
  })

  test('status heatmap keeps its upstream anatomy, labels, and cell interaction', async () => {
    const user = userEvent.setup()
    const clicked: string[] = []
    render(
      <StatusHeatmap
        data={[
          { date: '2026-05-01', value: 3 },
          { date: '2026-05-02', value: 2 },
          { date: '2026-05-03', value: 1 },
        ]}
      >
        <StatusHeatmapBody>
          {({ activity, dayIndex }) => (
            <StatusHeatmapBlock
              activity={activity}
              dayIndex={dayIndex}
              onCellClick={(cell) => clicked.push(cell.date)}
            />
          )}
        </StatusHeatmapBody>
        <StatusHeatmapFooter>
          <StatusHeatmapStat />
          <StatusHeatmapLegend />
        </StatusHeatmapFooter>
      </StatusHeatmap>,
    )
    expect(document.querySelector('[data-slot="status-heatmap"]')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Status heatmap' })).toBeInTheDocument()
    expect(document.querySelectorAll('[data-slot="status-heatmap-block"]')).toHaveLength(3)
    expect(document.querySelector('[data-slot="status-heatmap-stat"]')).toHaveTextContent(
      '1 days healthy',
    )
    expect(
      within(document.querySelector<HTMLElement>('[data-slot="status-heatmap-legend"]')!).getByText(
        'Degraded',
      ),
    ).toBeInTheDocument()

    const cells = screen.getAllByRole('button')
    expect(cells[2]).toHaveAttribute('aria-label', '2026-05-03: Critical')
    await user.click(cells[0]!)
    expect(clicked).toEqual(['2026-05-01'])
  })

  test('status monitor exposes recent availability, uptime, accessible statuses, and responsive windows', async () => {
    const observers: Array<{
      callback: ResizeObserverCallback
      elements: Element[]
    }> = []
    vi.stubGlobal(
      'ResizeObserver',
      class {
        entry: (typeof observers)[number]
        constructor(callback: ResizeObserverCallback) {
          this.entry = { callback, elements: [] }
          observers.push(this.entry)
        }
        observe(element: Element) {
          this.entry.elements.push(element)
        }
        disconnect() {}
        unobserve() {}
      },
    )
    let width = 640
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
      () => ({ width }) as DOMRect,
    )
    const statuses = [
      { status: 'normal' as const, timestamp: 'May 01, 2026' },
      {
        status: 'warning' as const,
        timestamp: 'May 02, 2026',
        info: 'Latency exceeded the expected threshold.',
      },
      {
        status: 'error' as const,
        timestamp: 'May 03, 2026',
        info: 'API requests failed during failover.',
      },
      { status: 'empty' as const, timestamp: 'May 04, 2026' },
    ]
    const { container } = render(
      <StatusMonitor
        className="host-status-monitor"
        statuses={statuses}
        title="API availability"
      />,
    )

    expect(screen.getByText('API availability')).toBeVisible()
    expect(screen.getByText('33.33% uptime')).toBeVisible()
    expect(container.firstElementChild).toHaveClass('host-status-monitor')
    await waitFor(() => expect(container.querySelectorAll('button[aria-label]')).toHaveLength(90))

    expect(
      screen.getByLabelText('May 03, 2026: Error. API requests failed during failover.'),
    ).toHaveAttribute('type', 'button')
    const root = container.firstElementChild!
    const monitorObserver = observers.find(({ elements }) => elements.includes(root))
    expect(monitorObserver).toBeDefined()

    width = 418
    await act(() => monitorObserver?.callback([], {} as ResizeObserver))
    await waitFor(() => expect(container.querySelectorAll('button[aria-label]')).toHaveLength(60))

    width = 207
    await act(() => monitorObserver?.callback([], {} as ResizeObserver))
    await waitFor(() => expect(container.querySelectorAll('button[aria-label]')).toHaveLength(30))
  })

  test('status monitor scopes uptime to the visible window and distinguishes no data and hours', async () => {
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(private callback: ResizeObserverCallback) {}
        observe() {
          this.callback([], this as unknown as ResizeObserver)
        }
        disconnect() {}
        unobserve() {}
      },
    )
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
      () => ({ width: 640 }) as DOMRect,
    )
    const statuses = Array.from({ length: 100 }, (_, index) => ({
      status: index < 10 ? ('error' as const) : ('normal' as const),
      timestamp: `Period ${index + 1}`,
    }))
    const { container, rerender } = render(<StatusMonitor statuses={statuses} />)

    await waitFor(() => expect(container.querySelectorAll('button[aria-label]')).toHaveLength(90))
    expect(screen.getByText('100% uptime')).toBeVisible()

    rerender(
      <StatusMonitor statuses={Array.from({ length: 90 }, () => ({ status: 'empty' as const }))} />,
    )
    expect(screen.getByText('N/A uptime')).toBeVisible()

    rerender(
      <StatusMonitor
        unit="hours"
        statuses={[
          { status: 'normal', timestamp: new Date('2026-05-03T03:00:00Z') },
          { status: 'normal', timestamp: new Date('2026-05-03T04:00:00Z') },
        ]}
      />,
    )
    const hourlyLabels = [...container.querySelectorAll<HTMLElement>('button[aria-label]')]
      .map((element) => element.getAttribute('aria-label'))
      .filter((label) => !label?.startsWith('No data.'))
    expect(hourlyLabels).toHaveLength(2)
    expect(new Set(hourlyLabels).size).toBe(2)
    expect(hourlyLabels.every((label) => /\d{1,2}:\d{2}/u.test(label!))).toBe(true)
  })

  test('environment variables keep values masked until an explicit reveal', async () => {
    const user = userEvent.setup()
    const { container } = render(<EnvVariables />)

    const secretInputs = () => [...container.querySelectorAll<HTMLInputElement>('input[readonly]')]
    expect(secretInputs().length).toBeGreaterThan(0)
    expect(secretInputs().every((input) => input.value === '••••••••••••••••')).toBe(true)

    await user.click(secretInputs()[0]!.nextElementSibling as HTMLElement)
    expect(secretInputs()[0]!.value).toBe('postgresql://user:pass@db.example.com:5432/mydb')
    expect(
      secretInputs()
        .slice(1)
        .every((input) => input.value === '••••••••••••••••'),
    ).toBe(true)

    await user.click(secretInputs()[0]!.nextElementSibling as HTMLElement)
    expect(secretInputs()[0]!.value).toBe('••••••••••••••••')
  })

  test('environment variables filter the inventory and report an empty result', async () => {
    const user = userEvent.setup()
    render(<EnvVariables />)

    expect(screen.getByText('DATABASE_URL')).toBeVisible()
    const filter = screen.getByPlaceholderText('Filter variables...')

    await user.type(filter, 'stripe')
    expect(screen.getByText('STRIPE_SECRET_KEY')).toBeVisible()
    expect(screen.queryByText('DATABASE_URL')).not.toBeInTheDocument()

    await user.clear(filter)
    await user.type(filter, 'no-such-variable')
    expect(screen.getByText('No variables found.')).toBeVisible()
  })

  test('environment variables expose the raw bulk edit surface for the active environment', async () => {
    const user = userEvent.setup()
    const { container } = render(<EnvVariables />)

    await user.click(screen.getByRole('switch'))
    const textarea = container.querySelector('textarea')!
    expect(textarea.value).toContain('DATABASE_URL=postgresql://user:pass@db.example.com:5432/mydb')
    expect(textarea.value).not.toContain('••••••••••••••••')
  })

  test('environment variables name every secret control for assistive technology', async () => {
    const user = userEvent.setup()
    render(<EnvVariables />)

    expect(screen.getByLabelText('Filter by group')).toBeVisible()
    expect(screen.getByLabelText('Filter variables')).toBeVisible()
    expect(screen.getByLabelText('Value of DATABASE_URL')).toHaveValue('••••••••••••••••')
    expect(screen.getByRole('button', { name: 'Actions for DATABASE_URL' })).toBeVisible()

    const reveal = screen.getByRole('button', { name: 'Reveal value of DATABASE_URL' })
    expect(reveal).toHaveAttribute('aria-pressed', 'false')
    await user.click(reveal)
    expect(screen.getByRole('button', { name: 'Hide value of DATABASE_URL' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByLabelText('Value of DATABASE_URL')).toHaveValue(
      'postgresql://user:pass@db.example.com:5432/mydb',
    )
  })

  test('environment variables add a variable through the injected create action', async () => {
    const user = userEvent.setup()
    const created: { key: string; value: string; environments: string[] }[] = []
    render(
      <EnvVariables
        defaultVariables={[]}
        onCreateVariable={(variable) => {
          created.push({
            key: variable.key,
            value: variable.value,
            environments: variable.environments,
          })
        }}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Add Variable' }))
    await user.type(screen.getByLabelText('Key'), 'CAMPAIGN_TOKEN')
    await user.type(screen.getByLabelText('Value'), 'campaign-secret')
    await user.click(screen.getByRole('checkbox', { name: 'production' }))
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(created).toEqual([
      {
        key: 'CAMPAIGN_TOKEN',
        value: 'campaign-secret',
        environments: ['development', 'production'],
      },
    ])
    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('Added CAMPAIGN_TOKEN.')
    })
    expect(screen.getByRole('status')).not.toHaveTextContent('campaign-secret')
    expect(screen.getByLabelText('Value of CAMPAIGN_TOKEN')).toHaveValue('••••••••••••••••')
  })

  test('environment variables refuse an unnamed variable without calling the host', async () => {
    const user = userEvent.setup()
    const created: string[] = []
    render(
      <EnvVariables
        defaultVariables={[]}
        onCreateVariable={(variable) => {
          created.push(variable.key)
        }}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Add Variable' }))
    await user.type(screen.getByLabelText('Value'), 'campaign-secret')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(created).toEqual([])
    expect(screen.getByRole('status')).toHaveTextContent('Enter a variable name before saving.')
    expect(screen.getByRole('status')).not.toHaveTextContent('campaign-secret')
  })

  test('environment variables report a rejected host action without changing the inventory', async () => {
    const user = userEvent.setup()
    render(
      <EnvVariables
        defaultVariables={[]}
        onCreateVariable={() => Promise.reject(new Error('rejected'))}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Add Variable' }))
    await user.type(screen.getByLabelText('Key'), 'CAMPAIGN_TOKEN')
    await user.type(screen.getByLabelText('Value'), 'campaign-secret')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('Could not add the variable.')
    })
    expect(screen.getByRole('status')).not.toHaveTextContent('campaign-secret')
    expect(screen.queryByLabelText('Value of CAMPAIGN_TOKEN')).not.toBeInTheDocument()
    expect(screen.getByText('No variables found.')).toBeVisible()
  })

  test('environment variable type badges keep their visible labels', () => {
    render(<EnvVariables />)

    for (const label of ['URL', 'Secret', 'Bool', 'Num', 'Str']) {
      expect(screen.getAllByText(label).length).toBeGreaterThan(0)
    }
  })

  test('the secret manager error fixture refuses every action without echoing a value', async () => {
    const variable: EnvVar = {
      id: 1,
      key: 'CAMPAIGN_TOKEN',
      value: 'campaign-secret',
      environments: ['production'],
      type: 'secret',
      group: 'general',
      encrypted: true,
      lastModifiedBy: 'You',
      lastModifiedAt: 'just now',
      linked: false,
    }

    for (const action of [
      secretManagerRejectedActions.onCreateVariable,
      secretManagerRejectedActions.onUpdateVariable,
      secretManagerRejectedActions.onDeleteVariable,
      secretManagerRejectedActions.onCopyValue,
    ]) {
      const failure = await action(variable).then(
        () => null,
        (error: unknown) => error,
      )
      expect(failure).toBeInstanceOf(Error)
      expect(String(failure)).not.toContain('campaign-secret')
    }
  })

  test('environment variables surface the rejected fixture through the live status region', async () => {
    const user = userEvent.setup()
    render(<EnvVariables defaultVariables={[]} {...secretManagerRejectedActions} />)

    await user.click(screen.getByRole('button', { name: 'Add Variable' }))
    await user.type(screen.getByLabelText('Key'), 'CAMPAIGN_TOKEN')
    await user.type(screen.getByLabelText('Value'), 'campaign-secret')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(screen.getByRole('status')).toHaveTextContent('Adding variable…')
    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('Could not add the variable.')
    })
    expect(screen.getByRole('status')).not.toHaveTextContent('campaign-secret')
    expect(screen.queryByLabelText('Value of CAMPAIGN_TOKEN')).not.toBeInTheDocument()
  })
})
