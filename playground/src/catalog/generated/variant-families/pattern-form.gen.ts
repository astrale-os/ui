import type { PreviewModule } from '../../previews.js'

const modules = import.meta.glob<PreviewModule>("../../../../../registry/variants/source/patterns/form/**/*.preview.tsx")

export function loadPreview(id: string): Promise<PreviewModule> {
  switch (id) {
    case "pattern/form/form-01#default":
      return modules["../../../../../registry/variants/source/patterns/form/form-01/form-01.preview.tsx"]!()
    case "pattern/form/form-02#default":
      return modules["../../../../../registry/variants/source/patterns/form/form-02/form-02.preview.tsx"]!()
    case "pattern/form/form-03#default":
      return modules["../../../../../registry/variants/source/patterns/form/form-03/form-03.preview.tsx"]!()
    case "pattern/form/form-04#default":
      return modules["../../../../../registry/variants/source/patterns/form/form-04/form-04.preview.tsx"]!()
    case "pattern/form/form-05#default":
      return modules["../../../../../registry/variants/source/patterns/form/form-05/form-05.preview.tsx"]!()
    case "pattern/form/form-06#default":
      return modules["../../../../../registry/variants/source/patterns/form/form-06/form-06.preview.tsx"]!()
    case "pattern/form/form-07#default":
      return modules["../../../../../registry/variants/source/patterns/form/form-07/form-07.preview.tsx"]!()
    case "pattern/form/form-08#default":
      return modules["../../../../../registry/variants/source/patterns/form/form-08/form-08.preview.tsx"]!()
    case "pattern/form/form-09#default":
      return modules["../../../../../registry/variants/source/patterns/form/form-09/form-09.preview.tsx"]!()
    case "pattern/form/form-10#default":
      return modules["../../../../../registry/variants/source/patterns/form/form-10/form-10.preview.tsx"]!()
    default:
      return Promise.reject(new Error(`Unknown variant preview ${id}.`))
  }
}
