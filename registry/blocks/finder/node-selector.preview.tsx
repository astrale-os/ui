import type { FinderChoice } from '@astrale-os/ui/finder'

import { Button } from '@astrale-os/ui/button'
import { useState } from 'react'

import { finderSource } from './finder.fixture.js'
import { NodeSelector } from './node-selector.js'

export default function NodeSelectorPreview() {
  const [open, setOpen] = useState(false)
  const [chosen, setChosen] = useState<readonly FinderChoice[]>([])
  return (
    <div className="flex flex-col items-start gap-3">
      <Button variant="outline" onClick={() => setOpen(true)}>
        Select…
      </Button>
      <p className="text-xs text-muted-foreground">
        {chosen.length === 0
          ? 'Nothing selected yet.'
          : `Selected: ${chosen.map((item) => item.name).join(', ')}`}
      </p>
      <NodeSelector
        open={open}
        source={finderSource}
        maximum={8}
        onConfirm={(choices) => {
          setChosen(choices)
          setOpen(false)
        }}
        onCancel={() => setOpen(false)}
      />
    </div>
  )
}
