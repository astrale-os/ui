import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, test, vi } from 'vitest'

import {
  IdentityFinder,
  IdentityFinderConfirm,
  IdentityFinderInput,
  IdentityFinderList,
  IdentityFinderOption,
  createMemoryIdentitySource,
  useIdentityFinder,
  type IdentityChoice,
  type IdentityFinderOptions,
  type IdentityFinderSource,
  type IdentityMemoryDirectory,
} from './index.js'

afterEach(cleanup)

const IDENTITY = 'kernel:class.Identity'
const ROLE = 'kernel:class.Role'
const USER = 'shell:class.User'
const GROUP = 'shell:class.Group'
const EMPLOYEE = 'people:class.Employee'

const directory: IdentityMemoryDirectory = {
  kinds: [
    { key: IDENTITY, name: 'Identity' },
    { key: USER, name: 'User', extends: [IDENTITY] },
    { key: EMPLOYEE, name: 'Employee', extends: [USER] },
    { key: GROUP, name: 'Group', extends: [IDENTITY] },
    { key: ROLE, name: 'Role', extends: [IDENTITY] },
  ],
  identities: [
    {
      id: 'u-ada',
      class: USER,
      name: 'Ada Lovelace',
      detail: 'ada@example.com',
      keywords: ['ada@example.com'],
    },
    {
      id: 'u-alan',
      class: USER,
      name: 'Alan Turing',
      detail: 'alan@example.com',
      keywords: ['alan@example.com'],
    },
    { id: 'u-grace', class: USER, name: 'Grace Hopper', keywords: ['grace@example.com'] },
    { id: 'u-marc', class: USER, name: 'Marc Davoust', keywords: ['marc@example.com'] },
    { id: 'u-nameless', class: USER },
    { id: 'e-linus', class: EMPLOYEE, name: 'Linus Pauling' },
    { id: 'g-eng', class: GROUP, name: 'Engineering' },
    { id: 'g-ops', class: GROUP, name: 'Operations' },
    { id: 'r-admin', class: ROLE, name: 'workspace.admin' },
  ],
  memberships: [
    ['u-ada', 'g-eng'],
    ['u-alan', 'g-eng'],
    ['g-ops', 'g-eng'],
    ['u-grace', 'g-ops'],
  ],
}

function Rows() {
  const finder = useIdentityFinder()
  return (
    <>
      <p data-testid="path">{finder.path.map((identity) => identity.name).join(' › ')}</p>
      <p data-testid="kind">{finder.kind?.name ?? 'all'}</p>
      <p data-testid="chosen">{finder.chosen.map((identity) => identity.name).join(', ')}</p>
      {finder.confirmError === undefined ? null : (
        <p role="alert">{finder.confirmError === true ? 'failed' : finder.confirmError}</p>
      )}
      <IdentityFinderList aria-label="Identities">
        {finder.rows.map((row) => (
          <IdentityFinderOption key={row.key} row={row}>
            {row.type === 'kind'
              ? `All ${row.kind.name}`
              : `${row.identity.name ?? 'No name'}${row.unavailable ? ` (${row.unavailable})` : ''}`}
          </IdentityFinderOption>
        ))}
      </IdentityFinderList>
      <IdentityFinderConfirm>Select</IdentityFinderConfirm>
    </>
  )
}

function renderFinder(
  options: Partial<IdentityFinderOptions> & { source?: IdentityFinderSource } = {},
) {
  const onConfirm = vi.fn<(choices: readonly IdentityChoice[]) => void | Promise<void>>()
  const onCancel = vi.fn()
  render(
    <IdentityFinder
      source={createMemoryIdentitySource(directory)}
      onConfirm={onConfirm}
      onCancel={onCancel}
      searchDelay={0}
      sectionSize={2}
      {...options}
    >
      <IdentityFinderInput aria-label="Search" />
      <Rows />
    </IdentityFinder>,
  )
  return { onConfirm: options.onConfirm ?? onConfirm, onCancel, user: userEvent.setup() }
}

const options = () =>
  within(screen.getByRole('listbox', { name: 'Identities' }))
    .queryAllByRole('option')
    .map((option) => option.textContent)

