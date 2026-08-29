import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Button,
  Card,
  CardContent,
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  ToggleGroup,
  ToggleGroupItem,
  toast,
} from '@astrale-os/ui'
import { Slider as SliderPrimitive } from '@base-ui/react/slider'
import { formatHex, parse } from 'culori'
import { useEffect, useMemo, useRef, useState, type ChangeEvent, type ComponentProps } from 'react'

import { ColorArea } from '../../../registry/components/color-picker/color-area.js'
import { ColorField as PickerColorField } from '../../../registry/components/color-picker/color-field.js'
import { ColorPicker } from '../../../registry/components/color-picker/color-picker.js'
import { ColorSlider } from '../../../registry/components/color-picker/color-slider.js'
import {
  type ThemeColorToken,
  type ThemeDocument,
  type ThemeTypographyRole,
} from '../../../tooling/theme-document/index.js'
import { generatorFontCatalog } from '../../../tooling/theme-generator/font-catalog.js'
import { defaultTheme, type ThemeWorkspace } from './workspace.js'

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
  sidebar: 'Menu background',
  sidebarForeground: 'Menu foreground',
  sidebarPrimary: 'Menu primary',
  sidebarPrimaryForeground: 'Menu primary foreground',
  sidebarAccent: 'Menu accent',
  sidebarAccentForeground: 'Menu accent foreground',
  sidebarBorder: 'Menu border',
  sidebarRing: 'Menu focus ring',
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
    label: 'Base colors',
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
  {
    label: 'Menu colors',
    tokens: [
      'sidebar',
      'sidebarForeground',
      'sidebarPrimary',
      'sidebarPrimaryForeground',
      'sidebarAccent',
      'sidebarAccentForeground',
      'sidebarBorder',
      'sidebarRing',
    ],
  },
  { label: 'Chart colors', tokens: ['chart1', 'chart2', 'chart3', 'chart4', 'chart5'] },
]

const fontItems = generatorFontCatalog
  .filter(
    (font) =>
      font.roles.some((role) => role === 'body') || font.roles.some((role) => role === 'heading'),
  )
  .map((font) => ({
    label: `${font.label} · ${font.kind[0]?.toUpperCase()}${font.kind.slice(1)}`,
    value: font.family,
  }))
const monoItems = generatorFontCatalog
  .filter((font) => font.roles.some((role) => role === 'terminal'))
  .map((font) => ({ label: `${font.label} · Mono`, value: font.family }))
const COLOR_PREVIEW_DEBOUNCE_MS = 250

function ThemePaletteIcon({ theme }: { theme: ThemeDocument }) {
  const colors = [
    theme.appearance.light.background,
    theme.appearance.light.primary,
    theme.appearance.dark.background,
    theme.appearance.dark.primary,
  ]
  return (
    <span className="theme-palette-icon" data-slot="theme-palette-icon" aria-hidden="true">
      {colors.map((color, index) => (
        <span key={index} style={{ backgroundColor: color }} />
      ))}
    </span>
  )
}

function ThemeChoiceLabel({ theme, saved = false }: { theme: ThemeDocument; saved?: boolean }) {
  return (
    <>
      <ThemePaletteIcon theme={theme} />
      <span>{theme.label}</span>
      {saved && <span className="theme-choice-kind">Saved</span>}
    </>
  )
}

function download(name: string, type: string, source: string) {
  const url = URL.createObjectURL(new Blob([source], { type }))
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.click()
  URL.revokeObjectURL(url)
}

async function copy(source: string, message: string) {
  try {
    await navigator.clipboard.writeText(source)
    toast.add({ title: message, type: 'success' })
  } catch (error) {
    toast.add({
      title: 'Copy failed',
      description: error instanceof Error ? error.message : String(error),
      type: 'error',
    })
  }
}

function ThemeSelectField({
  id,
  label,
  items,
  value,
  onChange,
}: {
  id: string
  label: string
  items: Array<{ label: string; value: string }>
  value: string
  onChange(value: string): void
}) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Select
        modal={false}
        items={items}
        value={value}
        onValueChange={(next) => {
          if (next) onChange(next)
        }}
      >
        <SelectTrigger id={id}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent alignItemWithTrigger={false}>
          <SelectGroup>
            {items.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </Field>
  )
}

