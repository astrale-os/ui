import type { FinderChoice, FinderPlace } from '@astrale-os/ui/finder'

import { useState } from 'react'

import { finderSource } from './finder.fixture.js'
import { NodeBrowser } from './node-browser.js'

export const preview = { canvas: 'wide' } as const

export default function NodeBrowserPreview() {
  const [place, setPlace] = useState<FinderPlace>({
    domain: 'product',
    classes: ['product:Product', 'product:Area'],
  })
  const [chosen, setChosen] = useState<readonly FinderChoice[]>([])
  return (
    <div className="grid w-full gap-3">
      <NodeBrowser
        source={finderSource}
        maximum={8}
        defaultPlace={place}
        onPlaceChange={setPlace}
        onConfirm={setChosen}
        onCancel={() => setChosen([])}
        className="h-[36rem] overflow-hidden rounded-xl border"
      />
      <p className="text-xs text-muted-foreground">
        {chosen.length === 0
          ? 'Nothing selected yet.'
          : `Selected: ${chosen.map((item) => item.name).join(', ')}`}
      </p>
    </div>
  )
}
