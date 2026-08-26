import { useState } from 'react'

import { MobileSidebarControlled } from './mobile-controlled.js'

export default function MobileSidebarControlledPreview() {
  const [open, setOpen] = useState(false)
  return (
    <MobileSidebarControlled
      open={open}
      links={[
        { id: 'catalog', label: 'Catalog' },
        { id: 'themes', label: 'Themes' },
      ]}
      onOpenChange={setOpen}
      onNavigate={() => undefined}
    />
  )
}
