import { Button } from '@astrale-os/ui/button'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@astrale-os/ui/field'
import { Input } from '@astrale-os/ui/input'
import { NativeSelect, NativeSelectOption } from '@astrale-os/ui/native-select'
import { DownloadIcon } from 'lucide-react'
import { useMemo, useState } from 'react'

import {
  type BrandColor,
  brandColors,
  contrastProblem,
  type LockupName,
  logoSvg,
  tileSvg,
} from '../../../packages/ui/src/brand/geometry.js'

/*
 * The brand generator in the browser: the same geometry and colors as `pnpm brand`, rendered to SVG
 * or PNG for someone who does not run the CLI. ICO and ICNS stay with the CLI and the icon set.
 */

type Lockup = LockupName | 'tile'
type Background = BrandColor | 'transparent'

const lockupLabels: Record<Lockup, string> = {
  horizontal: 'Horizontal (symbol and name)',
  stacked: 'Stacked (symbol over name)',
  symbol: 'Symbol',
  wordmark: 'Name',
  tile: 'App icon (symbol on a tile)',
}
const colorLabels: Record<BrandColor, string> = { blue: 'Blue', black: 'Black', white: 'White' }
const colors = Object.keys(brandColors) as BrandColor[]

function documentFor(lockup: Lockup, color: BrandColor, background: Background, width: number) {
  if (lockup !== 'tile') return logoSvg({ lockup, color, background })
  if (background === 'transparent') return null
  return tileSvg({ size: width, color, background, radius: 0.225, glyph: 0.68 })
}

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.click()
  URL.revokeObjectURL(url)
}

/** The SVG drawn on a canvas `width` pixels wide, at the document's aspect ratio. */
async function rasterize(svg: string, width: number): Promise<Blob> {
  const image = new Image()
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }))
  try {
    image.src = url
    await image.decode()
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = Math.round((width * image.naturalHeight) / image.naturalWidth)
    canvas.getContext('2d')!.drawImage(image, 0, 0, canvas.width, canvas.height)
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('PNG export failed'))),
        'image/png',
      ),
    )
  } finally {
    URL.revokeObjectURL(url)
  }
}

export function BrandStudio() {
  const [lockup, setLockup] = useState<Lockup>('horizontal')
  const [color, setColor] = useState<BrandColor>('blue')
  const [background, setBackground] = useState<Background>('transparent')
  const [width, setWidth] = useState(1024)

  const problem =
    contrastProblem(color, background) ??
    (lockup === 'tile' && background === 'transparent'
      ? 'An app icon needs a background color.'
      : !Number.isInteger(width) || width < 16 || width > 8192
        ? 'Choose a width between 16 and 8192 pixels.'
        : null)
  const svg = useMemo(
    () => (problem === null ? documentFor(lockup, color, background, width) : null),
    [problem, lockup, color, background, width],
  )
  const name = `astrale-${lockup}-${color}${background === 'transparent' ? '' : `-on-${background}`}`
  const preview = useMemo(
    () => (svg === null ? null : `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`),
    [svg],
  )

  return (
    <div data-slot="brand-studio" className="brand-studio">
      <div
        className="brand-studio-preview"
        data-surface={background === 'transparent' ? 'checkerboard' : undefined}
      >
        {preview === null ? (
          <p className="brand-studio-problem" role="status">
            {problem}
          </p>
        ) : (
          <img src={preview} alt={`${lockupLabels[lockup]} preview`} />
        )}
      </div>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="brand-lockup">Lockup</FieldLabel>
          <NativeSelect
            id="brand-lockup"
            value={lockup}
            onChange={(event) => setLockup(event.target.value as Lockup)}
          >
            {(Object.keys(lockupLabels) as Lockup[]).map((value) => (
              <NativeSelectOption key={value} value={value}>
                {lockupLabels[value]}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>
        <Field>
          <FieldLabel htmlFor="brand-color">Logo color</FieldLabel>
          <NativeSelect
            id="brand-color"
            value={color}
            onChange={(event) => setColor(event.target.value as BrandColor)}
          >
            {colors.map((value) => (
              <NativeSelectOption key={value} value={value}>
                {colorLabels[value]} ({brandColors[value]})
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>
        <Field>
          <FieldLabel htmlFor="brand-background">Background</FieldLabel>
          <NativeSelect
            id="brand-background"
            value={background}
            onChange={(event) => setBackground(event.target.value as Background)}
          >
            <NativeSelectOption value="transparent">Transparent</NativeSelectOption>
            {colors.map((value) => (
              <NativeSelectOption key={value} value={value}>
                {colorLabels[value]} ({brandColors[value]})
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>
        <Field>
          <FieldLabel htmlFor="brand-width">PNG width (px)</FieldLabel>
          <Input
            id="brand-width"
            type="number"
            min={16}
            max={8192}
            step={1}
            value={width}
            onChange={(event) => setWidth(event.target.valueAsNumber)}
          />
          <FieldDescription>
            The SVG scales to any size. Interfaces draw the logo with{' '}
            <code>@astrale-os/ui/brand</code> instead, in the text color of their theme.
          </FieldDescription>
        </Field>
      </FieldGroup>
      <div className="brand-studio-actions">
        <Button
          disabled={svg === null}
          onClick={() => svg && download(new Blob([svg], { type: 'image/svg+xml' }), `${name}.svg`)}
        >
          <DownloadIcon data-icon="inline-start" />
          Download SVG
        </Button>
        <Button
          variant="outline"
          disabled={svg === null}
          onClick={() => {
            if (svg)
              void rasterize(svg, width).then((blob) => download(blob, `${name}-${width}px.png`))
          }}
        >
          <DownloadIcon data-icon="inline-start" />
          Download PNG
        </Button>
      </div>
    </div>
  )
}
