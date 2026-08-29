import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, test } from 'vitest'

import { SignInCard } from '../blocks/authentication/sign-in-card.js'
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

afterEach(cleanup)

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
})