function firstSliderValue(value: number | readonly number[]) {
  return typeof value === 'number' ? value : value[0]!
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value))
}

function formatTracking(value: number) {
  if (Math.abs(value) < 0.0005) return '0'
  return `${Number(value.toFixed(3))}em`
}

function formatLeading(value: number) {
  return String(Number(value.toFixed(2)))
}

function formatRem(value: number) {
  return `${value.toFixed(2)}rem`
}

function formatMilliseconds(value: number) {
  return `${Math.round(value)}ms`
}

function ThemeSlider({
  label,
  value,
  min,
  max,
  step,
  format,
  onValueChange,
  onValueCommitted,
  onPreviewStarted,
  onPreviewCanceled,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  format(value: number): string
  onValueChange(value: number): void
  onValueCommitted(value: number): void
  onPreviewStarted(): void
  onPreviewCanceled(): void
}) {
  return (
    <SliderPrimitive.Root
      className="data-horizontal:w-full"
      data-slot="slider"
      value={[value]}
      min={min}
      max={max}
      step={step}
      thumbAlignment="edge"
      onValueChange={(next) => onValueChange(firstSliderValue(next))}
      onValueCommitted={(next) => onValueCommitted(firstSliderValue(next))}
      onPointerDown={onPreviewStarted}
      onPointerCancel={onPreviewCanceled}
    >
      <SliderPrimitive.Control className="relative flex w-full touch-none items-center select-none">
        <SliderPrimitive.Track
          data-slot="slider-track"
          className="relative h-1 w-full grow overflow-hidden rounded-full bg-muted select-none"
        >
          <SliderPrimitive.Indicator
            data-slot="slider-range"
            className="h-full bg-primary select-none"
          />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb
          data-slot="slider-thumb"
          getAriaLabel={() => label}
          getAriaValueText={(_formatted, next) => format(next)}
          className="relative block size-3 shrink-0 rounded-full border border-ring bg-white ring-ring/50 transition-[color,box-shadow] select-none after:absolute after:-inset-2 hover:ring-3 focus-visible:ring-3 focus-visible:outline-hidden active:ring-3"
        />
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  )
}

function ThemeRangeField({
  label,
  value,
  cssVariable,
  minimum,
  maximum,
  step,
  format,
  onCommit,
}: {
  label: string
  value: string
  cssVariable: string
  minimum: number
  maximum: number
  step: number
  format(value: number): string
  onCommit(value: string): void
}) {
  const numericValue = clamp(Number.parseFloat(value), minimum, maximum)
  const [draft, setDraft] = useState(numericValue)
  const previewFrame = useRef<number | null>(null)
  const canceledPreview = useRef(false)
  const committedValue = useRef(value)
  committedValue.current = value

  useEffect(() => {
    if (previewFrame.current !== null) cancelAnimationFrame(previewFrame.current)
    previewFrame.current = null
    setDraft(numericValue)
    document.documentElement.style.setProperty(cssVariable, value)
  }, [cssVariable, numericValue, value])
  useEffect(
    () => () => {
      if (previewFrame.current !== null) cancelAnimationFrame(previewFrame.current)
      document.documentElement.style.setProperty(cssVariable, committedValue.current)
    },
    [cssVariable],
  )

  function preview(next: number) {
    setDraft(next)
    if (previewFrame.current !== null) cancelAnimationFrame(previewFrame.current)
    previewFrame.current = requestAnimationFrame(() => {
      previewFrame.current = null
      document.documentElement.style.setProperty(cssVariable, format(next))
    })
  }

  function commit(next: number) {
    if (previewFrame.current !== null) cancelAnimationFrame(previewFrame.current)
    previewFrame.current = null
    if (canceledPreview.current) {
      canceledPreview.current = false
      const committed = committedValue.current
      setDraft(clamp(Number.parseFloat(committed), minimum, maximum))
      document.documentElement.style.setProperty(cssVariable, committed)
      return
    }
    const formatted = format(next)
    document.documentElement.style.setProperty(cssVariable, formatted)
    onCommit(formatted)
  }

  function cancelPreview() {
    canceledPreview.current = true
    if (previewFrame.current !== null) cancelAnimationFrame(previewFrame.current)
    previewFrame.current = null
    const committed = committedValue.current
    setDraft(clamp(Number.parseFloat(committed), minimum, maximum))
    document.documentElement.style.setProperty(cssVariable, committed)
  }

  return (
    <Field data-slot="theme-range-field">
      <FieldLabel className="theme-range-label">
        <span className="theme-range-heading">
          <span>{label}</span>
          <output>{format(draft)}</output>
        </span>
        <ThemeSlider
          label={label}
          value={draft}
          min={minimum}
          max={maximum}
          step={step}
          format={format}
          onValueChange={preview}
          onValueCommitted={commit}
          onPreviewStarted={() => {
            canceledPreview.current = false
          }}
          onPreviewCanceled={cancelPreview}
        />
      </FieldLabel>
    </Field>
  )
}

