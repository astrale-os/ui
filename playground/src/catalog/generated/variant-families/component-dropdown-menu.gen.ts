import type { PreviewModule } from '../../previews.js'

const modules = import.meta.glob<PreviewModule>("../../../../../registry/variants/source/components/dropdown-menu/**/*.preview.tsx")

export function loadPreview(id: string): Promise<PreviewModule> {
  switch (id) {
    case "component/dropdown-menu/dropdown-menu-01#default":
      return modules["../../../../../registry/variants/source/components/dropdown-menu/dropdown-menu-01/dropdown-menu-01.preview.tsx"]!()
    case "component/dropdown-menu/dropdown-menu-02#default":
      return modules["../../../../../registry/variants/source/components/dropdown-menu/dropdown-menu-02/dropdown-menu-02.preview.tsx"]!()
    case "component/dropdown-menu/dropdown-menu-03#default":
      return modules["../../../../../registry/variants/source/components/dropdown-menu/dropdown-menu-03/dropdown-menu-03.preview.tsx"]!()
    case "component/dropdown-menu/dropdown-menu-04#default":
      return modules["../../../../../registry/variants/source/components/dropdown-menu/dropdown-menu-04/dropdown-menu-04.preview.tsx"]!()
    case "component/dropdown-menu/dropdown-menu-05#default":
      return modules["../../../../../registry/variants/source/components/dropdown-menu/dropdown-menu-05/dropdown-menu-05.preview.tsx"]!()
    case "component/dropdown-menu/dropdown-menu-06#default":
      return modules["../../../../../registry/variants/source/components/dropdown-menu/dropdown-menu-06/dropdown-menu-06.preview.tsx"]!()
    case "component/dropdown-menu/dropdown-menu-07#default":
      return modules["../../../../../registry/variants/source/components/dropdown-menu/dropdown-menu-07/dropdown-menu-07.preview.tsx"]!()
    case "component/dropdown-menu/dropdown-menu-08#default":
      return modules["../../../../../registry/variants/source/components/dropdown-menu/dropdown-menu-08/dropdown-menu-08.preview.tsx"]!()
    case "component/dropdown-menu/dropdown-menu-09#default":
      return modules["../../../../../registry/variants/source/components/dropdown-menu/dropdown-menu-09/dropdown-menu-09.preview.tsx"]!()
    case "component/dropdown-menu/dropdown-menu-10#default":
      return modules["../../../../../registry/variants/source/components/dropdown-menu/dropdown-menu-10/dropdown-menu-10.preview.tsx"]!()
    case "component/dropdown-menu/dropdown-menu-11#default":
      return modules["../../../../../registry/variants/source/components/dropdown-menu/dropdown-menu-11/dropdown-menu-11.preview.tsx"]!()
    case "component/dropdown-menu/dropdown-menu-12#default":
      return modules["../../../../../registry/variants/source/components/dropdown-menu/dropdown-menu-12/dropdown-menu-12.preview.tsx"]!()
    case "component/dropdown-menu/dropdown-menu-13#default":
      return modules["../../../../../registry/variants/source/components/dropdown-menu/dropdown-menu-13/dropdown-menu-13.preview.tsx"]!()
    case "component/dropdown-menu/dropdown-menu-14#default":
      return modules["../../../../../registry/variants/source/components/dropdown-menu/dropdown-menu-14/dropdown-menu-14.preview.tsx"]!()
    case "component/dropdown-menu/dropdown-menu-15#default":
      return modules["../../../../../registry/variants/source/components/dropdown-menu/dropdown-menu-15/dropdown-menu-15.preview.tsx"]!()
    case "component/dropdown-menu/dropdown-menu-16#default":
      return modules["../../../../../registry/variants/source/components/dropdown-menu/dropdown-menu-16/dropdown-menu-16.preview.tsx"]!()
    default:
      return Promise.reject(new Error(`Unknown variant preview ${id}.`))
  }
}
