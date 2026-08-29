import { Button } from '@astrale-os/ui/button'
import { Toaster } from '@astrale-os/ui/toast'
import {
  lazy,
  Suspense,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react'

import { themeStyleProperties } from '../../tooling/theme-document/index.js'
import { Catalog } from './catalog/catalog.js'
import { useThemeWorkspace } from './theme/workspace.js'

const loadThemeStudio = () =>
  import('./theme/studio.js').then((module) => ({ default: module.ThemeStudio }))
const ThemeStudio = lazy(loadThemeStudio)

function prefetchThemeStudio() {
  void loadThemeStudio()
}

function useThemeStudioPrefetch() {
  useEffect(() => {
    if (typeof window.requestIdleCallback === 'function') {
      const request = window.requestIdleCallback(prefetchThemeStudio, { timeout: 1_500 })
      return () => window.cancelIdleCallback(request)
    }
    const timeout = window.setTimeout(prefetchThemeStudio, 250)
    return () => window.clearTimeout(timeout)
  }, [])
}

function useLiveTheme(
  rootRef: RefObject<HTMLDivElement | null>,
  theme: ReturnType<typeof useThemeWorkspace>['theme'],
  mode: 'light' | 'dark',
) {
  const appliedProperties = useRef<Readonly<Record<string, string>>>({})

  useLayoutEffect(() => {
    const root = rootRef.current
    const documentRoot = document.documentElement
    const nextProperties = themeStyleProperties(theme, mode)
    for (const [name, value] of Object.entries(nextProperties)) {
      if (appliedProperties.current[name] !== value) documentRoot.style.setProperty(name, value)
    }
    appliedProperties.current = nextProperties

    documentRoot.style.colorScheme = mode
    documentRoot.classList.toggle('dark', mode === 'dark')
    root?.classList.toggle('dark', mode === 'dark')
    if (root) root.dataset.uiTheme = theme.name
  }, [mode, rootRef, theme])
}

function ThemeInspector({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return
      event.preventDefault()
      setOpen(false)
      window.requestAnimationFrame(() => triggerRef.current?.focus({ preventScroll: true }))
    }
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [open])

  const close = () => {
    setOpen(false)
    window.requestAnimationFrame(() => triggerRef.current?.focus({ preventScroll: true }))
  }

  return (
    <>
      <Button
        ref={triggerRef}
        className="theme-drawer-trigger"
        aria-controls="theme-customizer"
        aria-expanded={open}
        aria-haspopup="dialog"
        onPointerEnter={prefetchThemeStudio}
        onFocus={prefetchThemeStudio}
        onClick={() => setOpen(true)}
      >
        Customize theme
      </Button>
      <aside
        id="theme-customizer"
        role="dialog"
        tabIndex={-1}
        aria-labelledby="theme-customizer-title"
        aria-describedby="theme-customizer-description"
        aria-hidden={!open}
        inert={!open ? true : undefined}
        data-open={open ? '' : undefined}
        className="theme-drawer-popup"
      >
        <header className="theme-drawer-header">
          <h2 id="theme-customizer-title" className="sr-only">
            Theme customizer
          </h2>
          <p id="theme-customizer-description" className="sr-only">
            Customize the live theme while inspecting the component catalog.
          </p>
          <Button data-theme-customizer-close variant="outline" size="sm" onClick={close}>
            Close
          </Button>
        </header>
        {children}
      </aside>
    </>
  )
}

function ThemeCustomizer({ rootRef }: { rootRef: RefObject<HTMLDivElement | null> }) {
  const workspace = useThemeWorkspace()
  const [mode, setMode] = useState<'light' | 'dark'>('light')
  useThemeStudioPrefetch()
  useLiveTheme(rootRef, workspace.theme, mode)

  return (
    <ThemeInspector>
      <div className="theme-panel" aria-label="Theme generator">
        <Suspense fallback={null}>
          <ThemeStudio workspace={workspace} mode={mode} onModeChange={setMode} />
        </Suspense>
      </div>
    </ThemeInspector>
  )
}

export function Playground() {
  const rootRef = useRef<HTMLDivElement>(null)

  return (
    <Toaster>
      <div
        ref={rootRef}
        data-slot="ui-playground"
        data-ui-theme="observatory"
        className="playground-root"
      >
        <div className="playground-layout">
          <main id="playground-main" className="playground-main">
            <Catalog />
          </main>
        </div>
        <ThemeCustomizer rootRef={rootRef} />
      </div>
    </Toaster>
  )
}
