import type { PreviewModule } from '../../previews.js'

const modules = import.meta.glob<PreviewModule>("../../../../../registry/variants/source/patterns/sortable/**/*.preview.tsx")

export function loadPreview(id: string): Promise<PreviewModule> {
  switch (id) {
    case "pattern/sortable/sortable-01#default":
      return modules["../../../../../registry/variants/source/patterns/sortable/sortable-01/sortable-01.preview.tsx"]!()
    case "pattern/sortable/sortable-02#default":
      return modules["../../../../../registry/variants/source/patterns/sortable/sortable-02/sortable-02.preview.tsx"]!()
    case "pattern/sortable/sortable-03#default":
      return modules["../../../../../registry/variants/source/patterns/sortable/sortable-03/sortable-03.preview.tsx"]!()
    case "pattern/sortable/sortable-04#default":
      return modules["../../../../../registry/variants/source/patterns/sortable/sortable-04/sortable-04.preview.tsx"]!()
    case "pattern/sortable/sortable-05#default":
      return modules["../../../../../registry/variants/source/patterns/sortable/sortable-05/sortable-05.preview.tsx"]!()
    default:
      return Promise.reject(new Error(`Unknown variant preview ${id}.`))
  }
}
