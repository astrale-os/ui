import { Button } from '@astrale-os/ui/button'
import { useState } from 'react'

import { DetailsPanel } from './details-panel.js'

export default function DetailsPanelPreview() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        Open details
      </Button>
      <DetailsPanel
        open={open}
        title="Observatory"
        description="Domain details"
        fields={[
          { label: 'Status', value: 'Ready' },
          { label: 'Revision', value: 'a02fa1' },
        ]}
        canEdit
        onOpenChange={setOpen}
        onEdit={() => undefined}
        onDelete={() => undefined}
      />
    </>
  )
}