describe('identity finder', () => {
  test('lists every kind together, a few each, people first, with a row to open a fuller kind', async () => {
    renderFinder()
    await waitFor(() =>
      expect(options()).toEqual([
        'Ada Lovelace',
        'Alan Turing',
        'All User',
        'Linus Pauling',
        'Engineering',
        'Operations',
        'workspace.admin',
      ]),
    )
  })

  test('a Class admits the Classes that extend it', async () => {
    renderFinder({ accepts: [USER] })
    await waitFor(() =>
      expect(options()).toEqual(['Ada Lovelace', 'Alan Turing', 'All User', 'Linus Pauling']),
    )
  })

  test('one kind lists alone, page by page, unnamed last and not choosable', async () => {
    renderFinder({ accepts: [GROUP] })
    await waitFor(() => expect(options()).toEqual(['Engineering', 'Operations']))
    cleanup()
    const { user } = renderFinder({ sectionSize: 2, pageSize: 50 })
    await waitFor(() => expect(options()).toContain('All User'))
    await user.click(screen.getByRole('option', { name: 'All User' }))
    expect(screen.getByTestId('kind').textContent).toBe('User')
    await waitFor(() =>
      expect(options()).toEqual([
        'Ada Lovelace',
        'Alan Turing',
        'Grace Hopper',
        'Marc Davoust',
        'No name',
      ]),
    )
    expect(screen.getByRole('option', { name: 'No name' }).getAttribute('aria-disabled')).toBe(
      'true',
    )
  })

  test('a search matches the start of any word of a name or an email, ignoring case', async () => {
    const { user } = renderFinder()
    await user.type(screen.getByRole('combobox', { name: 'Search' }), 'mar')
    await waitFor(() => expect(options()).toEqual(['Marc Davoust']))
    await user.clear(screen.getByRole('combobox', { name: 'Search' }))
    await user.type(screen.getByRole('combobox', { name: 'Search' }), 'hopper')
    await waitFor(() => expect(options()).toEqual(['Grace Hopper']))
  })

  test('opens a group to walk its members, and goes back out', async () => {
    const { user } = renderFinder({ accepts: [GROUP, USER] })
    const input = screen.getByRole('combobox', { name: 'Search' })
    await user.type(input, 'eng')
    await waitFor(() => expect(options()).toEqual(['Engineering']))
    await user.keyboard('{ArrowRight}')
    expect(screen.getByTestId('path').textContent).toBe('Engineering')
    expect((input as HTMLInputElement).value).toBe('')
    await waitFor(() => expect(options()).toEqual(['Ada Lovelace', 'Alan Turing', 'Operations']))
    await user.keyboard('{ArrowDown}{ArrowDown}{ArrowRight}')
    expect(screen.getByTestId('path').textContent).toBe('Engineering › Operations')
    await waitFor(() => expect(options()).toEqual(['Grace Hopper']))
    await user.keyboard('{Backspace}')
    expect(screen.getByTestId('path').textContent).toBe('Engineering')
    await user.keyboard('{Escape}')
    expect(screen.getByTestId('path').textContent).toBe('')
  })

  test('the arrows walk the rows while the input keeps the focus', async () => {
    const { user } = renderFinder({ accepts: [GROUP] })
    const input = screen.getByRole('combobox', { name: 'Search' })
    await waitFor(() => expect(options()).toEqual(['Engineering', 'Operations']))
    await user.click(input)
    const active = () => input.getAttribute('aria-activedescendant')
    expect(document.getElementById(active()!)?.textContent).toBe('Engineering')
    await user.keyboard('{ArrowDown}')
    expect(document.getElementById(active()!)?.textContent).toBe('Operations')
    await user.keyboard('{ArrowDown}')
    expect(document.getElementById(active()!)?.textContent).toBe('Operations')
    expect(document.activeElement).toBe(input)
  })

  test('with a maximum of one, choosing confirms at once', async () => {
    const { user, onConfirm } = renderFinder({ accepts: [USER] })
    await user.type(screen.getByRole('combobox', { name: 'Search' }), 'grace{Enter}')
    await waitFor(() =>
      expect(onConfirm).toHaveBeenCalledWith([
        { id: 'u-grace', class: USER, name: 'Grace Hopper' },
      ]),
    )
  })

  test('with a larger maximum, choices gather until confirmed, up to the maximum', async () => {
    const { user, onConfirm } = renderFinder({ accepts: [USER], maximum: 2, sectionSize: 10 })
    await waitFor(() => expect(options()).toContain('Grace Hopper'))
    await user.click(screen.getByRole('option', { name: 'Ada Lovelace' }))
    await user.click(screen.getByRole('option', { name: 'Grace Hopper' }))
    expect(screen.getByRole('option', { name: 'Alan Turing' }).getAttribute('aria-disabled')).toBe(
      'true',
    )
    await user.click(screen.getByRole('option', { name: 'Alan Turing' }))
    expect(screen.getByTestId('chosen').textContent).toBe('Ada Lovelace, Grace Hopper')
    await user.click(screen.getByRole('option', { name: 'Ada Lovelace' }))
    expect(screen.getByTestId('chosen').textContent).toBe('Grace Hopper')
    await user.click(screen.getByRole('option', { name: 'Marc Davoust' }))
    await user.click(screen.getByRole('button', { name: 'Select' }))
    expect(onConfirm).toHaveBeenCalledWith([
      { id: 'u-grace', class: USER, name: 'Grace Hopper' },
      { id: 'u-marc', class: USER, name: 'Marc Davoust' },
    ])
  })

  test('an unavailable Identity shows why and cannot be chosen', async () => {
    const { user, onConfirm } = renderFinder({
      accepts: [GROUP],
      unavailable: new Map([['g-eng', 'Already a member']]),
    })
    await waitFor(() => expect(options()).toContain('Engineering (Already a member)'))
    await user.click(screen.getByRole('option', { name: 'Engineering (Already a member)' }))
    expect(onConfirm).not.toHaveBeenCalled()
  })

  test('a refused confirmation shows its message and keeps the choices', async () => {
    const onConfirm = vi.fn(async () => {
      throw new Error('Not readable')
    })
    const { user } = renderFinder({ accepts: [USER], maximum: 3, onConfirm, sectionSize: 10 })
    await waitFor(() => expect(options()).toContain('Ada Lovelace'))
    await user.click(screen.getByRole('option', { name: 'Ada Lovelace' }))
    await user.click(screen.getByRole('button', { name: 'Select' }))
    expect((await screen.findByRole('alert')).textContent).toBe('Not readable')
    expect(screen.getByTestId('chosen').textContent).toBe('Ada Lovelace')
  })

  test('Escape clears the text, then cancels', async () => {
    const { user, onCancel } = renderFinder()
    await user.type(screen.getByRole('combobox', { name: 'Search' }), 'x')
    await user.keyboard('{Escape}')
    expect((screen.getByRole('combobox', { name: 'Search' }) as HTMLInputElement).value).toBe('')
    expect(onCancel).not.toHaveBeenCalled()
    await user.keyboard('{Escape}')
    expect(onCancel).toHaveBeenCalledOnce()
  })

  test('Enter before the read of what was typed answers waits, then takes its first row', async () => {
    const { user, onConfirm } = renderFinder({ accepts: [USER], searchDelay: 80 })
    await waitFor(() => expect(options()).toContain('Ada Lovelace'))
    await user.type(screen.getByRole('combobox', { name: 'Search' }), 'grace{Enter}')
    await waitFor(() => expect(onConfirm).toHaveBeenCalledOnce())
    expect(onConfirm).toHaveBeenCalledWith([{ id: 'u-grace', class: USER, name: 'Grace Hopper' }])
  })

  test('the rows a failed read kept can be neither walked nor chosen', async () => {
    let fail = false
    const memory = createMemoryIdentitySource(directory)
    const source: IdentityFinderSource = {
      kinds: memory.kinds,
      identities: async (input) => {
        if (fail) throw new Error('offline')
        return memory.identities(input)
      },
    }
    const { user, onConfirm } = renderFinder({ source, accepts: [USER] })
    await waitFor(() => expect(options()).toContain('Ada Lovelace'))
    fail = true
    await user.type(screen.getByRole('combobox', { name: 'Search' }), 'zz')
    await waitFor(() => expect(options()).toEqual([]))
    await user.keyboard('{Enter}')
    expect(onConfirm).not.toHaveBeenCalled()
    expect(screen.getByRole('combobox').getAttribute('aria-activedescendant')).toBeNull()
  })

  test('Escape while a confirmation runs leaves its outcome to the host', async () => {
    let settle: () => void = () => {}
    const onConfirm = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          settle = resolve
        }),
    )
    const { user, onCancel } = renderFinder({ accepts: [USER], onConfirm })
    await user.type(screen.getByRole('combobox', { name: 'Search' }), 'grace{Enter}')
    await waitFor(() => expect(onConfirm).toHaveBeenCalledOnce())
    await user.keyboard('{Escape}')
    expect(onCancel).not.toHaveBeenCalled()
    settle()
  })

  test('ids that differ only in punctuation get distinct option ids', async () => {
    const source = createMemoryIdentitySource({
      kinds: directory.kinds,
      identities: [
        { id: 'a.b', class: USER, name: 'Dot' },
        { id: 'a:b', class: USER, name: 'Colon' },
        { id: 'a_b', class: USER, name: 'Underscore' },
      ],
    })
    renderFinder({ source, accepts: [USER] })
    await waitFor(() => expect(options()).toHaveLength(3))
    const ids = screen.getAllByRole('option').map((option) => option.id)
    expect(new Set(ids).size).toBe(3)
  })

  test('a picture only a further read gives shows once it lands, a few reads at a time', async () => {
    const people = Array.from({ length: 9 }, (_, index) => ({
      id: `p-${index}`,
      class: USER,
      name: `Person ${index}`,
      image: { src: `https://pictures.example/${index}.png` },
    }))
    const memory = createMemoryIdentitySource({
      kinds: directory.kinds,
      identities: people,
      lazyPictures: true,
    })
    let running = 0
    let most = 0
    const asked: string[] = []
    const source: IdentityFinderSource = {
      kinds: memory.kinds,
      identities: memory.identities,
      picture: async (input) => {
        asked.push(input.identity.id)
        running++
        most = Math.max(most, running)
        await new Promise((resolve) => setTimeout(resolve, 5))
        running--
        return memory.picture!(input)
      },
    }
    function Pictures() {
      const finder = useIdentityFinder()
      return (
        <ul>
          {finder.rows.map((row) =>
            row.type === 'identity' ? (
              <li key={row.key} data-testid="picture">
                {finder.imageOf(row.identity)?.src ?? 'initials'}
              </li>
            ) : null,
          )}
        </ul>
      )
    }
    render(
      <IdentityFinder source={source} accepts={[USER]} onConfirm={() => {}} onCancel={() => {}}>
        <Pictures />
      </IdentityFinder>,
    )
    await waitFor(() =>
      expect(screen.getAllByTestId('picture').map((item) => item.textContent)).toEqual(
        people.map((person) => person.image.src),
      ),
    )
    expect(most).toBeLessThanOrEqual(4)
    expect([...asked].sort()).toEqual(people.map((person) => person.id))
  })

  test('a failed read shows as an error and a retry reads again', async () => {
    let fail = true
    const memory = createMemoryIdentitySource(directory)
    const source: IdentityFinderSource = {
      kinds: memory.kinds,
      identities: async (input) => {
        if (fail) throw new Error('offline')
        return memory.identities(input)
      },
    }
    function Status() {
      const finder = useIdentityFinder()
      return (
        <button type="button" onClick={finder.retry}>
          {finder.list?.status ?? 'none'}
        </button>
      )
    }
    const user = userEvent.setup()
    render(
      <IdentityFinder source={source} accepts={[GROUP]} onConfirm={() => {}} onCancel={() => {}}>
        <Status />
        <Rows />
      </IdentityFinder>,
    )
    await screen.findByRole('button', { name: 'error' })
    fail = false
    await user.click(screen.getByRole('button', { name: 'error' }))
    await screen.findByRole('button', { name: 'ready' })
    expect(options()).toEqual(['Engineering', 'Operations'])
  })
})
