import { useState } from 'react'

import { ApplicationShellSidebarHeader } from './sidebar-header.js'

export default function ApplicationShellSidebarHeaderPreview() {
  const [current, setCurrent] = useState('catalog')
  return (
    <ApplicationShellSidebarHeader
      navigation={[
        { id: 'catalog', label: 'Catalog' },
        { id: 'themes', label: 'Themes' },
      ]}
      current={current}
      identity="Alicia Koch"
      onNavigate={setCurrent}
      onIdentityAction={() => undefined}
    >
      <p>Inspect the selected workspace.</p>
    </ApplicationShellSidebarHeader>
  )
}
