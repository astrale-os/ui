import type { PreviewModule } from '../../previews.js'

const modules = import.meta.glob<PreviewModule>("../../../../../registry/variants/source/components/skeleton/**/*.preview.tsx")

export function loadPreview(id: string): Promise<PreviewModule> {
  switch (id) {
    case "component/skeleton/skeleton-01#default":
      return modules["../../../../../registry/variants/source/components/skeleton/skeleton-01/skeleton-01.preview.tsx"]!()
    case "component/skeleton/skeleton-02#default":
      return modules["../../../../../registry/variants/source/components/skeleton/skeleton-02/skeleton-02.preview.tsx"]!()
    case "component/skeleton/skeleton-03#default":
      return modules["../../../../../registry/variants/source/components/skeleton/skeleton-03/skeleton-03.preview.tsx"]!()
    case "component/skeleton/skeleton-04#default":
      return modules["../../../../../registry/variants/source/components/skeleton/skeleton-04/skeleton-04.preview.tsx"]!()
    case "component/skeleton/skeleton-05#default":
      return modules["../../../../../registry/variants/source/components/skeleton/skeleton-05/skeleton-05.preview.tsx"]!()
    case "component/skeleton/skeleton-06#default":
      return modules["../../../../../registry/variants/source/components/skeleton/skeleton-06/skeleton-06.preview.tsx"]!()
    case "component/skeleton/skeleton-07#default":
      return modules["../../../../../registry/variants/source/components/skeleton/skeleton-07/skeleton-07.preview.tsx"]!()
    case "component/skeleton/skeleton-08#default":
      return modules["../../../../../registry/variants/source/components/skeleton/skeleton-08/skeleton-08.preview.tsx"]!()
    case "component/skeleton/skeleton-09#default":
      return modules["../../../../../registry/variants/source/components/skeleton/skeleton-09/skeleton-09.preview.tsx"]!()
    case "component/skeleton/skeleton-10#default":
      return modules["../../../../../registry/variants/source/components/skeleton/skeleton-10/skeleton-10.preview.tsx"]!()
    case "component/skeleton/skeleton-11#default":
      return modules["../../../../../registry/variants/source/components/skeleton/skeleton-11/skeleton-11.preview.tsx"]!()
    case "component/skeleton/skeleton-12#default":
      return modules["../../../../../registry/variants/source/components/skeleton/skeleton-12/skeleton-12.preview.tsx"]!()
    default:
      return Promise.reject(new Error(`Unknown variant preview ${id}.`))
  }
}
