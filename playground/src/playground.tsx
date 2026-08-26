import { Toaster } from '@astrale-os/ui'
import { useState } from 'react'

import { ComponentSpecimens } from './catalog/component-specimens.js'
import { RegistrySpecimens } from './catalog/registry-specimens.js'
import { ThemeStudio } from './theme/studio.js'
import { useThemeWorkspace } from './theme/workspace.js'

export function Playground() {
  const workspace = useThemeWorkspace()
  const [mode, setMode] = useState<'light' | 'dark'>('light')

  return (
    <Toaster position="top-right" timeout={2000}>
      <style data-slot="live-theme-css">{workspace.css}</style>
      <div
        data-slot="ui-playground"
        data-ui-theme={workspace.theme.name}
        className={mode === 'dark' ? 'dark playground-root' : 'playground-root'}
      >
        <div className="playground-layout">
          <main id="playground-main" className="playground-main">
            <ComponentSpecimens />
            <RegistrySpecimens />
          </main>

          <aside className="theme-panel" aria-label="Theme generator">
            <ThemeStudio workspace={workspace} mode={mode} onModeChange={setMode} />
          </aside>
        </div>
      </div>
    </Toaster>
  )
}
