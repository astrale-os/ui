import type { PreviewModule } from '../../previews.js'

const modules = import.meta.glob<PreviewModule>("../../../../../registry/variants/source/blocks/kanban/**/*.preview.tsx")

export const previewLoaders = {
  "block/kanban/kanban-01#default": modules["../../../../../registry/variants/source/blocks/kanban/kanban-01/kanban-01.preview.tsx"]!,
  "block/kanban/kanban-02#default": modules["../../../../../registry/variants/source/blocks/kanban/kanban-02/kanban-02.preview.tsx"]!,
  "block/kanban/kanban-03#default": modules["../../../../../registry/variants/source/blocks/kanban/kanban-03/kanban-03.preview.tsx"]!,
  "block/kanban/kanban-04#default": modules["../../../../../registry/variants/source/blocks/kanban/kanban-04/kanban-04.preview.tsx"]!,
} satisfies Record<string, () => Promise<PreviewModule>>
