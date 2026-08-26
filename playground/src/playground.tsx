import { Button } from '@astrale-os/ui/button'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@astrale-os/ui/drawer'
import { Toaster } from '@astrale-os/ui/toast'
import { useState } from 'react'

import { Catalog } from './catalog/catalog.js'
import { ThemeStudio } from './theme/studio.js'
import { useThemeWorkspace } from './theme/workspace.js'

export function Playground() {
  const workspace = useThemeWorkspace()
  const [mode, setMode] = useState<'light' | 'dark'>('light')

  return (
    <Toaster>
      <style data-slot="live-theme-css">{workspace.css}</style>
      <div
        data-slot="ui-playground"
        data-ui-theme={workspace.theme.name}
        className={mode === 'dark' ? 'dark playground-root' : 'playground-root'}
      >
        <div className="playground-layout">
          <main id="playground-main" className="playground-main">
            <Catalog />
          </main>
        </div>

        <Drawer swipeDirection="right" showSwipeHandle>
          <DrawerTrigger className="theme-drawer-trigger" render={<Button />}>
            Customize theme
          </DrawerTrigger>
          <DrawerContent className="theme-drawer-popup">
            <DrawerHeader className="theme-drawer-header">
              <DrawerTitle className="sr-only">Theme customizer</DrawerTitle>
              <DrawerDescription className="sr-only">
                Customize the live theme while inspecting the component catalog.
              </DrawerDescription>
              <DrawerClose render={<Button variant="outline" size="sm" />}>Close</DrawerClose>
            </DrawerHeader>
            <div className="theme-panel" aria-label="Theme generator">
              <ThemeStudio workspace={workspace} mode={mode} onModeChange={setMode} />
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    </Toaster>
  )
}
