import {
  createMemoryIdentitySource,
  type IdentityFinderSource,
  type IdentityImage,
  type IdentityMemoryEntry,
} from '@astrale-os/ui/identity-finder'

function image(markup: string): string {
  return `data:image/svg+xml,${encodeURIComponent(markup)}`
}

function face(fill: string): IdentityImage {
  return {
    src: image(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" fill="${fill}"/><circle cx="16" cy="13" r="6" fill="#ffffff" fill-opacity=".85"/><path d="M5 31c1.5-6 6-9 11-9s9.5 3 11 9" fill="#ffffff" fill-opacity=".85"/></svg>`,
    ),
  }
}

export const IDENTITY = 'kernel.astrale.ai:class.Identity'
export const ROLE = 'kernel.astrale.ai:class.Role'
export const USER = 'shell.astrale.ai:class.User'
export const GROUP = 'shell.astrale.ai:class.Group'
export const SERVICE_ACCOUNT = 'shell.astrale.ai:class.ServiceAccount'

const people: [string, string, string?][] = [
  ['Ada Lovelace', 'ada@astrale.ai', '#6366f1'],
  ['Alan Turing', 'alan@astrale.ai'],
  ['Barbara Liskov', 'barbara@astrale.ai', '#0ea5e9'],
  ['Claude Shannon', 'claude@astrale.ai'],
  ['Donald Knuth', 'don@astrale.ai', '#f59e0b'],
  ['Edsger Dijkstra', 'edsger@astrale.ai'],
  ['Frances Allen', 'fran@astrale.ai', '#10b981'],
  ['Grace Hopper', 'grace@astrale.ai'],
  ['Hedy Lamarr', 'hedy@astrale.ai', '#ec4899'],
  ['John McCarthy', 'john@astrale.ai'],
  ['Katherine Johnson', 'katherine@astrale.ai'],
  ['Leslie Lamport', 'leslie@astrale.ai', '#8b5cf6'],
  ['Margaret Hamilton', 'margaret@astrale.ai'],
  ['Niklaus Wirth', 'niklaus@astrale.ai'],
  ['Radia Perlman', 'radia@astrale.ai', '#14b8a6'],
]

const users: IdentityMemoryEntry[] = people.map(([name, email, fill], index) => ({
  id: `u-${index}`,
  class: USER,
  name,
  detail: email,
  keywords: [email],
  ...(fill === undefined ? {} : { image: face(fill) }),
}))

/** The signed-in person of every preview. */
export const SELF = 'u-0'

export const identityDirectory = {
  kinds: [
    { key: IDENTITY, name: 'Identity' },
    { key: USER, name: 'People', extends: [IDENTITY] },
    { key: GROUP, name: 'Groups', extends: [IDENTITY] },
    { key: ROLE, name: 'Roles', extends: [IDENTITY] },
    { key: SERVICE_ACCOUNT, name: 'Service accounts', extends: [IDENTITY] },
  ],
  identities: [
    ...users,
    { id: 'u-pending', class: USER, detail: 'invited, not signed in yet' },
    { id: 'g-eng', class: GROUP, name: 'Engineering', detail: '6 members' },
    { id: 'g-kernel', class: GROUP, name: 'Kernel team', detail: '3 members' },
    { id: 'g-ops', class: GROUP, name: 'Operations', detail: '2 members' },
    { id: 'r-admin', class: ROLE, name: 'workspace.admin', detail: 'Administers the workspace' },
    { id: 'r-member', class: ROLE, name: 'workspace.member', detail: 'Uses the workspace' },
    { id: 's-ci', class: SERVICE_ACCOUNT, name: 'CI deployer', detail: 'Signs in with a key pair' },
  ],
  memberships: [
    ['u-0', 'g-eng'],
    ['u-1', 'g-eng'],
    ['u-4', 'g-eng'],
    ['u-11', 'g-eng'],
    ['g-kernel', 'g-eng'],
    ['g-ops', 'g-eng'],
    ['u-4', 'g-kernel'],
    ['u-5', 'g-kernel'],
    ['u-13', 'g-kernel'],
    ['u-7', 'g-ops'],
    ['u-12', 'g-ops'],
    ['u-0', 'r-admin'],
    ['g-eng', 'r-member'],
  ],
} as const

export const identitySource: IdentityFinderSource = createMemoryIdentitySource({
  ...identityDirectory,
  latency: 150,
})

/** A source that fails every read, to show the error states. */
export const failingIdentitySource: IdentityFinderSource = {
  async kinds() {
    throw new Error('The directory is unreachable.')
  },
  async identities() {
    throw new Error('The directory is unreachable.')
  },
}
