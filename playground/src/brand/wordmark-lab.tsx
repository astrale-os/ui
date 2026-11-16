import React, { useEffect, useMemo, useState } from 'react'
import ReactDOM from 'react-dom/client'

import { logoSvg, SYMBOL_PATH } from '../../../packages/ui/src/brand/geometry.js'
import './wordmark-lab.css'

/*
 * A scratch page to try typefaces for the name beside the Astrale symbol. The shipped wordmark is an
 * outline (Manrope Bold); here the name is live text, so any Google font can stand in for it. A
 * chosen setting is outlined into `geometry.ts` afterwards.
 */

type Weights = readonly [min: number, max: number] | readonly number[]
type Font = { family: string; weights: Weights; kind: 'Sans' | 'Wide' | 'Serif' }

const fonts: readonly Font[] = [
  { family: 'Manrope', weights: [200, 800], kind: 'Sans' },
  { family: 'Geist', weights: [100, 900], kind: 'Sans' },
  { family: 'Inter Tight', weights: [100, 900], kind: 'Sans' },
  { family: 'Space Grotesk', weights: [300, 700], kind: 'Sans' },
  { family: 'Sora', weights: [100, 800], kind: 'Sans' },
  { family: 'Outfit', weights: [100, 900], kind: 'Sans' },
  { family: 'Plus Jakarta Sans', weights: [200, 800], kind: 'Sans' },
  { family: 'DM Sans', weights: [100, 1000], kind: 'Sans' },
  { family: 'Urbanist', weights: [100, 900], kind: 'Sans' },
  { family: 'Lexend', weights: [100, 900], kind: 'Sans' },
  { family: 'Red Hat Display', weights: [300, 900], kind: 'Sans' },
  { family: 'Albert Sans', weights: [100, 900], kind: 'Sans' },
  { family: 'Figtree', weights: [300, 900], kind: 'Sans' },
  { family: 'Onest', weights: [100, 900], kind: 'Sans' },
  { family: 'Instrument Sans', weights: [400, 700], kind: 'Sans' },
  { family: 'Bricolage Grotesque', weights: [200, 800], kind: 'Sans' },
  { family: 'Schibsted Grotesk', weights: [400, 900], kind: 'Sans' },
  { family: 'Hanken Grotesk', weights: [100, 900], kind: 'Sans' },
  { family: 'Familjen Grotesk', weights: [400, 700], kind: 'Sans' },
  { family: 'Funnel Display', weights: [300, 800], kind: 'Sans' },
  { family: 'Geologica', weights: [100, 900], kind: 'Sans' },
  { family: 'Afacad', weights: [400, 700], kind: 'Sans' },
  { family: 'Montserrat', weights: [100, 900], kind: 'Sans' },
  { family: 'Poppins', weights: [100, 200, 300, 400, 500, 600, 700, 800, 900], kind: 'Sans' },
  { family: 'Archivo', weights: [100, 900], kind: 'Sans' },
  { family: 'Jost', weights: [100, 900], kind: 'Sans' },
  { family: 'Josefin Sans', weights: [100, 700], kind: 'Sans' },
  { family: 'Raleway', weights: [100, 900], kind: 'Sans' },
  { family: 'Questrial', weights: [400], kind: 'Sans' },
  { family: 'Didact Gothic', weights: [400], kind: 'Sans' },
  { family: 'Syne', weights: [400, 800], kind: 'Wide' },
  { family: 'Unbounded', weights: [200, 900], kind: 'Wide' },
  { family: 'Michroma', weights: [400], kind: 'Wide' },
  { family: 'Chakra Petch', weights: [300, 400, 500, 600, 700], kind: 'Wide' },
  { family: 'Exo 2', weights: [100, 900], kind: 'Wide' },
  { family: 'Saira', weights: [100, 900], kind: 'Wide' },
  { family: 'Fraunces', weights: [100, 900], kind: 'Serif' },
  { family: 'Playfair Display', weights: [400, 900], kind: 'Serif' },
  { family: 'Instrument Serif', weights: [400], kind: 'Serif' },
  { family: 'DM Serif Display', weights: [400], kind: 'Serif' },
  { family: 'Newsreader', weights: [200, 800], kind: 'Serif' },
  { family: 'Cormorant Garamond', weights: [300, 700], kind: 'Serif' },
  { family: 'Lora', weights: [400, 700], kind: 'Serif' },
  { family: 'Libre Baskerville', weights: [400, 700], kind: 'Serif' },
  { family: 'Bodoni Moda', weights: [400, 900], kind: 'Serif' },
  { family: 'Gloock', weights: [400], kind: 'Serif' },
]

