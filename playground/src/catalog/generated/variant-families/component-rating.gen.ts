import type { PreviewModule } from '../../previews.js'

const modules = import.meta.glob<PreviewModule>("../../../../../registry/variants/source/components/rating/**/*.preview.tsx")

export function loadPreview(id: string): Promise<PreviewModule> {
  switch (id) {
    case "component/rating/rating-01#default":
      return modules["../../../../../registry/variants/source/components/rating/rating-01/rating-01.preview.tsx"]!()
    case "component/rating/rating-02#default":
      return modules["../../../../../registry/variants/source/components/rating/rating-02/rating-02.preview.tsx"]!()
    case "component/rating/rating-03#default":
      return modules["../../../../../registry/variants/source/components/rating/rating-03/rating-03.preview.tsx"]!()
    case "component/rating/rating-04#default":
      return modules["../../../../../registry/variants/source/components/rating/rating-04/rating-04.preview.tsx"]!()
    case "component/rating/rating-05#default":
      return modules["../../../../../registry/variants/source/components/rating/rating-05/rating-05.preview.tsx"]!()
    case "component/rating/rating-06#default":
      return modules["../../../../../registry/variants/source/components/rating/rating-06/rating-06.preview.tsx"]!()
    case "component/rating/rating-07#default":
      return modules["../../../../../registry/variants/source/components/rating/rating-07/rating-07.preview.tsx"]!()
    case "component/rating/rating-08#default":
      return modules["../../../../../registry/variants/source/components/rating/rating-08/rating-08.preview.tsx"]!()
    default:
      return Promise.reject(new Error(`Unknown variant preview ${id}.`))
  }
}
