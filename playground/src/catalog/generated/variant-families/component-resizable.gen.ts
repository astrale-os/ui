import type { PreviewModule } from '../../previews.js'

const modules = import.meta.glob<PreviewModule>("../../../../../registry/variants/source/components/resizable/**/*.preview.tsx")

export function loadPreview(id: string): Promise<PreviewModule> {
  switch (id) {
    case "component/resizable/resizable-01#default":
      return modules["../../../../../registry/variants/source/components/resizable/resizable-01/resizable-01.preview.tsx"]!()
    case "component/resizable/resizable-02#default":
      return modules["../../../../../registry/variants/source/components/resizable/resizable-02/resizable-02.preview.tsx"]!()
    case "component/resizable/resizable-03#default":
      return modules["../../../../../registry/variants/source/components/resizable/resizable-03/resizable-03.preview.tsx"]!()
    case "component/resizable/resizable-04#default":
      return modules["../../../../../registry/variants/source/components/resizable/resizable-04/resizable-04.preview.tsx"]!()
    case "component/resizable/resizable-05#default":
      return modules["../../../../../registry/variants/source/components/resizable/resizable-05/resizable-05.preview.tsx"]!()
    case "component/resizable/resizable-06#default":
      return modules["../../../../../registry/variants/source/components/resizable/resizable-06/resizable-06.preview.tsx"]!()
    case "component/resizable/resizable-07#default":
      return modules["../../../../../registry/variants/source/components/resizable/resizable-07/resizable-07.preview.tsx"]!()
    case "component/resizable/resizable-08#default":
      return modules["../../../../../registry/variants/source/components/resizable/resizable-08/resizable-08.preview.tsx"]!()
    case "component/resizable/resizable-09#default":
      return modules["../../../../../registry/variants/source/components/resizable/resizable-09/resizable-09.preview.tsx"]!()
    default:
      return Promise.reject(new Error(`Unknown variant preview ${id}.`))
  }
}
