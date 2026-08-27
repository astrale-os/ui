import type { PreviewModule } from '../../previews.js'

const modules = import.meta.glob<PreviewModule>("../../../../../registry/variants/source/components/sheet/**/*.preview.tsx")

export function loadPreview(id: string): Promise<PreviewModule> {
  switch (id) {
    case "component/sheet/sheet-01#default":
      return modules["../../../../../registry/variants/source/components/sheet/sheet-01/sheet-01.preview.tsx"]!()
    case "component/sheet/sheet-02#default":
      return modules["../../../../../registry/variants/source/components/sheet/sheet-02/sheet-02.preview.tsx"]!()
    case "component/sheet/sheet-03#default":
      return modules["../../../../../registry/variants/source/components/sheet/sheet-03/sheet-03.preview.tsx"]!()
    case "component/sheet/sheet-04#default":
      return modules["../../../../../registry/variants/source/components/sheet/sheet-04/sheet-04.preview.tsx"]!()
    case "component/sheet/sheet-05#default":
      return modules["../../../../../registry/variants/source/components/sheet/sheet-05/sheet-05.preview.tsx"]!()
    case "component/sheet/sheet-06#default":
      return modules["../../../../../registry/variants/source/components/sheet/sheet-06/sheet-06.preview.tsx"]!()
    case "component/sheet/sheet-07#default":
      return modules["../../../../../registry/variants/source/components/sheet/sheet-07/sheet-07.preview.tsx"]!()
    default:
      return Promise.reject(new Error(`Unknown variant preview ${id}.`))
  }
}
