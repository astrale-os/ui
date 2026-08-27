import type { PreviewModule } from '../../previews.js'

const modules = import.meta.glob<PreviewModule>("../../../../../registry/variants/source/patterns/breadcrumb/**/*.preview.tsx")

export function loadPreview(id: string): Promise<PreviewModule> {
  switch (id) {
    case "pattern/breadcrumb/breadcrumb-01#default":
      return modules["../../../../../registry/variants/source/patterns/breadcrumb/breadcrumb-01/breadcrumb-01.preview.tsx"]!()
    case "pattern/breadcrumb/breadcrumb-02#default":
      return modules["../../../../../registry/variants/source/patterns/breadcrumb/breadcrumb-02/breadcrumb-02.preview.tsx"]!()
    case "pattern/breadcrumb/breadcrumb-03#default":
      return modules["../../../../../registry/variants/source/patterns/breadcrumb/breadcrumb-03/breadcrumb-03.preview.tsx"]!()
    case "pattern/breadcrumb/breadcrumb-04#default":
      return modules["../../../../../registry/variants/source/patterns/breadcrumb/breadcrumb-04/breadcrumb-04.preview.tsx"]!()
    case "pattern/breadcrumb/breadcrumb-05#default":
      return modules["../../../../../registry/variants/source/patterns/breadcrumb/breadcrumb-05/breadcrumb-05.preview.tsx"]!()
    case "pattern/breadcrumb/breadcrumb-06#default":
      return modules["../../../../../registry/variants/source/patterns/breadcrumb/breadcrumb-06/breadcrumb-06.preview.tsx"]!()
    case "pattern/breadcrumb/breadcrumb-07#default":
      return modules["../../../../../registry/variants/source/patterns/breadcrumb/breadcrumb-07/breadcrumb-07.preview.tsx"]!()
    case "pattern/breadcrumb/breadcrumb-08#default":
      return modules["../../../../../registry/variants/source/patterns/breadcrumb/breadcrumb-08/breadcrumb-08.preview.tsx"]!()
    default:
      return Promise.reject(new Error(`Unknown variant preview ${id}.`))
  }
}
