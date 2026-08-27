import type { PreviewModule } from '../../previews.js'

const modules = import.meta.glob<PreviewModule>("../../../../../registry/variants/source/blocks/kanban/**/*.preview.tsx")

export function loadPreview(id: string): Promise<PreviewModule> {
  switch (id) {
    case "block/kanban/kanban-01#default":
      return modules["../../../../../registry/variants/source/blocks/kanban/kanban-01/kanban-01.preview.tsx"]!()
    case "block/kanban/kanban-02#default":
      return modules["../../../../../registry/variants/source/blocks/kanban/kanban-02/kanban-02.preview.tsx"]!()
    case "block/kanban/kanban-03#default":
      return modules["../../../../../registry/variants/source/blocks/kanban/kanban-03/kanban-03.preview.tsx"]!()
    case "block/kanban/kanban-04#default":
      return modules["../../../../../registry/variants/source/blocks/kanban/kanban-04/kanban-04.preview.tsx"]!()
    default:
      return Promise.reject(new Error(`Unknown variant preview ${id}.`))
  }
}
