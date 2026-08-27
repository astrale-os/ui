import type { PreviewModule } from '../../previews.js'

const modules = import.meta.glob<PreviewModule>("../../../../../registry/variants/source/components/menubar/**/*.preview.tsx")

export function loadPreview(id: string): Promise<PreviewModule> {
  switch (id) {
    case "component/menubar/menubar-01#default":
      return modules["../../../../../registry/variants/source/components/menubar/menubar-01/menubar-01.preview.tsx"]!()
    case "component/menubar/menubar-02#default":
      return modules["../../../../../registry/variants/source/components/menubar/menubar-02/menubar-02.preview.tsx"]!()
    case "component/menubar/menubar-03#default":
      return modules["../../../../../registry/variants/source/components/menubar/menubar-03/menubar-03.preview.tsx"]!()
    case "component/menubar/menubar-04#default":
      return modules["../../../../../registry/variants/source/components/menubar/menubar-04/menubar-04.preview.tsx"]!()
    case "component/menubar/menubar-05#default":
      return modules["../../../../../registry/variants/source/components/menubar/menubar-05/menubar-05.preview.tsx"]!()
    case "component/menubar/menubar-06#default":
      return modules["../../../../../registry/variants/source/components/menubar/menubar-06/menubar-06.preview.tsx"]!()
    case "component/menubar/menubar-07#default":
      return modules["../../../../../registry/variants/source/components/menubar/menubar-07/menubar-07.preview.tsx"]!()
    case "component/menubar/menubar-08#default":
      return modules["../../../../../registry/variants/source/components/menubar/menubar-08/menubar-08.preview.tsx"]!()
    default:
      return Promise.reject(new Error(`Unknown variant preview ${id}.`))
  }
}
