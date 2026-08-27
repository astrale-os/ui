import type { PreviewModule } from '../../previews.js'

const modules = import.meta.glob<PreviewModule>("../../../../../registry/variants/source/patterns/navigation-menu/**/*.preview.tsx")

export function loadPreview(id: string): Promise<PreviewModule> {
  switch (id) {
    case "pattern/navigation-menu/navigation-menu-01#default":
      return modules["../../../../../registry/variants/source/patterns/navigation-menu/navigation-menu-01/navigation-menu-01.preview.tsx"]!()
    case "pattern/navigation-menu/navigation-menu-02#default":
      return modules["../../../../../registry/variants/source/patterns/navigation-menu/navigation-menu-02/navigation-menu-02.preview.tsx"]!()
    case "pattern/navigation-menu/navigation-menu-03#default":
      return modules["../../../../../registry/variants/source/patterns/navigation-menu/navigation-menu-03/navigation-menu-03.preview.tsx"]!()
    case "pattern/navigation-menu/navigation-menu-04#default":
      return modules["../../../../../registry/variants/source/patterns/navigation-menu/navigation-menu-04/navigation-menu-04.preview.tsx"]!()
    case "pattern/navigation-menu/navigation-menu-05#default":
      return modules["../../../../../registry/variants/source/patterns/navigation-menu/navigation-menu-05/navigation-menu-05.preview.tsx"]!()
    case "pattern/navigation-menu/navigation-menu-06#default":
      return modules["../../../../../registry/variants/source/patterns/navigation-menu/navigation-menu-06/navigation-menu-06.preview.tsx"]!()
    case "pattern/navigation-menu/navigation-menu-07#default":
      return modules["../../../../../registry/variants/source/patterns/navigation-menu/navigation-menu-07/navigation-menu-07.preview.tsx"]!()
    case "pattern/navigation-menu/navigation-menu-08#default":
      return modules["../../../../../registry/variants/source/patterns/navigation-menu/navigation-menu-08/navigation-menu-08.preview.tsx"]!()
    case "pattern/navigation-menu/navigation-menu-09#default":
      return modules["../../../../../registry/variants/source/patterns/navigation-menu/navigation-menu-09/navigation-menu-09.preview.tsx"]!()
    default:
      return Promise.reject(new Error(`Unknown variant preview ${id}.`))
  }
}