const isRange = (weights: Weights): weights is readonly [number, number] =>
  weights.length === 2 && weights[1] - weights[0] > 100
const range = (weights: Weights) => (isRange(weights) ? weights : [weights[0], weights.at(-1)!])
/** The weight the font can draw closest to the one asked for. */
function nearestWeight(weights: Weights, wanted: number) {
  if (isRange(weights)) return Math.min(Math.max(wanted, weights[0]), weights[1])
  return weights.reduce((best, weight) =>
    Math.abs(weight - wanted) < Math.abs(best - wanted) ? weight : best,
  )
}
function stylesheet({ family, weights }: Font) {
  const axis = isRange(weights) ? `${weights[0]}..${weights[1]}` : weights.join(';')
  return `https://fonts.googleapis.com/css2?family=${family.replaceAll(' ', '+')}:wght@${axis}&display=block`
}

type Case = 'title' | 'upper' | 'lower'
const names: Record<Case, string> = { title: 'Astrale', upper: 'ASTRALE', lower: 'astrale' }

type Settings = {
  family: string
  weight: number
  case: Case
  /** Letter spacing, in em. */
  tracking: number
  /** Cap height of the name over the symbol's height. */
  size: number
  /** Space between symbol and name, over the symbol's height. */
  gap: number
  /** Baseline shift from caps centred on the symbol, over the symbol's height (down is positive). */
  shift: number
}

const defaults: Settings = {
  family: 'Manrope',
  weight: 700,
  case: 'title',
  tracking: 0,
  size: 0.62,
  gap: 0.32,
  shift: 0,
}

/** The symbol's drawn bounds inside its 100-unit design square. */
const SYMBOL = { x: 6.16, y: 5.98, width: 87.68, height: 80.14 }

function readHash(): { settings: Settings; pinned: string[] } {
  try {
    const value = JSON.parse(decodeURIComponent(location.hash.slice(1)))
    return { settings: { ...defaults, ...value.settings }, pinned: value.pinned ?? [] }
  } catch {
    return { settings: defaults, pinned: [] }
  }
}

/** Cap height over font size, measured once the font has loaded. */
const capCache = new Map<string, number>()
function capHeight(family: string, weight: number) {
  const key = `${family}/${weight}`
  if (!capCache.has(key)) {
    const context = document.createElement('canvas').getContext('2d')!
    context.font = `${weight} 100px "${family}"`
    capCache.set(key, context.measureText('H').actualBoundingBoxAscent / 100 || 0.72)
  }
  return capCache.get(key)!
}
function textWidth(text: string, family: string, weight: number, size: number, tracking: number) {
  const context = document.createElement('canvas').getContext('2d')!
  context.font = `${weight} ${size}px "${family}"`
  return context.measureText(text).width + tracking * size * (text.length - 1)
}

/** Re-renders once every font asked for so far has loaded, so measurements use real metrics. */
function useFontsLoaded() {
  const [, setVersion] = useState(0)
  useEffect(() => {
    const refresh = () => {
      capCache.clear()
      setVersion((version) => version + 1)
    }
    document.fonts.addEventListener('loadingdone', refresh)
    return () => document.fonts.removeEventListener('loadingdone', refresh)
  }, [])
}

/** The symbol beside the name set in live text, `height` pixels tall (the symbol's height). */
function Lockup({ settings, height }: { settings: Settings; height: number }) {
  const font = fonts.find((candidate) => candidate.family === settings.family) ?? fonts[0]!
  const weight = nearestWeight(font.weights, settings.weight)
  const text = names[settings.case]
  const unitsCap = settings.size * SYMBOL.height
  const fontSize = unitsCap / capHeight(font.family, weight)
  const x = SYMBOL.width + settings.gap * SYMBOL.height
  const baseline = SYMBOL.height / 2 + unitsCap / 2 + settings.shift * SYMBOL.height
  const width = x + textWidth(text, font.family, weight, fontSize, settings.tracking) + 2
  return (
    <svg
      className="lab-lockup"
      viewBox={`0 0 ${width} ${SYMBOL.height}`}
      height={height}
      width={(height * width) / SYMBOL.height}
      role="img"
      aria-label={`Astrale in ${font.family} ${weight}`}
      overflow="visible"
    >
      <path
        d={SYMBOL_PATH}
        fillRule="evenodd"
        fill="currentColor"
        transform={`translate(${-SYMBOL.x} ${-SYMBOL.y})`}
      />
      <text
        x={x}
        y={baseline}
        fill="currentColor"
        fontFamily={`"${font.family}"`}
        fontWeight={weight}
        fontSize={fontSize}
        letterSpacing={settings.tracking * fontSize}
      >
        {text}
      </text>
    </svg>
  )
}

