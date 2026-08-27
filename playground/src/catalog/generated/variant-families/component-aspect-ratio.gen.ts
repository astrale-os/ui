import type { PreviewModule } from '../../previews.js'

const modules = import.meta.glob<PreviewModule>("../../../../../registry/variants/source/components/aspect-ratio/**/*.preview.tsx")

export function loadPreview(id: string): Promise<PreviewModule> {
  switch (id) {
    case "component/aspect-ratio/aspect-ratio-01#default":
      return modules["../../../../../registry/variants/source/components/aspect-ratio/aspect-ratio-01/aspect-ratio-01.preview.tsx"]!()
    case "component/aspect-ratio/aspect-ratio-02#default":
      return modules["../../../../../registry/variants/source/components/aspect-ratio/aspect-ratio-02/aspect-ratio-02.preview.tsx"]!()
    case "component/aspect-ratio/aspect-ratio-03#default":
      return modules["../../../../../registry/variants/source/components/aspect-ratio/aspect-ratio-03/aspect-ratio-03.preview.tsx"]!()
    case "component/aspect-ratio/aspect-ratio-04#default":
      return modules["../../../../../registry/variants/source/components/aspect-ratio/aspect-ratio-04/aspect-ratio-04.preview.tsx"]!()
    case "component/aspect-ratio/aspect-ratio-05#default":
      return modules["../../../../../registry/variants/source/components/aspect-ratio/aspect-ratio-05/aspect-ratio-05.preview.tsx"]!()
    case "component/aspect-ratio/aspect-ratio-06#default":
      return modules["../../../../../registry/variants/source/components/aspect-ratio/aspect-ratio-06/aspect-ratio-06.preview.tsx"]!()
    case "component/aspect-ratio/aspect-ratio-07#default":
      return modules["../../../../../registry/variants/source/components/aspect-ratio/aspect-ratio-07/aspect-ratio-07.preview.tsx"]!()
    default:
      return Promise.reject(new Error(`Unknown variant preview ${id}.`))
  }
}
