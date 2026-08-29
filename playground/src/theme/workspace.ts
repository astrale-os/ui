import { useCallback, useEffect, useState } from 'react'

import type { ThemeGenerationResult } from '../../../tooling/theme-generator/index.js'

import observatorySource from '../../../registry/themes/observatory.astrale-theme.json'
import {
  parseThemeDocument,
  parseThemeDocumentText,
  renderThemeCss,
  serializeThemeDocument,
  generatorBranches,
  type GeneratorBranch,
  type ThemeColorToken,
  type ThemeDocument,
} from '../../../tooling/theme-document/index.js'

const STORAGE_KEY = 'astrale-ui-playground:themes:v2'
const MAX_HISTORY = 50

export const defaultTheme = parseThemeDocument(observatorySource)

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

function nextSeed(): string {
  return [...globalThis.crypto.getRandomValues(new Uint8Array(16))]
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('')
}

function markEdited(theme: ThemeDocument, branch: GeneratorBranch): ThemeDocument {
  if (!theme.generation || theme.generation.editedBranches.includes(branch)) return theme
  return {
    ...theme,
    generation: {
      ...theme.generation,
      editedBranches: [...theme.generation.editedBranches, branch].sort(),
    },
  }
}

export function useThemeWorkspace() {
  const [timeline, setTimeline] = useState<Timeline>({
    past: [],
    present: copy(defaultTheme),
    future: [],
  })
  const [savedThemes, setSavedThemes] = useState<ThemeDocument[]>([])
  const [bootstrapLocks, setBootstrapLocks] = useState<readonly GeneratorBranch[]>([])

  useEffect(() => setSavedThemes(readSavedThemes()), [])

  const commitAdmitted = useCallback((admitted: ThemeDocument) => {
    setTimeline((current) => {
      if (serializeThemeDocument(current.present) === serializeThemeDocument(admitted)) {
        return current
      }
      return {
        past: [...current.past, current.present].slice(-MAX_HISTORY),
        present: admitted,
        future: [],
      }
    })
  }, [])

  const commit = useCallback(
    (next: ThemeDocument) => commitAdmitted(parseThemeDocument(next)),
    [commitAdmitted],
  )

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
    setBootstrapLocks([])
  }, [])

  const setIdentity = useCallback(
    (field: 'name' | 'label' | 'description', value: string) => {
      commit({ ...timeline.present, [field]: value })
    },
    [commit, timeline.present],
  )

  const setColor = useCallback(
    (mode: 'light' | 'dark', token: ThemeColorToken, value: string) => {
      commit(
        markEdited(
          {
            ...timeline.present,
            appearance: {
              ...timeline.present.appearance,
              [mode]: { ...timeline.present.appearance[mode], [token]: value },
            },
          },
          'palette',
        ),
      )
    },
    [commit, timeline.present],
  )

  const setValue = useCallback(
    <
      Section extends 'typography' | 'geometry' | 'density' | 'effects' | 'motion',
      Field extends keyof ThemeDocument[Section],
    >(
      section: Section,
      field: Field,
      value: ThemeDocument[Section][Field],
    ) => {
      const branch: GeneratorBranch = section === 'typography' ? 'typography' : 'geometry'
      commit(
        markEdited(
          {
            ...timeline.present,
            [section]: { ...timeline.present[section], [field]: value },
          },
          branch,
        ),
      )
    },
    [commit, timeline.present],
  )

  const locks = timeline.present.generation?.locks ?? bootstrapLocks

  const toggleLock = useCallback(
    (branch: GeneratorBranch) => {
      const next = locks.includes(branch)
        ? locks.filter((candidate) => candidate !== branch)
        : [...locks, branch].sort()
      if (timeline.present.generation) {
        commit({
          ...timeline.present,
          generation: { ...timeline.present.generation, locks: next },
        })
      } else {
        setBootstrapLocks(next)
      }
    },
    [commit, locks, timeline.present],
  )

  const generate = useCallback(
    async (kind: 'variation' | 'new-direction'): Promise<ThemeGenerationResult> => {
      if (kind === 'variation' && !timeline.present.generation) {
        return {
          kind: 'failure',
          code: 'variation-unavailable',
          message: 'Create a new direction before requesting a variation.',
        }
      }
      const request =
        kind === 'variation'
          ? {
              kind,
              theme: timeline.present as ThemeDocument & {
                generation: NonNullable<ThemeDocument['generation']>
              },
              seed: nextSeed(),
              locks,
            }
          : { kind: 'new-direction' as const, theme: timeline.present, seed: nextSeed(), locks }
      const { generateTheme } = await import('../../../tooling/theme-generator/index.js')
      const result = generateTheme(request)
      if (result.kind === 'generated' || result.kind === 'fallback') commitAdmitted(result.theme)
      return result
    },
    [commitAdmitted, locks, timeline.present],
  )

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
    async (source: string) => {
      const imported = parseThemeDocumentText(source)
      if (imported.generation) {
        const { validateGeneratorProvenance } =
          await import('../../../tooling/theme-generator/index.js')
        const provenance = validateGeneratorProvenance(imported)
        if (!provenance.ok)
          throw new Error(provenance.reasons[0] ?? 'Generated theme provenance is invalid.')
      }
      load(imported)
      return imported
    },
    [load],
  )

  return {
    theme: timeline.present,
    savedThemes,
    canUndo: timeline.past.length > 0,
    canRedo: timeline.future.length > 0,
    undo,
    redo,
    load,
    setIdentity,
    setColor,
    setValue,
    locks,
    generatorBranches,
    toggleLock,
    variationAvailable:
      Boolean(timeline.present.generation) &&
      timeline.present.generation?.lineage.kind !== 'fallback',
    generationDisabled: locks.length === generatorBranches.length,
    variation: () => generate('variation'),
    newDirection: () => generate('new-direction'),
    save,
    removeSaved,
    importText,
    serialize: () => serializeThemeDocument(timeline.present),
    serializeCss: () => renderThemeCss(timeline.present),
  }
}

export type ThemeWorkspace = ReturnType<typeof useThemeWorkspace>
