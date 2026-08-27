import type { PreviewModule } from '../../previews.js'

const modules = import.meta.glob<PreviewModule>("../../../../../registry/variants/source/patterns/pagination/**/*.preview.tsx")

export function loadPreview(id: string): Promise<PreviewModule> {
  switch (id) {
    case "pattern/pagination/pagination-01#default":
      return modules["../../../../../registry/variants/source/patterns/pagination/pagination-01/pagination-01.preview.tsx"]!()
    case "pattern/pagination/pagination-02#default":
      return modules["../../../../../registry/variants/source/patterns/pagination/pagination-02/pagination-02.preview.tsx"]!()
    case "pattern/pagination/pagination-03#default":
      return modules["../../../../../registry/variants/source/patterns/pagination/pagination-03/pagination-03.preview.tsx"]!()
    case "pattern/pagination/pagination-04#default":
      return modules["../../../../../registry/variants/source/patterns/pagination/pagination-04/pagination-04.preview.tsx"]!()
    case "pattern/pagination/pagination-05#default":
      return modules["../../../../../registry/variants/source/patterns/pagination/pagination-05/pagination-05.preview.tsx"]!()
    case "pattern/pagination/pagination-06#default":
      return modules["../../../../../registry/variants/source/patterns/pagination/pagination-06/pagination-06.preview.tsx"]!()
    case "pattern/pagination/pagination-07#default":
      return modules["../../../../../registry/variants/source/patterns/pagination/pagination-07/pagination-07.preview.tsx"]!()
    case "pattern/pagination/pagination-08#default":
      return modules["../../../../../registry/variants/source/patterns/pagination/pagination-08/pagination-08.preview.tsx"]!()
    case "pattern/pagination/pagination-09#default":
      return modules["../../../../../registry/variants/source/patterns/pagination/pagination-09/pagination-09.preview.tsx"]!()
    case "pattern/pagination/pagination-10#default":
      return modules["../../../../../registry/variants/source/patterns/pagination/pagination-10/pagination-10.preview.tsx"]!()
    case "pattern/pagination/pagination-11#default":
      return modules["../../../../../registry/variants/source/patterns/pagination/pagination-11/pagination-11.preview.tsx"]!()
    case "pattern/pagination/pagination-12#default":
      return modules["../../../../../registry/variants/source/patterns/pagination/pagination-12/pagination-12.preview.tsx"]!()
    case "pattern/pagination/pagination-13#default":
      return modules["../../../../../registry/variants/source/patterns/pagination/pagination-13/pagination-13.preview.tsx"]!()
    case "pattern/pagination/pagination-14#default":
      return modules["../../../../../registry/variants/source/patterns/pagination/pagination-14/pagination-14.preview.tsx"]!()
    case "pattern/pagination/pagination-15#default":
      return modules["../../../../../registry/variants/source/patterns/pagination/pagination-15/pagination-15.preview.tsx"]!()
    default:
      return Promise.reject(new Error(`Unknown variant preview ${id}.`))
  }
}
