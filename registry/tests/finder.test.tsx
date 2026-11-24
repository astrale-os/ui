import { createMemoryFinderSource, type FinderSource } from '@astrale-os/ui/finder'
import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, test, vi } from 'vitest'

import { NAMED, finderGraph } from '../blocks/finder/finder.fixture.js'
import { NodeBrowser } from '../blocks/finder/node-browser.js'
import { NodeSelector } from '../blocks/finder/node-selector.js'

afterEach(cleanup)

const source = createMemoryFinderSource(finderGraph)

function browse(props: Partial<Parameters<typeof NodeBrowser>[0]> = {}) {
  const onConfirm = vi.fn()
  const onCancel = vi.fn()
  const user = userEvent.setup()
  render(
    <NodeBrowser
      source={source}
      maximum={8}
      onConfirm={onConfirm}
      onCancel={onCancel}
      className="h-96"
      {...props}
    />,
  )
  return { user, onConfirm, onCancel }
}

async function openClass(user: ReturnType<typeof userEvent.setup>, domain: string, name: string) {
  await user.click(await screen.findByRole('option', { name: new RegExp(domain) }))
  const classes = screen.getByRole('listbox', { name: 'Classes' })
  await user.click(await within(classes).findByRole('option', { name: new RegExp(`^${name}`) }))
}

