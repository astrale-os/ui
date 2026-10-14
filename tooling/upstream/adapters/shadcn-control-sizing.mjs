import assert from 'node:assert/strict'

const revisions = new Map([
  [
    'badge',
    {
      notes: [
        'Add success, info, and warning variants with the soft treatment of destructive, bound to the Astrale status color tokens.',
      ],
      replacements: [
        [
          "[a]:hover:bg-destructive/20',\n",
          "[a]:hover:bg-destructive/20',\n" +
            '        success:\n' +
            "          'bg-success/10 text-success focus-visible:ring-success/20 dark:bg-success/20 dark:focus-visible:ring-success/40 [a]:hover:bg-success/20',\n" +
            "        info: 'bg-info/10 text-info focus-visible:ring-info/20 dark:bg-info/20 dark:focus-visible:ring-info/40 [a]:hover:bg-info/20',\n" +
            '        warning:\n' +
            "          'bg-warning/10 text-warning focus-visible:ring-warning/20 dark:bg-warning/20 dark:focus-visible:ring-warning/40 [a]:hover:bg-warning/20',\n",
        ],
      ],
    },
  ],
  [
    'button',
    {
      notes: [
        'Bind neutral control text to the foreground token instead of inheriting card or popover text across a different input surface.',
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
        [
          'border-border bg-background hover:bg-muted',
          'border-border bg-background text-foreground hover:bg-muted',
        ],
      ],
    },
  ],
  [
    'input',
    {
      notes: [
        'Bind neutral control text to the foreground token instead of inheriting card or popover text across a different input surface.',
        'Bind the Input height and transition duration to the public Astrale control and motion tokens so composed input slots retain themed geometry.',
      ],
      replacements: [
        [
          'h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none',
          'h-(--ui-control-height) w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors duration-[var(--ui-motion-fast)] outline-none',
        ],
        ['py-1 text-base transition-colors', 'py-1 text-base text-foreground transition-colors'],
      ],
    },
  ],
  [
    'input-group',
    {
      notes: [
        'Bind neutral control text to the foreground token instead of inheriting card or popover text across a different input surface.',
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
        [
          'border border-input transition-colors',
          'border border-input text-foreground transition-colors',
        ],
      ],
    },
  ],
  [
    'native-select',
    {
      notes: [
        'Bind neutral control text to the foreground token instead of inheriting card or popover text across a different input surface.',
        'Bind default and small Native Select heights and transition duration to the public Astrale control and motion tokens.',
      ],
      replacements: [
        [
          'h-8 w-full min-w-0 appearance-none rounded-lg border border-input bg-transparent py-1 pr-8 pl-2.5 text-sm transition-colors outline-none',
          'h-(--ui-control-height) w-full min-w-0 appearance-none rounded-lg border border-input bg-transparent py-1 pr-8 pl-2.5 text-sm transition-colors duration-[var(--ui-motion-fast)] outline-none',
        ],
        ['data-[size=sm]:h-7', 'data-[size=sm]:h-(--ui-control-height-sm)'],
        ['pl-2.5 text-sm transition-colors', 'pl-2.5 text-sm text-foreground transition-colors'],
      ],
    },
  ],
  [
    'select',
    {
      notes: [
        'Bind neutral control text to the foreground token instead of inheriting card or popover text across a different input surface.',
        'Bind default and small Select Trigger heights and transition duration to the public Astrale control and motion tokens.',
        'Bind the floating layer to the public --ui-z-floating token (50, the upstream value) so floating elements keep stacking by mount order while the toast viewport sits above them.',
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
        ['pl-2.5 text-sm whitespace-nowrap', 'pl-2.5 text-sm text-foreground whitespace-nowrap'],
        ['className="isolate z-50"', 'className="isolate z-(--ui-z-floating)"'],
        [
          'isolate z-50 max-h-(--available-height)',
          'isolate z-(--ui-z-floating) max-h-(--available-height)',
        ],
      ],
    },
  ],
  [
    'textarea',
    {
      notes: [
        'Bind neutral control text to the foreground token instead of inheriting card or popover text across a different input surface.',
      ],
      replacements: [
        ['py-2 text-base transition-colors', 'py-2 text-base text-foreground transition-colors'],
      ],
    },
  ],
  [
    'input-otp',
    {
      notes: [
        'Bind neutral control text to the foreground token instead of inheriting card or popover text across a different input surface.',
      ],
      replacements: [
        [
          'border-input text-sm transition-all',
          'border-input text-sm text-foreground transition-all',
        ],
      ],
    },
  ],
  [
    'alert-dialog',
    {
      notes: [
        'Bind the floating layer to the public --ui-z-floating token (50, the upstream value) so floating elements keep stacking by mount order while the toast viewport sits above them.',
      ],
      replacements: [
        ['isolate z-50 bg-black/10', 'isolate z-(--ui-z-floating) bg-black/10'],
        ['left-1/2 z-50 grid', 'left-1/2 z-(--ui-z-floating) grid'],
      ],
    },
  ],
  [
    'context-menu',
    {
      notes: [
        'Bind the floating layer to the public --ui-z-floating token (50, the upstream value) so floating elements keep stacking by mount order while the toast viewport sits above them.',
      ],
      replacements: [
        ['isolate z-50 outline-none', 'isolate z-(--ui-z-floating) outline-none'],
        ["'z-50 max-h-(--available-height)", "'z-(--ui-z-floating) max-h-(--available-height)"],
      ],
    },
  ],
  [
    'dialog',
    {
      notes: [
        'Bind the floating layer to the public --ui-z-floating token (50, the upstream value) so floating elements keep stacking by mount order while the toast viewport sits above them.',
      ],
      replacements: [
        ['isolate z-50 bg-black/10', 'isolate z-(--ui-z-floating) bg-black/10'],
        ['left-1/2 z-50 grid', 'left-1/2 z-(--ui-z-floating) grid'],
      ],
    },
  ],
  [
    'drawer',
    {
      notes: [
        'Bind the floating layer to the public --ui-z-floating token (50, the upstream value) so floating elements keep stacking by mount order while the toast viewport sits above them.',
      ],
      replacements: [
        ['inset-0 z-50 min-h-dvh', 'inset-0 z-(--ui-z-floating) min-h-dvh'],
        ['inset-0 z-50 select-none', 'inset-0 z-(--ui-z-floating) select-none'],
        ['fixed z-50 m-(--drawer-inset,0px)', 'fixed z-(--ui-z-floating) m-(--drawer-inset,0px)'],
      ],
    },
  ],
  [
    'dropdown-menu',
    {
      notes: [
        'Bind the floating layer to the public --ui-z-floating token (50, the upstream value) so floating elements keep stacking by mount order while the toast viewport sits above them.',
      ],
      replacements: [
        ['isolate z-50 outline-none', 'isolate z-(--ui-z-floating) outline-none'],
        ["'z-50 max-h-(--available-height)", "'z-(--ui-z-floating) max-h-(--available-height)"],
      ],
    },
  ],
  [
    'hover-card',
    {
      notes: [
        'Bind the floating layer to the public --ui-z-floating token (50, the upstream value) so floating elements keep stacking by mount order while the toast viewport sits above them.',
      ],
      replacements: [
        ['className="isolate z-50"', 'className="isolate z-(--ui-z-floating)"'],
        ["'z-50 w-64", "'z-(--ui-z-floating) w-64"],
      ],
    },
  ],
  [
    'navigation-menu',
    {
      notes: [
        'Bind the floating layer to the public --ui-z-floating token (50, the upstream value) so floating elements keep stacking by mount order while the toast viewport sits above them.',
      ],
      replacements: [
        [
          'isolate z-50 h-(--positioner-height)',
          'isolate z-(--ui-z-floating) h-(--positioner-height)',
        ],
      ],
    },
  ],
  [
    'popover',
    {
      notes: [
        'Bind the floating layer to the public --ui-z-floating token (50, the upstream value) so floating elements keep stacking by mount order while the toast viewport sits above them.',
      ],
      replacements: [
        ['className="isolate z-50"', 'className="isolate z-(--ui-z-floating)"'],
        ["'z-50 flex", "'z-(--ui-z-floating) flex"],
      ],
    },
  ],
  [
    'sheet',
    {
      notes: [
        'Bind the floating layer to the public --ui-z-floating token (50, the upstream value) so floating elements keep stacking by mount order while the toast viewport sits above them.',
      ],
      replacements: [
        ['inset-0 z-50 bg-black/10', 'inset-0 z-(--ui-z-floating) bg-black/10'],
        ['fixed z-50 flex', 'fixed z-(--ui-z-floating) flex'],
      ],
    },
  ],
  [
    'toast',
    {
      notes: [
        'Bind the toast viewport to the public --ui-z-toast token, above --ui-z-floating, so a toast raised while a modal dialog is open renders above its backdrop instead of under it.',
      ],
      replacements: [['bottom-4 z-50 mx-auto', 'bottom-4 z-(--ui-z-toast) mx-auto']],
    },
  ],
  [
    'tooltip',
    {
      notes: [
        'Bind the floating layer to the public --ui-z-floating token (50, the upstream value) so floating elements keep stacking by mount order while the toast viewport sits above them.',
      ],
      replacements: [
        ['className="isolate z-50"', 'className="isolate z-(--ui-z-floating)"'],
        ["'z-50 inline-flex", "'z-(--ui-z-floating) inline-flex"],
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
