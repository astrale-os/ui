import type { PreviewModule } from '../../previews.js'

const modules = import.meta.glob<PreviewModule>("../../../../../registry/variants/source/components/drawer/**/*.preview.tsx")

export function loadPreview(id: string): Promise<PreviewModule> {
  switch (id) {
    case "component/drawer/drawer-01#default":
      return modules["../../../../../registry/variants/source/components/drawer/drawer-01/drawer-01.preview.tsx"]!()
    case "component/drawer/drawer-02#default":
      return modules["../../../../../registry/variants/source/components/drawer/drawer-02/drawer-02.preview.tsx"]!()
    case "component/drawer/drawer-03#default":
      return modules["../../../../../registry/variants/source/components/drawer/drawer-03/drawer-03.preview.tsx"]!()
    case "component/drawer/drawer-04#default":
      return modules["../../../../../registry/variants/source/components/drawer/drawer-04/drawer-04.preview.tsx"]!()
    case "component/drawer/drawer-05#default":
      return modules["../../../../../registry/variants/source/components/drawer/drawer-05/drawer-05.preview.tsx"]!()
    case "component/drawer/drawer-06#default":
      return modules["../../../../../registry/variants/source/components/drawer/drawer-06/drawer-06.preview.tsx"]!()
    case "component/drawer/drawer-07#default":
      return modules["../../../../../registry/variants/source/components/drawer/drawer-07/drawer-07.preview.tsx"]!()
    case "component/drawer/drawer-08#default":
      return modules["../../../../../registry/variants/source/components/drawer/drawer-08/drawer-08.preview.tsx"]!()
    case "component/drawer/drawer-09#default":
      return modules["../../../../../registry/variants/source/components/drawer/drawer-09/drawer-09.preview.tsx"]!()
    case "component/drawer/drawer-10#default":
      return modules["../../../../../registry/variants/source/components/drawer/drawer-10/drawer-10.preview.tsx"]!()
    case "component/drawer/drawer-11#default":
      return modules["../../../../../registry/variants/source/components/drawer/drawer-11/drawer-11.preview.tsx"]!()
    case "component/drawer/drawer-12#default":
      return modules["../../../../../registry/variants/source/components/drawer/drawer-12/drawer-12.preview.tsx"]!()
    case "component/drawer/drawer-13#default":
      return modules["../../../../../registry/variants/source/components/drawer/drawer-13/drawer-13.preview.tsx"]!()
    case "component/drawer/drawer-14#default":
      return modules["../../../../../registry/variants/source/components/drawer/drawer-14/drawer-14.preview.tsx"]!()
    case "component/drawer/drawer-15#default":
      return modules["../../../../../registry/variants/source/components/drawer/drawer-15/drawer-15.preview.tsx"]!()
    default:
      return Promise.reject(new Error(`Unknown variant preview ${id}.`))
  }
}