describe('block/finder', () => {
  test('the browser lists, chooses across Domains and confirms with the tally', async () => {
    const { user, onConfirm } = browse()
    expect(screen.getByRole('heading', { name: 'Select Nodes' })).toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: 'Location' })).not.toBeInTheDocument()
    await openClass(user, 'Product', 'Product')
    // The package's `data-selected:` variant matches only `data-selected="true"`.
    const classes = screen.getByRole('listbox', { name: 'Classes' })
    expect(
      within(classes).getByRole('option', { name: /^Product/, selected: true }),
    ).toHaveAttribute('data-selected', 'true')
    const table = screen.getByRole('grid', { name: 'Nodes' })
    await user.click(await within(table).findByText('Shell'))
    expect(await screen.findByText('5 Nodes')).toBeInTheDocument()

    await openClass(user, 'People', 'Person')
    await user.click(await within(table).findByText('Ada Moreau'))
    expect(screen.getByText('2 of 8')).toBeInTheDocument()
    const tray = screen.getByRole('list', { name: 'Chosen Nodes' })
    expect(
      within(tray)
        .getAllByRole('listitem')
        .map((chip) => chip.textContent),
    ).toEqual(['Shell', 'Ada Moreau'])

    await user.click(screen.getByRole('button', { name: 'Select' }))
    expect(onConfirm).toHaveBeenCalledWith([
      expect.objectContaining({ class: 'product:Product', name: 'Shell' }),
      expect.objectContaining({ class: 'people:Person', name: 'Ada Moreau' }),
    ])
  })

  test('an accepted kind names the header, offers All accepted and hides what it does not admit', async () => {
    const { user } = browse({ accepts: [NAMED] })
    const domains = screen.getByRole('listbox', { name: 'Domains' })
    expect(await within(domains).findByRole('option', { name: /All accepted/ })).toBeInTheDocument()
    expect(within(domains).queryByRole('option', { name: /Kernel/ })).not.toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: 'Select Named' })).toBeInTheDocument()

    await user.click(within(domains).getByRole('option', { name: /People/ }))
    const classes = screen.getByRole('listbox', { name: 'Classes' })
    expect(await within(classes).findByRole('option', { name: /^Person/ })).toBeInTheDocument()
    expect(within(classes).queryByRole('option', { name: /^Group/ })).not.toBeInTheDocument()
  })

  test('a Domain with nothing readable says so, and an unnamed Node cannot be chosen', async () => {
    const { user } = browse()
    await user.click(await screen.findByRole('option', { name: /Kernel/ }))
    expect(await screen.findByText('Nothing here you can read')).toBeInTheDocument()

    await openClass(user, 'People', 'Group')
    const table = screen.getByRole('grid', { name: 'Nodes' })
    const unnamed = await within(table).findAllByText('No name')
    const row = unnamed[0]!.closest('[role="row"]')!
    expect(row).toHaveAttribute('aria-disabled', 'true')
    await user.click(row)
    expect(
      within(screen.getByRole('list', { name: 'Chosen Nodes' })).queryAllByRole('listitem'),
    ).toHaveLength(0)
  })

  test('a rule narrows the table, and an empty result offers to clear the filters', async () => {
    const { user } = browse()
    await openClass(user, 'Product', 'Area')
    const table = screen.getByRole('grid', { name: 'Nodes' })
    await within(table).findByText('Intents')

    await user.click(screen.getByRole('button', { name: 'Filter' }))
    const filters = screen.getByRole('group', { name: 'Filters' })
    expect(within(filters).getByRole('combobox', { name: 'Property' })).toHaveValue('name')
    await user.type(within(filters).getByRole('textbox', { name: 'Value' }), 'Int')
    await waitFor(() => expect(within(table).queryByText('Navigation')).not.toBeInTheDocument())
    expect(within(table).getByText('Intents')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '1 filter' })).toBeInTheDocument()

    await user.type(within(filters).getByRole('textbox', { name: 'Value' }), 'zzz')
    expect(await screen.findByText('No Nodes you can read match these filters')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Clear filters' }))
    expect(await within(table).findByText('Navigation')).toBeInTheDocument()
    expect(screen.queryByRole('group', { name: 'Filters' })).not.toBeInTheDocument()
  })

  test('a refused confirm shows the host’s reason and keeps the choice', async () => {
    const { user } = browse({
      maximum: 1,
      defaultPlace: { domain: 'product', classes: ['product:Product'] },
      onConfirm: () => Promise.reject(new Error('Shell can no longer be selected')),
    })
    await user.click(await within(screen.getByRole('grid', { name: 'Nodes' })).findByText('Shell'))
    await user.click(screen.getByRole('button', { name: 'Select' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Shell can no longer be selected')
    expect(
      within(screen.getByRole('list', { name: 'Chosen Nodes' })).getAllByRole('listitem'),
    ).toHaveLength(1)
    expect(screen.getByRole('button', { name: 'Select' })).toBeEnabled()
  })

  test('a host in another language gives its own words', async () => {
    const { user } = browse({
      maximum: 3,
      messages: {
        selectNodes: 'Sélectionner des Nœuds',
        domains: 'Domaines',
        count: (count, one) => `${count} ${one ? 'Nœud' : 'Nœuds'}`,
        tally: (count, maximum) => `${count} sur ${maximum}`,
        cancel: 'Annuler',
        confirm: 'Sélectionner',
      },
    })
    expect(screen.getByRole('heading', { name: 'Sélectionner des Nœuds' })).toBeInTheDocument()
    const domains = screen.getByRole('listbox', { name: 'Domaines' })
    await user.click(await within(domains).findByRole('option', { name: /Product/ }))
    const classes = screen.getByRole('listbox', { name: 'Classes' })
    await user.click(await within(classes).findByRole('option', { name: /^Product/ }))
    expect(await screen.findByText('5 Nœuds')).toBeInTheDocument()
    expect(screen.getByText('0 sur 3')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Annuler' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Sélectionner' })).toBeDisabled()
  })

  test('a failed read shows inline with a Retry that reads again', async () => {
    let attempts = 0
    const flaky: FinderSource = {
      ...source,
      async domains(input) {
        attempts += 1
        if (attempts === 1) throw new Error('unreachable')
        return source.domains(input)
      },
    }
    const { user } = browse({ source: flaky })
    expect(await screen.findByText('Couldn’t load the Domains')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Retry' }))
    expect(await screen.findByRole('option', { name: /Product/ })).toBeInTheDocument()
  })

  test('the selector dialog names itself by the request’s title and says who asks', async () => {
    render(
      <NodeSelector
        open
        source={source}
        accepts={[NAMED]}
        title="Link to PRD-87"
        description="For Issues"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    )
    expect(
      await screen.findByRole('dialog', { name: 'Link to PRD-87', description: 'For Issues' }),
    ).toBeInTheDocument()
  })

  test('the selector dialog: Escape closes the preview, then cancels; a menu keeps its own Escape', async () => {
    const onConfirm = vi.fn()
    const onCancel = vi.fn()
    const user = userEvent.setup()
    render(
      <NodeSelector
        open
        source={source}
        maximum={1}
        defaultPlace={{ domain: 'product', classes: ['product:Product'] }}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    )
    const dialog = await screen.findByRole('dialog', { name: 'Select a Node' })
    const table = within(dialog).getByRole('grid', { name: 'Nodes' })
    await within(table).findByText('Shell')

    await user.click(within(dialog).getByRole('button', { name: 'Columns' }))
    const menu = await screen.findByRole('menu')
    await user.keyboard('{Escape}')
    await waitFor(() => expect(menu).not.toBeInTheDocument())
    expect(onCancel).not.toHaveBeenCalled()

    table.focus()
    await user.keyboard('{ArrowDown}{ }')
    expect(await within(dialog).findByRole('region', { name: 'Preview' })).toBeInTheDocument()
    await user.keyboard('{Escape}')
    expect(within(dialog).queryByRole('region', { name: 'Preview' })).not.toBeInTheDocument()
    expect(onCancel).not.toHaveBeenCalled()
    await user.keyboard('{Escape}')
    expect(onCancel).toHaveBeenCalledTimes(1)

    table.focus()
    await user.keyboard('{Enter}')
    expect(onConfirm).toHaveBeenCalledWith([expect.objectContaining({ class: 'product:Product' })])
  })
})
