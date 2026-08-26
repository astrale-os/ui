import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, test } from 'vitest'

import { SignInCard } from '../blocks/authentication/sign-in-card.js'
import { AppearanceSettings } from '../blocks/settings/appearance.js'
import { HorizontalCarousel } from '../patterns/carousel/horizontal-controlled.js'
import { ChartLineBasic } from '../patterns/chart/line-basic.js'
import { ComboboxSingleBasic } from '../patterns/combobox/single-basic.js'

afterEach(cleanup)

describe('owned registry compositions', () => {
  test('chart has a preset-backed default while retaining host token control', () => {
    const { rerender } = render(
      <ChartLineBasic
        data={[
          { label: 'Intake', value: 18 },
          { label: 'Public beta', value: 100 },
        ]}
      />,
    )
    const line = document.querySelector('[data-slot="patterns-chart-line-basic-polyline"]')
    expect(line).toHaveAttribute('stroke', 'var(--color-chart-1, var(--ui-chart-1))')

    rerender(
      <ChartLineBasic
        className="host-chart"
        style={{ '--color-chart-1': 'var(--ui-primary)' } as React.CSSProperties}
        data={[{ label: 'Qualified', value: 100 }]}
      />,
    )
    const root = document.querySelector('[data-slot="pattern-chart-line-basic"]')
    expect(root).toHaveClass('host-chart')
    expect(root).toHaveStyle({ '--color-chart-1': 'var(--ui-primary)' })
  })

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

  test('settings blocks inject toggles and persistence without ambient effects', async () => {
    const user = userEvent.setup()
    const toggles: Array<[string, boolean]> = []
    let saves = 0
    render(
      <AppearanceSettings
        values={{ compact: false, motion: true }}
        onToggle={(id, value) => toggles.push([id, value])}
        onSave={() => saves++}
      />,
    )
    await user.click(screen.getByRole('switch', { name: 'Compact density' }))
    expect(toggles).toEqual([['compact', true]])
    await user.click(screen.getByRole('button', { name: 'Save changes' }))
    expect(saves).toBe(1)
  })
})
