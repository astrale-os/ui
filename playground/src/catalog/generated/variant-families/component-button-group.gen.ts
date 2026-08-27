import type { PreviewModule } from '../../previews.js'

const modules = import.meta.glob<PreviewModule>("../../../../../registry/variants/source/components/button-group/**/*.preview.tsx")

export function loadPreview(id: string): Promise<PreviewModule> {
  switch (id) {
    case "component/button-group/button-group-01#default":
      return modules["../../../../../registry/variants/source/components/button-group/button-group-01/button-group-01.preview.tsx"]!()
    case "component/button-group/button-group-02#default":
      return modules["../../../../../registry/variants/source/components/button-group/button-group-02/button-group-02.preview.tsx"]!()
    case "component/button-group/button-group-03#default":
      return modules["../../../../../registry/variants/source/components/button-group/button-group-03/button-group-03.preview.tsx"]!()
    case "component/button-group/button-group-04#default":
      return modules["../../../../../registry/variants/source/components/button-group/button-group-04/button-group-04.preview.tsx"]!()
    case "component/button-group/button-group-05#default":
      return modules["../../../../../registry/variants/source/components/button-group/button-group-05/button-group-05.preview.tsx"]!()
    case "component/button-group/button-group-06#default":
      return modules["../../../../../registry/variants/source/components/button-group/button-group-06/button-group-06.preview.tsx"]!()
    case "component/button-group/button-group-07#default":
      return modules["../../../../../registry/variants/source/components/button-group/button-group-07/button-group-07.preview.tsx"]!()
    case "component/button-group/button-group-08#default":
      return modules["../../../../../registry/variants/source/components/button-group/button-group-08/button-group-08.preview.tsx"]!()
    case "component/button-group/button-group-09#default":
      return modules["../../../../../registry/variants/source/components/button-group/button-group-09/button-group-09.preview.tsx"]!()
    case "component/button-group/button-group-10#default":
      return modules["../../../../../registry/variants/source/components/button-group/button-group-10/button-group-10.preview.tsx"]!()
    case "component/button-group/button-group-11#default":
      return modules["../../../../../registry/variants/source/components/button-group/button-group-11/button-group-11.preview.tsx"]!()
    case "component/button-group/button-group-12#default":
      return modules["../../../../../registry/variants/source/components/button-group/button-group-12/button-group-12.preview.tsx"]!()
    case "component/button-group/button-group-13#default":
      return modules["../../../../../registry/variants/source/components/button-group/button-group-13/button-group-13.preview.tsx"]!()
    case "component/button-group/button-group-14#default":
      return modules["../../../../../registry/variants/source/components/button-group/button-group-14/button-group-14.preview.tsx"]!()
    case "component/button-group/button-group-15#default":
      return modules["../../../../../registry/variants/source/components/button-group/button-group-15/button-group-15.preview.tsx"]!()
    case "component/button-group/button-group-16#default":
      return modules["../../../../../registry/variants/source/components/button-group/button-group-16/button-group-16.preview.tsx"]!()
    default:
      return Promise.reject(new Error(`Unknown variant preview ${id}.`))
  }
}
