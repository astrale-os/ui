import type { PreviewModule } from '../../previews.js'

const modules = import.meta.glob<PreviewModule>("../../../../../registry/variants/source/components/context-menu/**/*.preview.tsx")

export function loadPreview(id: string): Promise<PreviewModule> {
  switch (id) {
    case "component/context-menu/context-menu-01#default":
      return modules["../../../../../registry/variants/source/components/context-menu/context-menu-01/context-menu-01.preview.tsx"]!()
    case "component/context-menu/context-menu-02#default":
      return modules["../../../../../registry/variants/source/components/context-menu/context-menu-02/context-menu-02.preview.tsx"]!()
    case "component/context-menu/context-menu-03#default":
      return modules["../../../../../registry/variants/source/components/context-menu/context-menu-03/context-menu-03.preview.tsx"]!()
    case "component/context-menu/context-menu-04#default":
      return modules["../../../../../registry/variants/source/components/context-menu/context-menu-04/context-menu-04.preview.tsx"]!()
    case "component/context-menu/context-menu-05#default":
      return modules["../../../../../registry/variants/source/components/context-menu/context-menu-05/context-menu-05.preview.tsx"]!()
    case "component/context-menu/context-menu-06#default":
      return modules["../../../../../registry/variants/source/components/context-menu/context-menu-06/context-menu-06.preview.tsx"]!()
    case "component/context-menu/context-menu-07#default":
      return modules["../../../../../registry/variants/source/components/context-menu/context-menu-07/context-menu-07.preview.tsx"]!()
    case "component/context-menu/context-menu-08#default":
      return modules["../../../../../registry/variants/source/components/context-menu/context-menu-08/context-menu-08.preview.tsx"]!()
    case "component/context-menu/context-menu-09#default":
      return modules["../../../../../registry/variants/source/components/context-menu/context-menu-09/context-menu-09.preview.tsx"]!()
    default:
      return Promise.reject(new Error(`Unknown variant preview ${id}.`))
  }
}
