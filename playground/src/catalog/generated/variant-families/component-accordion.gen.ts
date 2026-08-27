import type { PreviewModule } from '../../previews.js'

const modules = import.meta.glob<PreviewModule>("../../../../../registry/variants/source/components/accordion/**/*.preview.tsx")

export function loadPreview(id: string): Promise<PreviewModule> {
  switch (id) {
    case "component/accordion/accordion-01#default":
      return modules["../../../../../registry/variants/source/components/accordion/accordion-01/accordion-01.preview.tsx"]!()
    case "component/accordion/accordion-02#default":
      return modules["../../../../../registry/variants/source/components/accordion/accordion-02/accordion-02.preview.tsx"]!()
    case "component/accordion/accordion-03#default":
      return modules["../../../../../registry/variants/source/components/accordion/accordion-03/accordion-03.preview.tsx"]!()
    case "component/accordion/accordion-04#default":
      return modules["../../../../../registry/variants/source/components/accordion/accordion-04/accordion-04.preview.tsx"]!()
    case "component/accordion/accordion-05#default":
      return modules["../../../../../registry/variants/source/components/accordion/accordion-05/accordion-05.preview.tsx"]!()
    case "component/accordion/accordion-06#default":
      return modules["../../../../../registry/variants/source/components/accordion/accordion-06/accordion-06.preview.tsx"]!()
    case "component/accordion/accordion-07#default":
      return modules["../../../../../registry/variants/source/components/accordion/accordion-07/accordion-07.preview.tsx"]!()
    case "component/accordion/accordion-08#default":
      return modules["../../../../../registry/variants/source/components/accordion/accordion-08/accordion-08.preview.tsx"]!()
    case "component/accordion/accordion-09#default":
      return modules["../../../../../registry/variants/source/components/accordion/accordion-09/accordion-09.preview.tsx"]!()
    case "component/accordion/accordion-10#default":
      return modules["../../../../../registry/variants/source/components/accordion/accordion-10/accordion-10.preview.tsx"]!()
    case "component/accordion/accordion-11#default":
      return modules["../../../../../registry/variants/source/components/accordion/accordion-11/accordion-11.preview.tsx"]!()
    case "component/accordion/accordion-12#default":
      return modules["../../../../../registry/variants/source/components/accordion/accordion-12/accordion-12.preview.tsx"]!()
    case "component/accordion/accordion-13#default":
      return modules["../../../../../registry/variants/source/components/accordion/accordion-13/accordion-13.preview.tsx"]!()
    case "component/accordion/accordion-14#default":
      return modules["../../../../../registry/variants/source/components/accordion/accordion-14/accordion-14.preview.tsx"]!()
    case "component/accordion/accordion-15#default":
      return modules["../../../../../registry/variants/source/components/accordion/accordion-15/accordion-15.preview.tsx"]!()
    case "component/accordion/accordion-16#default":
      return modules["../../../../../registry/variants/source/components/accordion/accordion-16/accordion-16.preview.tsx"]!()
    default:
      return Promise.reject(new Error(`Unknown variant preview ${id}.`))
  }
}
