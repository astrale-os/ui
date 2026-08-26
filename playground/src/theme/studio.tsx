import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  Input,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Slider,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  ToggleGroup,
  ToggleGroupItem,
  toast,
} from '@astrale-os/ui'
import { useEffect, useMemo, useRef, useState, type ChangeEvent, type ComponentProps } from 'react'

import {
  serializeThemeDocument,
  themeColorTokens,
  type ThemeColorToken,
  type ThemeDocument,
} from '../../../tooling/theme-document/index.js'
import { starterThemes, type ThemeWorkspace } from './workspace.js'

const colorLabels: Record<ThemeColorToken, string> = {
  background: 'Background',
  foreground: 'Foreground',
  card: 'Card',
  cardForeground: 'Card foreground',
  popover: 'Popover',
  popoverForeground: 'Popover foreground',
  primary: 'Primary',
  primaryForeground: 'Primary foreground',
  secondary: 'Secondary',
  secondaryForeground: 'Secondary foreground',
  muted: 'Muted',
  mutedForeground: 'Muted foreground',
  accent: 'Accent',
  accentForeground: 'Accent foreground',
  destructive: 'Destructive',
  destructiveForeground: 'Destructive foreground',
  border: 'Border',
  input: 'Input',
  ring: 'Focus ring',
  chart1: 'Chart 1',
  chart2: 'Chart 2',
  chart3: 'Chart 3',
  chart4: 'Chart 4',
  chart5: 'Chart 5',
}

const colorGroups: Array<{ label: string; tokens: ThemeColorToken[] }> = [
  {
    label: 'Brand colors',
    tokens: [
      'primary',
      'primaryForeground',
      'secondary',
      'secondaryForeground',
      'accent',
      'accentForeground',
      'destructive',
      'destructiveForeground',
    ],
  },
  {
    label: 'Surface colors',
    tokens: [
      'background',
      'foreground',
      'card',
      'cardForeground',
      'popover',
      'popoverForeground',
      'muted',
      'mutedForeground',
      'border',
      'input',
      'ring',
    ],
  },
  { label: 'Chart colors', tokens: ['chart1', 'chart2', 'chart3', 'chart4', 'chart5'] },
]

const bodyFonts = [
  "'Avenir Next', 'Segoe UI Variable', ui-sans-serif, sans-serif",
  "'IBM Plex Sans Condensed', 'Arial Narrow', ui-sans-serif, sans-serif",
  "'Aptos', 'Gill Sans', ui-sans-serif, sans-serif",
  "'Charter', 'Iowan Old Style', ui-serif, serif",
]
const headingFonts = [
  "'Iowan Old Style', 'Palatino Linotype', ui-serif, serif",
  "'IBM Plex Mono', 'SFMono-Regular', ui-monospace, monospace",
  "'Cooper Black', 'Iowan Old Style', ui-serif, serif",
  "'Avenir Next', 'Segoe UI Variable', ui-sans-serif, sans-serif",
]

function download(name: string, type: string, source: string) {
  const url = URL.createObjectURL(new Blob([source], { type }))
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.click()
  URL.revokeObjectURL(url)
}

async function copy(source: string, message: string) {
  await navigator.clipboard.writeText(source)
  toast.success(message)
}

function selectItems(values: string[]) {
  return values.map((value) => ({ label: value.split(',')[0]!.replaceAll("'", ''), value }))
}

function DraftInput({
  value,
  onCommit,
  ...props
}: Omit<ComponentProps<typeof Input>, 'defaultValue' | 'onChange' | 'value'> & {
  value: string
  onCommit: (value: string) => void
}) {
  const [draft, setDraft] = useState(value)
  useEffect(() => setDraft(value), [value])
  return (
    <Input
      {...props}
      value={draft}
      onChange={(event) => setDraft(event.currentTarget.value)}
      onBlur={() => {
        if (draft === value) return
        try {
          onCommit(draft)
        } catch (error) {
          setDraft(value)
          toast.error('Theme value rejected', {
            description: error instanceof Error ? error.message : String(error),
          })
        }
      }}
    />
  )
}

