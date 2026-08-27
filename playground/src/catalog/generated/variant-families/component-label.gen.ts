import type { PreviewModule } from '../../previews.js'

const modules = import.meta.glob<PreviewModule>("../../../../../registry/variants/source/components/label/**/*.preview.tsx")

export function loadPreview(id: string): Promise<PreviewModule> {
  switch (id) {
    case "component/label/label-01#default":
      return modules["../../../../../registry/variants/source/components/label/label-01/label-01.preview.tsx"]!()
    case "component/label/label-02#default":
      return modules["../../../../../registry/variants/source/components/label/label-02/label-02.preview.tsx"]!()
    case "component/label/label-03#default":
      return modules["../../../../../registry/variants/source/components/label/label-03/label-03.preview.tsx"]!()
    case "component/label/label-04#default":
      return modules["../../../../../registry/variants/source/components/label/label-04/label-04.preview.tsx"]!()
    case "component/label/label-05#default":
      return modules["../../../../../registry/variants/source/components/label/label-05/label-05.preview.tsx"]!()
    case "component/label/label-06#default":
      return modules["../../../../../registry/variants/source/components/label/label-06/label-06.preview.tsx"]!()
    case "component/label/label-07#default":
      return modules["../../../../../registry/variants/source/components/label/label-07/label-07.preview.tsx"]!()
    case "component/label/label-08#default":
      return modules["../../../../../registry/variants/source/components/label/label-08/label-08.preview.tsx"]!()
    case "component/label/label-09#default":
      return modules["../../../../../registry/variants/source/components/label/label-09/label-09.preview.tsx"]!()
    default:
      return Promise.reject(new Error(`Unknown variant preview ${id}.`))
  }
}
