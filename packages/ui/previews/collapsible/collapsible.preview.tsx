import { Button } from '@astrale-os/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@astrale-os/ui/collapsible'
import { useState } from 'react'

export const preview = { source: '@shadcn/collapsible' } as const

export default function CollapsiblePreview() {
  const [open, setOpen] = useState(false)
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger render={<Button variant="outline" />}>
        {open ? 'Hide details' : 'Show details'}
      </CollapsibleTrigger>
      <CollapsibleContent className="collapsible-copy">
        Stateful behavior stays in the component owner.
      </CollapsibleContent>
    </Collapsible>
  )
}
