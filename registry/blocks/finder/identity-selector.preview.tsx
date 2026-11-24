import type { IdentityChoice } from '@astrale-os/ui/identity-finder'

import { Button } from '@astrale-os/ui/button'
import { useState } from 'react'

import { IdentitySelector } from './identity-selector.js'
import { identitySource, SELF, USER } from './identity.fixture.js'

export default function IdentitySelectorPreview() {
  const [open, setOpen] = useState<'one' | 'many' | undefined>()
  const [chosen, setChosen] = useState<readonly IdentityChoice[]>([])
  return (
    <div
      data-slot="block-finder-identity-selector-preview"
      className="flex flex-col items-start gap-3"
    >
      <div data-slot="block-finder-identity-selector-preview-actions" className="flex gap-2">
        <Button variant="outline" onClick={() => setOpen('one')}>
          Assign someone…
        </Button>
        <Button variant="outline" onClick={() => setOpen('many')}>
          Add members…
        </Button>
      </div>
      <p
        data-slot="block-finder-identity-selector-preview-result"
        className="text-xs text-muted-foreground"
      >
        {chosen.length === 0
          ? 'Nobody selected yet.'
          : `Selected: ${chosen.map((item) => item.name).join(', ')}`}
      </p>
      <IdentitySelector
        open={open !== undefined}
        source={identitySource}
        self={SELF}
        {...(open === 'one'
          ? { accepts: [USER], title: 'Assign' }
          : { maximum: 8, title: 'Add members' })}
        onConfirm={(choices) => {
          setChosen(choices)
          setOpen(undefined)
        }}
        onCancel={() => setOpen(undefined)}
      />
    </div>
  )
}
