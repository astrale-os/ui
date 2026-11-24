import {
  createMemoryFinderSource,
  type FinderImage,
  type FinderMemoryClass,
  type FinderMemoryGraph,
  type FinderNode,
  type FinderProperty,
  type FinderSource,
} from '@astrale-os/ui/finder'

function image(markup: string): string {
  return `data:image/svg+xml,${encodeURIComponent(markup)}`
}

function tile(fill: string, body: string, ink = '#ffffff'): string {
  return image(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="${fill}"/><g fill="none" stroke="${ink}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${body}</g></svg>`,
  )
}

function icon(light: string, dark: string, body: string): FinderImage {
  return { src: tile(light, body), dark: tile(dark, body, '#0b1020') }
}

const name: FinderProperty = { key: 'name', label: 'Name', kind: 'text' }
const updated: FinderProperty = { key: 'updated', label: 'Updated', kind: 'instant' }

export const NAMED = 'kernel:Named'

const classes: Record<string, FinderMemoryClass[]> = {
  kernel: [
    {
      key: NAMED,
      name: 'Named',
      description: 'Anything with a name',
      abstract: true,
      properties: [name],
      nameProperty: 'name',
    },
  ],
  product: [
    {
      key: 'product:Catalog',
      name: 'Catalog',
      description: 'A set of Products',
      icon: icon('#4f46e5', '#a5b4fc', '<path d="M7 7h10M7 12h10M7 17h6"/>'),
      extends: [NAMED],
      properties: [name, updated],
      nameProperty: 'name',
    },
    {
      key: 'product:Product',
      name: 'Product',
      description: 'Something Astrale ships',
      icon: icon('#0f766e', '#5eead4', '<path d="M12 5l7 4v6l-7 4-7-4V9z"/>'),
      extends: [NAMED],
      properties: [
        name,
        { key: 'stage', label: 'Stage', kind: 'choice', choices: ['Idea', 'Beta', 'Live'] },
        updated,
      ],
      nameProperty: 'name',
    },
    {
      key: 'product:Area',
      name: 'Area',
      description: 'A part of a Product',
      extends: [NAMED],
      properties: [
        name,
        { key: 'stage', label: 'Stage', kind: 'choice', choices: ['Idea', 'Beta', 'Live'] },
        updated,
      ],
      nameProperty: 'name',
    },
  ],
  issues: [
    {
      key: 'issues:Issue',
      name: 'Issue',
      description: 'Work to do, tracked to the end',
      icon: icon('#b45309', '#fcd34d', '<circle cx="12" cy="12" r="5"/>'),
      extends: [NAMED],
      properties: [
        name,
        {
          key: 'status',
          label: 'Status',
          kind: 'choice',
          choices: ['Open', 'In progress', 'Done'],
        },
        { key: 'priority', label: 'Priority', kind: 'number' },
        updated,
        { key: 'archived', label: 'Archived', kind: 'boolean' },
      ],
      nameProperty: 'name',
    },
    {
      key: 'issues:Topic',
      name: 'Topic',
      description: 'Issues grouped by subject',
      icon: icon('#be185d', '#f9a8d4', '<path d="M7 9h10M7 15h10M10 6l-1 12M15 6l-1 12"/>'),
      extends: [NAMED],
      properties: [name, updated],
      nameProperty: 'name',
    },
  ],
  people: [
    {
      key: 'people:Person',
      name: 'Person',
      description: 'Someone who signs in',
      icon: icon(
        '#0369a1',
        '#7dd3fc',
        '<circle cx="12" cy="9" r="3"/><path d="M6.5 18a5.5 5.5 0 0 1 11 0"/>',
      ),
      extends: [NAMED],
      properties: [
        name,
        { key: 'email', label: 'Email', kind: 'text' },
        { key: 'joined', label: 'Joined', kind: 'instant' },
      ],
      nameProperty: 'name',
    },
    {
      key: 'people:Group',
      name: 'Group',
      description: 'People given access together',
      properties: [{ key: 'members', label: 'Members', kind: 'number' }],
    },
  ],
}

const start = Date.UTC(2026, 9, 1)
const day = 86_400_000

