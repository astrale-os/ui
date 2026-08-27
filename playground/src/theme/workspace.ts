import { useCallback, useEffect, useMemo, useState } from 'react'

import {
  parseThemeDocument,
  parseThemeDocumentText,
  renderThemeCss,
  serializeThemeDocument,
  type ThemeColorToken,
  type ThemeDocument,
} from '../../../tooling/theme-document/index.js'

const STORAGE_KEY = 'astrale-ui-playground:themes:v2'
const MAX_HISTORY = 50

const starterModules = import.meta.glob('../../../registry/themes/*.astrale-theme.json', {
  eager: true,
  import: 'default',
}) as Record<string, unknown>

export const starterThemes = Object.values(starterModules)
  .map((source) => parseThemeDocument(source))
  .sort((left, right) => left.label.localeCompare(right.label))

type Timeline = {
  past: ThemeDocument[]
  present: ThemeDocument
  future: ThemeDocument[]
}

function copy(theme: ThemeDocument): ThemeDocument {
  return parseThemeDocument(JSON.parse(JSON.stringify(theme)))
}

function readSavedThemes(): ThemeDocument[] {
  try {
    const source = localStorage.getItem(STORAGE_KEY)
    if (!source) return []
    const values = JSON.parse(source)
    if (!Array.isArray(values)) return []
    return values.flatMap((value) => {
      try {
        return [parseThemeDocument(value)]
      } catch {
        return []
      }
    })
  } catch {
    return []
  }
}

function writeSavedThemes(themes: ThemeDocument[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(themes))
}

export function useThemeWorkspace() {
  const [timeline, setTimeline] = useState<Timeline>({
    past: [],
    present: copy(starterThemes.find((theme) => theme.name === 'observatory')!),
    future: [],
  })
  const [savedThemes, setSavedThemes] = useState<ThemeDocument[]>([])

  useEffect(() => setSavedThemes(readSavedThemes()), [])

  const commit = useCallback((next: ThemeDocument) => {
    const admitted = parseThemeDocument(next)
    setTimeline((current) => ({
      past: [...current.past, current.present].slice(-MAX_HISTORY),
      present: admitted,
      future: [],
    }))
  }, [])

  const undo = useCallback(() => {
    setTimeline((current) => {
      const previous = current.past.at(-1)
      if (!previous) return current
      return {
        past: current.past.slice(0, -1),
        present: previous,
        future: [current.present, ...current.future].slice(0, MAX_HISTORY),
      }
    })
  }, [])

  const redo = useCallback(() => {
    setTimeline((current) => {
      const next = current.future[0]
      if (!next) return current
      return {
        past: [...current.past, current.present].slice(-MAX_HISTORY),
        present: next,
        future: current.future.slice(1),
      }
    })
  }, [])

  const load = useCallback((theme: ThemeDocument) => {
    setTimeline({ past: [], present: copy(theme), future: [] })
  }, [])

  const setIdentity = useCallback(
    (field: 'name' | 'label' | 'description', value: string) => {
      commit({ ...timeline.present, [field]: value })
    },
    [commit, timeline.present],
  )

  const setColor = useCallback(
    (mode: 'light' | 'dark', token: ThemeColorToken, value: string) => {
      commit({
        ...timeline.present,
        appearance: {
          ...timeline.present.appearance,
          [mode]: { ...timeline.present.appearance[mode], [token]: value },
        },
      })
    },
    [commit, timeline.present],
  )

  const setValue = useCallback(
    <Section extends 'typography' | 'geometry' | 'density' | 'effects' | 'motion'>(
      section: Section,
      field: keyof ThemeDocument[Section],
      value: string,
    ) => {
      commit({
        ...timeline.present,
        [section]: { ...timeline.present[section], [field]: value },
      })
    },
    [commit, timeline.present],
  )

  const randomize = useCallback(() => {
    const hue = Math.floor(Math.random() * 360)
    const complement = (hue + 145) % 360
    const accent = (hue + 72) % 360
    commit({
      ...timeline.present,
      appearance: {
        light: {
          ...timeline.present.appearance.light,
          primary: `oklch(0.52 0.18 ${hue})`,
          ring: `oklch(0.58 0.15 ${hue})`,
          accent: `oklch(0.88 0.09 ${accent})`,
          chart1: `oklch(0.58 0.18 ${hue})`,
          chart2: `oklch(0.66 0.15 ${complement})`,
          chart3: `oklch(0.72 0.16 ${accent})`,
          chart4: `oklch(0.62 0.18 ${(hue + 215) % 360})`,
          chart5: `oklch(0.57 0.15 ${(hue + 292) % 360})`,
        },
        dark: {
          ...timeline.present.appearance.dark,
          primary: `oklch(0.74 0.14 ${hue})`,
          ring: `oklch(0.7 0.13 ${hue})`,
          accent: `oklch(0.42 0.1 ${accent})`,
          chart1: `oklch(0.7 0.16 ${hue})`,
          chart2: `oklch(0.72 0.14 ${complement})`,
          chart3: `oklch(0.76 0.15 ${accent})`,
          chart4: `oklch(0.71 0.16 ${(hue + 215) % 360})`,
          chart5: `oklch(0.69 0.14 ${(hue + 292) % 360})`,
        },
      },
    })
  }, [commit, timeline.present])

  const save = useCallback(() => {
    const next = [
      ...savedThemes.filter((theme) => theme.name !== timeline.present.name),
      copy(timeline.present),
    ].sort((left, right) => left.label.localeCompare(right.label))
    writeSavedThemes(next)
    setSavedThemes(next)
    return timeline.present
  }, [savedThemes, timeline.present])

  const removeSaved = useCallback(
    (name: string) => {
      const next = savedThemes.filter((theme) => theme.name !== name)
      writeSavedThemes(next)
      setSavedThemes(next)
    },
    [savedThemes],
  )

  const importText = useCallback(
    (source: string) => {
      const imported = parseThemeDocumentText(source)
      load(imported)
      return imported
    },
    [load],
  )

  return {
    theme: timeline.present,
    css: useMemo(() => renderThemeCss(timeline.present), [timeline.present]),
    savedThemes,
    canUndo: timeline.past.length > 0,
    canRedo: timeline.future.length > 0,
    undo,
    redo,
    load,
    setIdentity,
    setColor,
    setValue,
    randomize,
    save,
    removeSaved,
    importText,
    serialize: () => serializeThemeDocument(timeline.present),
  }
}

export type ThemeWorkspace = ReturnType<typeof useThemeWorkspace>
