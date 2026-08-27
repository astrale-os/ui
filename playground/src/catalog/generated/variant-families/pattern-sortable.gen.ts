import type { PreviewModule } from '../../previews.js'

const modules = import.meta.glob<PreviewModule>("../../../../../registry/variants/source/patterns/sortable/**/*.preview.tsx")

export const previewLoaders = {
  "pattern/sortable/sortable-01#default": modules["../../../../../registry/variants/source/patterns/sortable/sortable-01/sortable-01.preview.tsx"]!,
  "pattern/sortable/sortable-02#default": modules["../../../../../registry/variants/source/patterns/sortable/sortable-02/sortable-02.preview.tsx"]!,
  "pattern/sortable/sortable-03#default": modules["../../../../../registry/variants/source/patterns/sortable/sortable-03/sortable-03.preview.tsx"]!,
  "pattern/sortable/sortable-04#default": modules["../../../../../registry/variants/source/patterns/sortable/sortable-04/sortable-04.preview.tsx"]!,
  "pattern/sortable/sortable-05#default": modules["../../../../../registry/variants/source/patterns/sortable/sortable-05/sortable-05.preview.tsx"]!,
} satisfies Record<string, () => Promise<PreviewModule>>
