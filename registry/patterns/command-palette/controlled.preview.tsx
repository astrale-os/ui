import { Button } from '@astrale-os/ui/button'
import { useState } from 'react'

import { CommandPaletteControlled } from './controlled.js'

export default function CommandPaletteControlledPreview() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        Open controlled palette
      </Button>
      <CommandPaletteControlled
        open={open}
        query={query}
        groups={[
          {
            label: 'Actions',
            actions: [
              { id: 'open', label: 'Open Domain' },
              { id: 'inspect', label: 'Inspect Schema' },
            ],
          },
        ]}
        onOpenChange={setOpen}
        onQueryChange={setQuery}
        onAction={() => setOpen(false)}
      />
    </>
  )
}