function DraftTextarea({
  value,
  onCommit,
  ...props
}: Omit<ComponentProps<typeof Textarea>, 'defaultValue' | 'onChange' | 'value'> & {
  value: string
  onCommit: (value: string) => void
}) {
  const [draft, setDraft] = useState(value)
  useEffect(() => setDraft(value), [value])
  return (
    <Textarea
      {...props}
      value={draft}
      onChange={(event) => setDraft(event.currentTarget.value)}
      onBlur={() => {
        if (draft === value) return
        try {
          onCommit(draft)
        } catch (error) {
          setDraft(value)
          toast.error('Theme value rejected', {
            description: error instanceof Error ? error.message : String(error),
          })
        }
      }}
    />
  )
}

function ColorField({
  theme,
  mode,
  token,
  onChange,
}: {
  theme: ThemeDocument
  mode: 'light' | 'dark'
  token: ThemeColorToken
  onChange: (value: string) => void
}) {
  const value = theme.appearance[mode][token]
  return (
    <Field orientation="responsive" data-slot="theme-color-field">
      <FieldLabel htmlFor={`${mode}-${token}`}>{colorLabels[token]}</FieldLabel>
      <div className="theme-color-control" data-slot="theme-color-control">
        <span data-slot="theme-color-swatch" aria-hidden="true" style={{ background: value }} />
        <DraftInput id={`${mode}-${token}`} value={value} onCommit={onChange} spellCheck={false} />
      </div>
    </Field>
  )
}

