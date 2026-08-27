import type { PreviewModule } from '../../previews.js'

const modules = import.meta.glob<PreviewModule>("../../../../../registry/variants/source/patterns/carousel/**/*.preview.tsx")

export function loadPreview(id: string): Promise<PreviewModule> {
  switch (id) {
    case "pattern/carousel/carousel-01#default":
      return modules["../../../../../registry/variants/source/patterns/carousel/carousel-01/carousel-01.preview.tsx"]!()
    case "pattern/carousel/carousel-02#default":
      return modules["../../../../../registry/variants/source/patterns/carousel/carousel-02/carousel-02.preview.tsx"]!()
    case "pattern/carousel/carousel-03#default":
      return modules["../../../../../registry/variants/source/patterns/carousel/carousel-03/carousel-03.preview.tsx"]!()
    case "pattern/carousel/carousel-04#default":
      return modules["../../../../../registry/variants/source/patterns/carousel/carousel-04/carousel-04.preview.tsx"]!()
    case "pattern/carousel/carousel-05#default":
      return modules["../../../../../registry/variants/source/patterns/carousel/carousel-05/carousel-05.preview.tsx"]!()
    case "pattern/carousel/carousel-06#default":
      return modules["../../../../../registry/variants/source/patterns/carousel/carousel-06/carousel-06.preview.tsx"]!()
    case "pattern/carousel/carousel-07#default":
      return modules["../../../../../registry/variants/source/patterns/carousel/carousel-07/carousel-07.preview.tsx"]!()
    case "pattern/carousel/carousel-08#default":
      return modules["../../../../../registry/variants/source/patterns/carousel/carousel-08/carousel-08.preview.tsx"]!()
    case "pattern/carousel/carousel-09#default":
      return modules["../../../../../registry/variants/source/patterns/carousel/carousel-09/carousel-09.preview.tsx"]!()
    case "pattern/carousel/carousel-10#default":
      return modules["../../../../../registry/variants/source/patterns/carousel/carousel-10/carousel-10.preview.tsx"]!()
    case "pattern/carousel/carousel-11#default":
      return modules["../../../../../registry/variants/source/patterns/carousel/carousel-11/carousel-11.preview.tsx"]!()
    case "pattern/carousel/carousel-12#default":
      return modules["../../../../../registry/variants/source/patterns/carousel/carousel-12/carousel-12.preview.tsx"]!()
    default:
      return Promise.reject(new Error(`Unknown variant preview ${id}.`))
  }
}
