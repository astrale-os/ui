import type { PreviewModule } from '../../previews.js'

const modules = import.meta.glob<PreviewModule>("../../../../../registry/variants/source/components/collapsible/**/*.preview.tsx")

export function loadPreview(id: string): Promise<PreviewModule> {
  switch (id) {
    case "component/collapsible/collapsible-01#default":
      return modules["../../../../../registry/variants/source/components/collapsible/collapsible-01/collapsible-01.preview.tsx"]!()
    case "component/collapsible/collapsible-02#default":
      return modules["../../../../../registry/variants/source/components/collapsible/collapsible-02/collapsible-02.preview.tsx"]!()
    case "component/collapsible/collapsible-03#default":
      return modules["../../../../../registry/variants/source/components/collapsible/collapsible-03/collapsible-03.preview.tsx"]!()
    case "component/collapsible/collapsible-04#default":
      return modules["../../../../../registry/variants/source/components/collapsible/collapsible-04/collapsible-04.preview.tsx"]!()
    case "component/collapsible/collapsible-05#default":
      return modules["../../../../../registry/variants/source/components/collapsible/collapsible-05/collapsible-05.preview.tsx"]!()
    case "component/collapsible/collapsible-06#default":
      return modules["../../../../../registry/variants/source/components/collapsible/collapsible-06/collapsible-06.preview.tsx"]!()
    case "component/collapsible/collapsible-07#default":
      return modules["../../../../../registry/variants/source/components/collapsible/collapsible-07/collapsible-07.preview.tsx"]!()
    case "component/collapsible/collapsible-08#default":
      return modules["../../../../../registry/variants/source/components/collapsible/collapsible-08/collapsible-08.preview.tsx"]!()
    case "component/collapsible/collapsible-09#default":
      return modules["../../../../../registry/variants/source/components/collapsible/collapsible-09/collapsible-09.preview.tsx"]!()
    case "component/collapsible/collapsible-10#default":
      return modules["../../../../../registry/variants/source/components/collapsible/collapsible-10/collapsible-10.preview.tsx"]!()
    default:
      return Promise.reject(new Error(`Unknown variant preview ${id}.`))
  }
}
