import type { PreviewModule } from '../../previews.js'

const modules = import.meta.glob<PreviewModule>("../../../../../registry/variants/source/components/slider/**/*.preview.tsx")

export function loadPreview(id: string): Promise<PreviewModule> {
  switch (id) {
    case "component/slider/slider-01#default":
      return modules["../../../../../registry/variants/source/components/slider/slider-01/slider-01.preview.tsx"]!()
    case "component/slider/slider-02#default":
      return modules["../../../../../registry/variants/source/components/slider/slider-02/slider-02.preview.tsx"]!()
    case "component/slider/slider-03#default":
      return modules["../../../../../registry/variants/source/components/slider/slider-03/slider-03.preview.tsx"]!()
    case "component/slider/slider-04#default":
      return modules["../../../../../registry/variants/source/components/slider/slider-04/slider-04.preview.tsx"]!()
    case "component/slider/slider-05#default":
      return modules["../../../../../registry/variants/source/components/slider/slider-05/slider-05.preview.tsx"]!()
    case "component/slider/slider-06#default":
      return modules["../../../../../registry/variants/source/components/slider/slider-06/slider-06.preview.tsx"]!()
    case "component/slider/slider-07#default":
      return modules["../../../../../registry/variants/source/components/slider/slider-07/slider-07.preview.tsx"]!()
    case "component/slider/slider-08#default":
      return modules["../../../../../registry/variants/source/components/slider/slider-08/slider-08.preview.tsx"]!()
    case "component/slider/slider-09#default":
      return modules["../../../../../registry/variants/source/components/slider/slider-09/slider-09.preview.tsx"]!()
    case "component/slider/slider-10#default":
      return modules["../../../../../registry/variants/source/components/slider/slider-10/slider-10.preview.tsx"]!()
    case "component/slider/slider-11#default":
      return modules["../../../../../registry/variants/source/components/slider/slider-11/slider-11.preview.tsx"]!()
    case "component/slider/slider-12#default":
      return modules["../../../../../registry/variants/source/components/slider/slider-12/slider-12.preview.tsx"]!()
    case "component/slider/slider-13#default":
      return modules["../../../../../registry/variants/source/components/slider/slider-13/slider-13.preview.tsx"]!()
    case "component/slider/slider-14#default":
      return modules["../../../../../registry/variants/source/components/slider/slider-14/slider-14.preview.tsx"]!()
    case "component/slider/slider-15#default":
      return modules["../../../../../registry/variants/source/components/slider/slider-15/slider-15.preview.tsx"]!()
    case "component/slider/slider-16#default":
      return modules["../../../../../registry/variants/source/components/slider/slider-16/slider-16.preview.tsx"]!()
    case "component/slider/slider-17#default":
      return modules["../../../../../registry/variants/source/components/slider/slider-17/slider-17.preview.tsx"]!()
    case "component/slider/slider-18#default":
      return modules["../../../../../registry/variants/source/components/slider/slider-18/slider-18.preview.tsx"]!()
    case "component/slider/slider-19#default":
      return modules["../../../../../registry/variants/source/components/slider/slider-19/slider-19.preview.tsx"]!()
    default:
      return Promise.reject(new Error(`Unknown variant preview ${id}.`))
  }
}