function at(index: number): string {
  return new Date(start + ((index * 7) % 53) * day + (index % 9) * 3_600_000).toISOString()
}

let sequence = 0
function node(nodeClass: string, values: Record<string, unknown>): FinderNode {
  sequence += 1
  const id = `${nodeClass.split(':')[1]!.toLowerCase()}-${sequence}`
  return typeof values['name'] === 'string'
    ? { id, class: nodeClass, name: values['name'], values }
    : { id, class: nodeClass, values }
}

const products = ['Shell', 'Views', 'Kernel', 'Studio', 'Console']
const areas = [
  'Intents',
  'Navigation',
  'Graph reads',
  'Access',
  'Billing',
  'Installs',
  'Search',
  'Notifications',
  'Identity',
  'A deliberately long Area name that does not fit in its row',
]
const topics = ['Onboarding', 'Performance', 'Accessibility', 'Security', 'Pricing', 'Migrations']
const people = [
  'Ada Moreau',
  'Bilal Haddad',
  'Chloé Martin',
  'Dmitri Volkov',
  'Elena García',
  'Farid Benali',
  'Grace Liu',
  'Hugo Lefèvre',
  'Inès Dubois',
  'Jonas Berg',
  'Kenji Watanabe',
  'Léa Rousseau',
]
const verbs = ['Show', 'Fix', 'Explain', 'Speed up', 'Remember', 'Group', 'Sort', 'Name']
const subjects = [
  'the path bar',
  'unnamed Nodes',
  'the tray',
  'Domain icons',
  'paging',
  'the preview',
  'filters',
  'counts',
]
const statuses = ['Open', 'In progress', 'Done']

const nodes: FinderNode[] = [
  node('product:Catalog', { name: 'Astrale Catalog', updated: at(1) }),
  ...products.map((item, index) =>
    node('product:Product', {
      name: item,
      stage: index < 3 ? 'Live' : 'Beta',
      updated: at(index + 2),
    }),
  ),
  ...areas.map((item, index) =>
    node('product:Area', {
      name: item,
      stage: ['Idea', 'Beta', 'Live'][index % 3],
      updated: at(index + 9),
    }),
  ),
  ...Array.from({ length: 150 }, (_, index) =>
    node('issues:Issue', {
      name: `PRD-${index + 1} ${verbs[index % verbs.length]} ${subjects[(index * 3) % subjects.length]}`,
      status: statuses[index % 3],
      ...(index % 5 === 4 ? {} : { priority: (index % 4) + 1 }),
      updated: at(index),
      archived: index % 11 === 0,
    }),
  ),
  ...topics.map((item, index) => node('issues:Topic', { name: item, updated: at(index + 40) })),
  ...people.map((item, index) =>
    node('people:Person', {
      name: item,
      email: `${item.split(' ')[0]!.toLowerCase()}@example.com`,
      joined: at(index * 5),
    }),
  ),
  node('people:Group', { members: 4 }),
  node('people:Group', { members: 12 }),
  node('people:Group', { members: 2 }),
]

export const finderGraph: FinderMemoryGraph = {
  domains: [
    {
      id: 'product',
      name: 'Product',
      origin: 'product.example',
      icon: icon('#4f46e5', '#a5b4fc', '<path d="M8 8h8v8H8z"/>'),
    },
    {
      id: 'issues',
      name: 'Issues',
      origin: 'issues.example',
      icon: icon('#b45309', '#fcd34d', '<circle cx="12" cy="12" r="4"/>'),
    },
    { id: 'people', name: 'People', origin: 'people.example' },
    { id: 'kernel', name: 'Kernel', origin: 'kernel.example' },
  ],
  classes,
  nodes,
}

/** The fixture graph, with the delay of a real read so loading states show. */
export const finderSource: FinderSource = createMemoryFinderSource({ ...finderGraph, latency: 220 })

/** A source whose every read fails, for the error states. */
export const failingFinderSource: FinderSource = {
  ...finderSource,
  async domains() {
    await new Promise((resolve) => setTimeout(resolve, 220))
    throw new Error('The graph could not be read.')
  },
}
