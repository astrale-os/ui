import { useState } from 'react'

import { ResponsiveWorkspaceShell } from './responsive-workspace.js'

export default function ResponsiveWorkspaceShellPreview() {
  const [active, setActive] = useState('catalog')
  return (
    <ResponsiveWorkspaceShell
      title="Astrale UI"
      panels={[
        { id: 'catalog', label: 'Catalog', content: <p>Complete live catalog.</p> },
        { id: 'themes', label: 'Themes', content: <p>Portable theme workspace.</p> },
      ]}
      activePanel={active}
      onActivePanelChange={setActive}
    />
  )
}