function TypographyRoleSection({
  role,
  title,
  workspace,
}: {
  role: 'heading' | 'body'
  title: string
  workspace: ThemeWorkspace
}) {
  const typography = workspace.theme.typography[role]
  const selectedFont = generatorFontCatalog.find((font) => font.family === typography.family)
  const weightItems = (selectedFont?.weights ?? [typography.weight]).map((weight) => ({
    label: String(weight),
    value: String(weight),
  }))
  const update = (changes: Partial<ThemeTypographyRole>) =>
    workspace.setValue('typography', role, { ...typography, ...changes })
  const id = `typography-${role}`

  return (
    <section className="theme-typography-section" aria-labelledby={id}>
      <header className="theme-typography-section-header">
        <h3 id={id}>{title}</h3>
      </header>
      <div className="theme-typography-controls">
        <ThemeSelectField
          id={`${role}-font`}
          label={`${title} font`}
          items={fontItems}
          value={typography.family}
          onChange={(family) => {
            const font = generatorFontCatalog.find((candidate) => candidate.family === family)
            const weights: readonly number[] = font?.weights ?? []
            const weight = weights.includes(typography.weight)
              ? typography.weight
              : weights.reduce(
                  (best, candidate) =>
                    Math.abs(candidate - typography.weight) < Math.abs(best - typography.weight)
                      ? candidate
                      : best,
                  weights[0] ?? typography.weight,
                )
            update({ family, weight })
          }}
        />
        <ThemeSelectField
          id={`${role}-weight`}
          label={`${title} weight`}
          items={weightItems}
          value={String(typography.weight)}
          onChange={(weight) => update({ weight: Number(weight) })}
        />
        <ThemeRangeField
          label={`${title} letter spacing`}
          value={typography.tracking}
          cssVariable={`--ui-tracking-${role}`}
          minimum={-0.04}
          maximum={0.04}
          step={0.005}
          format={formatTracking}
          onCommit={(tracking) => update({ tracking })}
        />
        <ThemeRangeField
          label={`${title} line height`}
          value={typography.leading}
          cssVariable={`--ui-leading-${role}`}
          minimum={1}
          maximum={2}
          step={0.05}
          format={formatLeading}
          onCommit={(leading) => update({ leading })}
        />
      </div>
      <div className="theme-typography-specimen" data-role={role}>
        {role === 'heading' ? (
          <CardTitle>Heading preview</CardTitle>
        ) : (
          <p data-slot="theme-typography-body">Body preview</p>
        )}
      </div>
    </section>
  )
}

function TerminalTypographySection({ workspace }: { workspace: ThemeWorkspace }) {
  return (
    <section className="theme-typography-section" aria-labelledby="typography-terminal">
      <header className="theme-typography-section-header">
        <h3 id="typography-terminal">Terminal</h3>
      </header>
      <div className="theme-typography-controls" data-terminal>
        <ThemeSelectField
          id="mono-font"
          label="Terminal font"
          items={monoItems}
          value={workspace.theme.typography.mono}
          onChange={(family) => workspace.setValue('typography', 'mono', family)}
        />
      </div>
      <div className="theme-typography-specimen" data-role="terminal">
        <code className="font-mono" data-slot="theme-typography-mono">
          pnpm astrale ui add theme/observatory
        </code>
      </div>
    </section>
  )
}

