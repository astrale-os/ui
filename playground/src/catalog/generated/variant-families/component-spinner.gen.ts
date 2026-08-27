import type { PreviewModule } from '../../previews.js'

const modules = import.meta.glob<PreviewModule>("../../../../../registry/variants/source/components/spinner/**/*.preview.tsx")

export function loadPreview(id: string): Promise<PreviewModule> {
  switch (id) {
    case "component/spinner/spinner-01#default":
      return modules["../../../../../registry/variants/source/components/spinner/spinner-01/spinner-01.preview.tsx"]!()
    case "component/spinner/spinner-02#default":
      return modules["../../../../../registry/variants/source/components/spinner/spinner-02/spinner-02.preview.tsx"]!()
    case "component/spinner/spinner-03#default":
      return modules["../../../../../registry/variants/source/components/spinner/spinner-03/spinner-03.preview.tsx"]!()
    case "component/spinner/spinner-04#default":
      return modules["../../../../../registry/variants/source/components/spinner/spinner-04/spinner-04.preview.tsx"]!()
    case "component/spinner/spinner-05#default":
      return modules["../../../../../registry/variants/source/components/spinner/spinner-05/spinner-05.preview.tsx"]!()
    case "component/spinner/spinner-06#default":
      return modules["../../../../../registry/variants/source/components/spinner/spinner-06/spinner-06.preview.tsx"]!()
    case "component/spinner/spinner-07#default":
      return modules["../../../../../registry/variants/source/components/spinner/spinner-07/spinner-07.preview.tsx"]!()
    case "component/spinner/spinner-08#default":
      return modules["../../../../../registry/variants/source/components/spinner/spinner-08/spinner-08.preview.tsx"]!()
    case "component/spinner/spinner-09#default":
      return modules["../../../../../registry/variants/source/components/spinner/spinner-09/spinner-09.preview.tsx"]!()
    case "component/spinner/spinner-10#default":
      return modules["../../../../../registry/variants/source/components/spinner/spinner-10/spinner-10.preview.tsx"]!()
    default:
      return Promise.reject(new Error(`Unknown variant preview ${id}.`))
  }
}
