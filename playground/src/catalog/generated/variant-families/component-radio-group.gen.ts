import type { PreviewModule } from '../../previews.js'

const modules = import.meta.glob<PreviewModule>("../../../../../registry/variants/source/components/radio-group/**/*.preview.tsx")

export function loadPreview(id: string): Promise<PreviewModule> {
  switch (id) {
    case "component/radio-group/radio-group-01#default":
      return modules["../../../../../registry/variants/source/components/radio-group/radio-group-01/radio-group-01.preview.tsx"]!()
    case "component/radio-group/radio-group-02#default":
      return modules["../../../../../registry/variants/source/components/radio-group/radio-group-02/radio-group-02.preview.tsx"]!()
    case "component/radio-group/radio-group-03#default":
      return modules["../../../../../registry/variants/source/components/radio-group/radio-group-03/radio-group-03.preview.tsx"]!()
    case "component/radio-group/radio-group-04#default":
      return modules["../../../../../registry/variants/source/components/radio-group/radio-group-04/radio-group-04.preview.tsx"]!()
    case "component/radio-group/radio-group-05#default":
      return modules["../../../../../registry/variants/source/components/radio-group/radio-group-05/radio-group-05.preview.tsx"]!()
    case "component/radio-group/radio-group-06#default":
      return modules["../../../../../registry/variants/source/components/radio-group/radio-group-06/radio-group-06.preview.tsx"]!()
    case "component/radio-group/radio-group-07#default":
      return modules["../../../../../registry/variants/source/components/radio-group/radio-group-07/radio-group-07.preview.tsx"]!()
    case "component/radio-group/radio-group-08#default":
      return modules["../../../../../registry/variants/source/components/radio-group/radio-group-08/radio-group-08.preview.tsx"]!()
    case "component/radio-group/radio-group-09#default":
      return modules["../../../../../registry/variants/source/components/radio-group/radio-group-09/radio-group-09.preview.tsx"]!()
    case "component/radio-group/radio-group-10#default":
      return modules["../../../../../registry/variants/source/components/radio-group/radio-group-10/radio-group-10.preview.tsx"]!()
    case "component/radio-group/radio-group-11#default":
      return modules["../../../../../registry/variants/source/components/radio-group/radio-group-11/radio-group-11.preview.tsx"]!()
    case "component/radio-group/radio-group-12#default":
      return modules["../../../../../registry/variants/source/components/radio-group/radio-group-12/radio-group-12.preview.tsx"]!()
    case "component/radio-group/radio-group-13#default":
      return modules["../../../../../registry/variants/source/components/radio-group/radio-group-13/radio-group-13.preview.tsx"]!()
    case "component/radio-group/radio-group-14#default":
      return modules["../../../../../registry/variants/source/components/radio-group/radio-group-14/radio-group-14.preview.tsx"]!()
    case "component/radio-group/radio-group-15#default":
      return modules["../../../../../registry/variants/source/components/radio-group/radio-group-15/radio-group-15.preview.tsx"]!()
    default:
      return Promise.reject(new Error(`Unknown variant preview ${id}.`))
  }
}
