import type { PreviewModule } from '../../previews.js'

const modules = import.meta.glob<PreviewModule>("../../../../../registry/variants/source/patterns/list/**/*.preview.tsx")

export function loadPreview(id: string): Promise<PreviewModule> {
  switch (id) {
    case "pattern/list/list-01#default":
      return modules["../../../../../registry/variants/source/patterns/list/list-01/list-01.preview.tsx"]!()
    case "pattern/list/list-02#default":
      return modules["../../../../../registry/variants/source/patterns/list/list-02/list-02.preview.tsx"]!()
    case "pattern/list/list-03#default":
      return modules["../../../../../registry/variants/source/patterns/list/list-03/list-03.preview.tsx"]!()
    case "pattern/list/list-04#default":
      return modules["../../../../../registry/variants/source/patterns/list/list-04/list-04.preview.tsx"]!()
    case "pattern/list/list-05#default":
      return modules["../../../../../registry/variants/source/patterns/list/list-05/list-05.preview.tsx"]!()
    case "pattern/list/list-06#default":
      return modules["../../../../../registry/variants/source/patterns/list/list-06/list-06.preview.tsx"]!()
    case "pattern/list/list-07#default":
      return modules["../../../../../registry/variants/source/patterns/list/list-07/list-07.preview.tsx"]!()
    case "pattern/list/list-08#default":
      return modules["../../../../../registry/variants/source/patterns/list/list-08/list-08.preview.tsx"]!()
    case "pattern/list/list-09#default":
      return modules["../../../../../registry/variants/source/patterns/list/list-09/list-09.preview.tsx"]!()
    case "pattern/list/list-10#default":
      return modules["../../../../../registry/variants/source/patterns/list/list-10/list-10.preview.tsx"]!()
    default:
      return Promise.reject(new Error(`Unknown variant preview ${id}.`))
  }
}
