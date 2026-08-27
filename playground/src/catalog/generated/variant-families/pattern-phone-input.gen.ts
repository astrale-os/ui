import type { PreviewModule } from '../../previews.js'

const modules = import.meta.glob<PreviewModule>("../../../../../registry/variants/source/patterns/phone-input/**/*.preview.tsx")

export function loadPreview(id: string): Promise<PreviewModule> {
  switch (id) {
    case "pattern/phone-input/phone-input-01#default":
      return modules["../../../../../registry/variants/source/patterns/phone-input/phone-input-01/phone-input-01.preview.tsx"]!()
    case "pattern/phone-input/phone-input-02#default":
      return modules["../../../../../registry/variants/source/patterns/phone-input/phone-input-02/phone-input-02.preview.tsx"]!()
    case "pattern/phone-input/phone-input-03#default":
      return modules["../../../../../registry/variants/source/patterns/phone-input/phone-input-03/phone-input-03.preview.tsx"]!()
    case "pattern/phone-input/phone-input-04#default":
      return modules["../../../../../registry/variants/source/patterns/phone-input/phone-input-04/phone-input-04.preview.tsx"]!()
    case "pattern/phone-input/phone-input-05#default":
      return modules["../../../../../registry/variants/source/patterns/phone-input/phone-input-05/phone-input-05.preview.tsx"]!()
    case "pattern/phone-input/phone-input-06#default":
      return modules["../../../../../registry/variants/source/patterns/phone-input/phone-input-06/phone-input-06.preview.tsx"]!()
    case "pattern/phone-input/phone-input-07#default":
      return modules["../../../../../registry/variants/source/patterns/phone-input/phone-input-07/phone-input-07.preview.tsx"]!()
    case "pattern/phone-input/phone-input-08#default":
      return modules["../../../../../registry/variants/source/patterns/phone-input/phone-input-08/phone-input-08.preview.tsx"]!()
    case "pattern/phone-input/phone-input-09#default":
      return modules["../../../../../registry/variants/source/patterns/phone-input/phone-input-09/phone-input-09.preview.tsx"]!()
    default:
      return Promise.reject(new Error(`Unknown variant preview ${id}.`))
  }
}
