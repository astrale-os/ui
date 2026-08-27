import type { PreviewModule } from '../../previews.js'

const modules = import.meta.glob<PreviewModule>("../../../../../registry/variants/source/patterns/combobox/**/*.preview.tsx")

export function loadPreview(id: string): Promise<PreviewModule> {
  switch (id) {
    case "pattern/combobox/combobox-01#default":
      return modules["../../../../../registry/variants/source/patterns/combobox/combobox-01/combobox-01.preview.tsx"]!()
    case "pattern/combobox/combobox-02#default":
      return modules["../../../../../registry/variants/source/patterns/combobox/combobox-02/combobox-02.preview.tsx"]!()
    case "pattern/combobox/combobox-03#default":
      return modules["../../../../../registry/variants/source/patterns/combobox/combobox-03/combobox-03.preview.tsx"]!()
    case "pattern/combobox/combobox-04#default":
      return modules["../../../../../registry/variants/source/patterns/combobox/combobox-04/combobox-04.preview.tsx"]!()
    case "pattern/combobox/combobox-05#default":
      return modules["../../../../../registry/variants/source/patterns/combobox/combobox-05/combobox-05.preview.tsx"]!()
    case "pattern/combobox/combobox-06#default":
      return modules["../../../../../registry/variants/source/patterns/combobox/combobox-06/combobox-06.preview.tsx"]!()
    case "pattern/combobox/combobox-07#default":
      return modules["../../../../../registry/variants/source/patterns/combobox/combobox-07/combobox-07.preview.tsx"]!()
    case "pattern/combobox/combobox-08#default":
      return modules["../../../../../registry/variants/source/patterns/combobox/combobox-08/combobox-08.preview.tsx"]!()
    case "pattern/combobox/combobox-09#default":
      return modules["../../../../../registry/variants/source/patterns/combobox/combobox-09/combobox-09.preview.tsx"]!()
    case "pattern/combobox/combobox-10#default":
      return modules["../../../../../registry/variants/source/patterns/combobox/combobox-10/combobox-10.preview.tsx"]!()
    case "pattern/combobox/combobox-11#default":
      return modules["../../../../../registry/variants/source/patterns/combobox/combobox-11/combobox-11.preview.tsx"]!()
    case "pattern/combobox/combobox-12#default":
      return modules["../../../../../registry/variants/source/patterns/combobox/combobox-12/combobox-12.preview.tsx"]!()
    case "pattern/combobox/combobox-13#default":
      return modules["../../../../../registry/variants/source/patterns/combobox/combobox-13/combobox-13.preview.tsx"]!()
    case "pattern/combobox/combobox-14#default":
      return modules["../../../../../registry/variants/source/patterns/combobox/combobox-14/combobox-14.preview.tsx"]!()
    default:
      return Promise.reject(new Error(`Unknown variant preview ${id}.`))
  }
}