export function ThemeStudio({
  workspace,
  mode,
  onModeChange,
}: {
  workspace: ThemeWorkspace
  mode: 'light' | 'dark'
  onModeChange: (mode: 'light' | 'dark') => void
}) {
  const fileInput = useRef<HTMLInputElement>(null)
  const starterItems = useMemo(
    () => starterThemes.map((theme) => ({ label: theme.label, value: theme.name })),
    [],
  )
  const savedItems = workspace.savedThemes.map((theme) => ({
    label: theme.label,
    value: theme.name,
  }))
  const published = starterThemes.some(
    (theme) =>
      theme.name === workspace.theme.name &&
      serializeThemeDocument(theme) === serializeThemeDocument(workspace.theme),
  )
  const installCommand = published
    ? `astrale ui add theme/${workspace.theme.name}`
    : `astrale ui add ./${workspace.theme.name}.css`

  async function importTheme(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget
    const file = input.files?.[0]
    if (!file) return
    try {
      const theme = workspace.importText(await file.text())
      toast.success(`${theme.label} imported`)
    } catch (error) {
      toast.error('Theme import rejected', {
        description: error instanceof Error ? error.message : String(error),
      })
    } finally {
      input.value = ''
    }
  }

  return (
    <Card className="theme-studio" data-slot="theme-studio">
      <CardHeader className="theme-studio-header">
        <div>
          <Badge variant="outline">Base UI · Nova</Badge>
          <CardTitle>Theme studio</CardTitle>
          <CardDescription>Every change is live across the complete playground.</CardDescription>
        </div>
        <div className="theme-history-actions">
          <Button
            variant="outline"
            size="sm"
            disabled={!workspace.canUndo}
            onClick={workspace.undo}
          >
            Undo
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!workspace.canRedo}
            onClick={workspace.redo}
          >
            Redo
          </Button>
        </div>
      </CardHeader>
      <CardContent className="theme-studio-content">
        <FieldGroup>
          <Field orientation="horizontal">
            <FieldLabel>Mode</FieldLabel>
            <ToggleGroup
              aria-label="Theme mode"
              value={[mode]}
              onValueChange={(value) => {
                const next = value[0]
                if (next === 'light' || next === 'dark') onModeChange(next)
              }}
              spacing={0}
              variant="outline"
            >
              <ToggleGroupItem value="light">Light</ToggleGroupItem>
              <ToggleGroupItem value="dark">Dark</ToggleGroupItem>
            </ToggleGroup>
          </Field>
          <Field>
            <FieldLabel htmlFor="starter-theme">Starter</FieldLabel>
            <Select
              items={starterItems}
              value={
                starterThemes.some((theme) => theme.name === workspace.theme.name)
                  ? workspace.theme.name
                  : null
              }
              onValueChange={(value) => {
                const selected = starterThemes.find((theme) => theme.name === value)
                if (selected) workspace.load(selected)
              }}
            >
              <SelectTrigger id="starter-theme">
                <SelectValue>{(value) => value ?? 'Custom theme'}</SelectValue>
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false}>
                <SelectGroup>
                  {starterItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
          <div className="theme-preset-actions">
            <Input
              ref={fileInput}
              className="sr-only !size-px"
              type="file"
              accept="application/json,.json"
              aria-label="Import theme document"
              onChange={importTheme}
            />
            <Button variant="outline" onClick={() => fileInput.current?.click()}>
              Import
            </Button>
            <Button variant="outline" onClick={workspace.randomize}>
              Randomize
            </Button>
            <Button
              onClick={() => {
                const theme = workspace.save()
                toast.success(`${theme.label} saved in this browser`)
              }}
            >
              Save theme
            </Button>
          </div>
          {savedItems.length > 0 && (
            <Field>
              <FieldLabel htmlFor="saved-theme">Saved themes</FieldLabel>
              <Select
                items={savedItems}
                onValueChange={(value) => {
                  const selected = workspace.savedThemes.find((theme) => theme.name === value)
                  if (selected) workspace.load(selected)
                }}
              >
                <SelectTrigger id="saved-theme">
                  <SelectValue>{(value) => value ?? 'Choose a saved theme'}</SelectValue>
                </SelectTrigger>
                <SelectContent alignItemWithTrigger={false}>
                  <SelectGroup>
                    {savedItems.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
          )}
        </FieldGroup>

        <Separator />

        <Tabs defaultValue="colors">
          <TabsList className="theme-tabs-list">
            <TabsTrigger value="colors">Colors</TabsTrigger>
            <TabsTrigger value="type">Typography</TabsTrigger>
            <TabsTrigger value="other">Other</TabsTrigger>
            <TabsTrigger value="export">Export</TabsTrigger>
          </TabsList>
          <TabsContent value="colors">
            <Accordion defaultValue={['Brand colors']}>
              {colorGroups.map((group) => (
                <AccordionItem key={group.label} value={group.label}>
                  <AccordionTrigger>{group.label}</AccordionTrigger>
                  <AccordionContent>
                    <FieldGroup className="theme-token-list">
                      {group.tokens.map((token) => (
                        <ColorField
                          key={token}
                          theme={workspace.theme}
                          mode={mode}
                          token={token}
                          onChange={(value) => workspace.setColor(mode, token, value)}
                        />
                      ))}
                    </FieldGroup>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </TabsContent>
          <TabsContent value="type">
            <FieldGroup className="theme-tab-panel">
              <Field>
                <FieldLabel htmlFor="body-font">Body font</FieldLabel>
                <Select
                  items={selectItems(bodyFonts)}
                  value={workspace.theme.typography.body}
                  onValueChange={(value) => {
                    if (value) workspace.setValue('typography', 'body', value)
                  }}
                >
                  <SelectTrigger id="body-font">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent alignItemWithTrigger={false}>
                    <SelectGroup>
                      {selectItems(bodyFonts).map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="heading-font">Heading font</FieldLabel>
                <Select
                  items={selectItems(headingFonts)}
                  value={workspace.theme.typography.heading}
                  onValueChange={(value) => {
                    if (value) workspace.setValue('typography', 'heading', value)
                  }}
                >
                  <SelectTrigger id="heading-font">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent alignItemWithTrigger={false}>
                    <SelectGroup>
                      {selectItems(headingFonts).map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
              <Card size="sm">
                <CardHeader>
                  <CardTitle>The observable becomes operable.</CardTitle>
                  <CardDescription>Aa Bb Cc · 0123456789 · Schema revision 42</CardDescription>
                </CardHeader>
              </Card>
            </FieldGroup>
          </TabsContent>
          <TabsContent value="other">
            <FieldGroup className="theme-tab-panel">
              <Field>
                <FieldLabel>Corner radius</FieldLabel>
                <Slider
                  value={Number.parseFloat(workspace.theme.geometry.radius)}
                  min={0}
                  max={1.5}
                  step={0.05}
                  onValueChange={(value) =>
                    workspace.setValue('geometry', 'radius', `${Number(value).toFixed(2)}rem`)
                  }
                  aria-label="Corner radius"
                />
                <FieldDescription>{workspace.theme.geometry.radius}</FieldDescription>
              </Field>
              <Field>
                <FieldLabel>Panel radius</FieldLabel>
                <Slider
                  value={Number.parseFloat(workspace.theme.geometry.panelRadius)}
                  min={0}
                  max={2}
                  step={0.05}
                  onValueChange={(value) =>
                    workspace.setValue('geometry', 'panelRadius', `${Number(value).toFixed(2)}rem`)
                  }
                  aria-label="Panel radius"
                />
                <FieldDescription>{workspace.theme.geometry.panelRadius}</FieldDescription>
              </Field>
              <Field>
                <FieldLabel>Control height</FieldLabel>
                <Slider
                  value={Number.parseFloat(workspace.theme.density.control)}
                  min={1.75}
                  max={3}
                  step={0.05}
                  onValueChange={(value) =>
                    workspace.setValue('density', 'control', `${Number(value).toFixed(2)}rem`)
                  }
                  aria-label="Control height"
                />
                <FieldDescription>{workspace.theme.density.control}</FieldDescription>
              </Field>
              <Field>
                <FieldLabel htmlFor="panel-shadow">Panel shadow</FieldLabel>
                <DraftInput
                  id="panel-shadow"
                  value={workspace.theme.effects.panelShadow}
                  onCommit={(value) => workspace.setValue('effects', 'panelShadow', value)}
                />
              </Field>
              <Field>
                <FieldLabel>Motion speed</FieldLabel>
                <Slider
                  value={Number.parseFloat(workspace.theme.motion.standard)}
                  min={0}
                  max={500}
                  step={10}
                  onValueChange={(value) =>
                    workspace.setValue('motion', 'standard', `${Number(value)}ms`)
                  }
                  aria-label="Motion speed"
                />
                <FieldDescription>{workspace.theme.motion.standard}</FieldDescription>
              </Field>
            </FieldGroup>
          </TabsContent>
          <TabsContent value="export">
            <FieldGroup className="theme-tab-panel">
              <Field>
                <FieldLabel htmlFor="theme-name">Theme slug</FieldLabel>
                <DraftInput
                  id="theme-name"
                  value={workspace.theme.name}
                  onCommit={(value) => workspace.setIdentity('name', value.toLowerCase())}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="theme-label">Display name</FieldLabel>
                <DraftInput
                  id="theme-label"
                  value={workspace.theme.label}
                  onCommit={(value) => workspace.setIdentity('label', value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="theme-description">Description</FieldLabel>
                <DraftTextarea
                  id="theme-description"
                  value={workspace.theme.description}
                  onCommit={(value) => workspace.setIdentity('description', value)}
                />
              </Field>
              <Field>
                <FieldLabel>One-command install</FieldLabel>
                <code className="install-command" data-slot="theme-install-command">
                  {installCommand}
                </code>
                <FieldDescription>
                  {published
                    ? 'This starter is release-qualified in the Astrale registry.'
                    : 'Export the CSS beside your project, then run this command to install and own it.'}
                </FieldDescription>
              </Field>
              <div className="theme-export-actions">
                <Button onClick={() => copy(installCommand, 'Install command copied')}>
                  Copy command
                </Button>
                <Button variant="outline" onClick={() => copy(workspace.css, 'Theme CSS copied')}>
                  Copy CSS
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    download(
                      `${workspace.theme.name}.astrale-theme.json`,
                      'application/json',
                      workspace.serialize(),
                    )
                  }
                >
                  Download JSON
                </Button>
                <Button
                  variant="outline"
                  onClick={() => download(`${workspace.theme.name}.css`, 'text/css', workspace.css)}
                >
                  Download CSS
                </Button>
              </div>
            </FieldGroup>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter>
        <span>{themeColorTokens.length} color tokens · light and dark · consumer-owned output</span>
      </CardFooter>
    </Card>
  )
}