/** The logo as shipped today, from the outlines in geometry.ts. */
function CurrentLogo({ height }: { height: number }) {
  const svg = useMemo(() => logoSvg({ lockup: 'horizontal', color: 'currentColor' }), [])
  return (
    <span className="lab-current" style={{ height }} dangerouslySetInnerHTML={{ __html: svg }} />
  )
}

const surfaces = [
  { id: 'paper', label: 'Paper' },
  { id: 'night', label: 'Dark' },
  { id: 'blue', label: 'Blue' },
] as const

function WordmarkLab() {
  const initial = useMemo(readHash, [])
  const [settings, setSettings] = useState<Settings>(initial.settings)
  const [pinned, setPinned] = useState<string[]>(initial.pinned)
  const [onlyPinned, setOnlyPinned] = useState(false)
  const [kind, setKind] = useState<'All' | Font['kind']>('All')
  const [copied, setCopied] = useState(false)
  useFontsLoaded()

  useEffect(() => {
    for (const font of fonts) {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = stylesheet(font)
      document.head.append(link)
    }
  }, [])

  useEffect(() => {
    history.replaceState(null, '', `#${encodeURIComponent(JSON.stringify({ settings, pinned }))}`)
  }, [settings, pinned])

  const font = fonts.find((candidate) => candidate.family === settings.family) ?? fonts[0]!
  const [minWeight, maxWeight] = range(font.weights)
  const weight = nearestWeight(font.weights, settings.weight)
  const set = (patch: Partial<Settings>) => setSettings((current) => ({ ...current, ...patch }))
  const step = (direction: 1 | -1) => {
    const index = fonts.indexOf(font)
    set({ family: fonts[(index + direction + fonts.length) % fonts.length]!.family })
  }
  const togglePin = (family: string) =>
    setPinned((current) =>
      current.includes(family) ? current.filter((name) => name !== family) : [...current, family],
    )

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement)
        return
      if (event.key === 'ArrowRight') step(1)
      if (event.key === 'ArrowLeft') step(-1)
      if (event.key === 'p') togglePin(font.family)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const shown = fonts.filter(
    (candidate) =>
      (kind === 'All' || candidate.kind === kind) &&
      (!onlyPinned || pinned.includes(candidate.family)),
  )

  return (
    <div className="lab">
      <aside className="lab-controls">
        <h1>Wordmark lab</h1>
        <p className="lab-hint">← → to change font, P to pin. Settings live in the URL.</p>

        <label>
          Font
          <span className="lab-row">
            <button type="button" onClick={() => step(-1)} aria-label="Previous font">
              ←
            </button>
            <select value={font.family} onChange={(event) => set({ family: event.target.value })}>
              {fonts.map(({ family, kind: group }) => (
                <option key={family} value={family}>
                  {family} · {group}
                </option>
              ))}
            </select>
            <button type="button" onClick={() => step(1)} aria-label="Next font">
              →
            </button>
          </span>
        </label>

        <Slider
          label="Weight"
          value={weight}
          min={minWeight}
          max={maxWeight}
          step={isRange(font.weights) ? 10 : 100}
          format={(v) => String(v)}
          onChange={(v) => set({ weight: v })}
        />

        <fieldset>
          <legend>Case</legend>
          <span className="lab-row">
            {(Object.keys(names) as Case[]).map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={settings.case === value}
                onClick={() => set({ case: value })}
              >
                {names[value]}
              </button>
            ))}
          </span>
        </fieldset>

        <Slider
          label="Letter spacing"
          value={settings.tracking}
          min={-0.08}
          max={0.45}
          step={0.005}
          format={(v) => `${v.toFixed(3)} em`}
          onChange={(v) => set({ tracking: v })}
        />
        <Slider
          label="Name size (cap height / symbol)"
          value={settings.size}
          min={0.3}
          max={0.95}
          step={0.01}
          format={(v) => `${Math.round(v * 100)}%`}
          onChange={(v) => set({ size: v })}
        />
        <Slider
          label="Gap (/ symbol)"
          value={settings.gap}
          min={0.05}
          max={0.7}
          step={0.01}
          format={(v) => `${Math.round(v * 100)}%`}
          onChange={(v) => set({ gap: v })}
        />
        <Slider
          label="Baseline shift (/ symbol)"
          value={settings.shift}
          min={-0.25}
          max={0.25}
          step={0.005}
          format={(v) => `${(v * 100).toFixed(1)}%`}
          onChange={(v) => set({ shift: v })}
        />

        <span className="lab-row">
          <button
            type="button"
            aria-pressed={pinned.includes(font.family)}
            onClick={() => togglePin(font.family)}
          >
            {pinned.includes(font.family) ? '★ Pinned' : '☆ Pin'}
          </button>
          <button type="button" onClick={() => setSettings({ ...defaults })}>
            Reset to today’s logo
          </button>
        </span>
        <button
          type="button"
          onClick={() => {
            void navigator.clipboard.writeText(JSON.stringify({ ...settings, weight }, null, 2))
            setCopied(true)
            setTimeout(() => setCopied(false), 1500)
          }}
        >
          {copied ? 'Copied' : 'Copy settings'}
        </button>
      </aside>

      <main className="lab-main">
        <section className="lab-hero">
          {surfaces.map(({ id, label }) => (
            <div key={id} className="lab-surface" data-surface={id}>
              <span className="lab-surface-label">{label}</span>
              <Lockup settings={settings} height={id === 'paper' ? 84 : 56} />
            </div>
          ))}
        </section>

        <section className="lab-contexts">
          <div className="lab-surface lab-nav" data-surface="paper">
            <Lockup settings={settings} height={24} />
            <span className="lab-nav-links">Documentation</span>
          </div>
          <div className="lab-surface lab-nav" data-surface="night">
            <Lockup settings={settings} height={24} />
            <span className="lab-nav-links">Documentation</span>
          </div>
          <div className="lab-surface lab-compare" data-surface="paper">
            <span className="lab-surface-label">Today</span>
            <CurrentLogo height={40} />
            <span className="lab-surface-label">Trying</span>
            <Lockup settings={settings} height={40} />
          </div>
        </section>

        <section>
          <header className="lab-grid-header">
            <h2>All fonts, with these settings</h2>
            <span className="lab-row">
              {(['All', 'Sans', 'Wide', 'Serif'] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={kind === value}
                  onClick={() => setKind(value)}
                >
                  {value}
                </button>
              ))}
              <button
                type="button"
                aria-pressed={onlyPinned}
                onClick={() => setOnlyPinned(!onlyPinned)}
              >
                ★ Pinned ({pinned.length})
              </button>
            </span>
          </header>
          <ul className="lab-grid">
            {shown.map((candidate) => (
              <li key={candidate.family} data-selected={candidate.family === font.family}>
                <button
                  type="button"
                  className="lab-card"
                  onClick={() => set({ family: candidate.family })}
                >
                  <Lockup settings={{ ...settings, family: candidate.family }} height={44} />
                  <span className="lab-card-name">
                    {candidate.family}
                    <small>
                      {candidate.kind} · {nearestWeight(candidate.weights, settings.weight)}
                    </small>
                  </span>
                </button>
                <button
                  type="button"
                  className="lab-pin"
                  aria-pressed={pinned.includes(candidate.family)}
                  aria-label={`Pin ${candidate.family}`}
                  onClick={() => togglePin(candidate.family)}
                >
                  {pinned.includes(candidate.family) ? '★' : '☆'}
                </button>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  )
}

function Slider(props: {
  label: string
  value: number
  min: number
  max: number
  step: number
  format: (value: number) => string
  onChange: (value: number) => void
}) {
  return (
    <label>
      <span className="lab-row lab-slider-head">
        {props.label}
        <output>{props.format(props.value)}</output>
      </span>
      <input
        type="range"
        min={props.min}
        max={props.max}
        step={props.step}
        value={props.value}
        onChange={(event) => props.onChange(event.target.valueAsNumber)}
      />
    </label>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WordmarkLab />
  </React.StrictMode>,
)
