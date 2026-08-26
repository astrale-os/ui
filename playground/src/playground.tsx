import {
  Badge,
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
  Progress,
  ScrollArea,
  Separator,
  Toaster,
} from '@astrale-os/ui'
import { useState } from 'react'

import { ComponentSpecimens } from './catalog/component-specimens.js'
import { componentGroups, componentNames } from './catalog/inventory.js'
import { RegistrySpecimens } from './catalog/registry-specimens.js'
import { ThemeStudio } from './theme/studio.js'
import { useThemeWorkspace } from './theme/workspace.js'

export function Playground() {
  const workspace = useThemeWorkspace()
  const [mode, setMode] = useState<'light' | 'dark'>('light')
  const [search, setSearch] = useState('')

  function focusSearchResult(value = search) {
    const needle = value.trim().toLowerCase()
    if (!needle) return
    const component =
      componentNames.find((name) => name === needle) ??
      componentNames.find((name) => name.includes(needle))
    const target = component
      ? document.querySelector(`[data-component='${component}']`)
      : document.querySelector(`[data-registry-item*='${CSS.escape(needle)}']`)
    if (target instanceof HTMLElement) {
      target.focus()
      target.scrollIntoView({ block: 'center' })
      if (target.id) history.replaceState(null, '', `#${target.id}`)
    }
  }

  return (
    <Toaster position="top-right">
      <style data-slot="live-theme-css">{workspace.css}</style>
      <div
        data-slot="ui-playground"
        data-ui-theme={workspace.theme.name}
        className={mode === 'dark' ? 'dark playground-root' : 'playground-root'}
      >
        <a className="skip-link" href="#playground-main">
          Skip to playground
        </a>
        <header className="playground-header">
          <div className="playground-wordmark">
            <span aria-hidden="true">✦</span>
            <div>
              <strong>Astrale UI</strong>
              <small>Playground</small>
            </div>
          </div>
          <form
            className="global-search"
            role="search"
            onKeyDownCapture={(event) => {
              if (event.key !== 'Enter') return
              event.preventDefault()
              const input = event.currentTarget.elements.namedItem('query')
              focusSearchResult(input instanceof HTMLInputElement ? input.value : '')
            }}
            onSubmit={(event) => {
              event.preventDefault()
              focusSearchResult(String(new FormData(event.currentTarget).get('query') ?? ''))
            }}
          >
            <InputGroup>
              <InputGroupAddon>
                <InputGroupText>Find</InputGroupText>
              </InputGroupAddon>
              <InputGroupInput
                name="query"
                aria-label="Find a component or registry item"
                placeholder="button, dialog, chart…"
                value={search}
                onChange={(event) => setSearch(event.currentTarget.value)}
              />
              <InputGroupAddon align="inline-end">
                <InputGroupButton type="submit">Go</InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
          </form>
          <div className="header-status">
            <Badge variant="outline">Base UI</Badge>
            <Badge>52 registry items</Badge>
          </div>
        </header>

        <div className="playground-layout">
          <aside className="playground-navigation" aria-label="Playground navigation">
            <ScrollArea className="navigation-scroll">
              <nav>
                <p className="nav-label">Catalog</p>
                {componentGroups.map((group) => (
                  <Button
                    key={group.id}
                    variant="ghost"
                    nativeButton={false}
                    render={<a href={`#${group.id}`} />}
                  >
                    <span>{group.label}</span>
                    <Badge variant="outline">{group.components.length}</Badge>
                  </Button>
                ))}
                <Button variant="ghost" nativeButton={false} render={<a href="#registry" />}>
                  <span>Patterns & blocks</span>
                  <Badge variant="outline">52</Badge>
                </Button>
              </nav>
              <Separator />
              <div className="navigation-note">
                <p>Everything here consumes public package paths or registry source.</p>
                <code>pnpm --filter @astrale-os/ui-playground dev</code>
              </div>
            </ScrollArea>
          </aside>

          <main id="playground-main" className="playground-main">
            <section className="playground-hero" aria-labelledby="playground-title">
              <div className="hero-copy">
                <p className="section-kicker">Living system · editable character</p>
                <h1 id="playground-title">
                  Tune the system.
                  <em>Keep the behavior.</em>
                </h1>
                <p>
                  Every runtime owner, registry composition, and portable theme shares one live
                  surface. Change a token once; inspect its consequences everywhere.
                </p>
                <div className="inline-cluster">
                  <Button nativeButton={false} render={<a href="#actions-inputs" />}>
                    Explore components
                  </Button>
                  <Button variant="outline" nativeButton={false} render={<a href="#registry" />}>
                    Browse registry
                  </Button>
                </div>
              </div>
              <Card className="hero-console">
                <CardHeader>
                  <CardTitle>Theme qualification</CardTitle>
                  <CardDescription>{workspace.theme.label} · live draft</CardDescription>
                  <CardAction>
                    <Badge>Hot reload</Badge>
                  </CardAction>
                </CardHeader>
                <CardContent className="stack">
                  <div className="metric-row">
                    <span>Runtime owners</span>
                    <strong>50 / 50</strong>
                  </div>
                  <Progress value={100} aria-label="Runtime owner coverage" />
                  <div className="metric-row">
                    <span>Portable color modes</span>
                    <strong>2</strong>
                  </div>
                  <div className="metric-row">
                    <span>Consumer command</span>
                    <code>astrale ui add</code>
                  </div>
                </CardContent>
              </Card>
            </section>

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