function pickerColor(value: string) {
  return formatHex(parse(value)) ?? '#000000'
}

function colorStyleProperty(token: ThemeColorToken) {
  return `--ui-${token
    .replaceAll(/([a-z])([A-Z])/gu, '$1-$2')
    .replaceAll(/([a-z])(\d+)$/gu, '$1-$2')
    .toLowerCase()}`
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
          toast.add({
            title: 'Theme value rejected',
            description: error instanceof Error ? error.message : String(error),
            type: 'error',
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
          toast.add({
            title: 'Theme value rejected',
            description: error instanceof Error ? error.message : String(error),
            type: 'error',
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
  const [draft, setDraft] = useState(value)
  const pendingCommit = useRef<ReturnType<typeof setTimeout> | null>(null)
  const previewFrame = useRef<number | null>(null)
  const latestOnChange = useRef(onChange)
  const committedValue = useRef(value)
  const styleProperty = colorStyleProperty(token)
  committedValue.current = value

  useEffect(() => {
    latestOnChange.current = onChange
  }, [onChange])

  useEffect(() => {
    if (pendingCommit.current) clearTimeout(pendingCommit.current)
    if (previewFrame.current !== null) cancelAnimationFrame(previewFrame.current)
    pendingCommit.current = null
    previewFrame.current = null
    setDraft(value)
  }, [value])

  useEffect(
    () => () => {
      if (pendingCommit.current) clearTimeout(pendingCommit.current)
      if (previewFrame.current !== null) cancelAnimationFrame(previewFrame.current)
      document.documentElement.style.setProperty(styleProperty, committedValue.current)
    },
    [styleProperty],
  )

  function applyPreview(next: string) {
    if (previewFrame.current !== null) cancelAnimationFrame(previewFrame.current)
    previewFrame.current = requestAnimationFrame(() => {
      previewFrame.current = null
      document.documentElement.style.setProperty(styleProperty, next)
    })
  }

  function commit(next: string) {
    if (pendingCommit.current) clearTimeout(pendingCommit.current)
    if (previewFrame.current !== null) cancelAnimationFrame(previewFrame.current)
    pendingCommit.current = null
    previewFrame.current = null
    setDraft(next)
    document.documentElement.style.setProperty(styleProperty, next)
    latestOnChange.current(next)
  }

  function preview(next: string) {
    setDraft(next)
    applyPreview(next)
    if (pendingCommit.current) clearTimeout(pendingCommit.current)
    pendingCommit.current = setTimeout(() => {
      pendingCommit.current = null
      latestOnChange.current(next)
    }, COLOR_PREVIEW_DEBOUNCE_MS)
  }

  return (
    <Field orientation="responsive" data-slot="theme-color-field">
      <FieldLabel htmlFor={`${mode}-${token}`}>{colorLabels[token]}</FieldLabel>
      <div className="theme-color-control" data-slot="theme-color-control">
        <ColorPicker
          label={`Pick ${colorLabels[token]}`}
          value={pickerColor(draft)}
          onChange={(color) => preview(color.toString('hex'))}
        >
          <ColorArea
            colorSpace="hsb"
            xChannel="saturation"
            yChannel="brightness"
            onChangeEnd={(color) => commit(color.toString('hex'))}
          />
          <ColorSlider
            colorSpace="hsb"
            channel="hue"
            onChangeEnd={(color) => commit(color.toString('hex'))}
          />
          <PickerColorField label="Hex" />
        </ColorPicker>
        <DraftInput id={`${mode}-${token}`} value={draft} onCommit={commit} spellCheck={false} />
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
  const [selectedThemeChoice, setSelectedThemeChoice] = useState('default:observatory')
  const [generationPending, setGenerationPending] = useState(false)
  const themeChoices = useMemo(
    () => [
      {
        label: defaultTheme.label,
        value: 'default:observatory',
        theme: defaultTheme,
        saved: false,
      },
      ...workspace.savedThemes.map((theme) => ({
        label: `${theme.label} Saved`,
        value: `saved:${theme.name}`,
        theme,
        saved: true,
      })),
    ],
    [workspace.savedThemes],
  )
  const selectedChoice = themeChoices.find((choice) => choice.value === selectedThemeChoice)
  const published = selectedThemeChoice === 'default:observatory' && !workspace.canUndo
  const command = published
    ? `astrale ui add theme/${workspace.theme.name}`
    : `astrale ui add ./${workspace.theme.name}.css`

  async function importTheme(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget
    const file = input.files?.[0]
    if (!file) return
    try {
      const theme = await workspace.importText(await file.text())
      setSelectedThemeChoice('imported')
      toast.add({ title: `${theme.label} imported`, type: 'success' })
    } catch (error) {
      toast.add({
        title: 'Theme import rejected',
        description: error instanceof Error ? error.message : String(error),
        type: 'error',
      })
    } finally {
      input.value = ''
    }
  }

  async function runGeneration(kind: 'variation' | 'new-direction') {
    if (generationPending) return
    setGenerationPending(true)
    try {
      const result =
        kind === 'variation' ? await workspace.variation() : await workspace.newDirection()
      if (result.kind === 'failure') {
        toast.add({ title: 'Theme generation failed', description: result.message, type: 'error' })
      } else if (result.kind === 'fallback') {
        toast.add({
          title: 'A safe fallback was used; try a new direction.',
          type: 'warning',
        })
      }
    } finally {
      setGenerationPending(false)
    }
  }

  return (
    <Card className="theme-studio" data-slot="theme-studio">
      <CardContent className="theme-studio-content">
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
            <FieldLabel htmlFor="theme-choice">Theme</FieldLabel>
            <Select
              modal={false}
              items={themeChoices}
              value={selectedChoice?.value ?? null}
              onValueChange={(value) => {
                const selected = themeChoices.find((choice) => choice.value === value)
                if (selected) {
                  setSelectedThemeChoice(selected.value)
                  workspace.load(selected.theme)
                }
              }}
            >
              <SelectTrigger id="theme-choice" className="theme-choice-trigger">
                <SelectValue>
                  <ThemeChoiceLabel theme={workspace.theme} saved={selectedChoice?.saved} />
                </SelectValue>
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false}>
                <SelectGroup>
                  {themeChoices.map((choice) => (
                    <SelectItem key={choice.value} value={choice.value}>
                      <ThemeChoiceLabel theme={choice.theme} saved={choice.saved} />
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
            <Button
              onClick={() => {
                try {
                  const theme = workspace.save()
                  toast.add({
                    title: `${theme.label} saved in this browser`,
                    type: 'success',
                  })
                } catch (error) {
                  toast.add({
                    title: 'Theme save failed',
                    description: error instanceof Error ? error.message : String(error),
                    type: 'error',
                  })
                }
              }}
            >
              Save theme
            </Button>
          </div>
          <div className="theme-generation-panel">
            <div className="theme-generation-actions">
              <Button
                variant="outline"
                disabled={
                  generationPending || !workspace.variationAvailable || workspace.generationDisabled
                }
                title={
                  workspace.variationAvailable
                    ? undefined
                    : 'Create a new direction before requesting a variation.'
                }
                onClick={() => runGeneration('variation')}
              >
                Variation
              </Button>
              <Button
                variant="outline"
                disabled={generationPending || workspace.generationDisabled}
                onClick={() => runGeneration('new-direction')}
              >
                New direction
              </Button>
            </div>
            <span className="theme-generation-lock-label">Keep</span>
            <div className="theme-generation-locks" role="group" aria-label="Keep theme properties">
              {workspace.generatorBranches.map((branch) => {
                const label =
                  branch === 'palette' ? 'Colors' : branch[0]?.toUpperCase() + branch.slice(1)
                const locked = workspace.locks.includes(branch)
                const edited = workspace.theme.generation?.editedBranches.includes(branch)
                return (
                  <Button
                    key={branch}
                    variant="outline"
                    size="sm"
                    aria-pressed={locked}
                    aria-label={`${label} ${locked ? 'locked' : 'unlocked'}${edited ? ', edited' : ''}`}
                    onClick={() => workspace.toggleLock(branch)}
                  >
                    <span>{label}</span>
                    {(locked || edited) && (
                      <span className="theme-generation-lock-state">
                        {[locked ? 'Locked' : '', edited ? 'Edited' : '']
                          .filter(Boolean)
                          .join(' · ')}
                      </span>
                    )}
                  </Button>
                )
              })}
            </div>
          </div>
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
            <div className="theme-tab-panel theme-typography-panel">
              <TypographyRoleSection role="heading" title="Heading" workspace={workspace} />
              <TypographyRoleSection role="body" title="Body" workspace={workspace} />
              <TerminalTypographySection workspace={workspace} />
            </div>
          </TabsContent>
          <TabsContent value="other">
            <FieldGroup className="theme-tab-panel">
              <ThemeRangeField
                label="Corner radius"
                value={workspace.theme.geometry.radius}
                cssVariable="--ui-radius"
                minimum={0}
                maximum={1.5}
                step={0.05}
                format={formatRem}
                onCommit={(radius) => workspace.setValue('geometry', 'radius', radius)}
              />
              <ThemeRangeField
                label="Panel radius"
                value={workspace.theme.geometry.panelRadius}
                cssVariable="--ui-radius-panel"
                minimum={0}
                maximum={2}
                step={0.05}
                format={formatRem}
                onCommit={(panelRadius) =>
                  workspace.setValue('geometry', 'panelRadius', panelRadius)
                }
              />
              <ThemeRangeField
                label="Control height"
                value={workspace.theme.density.control}
                cssVariable="--ui-control-height"
                minimum={1.75}
                maximum={3}
                step={0.05}
                format={formatRem}
                onCommit={(control) => workspace.setValue('density', 'control', control)}
              />
              <ThemeRangeField
                label="Small control height"
                value={workspace.theme.density.controlSmall}
                cssVariable="--ui-control-height-sm"
                minimum={1.5}
                maximum={2.75}
                step={0.05}
                format={formatRem}
                onCommit={(controlSmall) =>
                  workspace.setValue('density', 'controlSmall', controlSmall)
                }
              />
              <ThemeRangeField
                label="Large control height"
                value={workspace.theme.density.controlLarge}
                cssVariable="--ui-control-height-lg"
                minimum={2}
                maximum={3.5}
                step={0.05}
                format={formatRem}
                onCommit={(controlLarge) =>
                  workspace.setValue('density', 'controlLarge', controlLarge)
                }
              />
              <Field>
                <FieldLabel htmlFor="control-shadow">Control shadow</FieldLabel>
                <DraftInput
                  id="control-shadow"
                  value={workspace.theme.effects.controlShadow}
                  onCommit={(value) => workspace.setValue('effects', 'controlShadow', value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="panel-shadow">Panel shadow</FieldLabel>
                <DraftInput
                  id="panel-shadow"
                  value={workspace.theme.effects.panelShadow}
                  onCommit={(value) => workspace.setValue('effects', 'panelShadow', value)}
                />
              </Field>
              <ThemeRangeField
                label="Fast motion"
                value={workspace.theme.motion.fast}
                cssVariable="--ui-motion-fast"
                minimum={0}
                maximum={300}
                step={10}
                format={formatMilliseconds}
                onCommit={(fast) => workspace.setValue('motion', 'fast', fast)}
              />
              <ThemeRangeField
                label="Standard motion"
                value={workspace.theme.motion.standard}
                cssVariable="--ui-motion-standard"
                minimum={0}
                maximum={500}
                step={10}
                format={formatMilliseconds}
                onCommit={(standard) => workspace.setValue('motion', 'standard', standard)}
              />
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
                  {command}
                </code>
                <FieldDescription>
                  {published
                    ? 'This starter is release-qualified in the Astrale registry.'
                    : 'Export the CSS beside your project, then run this command to install and own it.'}
                </FieldDescription>
              </Field>
              <div className="theme-export-actions">
                <Button onClick={() => copy(command, 'Install command copied')}>
                  Copy command
                </Button>
                <Button
                  variant="outline"
                  onClick={() => copy(workspace.serializeCss(), 'Theme CSS copied')}
                >
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
                  onClick={() =>
                    download(`${workspace.theme.name}.css`, 'text/css', workspace.serializeCss())
                  }
                >
                  Download CSS
                </Button>
              </div>
            </FieldGroup>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
