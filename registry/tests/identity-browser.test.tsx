import { createMemoryIdentitySource } from '@astrale-os/ui/identity-finder'
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, test, vi } from 'vitest'

import { IdentityBrowser } from '../blocks/finder/identity-browser.js'
import {
  failingIdentitySource,
  GROUP,
  USER,
  identityDirectory,
} from '../blocks/finder/identity.fixture.js'

afterEach(cleanup)

const source = createMemoryIdentitySource(identityDirectory)

function browse(props: Partial<Parameters<typeof IdentityBrowser>[0]> = {}) {
  const user = userEvent.setup()
  render(
    <IdentityBrowser
      source={source}
      maximum={8}
      onConfirm={vi.fn()}
      onCancel={vi.fn()}
      className="h-96"
      {...props}
    />,
  )
  return { user }
}

/** Elements whose tag alone gives them a role. */
const SEMANTIC = /^(?:A|BUTTON|H[1-6]|INPUT|LI|NAV|OL|P|SECTION|UL)$/u

/** The elements assistive technology sees directly under `parent`, through generic wrappers. */
function owned(parent: Element): Element[] {
  return [...parent.children].flatMap((child) => {
    if (child.getAttribute('aria-hidden') === 'true') return []
    return child.hasAttribute('role') || SEMANTIC.test(child.tagName) ? [child] : owned(child)
  })
}

describe('block/finder/identity-browser', () => {
  test('the listbox owns groups of options only, and no option holds a control', async () => {
    browse()
    const listbox = screen.getByRole('listbox', { name: 'Identities' })
    await within(listbox).findByRole('option', { name: /Engineering/ }, { timeout: 5000 })
    const groups = owned(listbox)
    expect(groups.map((group) => group.getAttribute('role'))).toEqual(groups.map(() => 'group'))
    expect(groups.map((group) => group.getAttribute('aria-label'))).toEqual([
      'People',
      'Groups',
      'Roles',
      'Service accounts',
    ])
    for (const group of groups)
      for (const child of owned(group)) expect(child.getAttribute('role')).toBe('option')
    for (const option of within(listbox).getAllByRole('option'))
      expect(option.querySelector('button, a[href], input, [tabindex]')).toBeNull()
  })

  test('the pointer opens a group from the mark on its row', async () => {
    const { user } = browse()
    const engineering = await screen.findByRole(
      'option',
      { name: /Engineering/ },
      { timeout: 5000 },
    )
    const opener = engineering.querySelector(
      '[data-slot="block-finder-identity-browser-open-members"]',
    )
    expect(opener).not.toBeNull()
    await user.click(opener!)
    const path = await screen.findByRole('navigation', { name: 'Opened' })
    expect(path).toHaveTextContent('Engineering')
    expect(await screen.findByRole('option', { name: /Kernel team/ })).toBeInTheDocument()
  })

  test.each([
    ['preparing', 'Preparing search'],
    ['budget', 'More results — refine the search'],
  ] as const)('an empty %s Identity page can be continued explicitly', async (stop, message) => {
    const identities = vi.fn<typeof source.identities>(async (input) => {
      if (!input.text) return source.identities(input)
      if (input.after === undefined) return { identities: [], next: 'sealed', stop }
      return { identities: [{ id: 'found', class: USER, name: 'Élodie Martin' }] }
    })
    const { user } = browse({ source: { ...source, identities }, accepts: [USER] })
    await screen.findAllByRole('option')
    await user.type(screen.getByRole('combobox', { name: 'Search by name or email' }), 'elo mar')
    expect(await screen.findByText(message)).toBeInTheDocument()
    expect(identities.mock.calls.some(([input]) => input.after === 'sealed')).toBe(false)
    await user.click(screen.getByRole('button', { name: 'Load more' }))
    expect(await screen.findByRole('option', { name: /Élodie Martin/ })).toBeInTheDocument()
    expect(identities.mock.calls.at(-1)?.[0]).toMatchObject({ text: 'elo mar', after: 'sealed' })
  })

  test('a kind that fails shows under the listbox, and the others stay listed', async () => {
    const groupsFail: typeof source = {
      ...source,
      async identities(search) {
        if (search.kinds.includes(GROUP)) throw new Error('unreachable')
        return source.identities(search)
      },
    }
    browse({ source: groupsFail })
    const retry = await screen.findByRole('button', { name: 'Retry' }, { timeout: 5000 })
    const listbox = screen.getByRole('listbox', { name: 'Identities' })
    expect(listbox.contains(retry)).toBe(false)
    expect(owned(listbox).map((group) => group.getAttribute('aria-label'))).toEqual([
      'People',
      'Roles',
      'Service accounts',
    ])
  })

  test('a failure and its Retry show under the listbox, not in it', async () => {
    browse({ source: failingIdentitySource })
    const retry = await screen.findByRole('button', { name: 'Retry' }, { timeout: 5000 })
    const listbox = screen.getByRole('listbox', { hidden: true })
    expect(listbox.contains(retry)).toBe(false)
  })
})
