import {
  IdentityAvatar,
  IdentityFinder,
  IdentityFinderCancel,
  IdentityFinderConfirm,
  IdentityFinderInput,
  IdentityFinderList,
  IdentityFinderOption,
  createMemoryIdentitySource,
  useIdentityFinder,
} from '@astrale-os/ui/identity-finder'

const source = createMemoryIdentitySource({
  kinds: [
    { key: 'kernel:Identity', name: 'Identity' },
    { key: 'shell:User', name: 'People', extends: ['kernel:Identity'] },
    { key: 'shell:Group', name: 'Groups', extends: ['kernel:Identity'] },
  ],
  identities: [
    {
      id: 'u1',
      class: 'shell:User',
      name: 'Ada Lovelace',
      detail: 'ada@example.com',
      keywords: ['ada@example.com'],
    },
    {
      id: 'u2',
      class: 'shell:User',
      name: 'Alan Turing',
      detail: 'alan@example.com',
      keywords: ['alan@example.com'],
    },
    {
      id: 'u3',
      class: 'shell:User',
      name: 'Grace Hopper',
      detail: 'grace@example.com',
      keywords: ['grace@example.com'],
    },
    { id: 'g1', class: 'shell:Group', name: 'Engineering' },
  ],
  memberships: [
    ['u1', 'g1'],
    ['u2', 'g1'],
  ],
})

function Rows() {
  const finder = useIdentityFinder()
  return (
    <IdentityFinderList aria-label="People and groups" className="overflow-y-auto p-1 outline-none">
      {finder.path.length > 0 ? (
        <button
          type="button"
          className="px-2 text-xs text-muted-foreground"
          onClick={() => finder.goTo(0)}
        >
          ← {finder.path.map((identity) => identity.name).join(' › ')}
        </button>
      ) : null}
      {finder.rows.map((row) => (
        <IdentityFinderOption
          key={row.key}
          row={row}
          className="flex cursor-default items-center gap-2 rounded px-2 py-1 data-active:bg-muted data-chosen:font-medium data-disabled:opacity-50"
        >
          {row.type === 'kind' ? (
            `Show every ${row.kind.name}`
          ) : (
            <>
              <IdentityAvatar
                {...(row.identity.name === undefined ? {} : { name: row.identity.name })}
                className="grid size-6 place-items-center rounded-full bg-muted text-[10px]"
              />
              <span className="flex-1 truncate">{row.identity.name}</span>
              {row.identity.members ? (
                <button
                  type="button"
                  className="text-xs"
                  onClick={(event) => {
                    event.stopPropagation()
                    finder.open(row.identity)
                  }}
                >
                  →
                </button>
              ) : null}
            </>
          )}
        </IdentityFinderOption>
      ))}
    </IdentityFinderList>
  )
}

/** The headless identity finder with a minimal look of the host's own; `block/finder/identity-*` is the full one. */
export default function IdentityFinderPreview() {
  return (
    <IdentityFinder
      source={source}
      maximum={3}
      searchDelay={0}
      onConfirm={() => undefined}
      onCancel={() => undefined}
      className="grid h-72 w-full max-w-sm grid-rows-[auto_1fr_auto] overflow-hidden rounded-lg border text-sm"
    >
      <IdentityFinderInput
        aria-label="Search"
        placeholder="Search by name or email"
        className="border-b px-3 py-2 outline-none"
      />
      <Rows />
      <div className="flex justify-end gap-2 border-t p-2">
        <IdentityFinderCancel className="rounded border px-2 py-1">Cancel</IdentityFinderCancel>
        <IdentityFinderConfirm className="rounded bg-primary px-2 py-1 text-primary-foreground disabled:opacity-50">
          Select
        </IdentityFinderConfirm>
      </div>
    </IdentityFinder>
  )
}
