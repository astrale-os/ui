import assert from 'node:assert/strict'

const revisions = new Map([
  [
    'button',
    {
      notes: [
        'Bind default, small, large, and icon dimensions to the public Astrale control-height tokens so render-composed buttons keep themed geometry.',
        'Expose the admitted Button size as data-size after semantic trigger composition.',
        'Bind control transition duration to the Astrale fast motion token.',
      ],
      replacements: [
        [
          'transition-all outline-none',
          'transition-all duration-[var(--ui-motion-fast)] outline-none',
        ],
        ['h-8 gap-1.5 px-2.5', 'h-(--ui-control-height) gap-1.5 px-2.5'],
        [
          'h-7 gap-1 rounded-[min(var(--radius-md),12px)]',
          'h-(--ui-control-height-sm) gap-1 rounded-[min(var(--radius-md),12px)]',
        ],
        ['h-9 gap-1.5 px-2.5', 'h-(--ui-control-height-lg) gap-1.5 px-2.5'],
        ['size-8', 'size-(--ui-control-height)'],
        [
          'size-7 rounded-[min(var(--radius-md),12px)]',
          'size-(--ui-control-height-sm) rounded-[min(var(--radius-md),12px)]',
        ],
        ['size-9', 'size-(--ui-control-height-lg)'],
        [
          'data-slot="button"\n      className=',
          'data-slot="button"\n      data-size={size}\n      className=',
        ],
      ],
    },
  ],
  [
    'input',
    {
      notes: [
        'Bind the Input height and transition duration to the public Astrale control and motion tokens so composed input slots retain themed geometry.',
      ],
      replacements: [
        [
          'h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none',
          'h-(--ui-control-height) w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors duration-[var(--ui-motion-fast)] outline-none',
        ],
      ],
    },
  ],
  [
    'input-group',
    {
      notes: [
        'Bind the Input Group wrapper height and transition duration to the public Astrale control and motion tokens.',
        'Route the Input Group action size through Button so its local compact variants keep their intended dimensions without a slot-based minimum.',
      ],
      replacements: [
        [
          'group/input-group relative flex h-8 w-full min-w-0 items-center rounded-lg border border-input transition-colors outline-none',
          'group/input-group relative flex h-(--ui-control-height) w-full min-w-0 items-center rounded-lg border border-input transition-colors duration-[var(--ui-motion-fast)] outline-none',
        ],
        [
          'type={type}\n      data-size={size}\n      variant={variant}',
          'type={type}\n      variant={variant}\n      size={size}',
        ],
      ],
    },
  ],
  [
    'native-select',
    {
      notes: [
        'Bind default and small Native Select heights and transition duration to the public Astrale control and motion tokens.',
      ],
      replacements: [
        [
          'h-8 w-full min-w-0 appearance-none rounded-lg border border-input bg-transparent py-1 pr-8 pl-2.5 text-sm transition-colors outline-none',
          'h-(--ui-control-height) w-full min-w-0 appearance-none rounded-lg border border-input bg-transparent py-1 pr-8 pl-2.5 text-sm transition-colors duration-[var(--ui-motion-fast)] outline-none',
        ],
        ['data-[size=sm]:h-7', 'data-[size=sm]:h-(--ui-control-height-sm)'],
      ],
    },
  ],
  [
    'select',
    {
      notes: [
        'Bind default and small Select Trigger heights and transition duration to the public Astrale control and motion tokens.',
      ],
      replacements: [
        [
          'text-sm whitespace-nowrap transition-colors outline-none',
          'text-sm whitespace-nowrap transition-colors duration-[var(--ui-motion-fast)] outline-none',
        ],
        [
          'data-[size=default]:h-8 data-[size=sm]:h-7',
          'data-[size=default]:h-(--ui-control-height) data-[size=sm]:h-(--ui-control-height-sm)',
        ],
      ],
    },
  ],
])

function replaceExactly(content, from, to, label) {
  assert.equal(content.split(from).length - 1, 1, `${label} must match exactly once`)
  return content.replace(from, to)
}

export function shadcnControlRevision(name) {
  const revision = revisions.get(name)
  return revision ? { adaptation: 'astrale-revision', notes: revision.notes } : undefined
}

export function adaptShadcnControlSizing(name, content) {
  const revision = revisions.get(name)
  if (!revision) return content
  return revision.replacements.reduce(
    (adapted, [upstream, astrale], index) =>
      replaceExactly(adapted, upstream, astrale, `@shadcn/${name} adaptation ${index + 1}`),
    content,
  )
}

export function restoreShadcnControlSizing(name, content) {
  const revision = revisions.get(name)
  if (!revision) return content
  return [...revision.replacements]
    .reverse()
    .reduce(
      (restored, [upstream, astrale], index) =>
        replaceExactly(
          restored,
          astrale,
          upstream,
          `@shadcn/${name} reverse adaptation ${revision.replacements.length - index}`,
        ),
      content,
    )
}
