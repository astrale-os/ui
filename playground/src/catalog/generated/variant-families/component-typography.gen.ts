import type { PreviewModule } from '../../previews.js'

const modules = import.meta.glob<PreviewModule>("../../../../../registry/variants/source/components/typography/**/*.preview.tsx")

export function loadPreview(id: string): Promise<PreviewModule> {
  switch (id) {
    case "component/typography/typography-01#default":
      return modules["../../../../../registry/variants/source/components/typography/typography-01/typography-01.preview.tsx"]!()
    case "component/typography/typography-02#default":
      return modules["../../../../../registry/variants/source/components/typography/typography-02/typography-02.preview.tsx"]!()
    case "component/typography/typography-03#default":
      return modules["../../../../../registry/variants/source/components/typography/typography-03/typography-03.preview.tsx"]!()
    case "component/typography/typography-04#default":
      return modules["../../../../../registry/variants/source/components/typography/typography-04/typography-04.preview.tsx"]!()
    case "component/typography/typography-05#default":
      return modules["../../../../../registry/variants/source/components/typography/typography-05/typography-05.preview.tsx"]!()
    case "component/typography/typography-06#default":
      return modules["../../../../../registry/variants/source/components/typography/typography-06/typography-06.preview.tsx"]!()
    case "component/typography/typography-07#default":
      return modules["../../../../../registry/variants/source/components/typography/typography-07/typography-07.preview.tsx"]!()
    case "component/typography/typography-08#default":
      return modules["../../../../../registry/variants/source/components/typography/typography-08/typography-08.preview.tsx"]!()
    case "component/typography/typography-09#default":
      return modules["../../../../../registry/variants/source/components/typography/typography-09/typography-09.preview.tsx"]!()
    case "component/typography/typography-10#default":
      return modules["../../../../../registry/variants/source/components/typography/typography-10/typography-10.preview.tsx"]!()
    case "component/typography/typography-11#default":
      return modules["../../../../../registry/variants/source/components/typography/typography-11/typography-11.preview.tsx"]!()
    case "component/typography/typography-12#default":
      return modules["../../../../../registry/variants/source/components/typography/typography-12/typography-12.preview.tsx"]!()
    case "component/typography/typography-13#default":
      return modules["../../../../../registry/variants/source/components/typography/typography-13/typography-13.preview.tsx"]!()
    case "component/typography/typography-14#default":
      return modules["../../../../../registry/variants/source/components/typography/typography-14/typography-14.preview.tsx"]!()
    case "component/typography/typography-15#default":
      return modules["../../../../../registry/variants/source/components/typography/typography-15/typography-15.preview.tsx"]!()
    default:
      return Promise.reject(new Error(`Unknown variant preview ${id}.`))
  }
}
